# Production runbook

What runs in production, and the failure modes this host has already produced.

The second half is the useful part. Every entry there cost real debugging time, and
most of it is **not specific to KPIndicator** — BrandSentryPro sits on the same
AlmaLinux 10 box, behind the same nginx and PHP-FPM, under the same SELinux policy
and the same system-wide crypto policy. A symptom listed below will look identical
there.

---

## Part 1 — What is deployed

### The checkout (`checkout/`)

A dependency-free PHP 8.1 app at `checkout.kpindicator.com`, using Stripe's Payment
Element. No Composer, no vendor directory — `src/Stripe.php` is a hand-rolled cURL
client against Stripe's REST API, pinned to API version `2026-03-25.dahlia`.

It charges the **same Stripe account as BrandSentryPro**. The sharing mechanism is
`STRIPE_ENV_FILE` (see `checkout/.env.example`): point it at BSP's `.env` and both
apps read one key, so rotating there rotates here. Resolution order is real process
env → `checkout/.env` → repo-root `.env` → `STRIPE_ENV_FILE`, first definition wins.

Orders are written to the `kpindicator_prod` PostgreSQL database as
organization-owned `Order` rows, with `pg_advisory_xact_lock(hashtext(?)::bigint)`
for idempotency so a webhook and a return-page hit cannot double-write.

`checkout/bin/connection-check.php` answers the questions that actually block
go-live: which key the resolution chain lands on, whether Stripe accepts it, whether
sessions can be written, whether orders can be recorded. Run it **as `nginx`**, not
as your own user — the whole point is to prove the user PHP-FPM runs as can read the
config.

### The site

Next.js 15 App Router on the same host, served by `kpindicator.com.service` behind
nginx. Deployed by `checkout/deploy/deploy.sh`, which is safe to re-run and stops at
the first failure rather than half-deploying.

### Email events

SES publishes delivery, bounce and complaint events to an SNS topic, which POSTs to
`/api/webhooks/ses`. Signatures are verified in `src/lib/sns-signature.ts` against
the certificate SNS names, with the topic ARN pinned so another topic cannot feed us
events. `src/lib/ses-events.ts` normalises SES's shape; only
`bounceType === "Permanent"` suppresses an address — Transient and Undetermined
bounces map to `failed`, because suppressing on a full mailbox would burn a real
contact permanently.

### Tests

- `npm test` — 36 Node tests (`tsx --test tests/*.test.ts`). All passing.
- `php checkout/tests/run.php` — the PHP suite, dependency-free. **Only runs on the
  host**; PHP is not installed on the dev machine.

> `CLAUDE.md` still says "There is no test suite ... don't invent one". That is now
> stale — there is one, and it should be run.

---

## Part 2 — Failure modes on this host

Each entry: what you see, what it actually was, and the check that settles it in
seconds. Read this before debugging anything on this box.

### 1. SELinux silently denies every write under `/var/www`

**Symptom.** Checkout returns 419 on every request. The page says the session
expired. Nothing in the PHP error log.

**Cause.** Everything under `/var/www` inherits `httpd_sys_content_t`, which is
read-only to the web server. PHP-FPM's session writes are denied at the kernel
level. No error surfaces — PHP treats it as "no session".

**Why it survived a check.** The first diagnostic used `is_writable()`, which only
reads the Unix permission bits. It reported OK while the kernel was refusing every
write. **A permission check that does not actually write proves nothing under
SELinux.** `connection-check.php` now writes a probe file.

**Guard.** `deploy.sh` labels `checkout/storage` as `httpd_sys_rw_content_t` via
`semanage` (persistent) or `chcon` (until the next relabel).

```bash
sudo ausearch -m avc -ts recent | tail -20
```

### 2. The system session path is owned by the wrong user

**Symptom.** Same 419 as above, and it persists after the SELinux label is fixed.

**Cause.** The distro's `session.save_path` is `root:apache`, while the pool runs as
`nginx`. Two separate causes producing one symptom is why this took three passes —
fixing either one alone changed nothing visible.

**Guard.** The app keeps sessions in `checkout/storage/sessions`, created
`nginx:nginx 770` by the deploy.

### 3. This host refuses SHA-1, so SNS v1 signatures fail

**Symptom.** SNS webhook returns 403. The signature looks correct. Replaying the
same message offline verifies fine.

**Cause.** AlmaLinux 10's `DEFAULT` crypto policy disables SHA-1 signature
verification system-wide. SNS `SignatureVersion 1` is RSA-SHA1. OpenSSL does not
say "policy forbids this" — it returns a failed verification, indistinguishable from
a forged message.

**Fix.** `SignatureVersion` is an attribute of the **topic**, not of the
subscription, and unset it defaults to `1`:

```
SetTopicAttributes  TopicArn=<topic>  AttributeName=SignatureVersion  AttributeValue=2
```

`sns-signature.ts` probes for SHA-1 support once and returns the distinct reason
`sha1_disabled_by_platform`, so the log names the platform rather than the sender.

**What it silently costs.** The subscription handshake is itself a signed message,
so on a SHA-1 topic the `SubscriptionConfirmation` POST is rejected too and the
subscription sits at `PendingConfirmation` indefinitely. SES then publishes every
bounce and complaint into a topic with no confirmed subscriber. Nothing reports an
error anywhere — the only symptom is events that never arrive.

That is what the single `403` in the access log on 02 Sep actually meant. It went
unnoticed until 04 Sep. There is no API to resend a confirmation: fix the topic,
then call `Subscribe` again with the same protocol and endpoint, and the route
auto-confirms.

```bash
update-crypto-policies --show    # DEFAULT here means no SHA-1 signatures
```

**The real lesson.** This burned four cycles because each one reasoned from a status
code instead of measuring on the server. A 403 from a signature check has two
possible meanings — the signature is wrong, or this machine cannot evaluate it — and
only one of them is visible from the client side. **After the first unexplained
failure, go measure on the box.**

### 4. `npx --prefix` is ignored, and will resolve from the registry

**Symptom.** `prisma migrate deploy` runs a different major version than the one in
`package.json`, pointed at production.

**Cause.** `npx` has no `--prefix` flag. Given one it does not error — it ignores it
and downloads the latest from the registry. Here that was Prisma 8.0.0-rc.12 instead
of the pinned 6.19.3, aimed at the production database.

**Guard.** `deploy.sh` uses an `as_owner()` helper that `cd`s into the app directory,
and `npx --no-install`.

### 5. Webpack does not invalidate its cache when `.env` changes

**Symptom.** A `NEXT_PUBLIC_*` value is set correctly in `.env`, the build succeeds,
and the feature is dead in the browser. The bundle contains
`y.env.NEXT_PUBLIC_POSTHOG_KEY` instead of the key.

**Cause.** `NEXT_PUBLIC_*` is inlined at build time. Webpack's cache does not
invalidate on an `.env`-only change, so it reuses the module compiled while the
variable was absent, leaving a runtime `process.env` lookup that is `undefined` in
the browser.

**Guard.** `deploy.sh` clears `.next/cache` whenever `.env` is newer than
`.next/BUILD_ID`. A restart is never enough for a `NEXT_PUBLIC_*` change.

### 6. The deploy aborted before it restarted anything

**Symptom.** Deploy output looks clean. The old build keeps serving.

**Cause.** The connection check ran last and exits non-zero when anything is
unconfigured. Under `set -e` that aborted the script at the final step — after the
build, before the restart.

**Guard.** Restarts happen before the check, and the check is non-fatal. **A
verification step must never gate the action it verifies.**

### 7. PHP-FPM cannot read a 600 `.env`

**Symptom.** Payments succeed, orders are not recorded, nothing logs an error.

**Cause.** The site's `.env` is `600` and owned by the repo user. PHP-FPM runs as
`nginx`. `DATABASE_URL` simply looks unset.

**Guard.** `deploy.sh` copies that one line into `checkout/.env` (`owner:nginx 640`)
rather than loosening the site's `.env`, which also holds SES keys and OAuth secrets
the checkout has no business reading.

### 8. Running git as root leaves objects the service user cannot write

**Symptom.** `insufficient permission for adding an object to repository database
.git/objects`.

**Guard.** `deploy.sh` opens with `chown -R almalinux:almalinux` on the app
directory. If you ever run a git command on the server, run it through `sudo -u
almalinux`.

### 9. Filtering a contact list on substrings

Three separate mistakes while building the outreach lists, all the same shape:

- `market` matched World Market and farmers' markets.
- `\bmedia\b` matched nothing in concatenated domains and cut 559 real agencies.
- A rebuild dropped the free-domain filter, letting gmail/outlook addresses back in.

The list also contained a **spam trap** (`donotspamus@`). Always eyeball a random
sample of what a filter *removed*, not just what it kept, and re-run the full filter
chain after any rebuild.

### 10. Do not conclude from the browser network pane alone

I reported site-wide PostHog as "capturing nothing" based on the browser pane's
network log. `localStorage` showed it initialising fine. Requests can be batched,
deferred, or sent after the pane stops recording. Check the SDK's own state before
declaring an integration dead.

### 11. A glob in a `sudo grep` expands as *you*, not as root

**Symptom.** `sudo grep pattern /var/log/nginx/*access*.log` reports nothing, on a
directory that plainly contains matching files.

**Cause.** The shell expands the glob before `sudo` runs, as the unprivileged user.
`/var/log/nginx` is root-only, so the pattern matches nothing, is passed through
literally, and grep searches a path that does not exist — reporting no matches
rather than an error you would notice.

**Fix.** Put the whole command behind sudo, or name the file exactly:

```bash
sudo sh -c 'grep webhooks/ses /var/log/nginx/kpindicator.com-access.log'
```

This produced two wrong conclusions in one session — first that no webhook had ever
reached the endpoint, then that events were not arriving. Both false. Note also that
each vhost has its own log (`kpindicator.com-access.log`,
`checkout.kpindicator.com.access.log`); `access.log` is only the fallback.

### 12. `RCPT TO` proves nothing against Google's MX

**Symptom.** You probe an address over SMTP to check whether a Workspace alias
exists, get `250 2.1.5 OK`, and conclude it does.

**Cause.** `smtp.google.com` accepts every recipient at the `RCPT TO` stage for
this domain and decides deliverability afterwards. A deliberately absurd address
gets the same `250` as a real one.

**Fix.** Always probe a known-bad control alongside the address in question. If the
control also returns `250`, the test is inconclusive — go read the admin console,
or wait for real mail to arrive.

```
support@kpindicator.com      -> 250 OK   (exists)
zzq7x4nope@kpindicator.com   -> 250 OK   (does not exist)
```

The general form of this, and of the `is_writable()` and `sudo`-glob entries above:
**a check that cannot fail is not a check.** Give every probe a control that should
fail, and confirm it does.

---

## Part 3 — Deploy checklist

```bash
sudo bash checkout/deploy/deploy.sh
```

Then confirm, in this order:

1. `sudo -u nginx php /var/www/kpindicator.com/checkout/bin/connection-check.php`
   — expect `sessions OK`, `connection OK`, `charges enabled`, and no "Still to
   configure" block.
2. Load `checkout.kpindicator.com` and confirm the card field renders with **zero**
   console errors. A missing publishable key shows as an empty box, not an error.
3. `systemctl status kpindicator.com.service` and `nginx -t`.
4. If a `NEXT_PUBLIC_*` value changed, confirm it is in the bundle, not just in
   `.env`.

Note that `deploy.sh` does `git reset --hard origin/main`. Uncommitted work on the
server is discarded. Check `git status` there first.

---

## Part 4 — Mail for kpindicator.com

Verified against the live server and the SES API on 2026-09-04. DNS is at
Hostinger (`ns1/ns2.dns-parking.com`).

### Current state (verified 2026-09-04)

Confirmed from the SES API and from the authoritative nameserver, not a cached
resolver — Hostinger's TTL is 14400, so a change can take four hours to show up
locally while already being live. Query `ns1.dns-parking.com` directly.

```
SES identity  kpindicator.com        verified=true  dkim=SUCCESS  signing=true
MAIL FROM     mail.kpindicator.com   PENDING (SES re-checks on its own schedule)
config set    kpindicator-campaign-set -> arn:aws:sns:ap-southeast-2:881796983903:kpindicator-ses-events
              BOUNCE/CLICK/COMPLAINT/DELIVERY/OPEN/SEND, enabled
SNS topic     SignatureVersion=2, HTTPS subscription to /api/webhooks/ses CONFIRMED
```

Proven end to end on 2026-09-04 by sending through the configuration set: three
`POST /api/webhooks/ses` in `kpindicator.com-access.log`, all `200` — the
confirmation handshake, then SEND and DELIVERY. A test send to an address with no
`EmailRecipient` row returns `recorded=0, unmatched=1`, which is the designed
behaviour, not a fault.

Published at Hostinger: Google MX (`smtp.google.com`), `google._domainkey`, three
SES DKIM CNAMEs, `v=spf1 include:_spf.google.com include:amazonses.com ~all`,
`v=DMARC1; p=none; rua=mailto:dmarc@kpindicator.com; fo=1`, and the MAIL FROM pair
at `mail` (MX `feedback-smtp.ap-southeast-2.amazonses.com` + its own SPF).

The three dead DKIM CNAMEs from the first attempt have been removed; the zone is
now exactly the records above and the two `google-site-verification` TXTs.

**Outstanding:** DMARC reports go to `rua=mailto:dmarc@kpindicator.com`, but no
`dmarc@` alias exists — the Workspace aliases are `hello`, `support`, `insights`,
`alerts`, `emma`, `anna`, `laura`, `mikkel`, `ray`. Reports will bounce. Either add
the alias or repoint `rua` at `alerts@kpindicator.com`. Until that is fixed there is
no DMARC visibility, which is the whole point of `p=none`.

### The region is ap-southeast-2, not us-east-1

`SES_REGION="ap-southeast-2"` — Sydney, the same region and the same shared AWS
account (`881796983903`) as BrandSentryPro. A domain verified in the wrong region
is invisible to this app.

That cost a full round trip. The first three DKIM tokens published to DNS resolved
correctly and looked completely normal, but had been generated in **a different AWS
account** — absent from all 24 regions of this one, and matching none of the five
domain identities in it. DKIM tokens only sign mail from the account that issued
them, and nothing about the record tells you which account that was.

**Read the account ID in the SES console before publishing DKIM records.**
`aws sts get-caller-identity` (or `GetCallerIdentityCommand`) answers it for
whatever credentials you hold; it cannot tell you anything about an account you
have no credentials for.

The app authenticates as `arn:aws:iam::881796983903:user/ray.cerbolles` — a named
person's IAM user, not a service account. Worth replacing: the app's mail stops the
day that key is rotated, and it carries whatever permissions a human needs rather
than SES-send-only.

### The account is on PROBATION

```
ProductionAccessEnabled: true
EnforcementStatus:       PROBATION
24h quota: 82,300   sent in last 24h: 17,668
```

`PROBATION` means AWS has already flagged this account — normally after a bounce or
complaint rate breach — and is watching it. It is shared with `brandsentrypro.com`,
`jumbobooking.com`, `makemoore.com` and `efficientemails.com`, so reputation is
pooled across all of them.

**Do not launch cold outreach from this account while it is on probation.** A cold
list is the highest-bounce, highest-complaint traffic there is; one bad batch takes
down sending for every domain in the account.

### The mailboxes are aliases, not accounts

The nine `@kpindicator.com` addresses (`hello`, `support`, `insights`, `alerts`,
`emma`, `anna`, `laura`, `mikkel`, `ray`) are all aliases on the single Workspace
user `ray@brandsentrypro.com`. Every reply lands in one inbox.

Gmail will not offer an alias in the From dropdown until it is added under
Settings → Accounts → "Send mail as" — one entry per alias. SES ignores aliases
entirely: a verified domain identity sends from any address on the domain whether
or not Workspace knows it exists, so the aliases matter for *receiving* only.

If the personal names are real people they need their own seats. If they are
invented senders, note that CAN-SPAM prohibits false or misleading header
information and sender identity falls under it, Denmark and Norway are stricter
still, and a complaint lands on an account already at PROBATION.

### Send outreach from a person

The templates sign off `— {{senderName}}`. Mail signed by a human but sent from
`support@` reads as automated. Use `nicklas@kpindicator.com` for campaigns (set
per-campaign via `fromName`/`fromEmail`); keep `support@` for transactional.

---

## Part 5 — Open items

- **Rotate every credential that passed through a chat transcript**: the Stripe
  `sk_live` and `whsec_`, the `kpindicator_prod` Postgres password, and the host's
  SSH password. Rotating the Stripe key means rotating it in BrandSentryPro's `.env`,
  since that is the shared source.
- **SES enforcement is `PROBATION`.** Clear it before any cold-outreach batch, or
  send the campaign from somewhere other than this shared account.
- **`charge.refunded` is not wired.** A refunded order still reads `PAID`.
- **The Scandinavian list is on hold** pending a decision on GDPR lawful basis.
  Denmark and Norway are strict; the US list is fine under CAN-SPAM.
- **`CONTACT_NOTIFICATION_EMAIL`** should move off `@brandsentrypro.com` once the
  mailboxes exist.
- **`CLAUDE.md`'s "no test suite" line and README's "Auth note"** are both stale.
