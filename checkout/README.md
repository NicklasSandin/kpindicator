# KPIndicator checkout (PHP)

A custom, self-hosted checkout for the KPIndicator packages, built on Stripe's
[Payment Element quickstart](https://docs.stripe.com/payments/quickstart).

It replaces the hosted Stripe Checkout redirect with a page we control: our
type, our order docket, our copy, our error states — and, unlike the hosted
page, the buyer never leaves the brand. The buyer's card details still never
touch this server, because the card fields live inside an iframe Stripe serves.

Everything that can be PHP is PHP. The browser sends a package id and receives
a rendered page; the amount, the PaymentIntent, the buyer record, the
confirmation, the webhook and the database write all happen server-side. The
single JavaScript file exists only to mount Stripe's iframe and hand it back.

## Requirements

- PHP **8.1+** with `curl`, `json` and `session`
- `pdo_pgsql` to record orders (`dnf install php-pgsql` / `apt install php8.3-pgsql`)
- **No Composer.** There is no `vendor/` and no dependency to install.
  `src/Stripe.php` is a small REST client for the three endpoints this app uses.

## Run it locally

```bash
php -S localhost:8787 -t checkout/public checkout/router.php
```

Then open <http://localhost:8787/?package=market-test>. `GET /health` reports
what is and isn't configured, without printing any secret.

## Configuration

Copy `checkout/.env.example` to `checkout/.env`. Every value is read from the
first source that defines it:

1. the real process environment (what a production host or `docker run -e` sets)
2. `checkout/.env`
3. the repo-root `.env` — the same file the Next.js app uses
4. the file named by `STRIPE_ENV_FILE`, if set

Step 3 is why a working Next.js Stripe setup needs nothing more here.

### Sharing BrandSentryPro's Stripe connection

To charge the same Stripe account BrandSentryPro charges, point at its env file
instead of copying its secret key:

```dotenv
STRIPE_ENV_FILE="/var/www/backend1.brandsentrypro.com/.env"
```

`STRIPE_KEY` — BrandSentryPro's name for the secret key — is accepted as an
alias for `STRIPE_SECRET_KEY`, so the file works as-is. One key, one place to
rotate it, and no live credential duplicated into this repository.

Two values still have to be set explicitly, because BrandSentryPro keeps them
in its `settings` table rather than in `.env`:

| Value | Where to get it |
| --- | --- |
| `STRIPE_PUBLISHABLE_KEY` | Stripe dashboard → Developers → API keys. It cannot be derived from the secret key. |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Developers → Webhooks → your endpoint → signing secret. |

> BrandSentryPro resolves its live key from `settings.stripe_secret` in the
> database, not from `.env`. If the two have drifted, the database is the one
> that is actually charging cards — check it before assuming `.env` is current.

When the secret key is a `sk_live_` key and `CHECKOUT_ENV` is not `production`,
every page carries a warning bar. Real cards, real charges.

> BrandSentryPro's `.env` also holds `STRIPE_TEST_KEY`, and the name is wrong:
> its value is an `rk_live_` key — a **restricted live key**, not a test key.
> Using it as one charges real cards, and it only works at all if its scope
> includes write access to PaymentIntents. If you want test mode, take a
> `sk_test_` key from the dashboard's test toggle.

### Checking the connection

```bash
php checkout/bin/connection-check.php
```

Reports which key the resolution chain landed on (prefix only — it prints no
secrets), whether Stripe accepts it, whether this account accepts the pinned API
version, and what is still missing. Exits non-zero when anything is unset, so it
works as a deploy gate.

## Pricing

Set `STRIPE_PRICE_*` and the amount and currency come from that Stripe Price, so
a price change in the dashboard needs no deploy. Leave them empty and the
checkout charges the catalog amount in `src/Packages.php`, which mirrors
`src/content/packages.ts`. **Keep those two in sync** — the TypeScript file is
what the marketing site shows, and this file is what the buyer is charged.

Either way the amount is resolved server-side. The request body contributes a
package id and nothing else.

## Deploying

Document root must be `checkout/public`. Nothing above it is web-reachable.

### nginx

```nginx
server {
    server_name checkout.kpindicator.com;
    root /var/www/kpindicator/checkout/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php$is_args$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
}
```

### Apache

`public/.htaccess` already carries the rewrite. Point the vhost's `DocumentRoot`
at `checkout/public` and allow `.htaccess` overrides.

Behind a proxy or on a subpath, set `CHECKOUT_BASE_URL` — Stripe's `return_url`
is built from it, and a wrong value sends buyers to a dead page after paying.

## The webhook

Add an endpoint in the Stripe dashboard pointing at `POST /webhook`, subscribed
to `payment_intent.succeeded` and `payment_intent.payment_failed`, and put its
signing secret in `STRIPE_WEBHOOK_SECRET`.

The webhook is not an optimisation. The return page records the order for a
buyer who waits for the redirect; the webhook records it for everyone else —
closed tab, dead battery, a bank redirect that never came back. Both call the
same code, and recording is idempotent, so whichever arrives first wins and the
other is a no-op.

Test it locally with the Stripe CLI:

```bash
stripe listen --forward-to localhost:8787/webhook
```

## Orders

A successful payment writes into the same PostgreSQL database Prisma owns, and
[Orders.php](src/Orders.php) is a direct port of the fulfilment half of
`src/app/api/webhooks/stripe/route.ts` — same conventions, so an order taken
here is indistinguishable from one taken through hosted Checkout:

1. upsert the buyer by email
2. take their earliest `OrganizationMember`, or create `<name>'s team` with them
   as `OWNER` plus a `TEAM_CREATED` audit entry
3. write the `Order` against that `organizationId`

An `Order` belongs to an `Organization`, not a `User` — `Order.userId` was
dropped in `20260830000000_add_organizations`.

Three details of Prisma's PostgreSQL mapping the raw SQL has to respect: enums
are native Postgres types and need `::"OrderStatus"`-style casts; every
`createdAt`/`updatedAt` carries `DEFAULT CURRENT_TIMESTAMP`, so timestamps are
left to the database; and ids are client-generated cuids.

Idempotency is a transaction-scoped advisory lock keyed on the payment intent,
because Prisma's only unique index here is on `stripeSessionId`, which this
PaymentIntent flow never populates. The return page and the webhook can race
freely — whichever lands first wins and the other is a no-op.

Recording is best-effort by design: an unreachable database, a missing
`pdo_pgsql`, or a non-Postgres `DATABASE_URL` logs and moves on rather than
turning a successful charge into an error page. Stripe remains the ledger of
record in every case.

## Layout

| Path | What it does |
| --- | --- |
| `public/index.php` | Front controller. Every route lives here. |
| `public/assets/checkout.js` | The only JavaScript: mounts Stripe's Payment Element. |
| `public/assets/checkout.css` | The editorial system, ported from `src/app/globals.css`. |
| `bootstrap.php` | Autoloader, env resolution, wiring. |
| `src/Stripe.php` | Dependency-free REST client and webhook signature verification. |
| `src/Pricing.php` | Resolves the amount — Stripe Price first, catalog second. |
| `src/Packages.php` | The catalog, mirroring `src/content/packages.ts`. |
| `src/Fulfilment.php` | What happens after a successful PaymentIntent. |
| `src/Orders.php` | Prisma-compatible PostgreSQL writer (user → org → order). |
| `src/Http.php` | Routing, JSON, session, CSRF. |
| `src/Env.php`, `src/View.php`, `src/Notifier.php` | Dotenv, templates, admin alerts. |
| `bin/connection-check.php` | CLI self-check: key, account, API version, what's missing. |
| `router.php` | Dev-only shim for `php -S`. |

## Routes

| Route | Purpose |
| --- | --- |
| `GET /?package=<id>` | The checkout sheet. |
| `POST /api/payment-intent` | Creates (or replays) the PaymentIntent. CSRF-protected. |
| `POST /api/buyer` | Attaches email and name to the PaymentIntent. CSRF-protected. |
| `GET /return` | Where Stripe redirects after confirmation. |
| `POST /webhook` | Signature-verified Stripe events. |
| `GET /health` | Configuration self-check. No secrets. |

## Before going live

- [ ] `php checkout/bin/connection-check.php` exits 0, and `GET /health` reports `ok: true`
- [ ] `CHECKOUT_ENV=production` and `CHECKOUT_BASE_URL` set on the server
- [ ] Webhook endpoint added in Stripe and its signing secret configured
- [ ] A test-mode payment with `4242 4242 4242 4242` reaches the success page
- [ ] `3184 0000 0000 0004` (3DS) also completes — that path uses the redirect
- [ ] `4000 0000 0000 9995` (decline) shows a usable error, not a stack trace
- [ ] The order appears in the client dashboard
- [ ] Document root is `checkout/public`, and `/../.env` returns 404
