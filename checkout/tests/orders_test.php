<?php

declare(strict_types=1);

namespace KPI\Checkout\Tests;

use KPI\Checkout\Fulfilment;
use KPI\Checkout\Notifier;
use KPI\Checkout\Orders;
use KPI\Checkout\Packages;

/**
 * The fulfilment chain against a real PostgreSQL schema.
 *
 * Skipped unless DATABASE_URL points at a throwaway database with the project's
 * migrations applied — see checkout/README.md. Never point this at production:
 * it writes orders.
 */

$url = getenv('DATABASE_URL') ?: null;
$isPg = is_string($url) && preg_match('#^postgres(ql)?://#', $url) === 1;

$pdo = null;
if ($isPg && extension_loaded('pdo_pgsql')) {
    $p = parse_url($url);
    try {
        $pdo = new \PDO(
            sprintf('pgsql:host=%s;port=%d;dbname=%s', $p['host'] ?? 'localhost', $p['port'] ?? 5432, ltrim($p['path'] ?? '', '/')),
            isset($p['user']) ? rawurldecode($p['user']) : null,
            isset($p['pass']) ? rawurldecode($p['pass']) : null,
            [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION, \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC],
        );
    } catch (\Throwable) {
        $pdo = null;
    }
}

$need = static function () use ($pdo, $isPg) {
    if (!$isPg) {
        skip('DATABASE_URL is not a PostgreSQL URL');
    }
    if (!extension_loaded('pdo_pgsql')) {
        skip('ext-pdo_pgsql not installed');
    }
    if ($pdo === null) {
        skip('could not connect to the test database');
    }
};

$fresh = static function () use ($pdo) {
    // Truncate rather than delete so identity of the run is obvious on failure.
    $pdo->exec('TRUNCATE "Order", "OrganizationAuditLog", "OrganizationMember", "Organization", "User" RESTART IDENTITY CASCADE');

    return new Fulfilment(Orders::open(getenv('DATABASE_URL')), new Notifier(null, null, null));
};

$intent = static fn (string $id, string $pkg, int $amount, string $email, ?string $name = null, ?string $company = null): array => [
    'id' => $id,
    'status' => 'succeeded',
    'amount' => $amount,
    'amount_received' => $amount,
    'currency' => 'usd',
    'receipt_email' => $email,
    'metadata' => array_filter([
        'packageId' => $pkg,
        'packageType' => (string) Packages::find($pkg)['dbType'],
        'email' => $email,
        'name' => $name,
        'company' => $company,
    ]),
];

$count = static fn (string $table): int => (int) $pdo->query('SELECT count(*) FROM "' . $table . '"')->fetchColumn();
$one = static function (string $sql, array $args = []) use ($pdo) {
    $s = $pdo->prepare($sql);
    $s->execute($args);

    return $s->fetch();
};

test('a first-time buyer gets a user, a team, an owner membership and an order', function () use ($need, $fresh, $intent, $count, $one) {
    $need();
    $f = $fresh();

    $result = $f->fulfil($intent('pi_t1', 'market-test', 250000, 'ada@example.com', 'Ada Buyer', 'Buyer Labs'));

    assertSame(true, $result['recorded']);
    assertSame(1, $count('User'));
    assertSame(1, $count('Organization'));
    assertSame(1, $count('Order'));

    $user = $one('SELECT * FROM "User" WHERE "email" = ?', ['ada@example.com']);
    assertSame('Ada Buyer', (string) $user['name']);
    assertSame('Buyer Labs', (string) $user['company']);
    assertSame('CLIENT', (string) $user['role'], 'role should come from the column default');

    assertSame("Ada Buyer's team", (string) $one('SELECT "name" FROM "Organization"')['name']);
    assertSame('OWNER', (string) $one('SELECT "role" FROM "OrganizationMember"')['role']);
    assertSame('TEAM_CREATED', (string) $one('SELECT "action" FROM "OrganizationAuditLog"')['action']);

    $order = $one('SELECT * FROM "Order"');
    assertSame('PAID', (string) $order['status']);
    assertSame('MARKET_TEST', (string) $order['package']);
    assertSame(250000, (int) $order['amountCents']);
    assertSame('usd', (string) $order['currency']);
    assertTrue($order['createdAt'] !== null, 'createdAt should be filled by the column default');
});

test('replaying the same payment intent creates nothing extra', function () use ($need, $fresh, $intent, $count) {
    $need();
    $f = $fresh();

    $f->fulfil($intent('pi_t2', 'market-test', 250000, 'ada@example.com', 'Ada Buyer'));
    $second = $f->fulfil($intent('pi_t2', 'market-test', 250000, 'ada@example.com', 'Ada Buyer'));

    assertSame(false, $second['recorded'], 'the second call must report it did not create anything');
    assertSame(1, $count('Order'), 'the webhook and the return page must not both insert');
    assertSame(1, $count('Organization'));
});

test('a repeat purchase reuses the existing team', function () use ($need, $fresh, $intent, $count) {
    $need();
    $f = $fresh();

    $f->fulfil($intent('pi_t3a', 'market-test', 250000, 'ada@example.com', 'Ada Buyer'));
    $f->fulfil($intent('pi_t3b', 'idea-check', 99500, 'ada@example.com', 'Ada Buyer'));

    assertSame(2, $count('Order'));
    assertSame(1, $count('Organization'), 'a second purchase must not create a second team');
    assertSame(1, $count('User'));
});

test('a buyer who already has a team gets the order on that team', function () use ($need, $fresh, $intent, $count, $one, $pdo) {
    $need();
    $f = $fresh();

    $pdo->exec('INSERT INTO "User" ("id","email","name") VALUES (\'u_pre\',\'member@example.com\',\'Pre Existing\')');
    $pdo->exec('INSERT INTO "Organization" ("id","name") VALUES (\'org_pre\',\'Existing Co\')');
    $pdo->exec('INSERT INTO "OrganizationMember" ("id","organizationId","userId","role") VALUES (\'m_pre\',\'org_pre\',\'u_pre\',\'ADMIN\')');

    $f->fulfil($intent('pi_t4', 'validation-sprint', 490000, 'member@example.com'));

    assertSame('org_pre', (string) $one('SELECT "organizationId" FROM "Order"')['organizationId']);
    assertSame(1, $count('Organization'), 'must not create a duplicate team');
    assertSame(1, $count('User'), 'must not create a duplicate user');
});

test('email is matched case-insensitively, so one buyer is one user', function () use ($need, $fresh, $intent, $count) {
    $need();
    $f = $fresh();

    $f->fulfil($intent('pi_t5a', 'idea-check', 99500, 'Ada@Example.com', 'Ada'));
    $f->fulfil($intent('pi_t5b', 'idea-check', 99500, 'ada@example.com', 'Ada'));

    assertSame(1, $count('User'), 'differing case must not produce two users');
    assertSame(2, $count('Order'));
});

test('an intent with no usable email records nothing', function () use ($need, $fresh, $count) {
    $need();
    $f = $fresh();

    $result = $f->fulfil([
        'id' => 'pi_t6', 'status' => 'succeeded', 'amount' => 99500, 'currency' => 'usd',
        'metadata' => ['packageId' => 'idea-check'],
    ]);

    assertSame(false, $result['recorded']);
    assertSame(0, $count('Order'), 'an unattributable payment must not create a half-formed order');
});

test('an intent for an unknown package records nothing', function () use ($need, $fresh, $count) {
    $need();
    $f = $fresh();

    $result = $f->fulfil([
        'id' => 'pi_t7', 'status' => 'succeeded', 'amount' => 1, 'currency' => 'usd',
        'receipt_email' => 'x@example.com', 'metadata' => ['packageId' => 'not-a-package'],
    ]);

    assertSame(false, $result['recorded']);
    assertSame(0, $count('Order'));
});

test('the amount recorded is what Stripe actually received', function () use ($need, $fresh, $one) {
    $need();
    $f = $fresh();

    // amount_received differing from amount is what a partial capture or a
    // currency conversion looks like; the received figure is the true one.
    $f->fulfil([
        'id' => 'pi_t8', 'status' => 'succeeded', 'amount' => 250000, 'amount_received' => 249000,
        'currency' => 'usd', 'receipt_email' => 'ada@example.com',
        'metadata' => ['packageId' => 'market-test', 'name' => 'Ada'],
    ]);

    assertSame(249000, (int) $one('SELECT "amountCents" FROM "Order"')['amountCents']);
});

test('a non-PostgreSQL DATABASE_URL degrades instead of throwing', function () {
    assertSame(null, Orders::open('file:./dev.db'), 'SQLite is no longer supported and must be refused, not crash');
    assertSame(null, Orders::open(null));
    assertSame(null, Orders::open('nonsense'));
});
