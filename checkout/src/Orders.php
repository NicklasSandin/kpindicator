<?php

declare(strict_types=1);

namespace KPI\Checkout;

use PDO;
use PDOException;
use Throwable;

/**
 * Writes paid orders into the same PostgreSQL database Prisma owns.
 *
 * This is a port of the fulfilment half of src/app/api/webhooks/stripe/route.ts,
 * and it deliberately mirrors that file's conventions rather than inventing its
 * own: the buyer is upserted by email, their first organization by createdAt
 * wins, a missing organization is created as "<name>'s team" with the buyer as
 * OWNER and a TEAM_CREATED audit entry, and only then is the Order written.
 * An order belongs to an Organization, not a User — Order.userId was dropped in
 * 20260830000000_add_organizations.
 *
 * Three things about Prisma's PostgreSQL mapping matter for raw SQL:
 *
 *   - Enums are native Postgres types, so a bound string needs an explicit
 *     ::"OrderStatus"-style cast or the insert fails on a type mismatch.
 *   - Every createdAt/updatedAt column carries DEFAULT CURRENT_TIMESTAMP, so
 *     timestamps are omitted here and left to the database. That is both less
 *     code and one fewer way to get a timezone wrong.
 *   - Ids are client-generated cuid strings, not sequences.
 *
 * Recording is best-effort by design. A database that is unreachable or
 * mid-migration must never turn a successful charge into an error page for the
 * buyer — the webhook retries, and Stripe remains the ledger of record.
 */
final class Orders
{
    private static int $counter = 0;

    private function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * Connect using the DATABASE_URL Prisma reads.
     *
     * Returns null (with a log line) for anything this writer cannot handle, so
     * a misconfigured database degrades to "payments work, orders are not
     * recorded locally" rather than taking checkout down.
     */
    public static function open(?string $databaseUrl): ?self
    {
        if ($databaseUrl === null || $databaseUrl === '') {
            return null;
        }

        $parts = parse_url($databaseUrl);

        if ($parts === false || !isset($parts['scheme'])) {
            error_log('[checkout] DATABASE_URL could not be parsed — skipping order recording.');

            return null;
        }

        if (!in_array($parts['scheme'], ['postgres', 'postgresql'], true)) {
            error_log(sprintf(
                '[checkout] DATABASE_URL is "%s", but this writer only speaks PostgreSQL — skipping order recording.',
                $parts['scheme'],
            ));

            return null;
        }

        if (!extension_loaded('pdo_pgsql')) {
            error_log('[checkout] ext-pdo_pgsql is not installed (dnf install php-pgsql) — skipping order recording.');

            return null;
        }

        parse_str($parts['query'] ?? '', $query);

        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s',
            $parts['host'] ?? 'localhost',
            $parts['port'] ?? 5432,
            ltrim($parts['path'] ?? '', '/'),
        );

        if (isset($query['sslmode']) && preg_match('/^[a-z-]+$/', (string) $query['sslmode'])) {
            $dsn .= ';sslmode=' . $query['sslmode'];
        }

        // Prisma's ?schema= is a search_path, not a DSN field. Validated rather
        // than interpolated blind — this string reaches the server as options.
        if (isset($query['schema']) && preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', (string) $query['schema'])) {
            $dsn .= ";options='--search_path=" . $query['schema'] . "'";
        }

        try {
            $pdo = new PDO(
                $dsn,
                isset($parts['user']) ? rawurldecode($parts['user']) : null,
                isset($parts['pass']) ? rawurldecode($parts['pass']) : null,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 5,
                ],
            );
        } catch (PDOException $e) {
            // Never log the exception verbatim: the DSN, and therefore the
            // database password, can appear in PDO's message.
            error_log('[checkout] Could not connect to PostgreSQL (code ' . $e->getCode() . ') — skipping order recording.');

            return null;
        }

        return new self($pdo);
    }

    /**
     * Record a paid order, idempotently.
     *
     * Called from both the return page and the webhook — whichever arrives
     * first wins, the other is a no-op. A transaction-scoped advisory lock keyed
     * on the payment intent serialises just those two against each other,
     * without taking a lock anyone else contends for. It is needed because the
     * dedup is a SELECT followed by an INSERT: Prisma's only unique index here
     * is on stripeSessionId, which this PaymentIntent flow never populates.
     *
     * @param array<string,mixed> $package
     * @return array{created:bool, orderId:?string}
     */
    public function recordPaid(
        array $package,
        string $email,
        ?string $name,
        ?string $company,
        int $amountCents,
        string $currency,
        string $paymentIntentId,
    ): array {
        try {
            $this->pdo->beginTransaction();

            $lock = $this->pdo->prepare('SELECT pg_advisory_xact_lock(hashtext(?)::bigint)');
            $lock->execute([$paymentIntentId]);

            $existing = $this->pdo->prepare(
                'SELECT "id", "status" FROM "Order" WHERE "stripePaymentIntentId" = ? LIMIT 1'
            );
            $existing->execute([$paymentIntentId]);
            $order = $existing->fetch();

            if ($order !== false) {
                if (($order['status'] ?? null) !== 'PAID') {
                    $update = $this->pdo->prepare('UPDATE "Order" SET "status" = ?::"OrderStatus" WHERE "id" = ?');
                    $update->execute(['PAID', $order['id']]);
                }

                $this->pdo->commit();

                return ['created' => false, 'orderId' => (string) $order['id']];
            }

            $user = $this->upsertUser($email, $name, $company);
            $organizationId = $this->organizationFor($user);
            $orderId = self::cuid();

            $insert = $this->pdo->prepare(
                'INSERT INTO "Order"
                    ("id", "organizationId", "package", "amountCents", "currency",
                     "stripeSessionId", "stripePaymentIntentId", "status")
                 VALUES (?, ?, ?::"PackageType", ?, ?, NULL, ?, ?::"OrderStatus")'
            );
            $insert->execute([
                $orderId,
                $organizationId,
                (string) $package['dbType'],
                $amountCents,
                strtolower($currency),
                $paymentIntentId,
                'PAID',
            ]);

            $this->pdo->commit();

            return ['created' => true, 'orderId' => $orderId];
        } catch (Throwable $e) {
            try {
                if ($this->pdo->inTransaction()) {
                    $this->pdo->rollBack();
                }
            } catch (Throwable) {
                // Nothing useful to do; the original failure is what matters.
            }

            error_log('[checkout] Could not record the order: ' . $e->getMessage());

            return ['created' => false, 'orderId' => null];
        }
    }

    /**
     * Find the buyer by email or create them — the same upsert the Next.js
     * webhook does, down to deriving a display name from the address.
     *
     * @return array{id:string, name:string}
     */
    private function upsertUser(string $email, ?string $name, ?string $company): array
    {
        $email = strtolower(trim($email));

        $lookup = $this->pdo->prepare('SELECT "id", "name" FROM "User" WHERE "email" = ? LIMIT 1');
        $lookup->execute([$email]);
        $found = $lookup->fetch();

        if ($found !== false) {
            return ['id' => (string) $found['id'], 'name' => (string) $found['name']];
        }

        $userId = self::cuid();
        $displayName = $name !== null && trim($name) !== ''
            ? trim($name)
            : (explode('@', $email)[0] ?: $email);

        // "role" and "createdAt" are left to their column defaults (CLIENT,
        // CURRENT_TIMESTAMP). "company" is ours to add — the checkout asks for
        // it, and the hosted-Checkout webhook never had it to give.
        $insert = $this->pdo->prepare(
            'INSERT INTO "User" ("id", "email", "name", "company") VALUES (?, ?, ?, ?)'
        );
        $insert->execute([
            $userId,
            $email,
            $displayName,
            $company !== null && trim($company) !== '' ? trim($company) : null,
        ]);

        return ['id' => $userId, 'name' => $displayName];
    }

    /**
     * The organization the order belongs to: the buyer's earliest membership,
     * or a new team owned by them. Mirrors the webhook, including the audit
     * entry, so a team created by a purchase is indistinguishable from one
     * created at signup.
     *
     * @param array{id:string, name:string} $user
     */
    private function organizationFor(array $user): string
    {
        $lookup = $this->pdo->prepare(
            'SELECT "organizationId" FROM "OrganizationMember"
             WHERE "userId" = ? ORDER BY "createdAt" ASC LIMIT 1'
        );
        $lookup->execute([$user['id']]);
        $membership = $lookup->fetch();

        if ($membership !== false) {
            return (string) $membership['organizationId'];
        }

        $organizationId = self::cuid();
        $teamName = $user['name'] . "'s team";

        $organization = $this->pdo->prepare('INSERT INTO "Organization" ("id", "name") VALUES (?, ?)');
        $organization->execute([$organizationId, $teamName]);

        $member = $this->pdo->prepare(
            'INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role")
             VALUES (?, ?, ?, ?::"OrganizationRole")'
        );
        $member->execute([self::cuid(), $organizationId, $user['id'], 'OWNER']);

        $audit = $this->pdo->prepare(
            'INSERT INTO "OrganizationAuditLog"
                ("id", "organizationId", "actorId", "actorName", "action", "target")
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $audit->execute([self::cuid(), $organizationId, $user['id'], $user['name'], 'TEAM_CREATED', $teamName]);

        return $organizationId;
    }

    /**
     * A cuid-shaped id: 'c' + base36 time + counter + fingerprint + entropy.
     *
     * Prisma generates these client-side, so PHP has to produce ids in the same
     * shape for rows written outside Prisma to look native in the dashboard.
     */
    public static function cuid(): string
    {
        $time = base_convert((string) (int) round(microtime(true) * 1000), 10, 36);
        $counter = str_pad(base_convert((string) (self::$counter++ % 1_679_616), 10, 36), 4, '0', STR_PAD_LEFT);
        $fingerprint = substr(md5((gethostname() ?: 'kpi') . (string) getmypid()), 0, 4);
        $entropy = substr(bin2hex(random_bytes(6)), 0, 8);

        return 'c' . $time . $counter . $fingerprint . $entropy;
    }
}
