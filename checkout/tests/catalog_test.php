<?php

declare(strict_types=1);

namespace KPI\Checkout\Tests;

use KPI\Checkout\Packages;
use KPI\Checkout\Pricing;

/**
 * The checkout keeps its own copy of the package catalog because PHP cannot
 * import a .ts module. That duplication is the single most dangerous thing in
 * this app: the TypeScript file is what the buyer is *shown*, and the PHP file
 * is what they are *charged*. These tests read both and fail on any drift.
 */

$repoRoot = dirname(dirname(__DIR__));
$tsPath = $repoRoot . '/src/content/packages.ts';
$schemaPath = $repoRoot . '/prisma/schema.prisma';

/** Pull id/dbType/priceCents triples straight out of the TypeScript source. */
$parseTs = static function (string $path): array {
    $source = @file_get_contents($path);
    if ($source === false) {
        skip('src/content/packages.ts not readable from here');
    }

    preg_match_all(
        '/id:\s*"([a-z-]+)",\s*dbType:\s*"([A-Z_]+)",\s*name:\s*"([^"]+)",\s*priceCents:\s*(\d+)/',
        $source,
        $m,
        PREG_SET_ORDER,
    );

    $out = [];
    foreach ($m as $row) {
        $out[$row[1]] = ['dbType' => $row[2], 'name' => $row[3], 'priceCents' => (int) $row[4]];
    }

    return $out;
};

test('the PHP catalog lists the same packages as packages.ts', function () use ($parseTs, $tsPath) {
    $ts = $parseTs($tsPath);
    assertTrue($ts !== [], 'parsed no packages out of the TypeScript — the parser needs updating');

    $php = array_column(Packages::all(), 'id');
    sort($php);
    $tsIds = array_keys($ts);
    sort($tsIds);

    assertSame($tsIds, $php, 'package ids differ between packages.ts and Packages.php');
});

test('every price matches packages.ts exactly', function () use ($parseTs, $tsPath) {
    $ts = $parseTs($tsPath);

    foreach (Packages::all() as $pkg) {
        $id = (string) $pkg['id'];
        assertTrue(isset($ts[$id]), "package $id is missing from packages.ts");
        assertSame(
            $ts[$id]['priceCents'],
            (int) $pkg['priceCents'],
            "$id is priced differently in PHP than the site shows",
        );
    }
});

test('every package name matches packages.ts', function () use ($parseTs, $tsPath) {
    $ts = $parseTs($tsPath);
    foreach (Packages::all() as $pkg) {
        assertSame($ts[(string) $pkg['id']]['name'], (string) $pkg['name'], 'name drift for ' . $pkg['id']);
    }
});

test('every dbType matches packages.ts', function () use ($parseTs, $tsPath) {
    $ts = $parseTs($tsPath);
    foreach (Packages::all() as $pkg) {
        assertSame($ts[(string) $pkg['id']]['dbType'], (string) $pkg['dbType'], 'dbType drift for ' . $pkg['id']);
    }
});

test('every dbType is a real value of the Prisma PackageType enum', function () use ($schemaPath) {
    $schema = @file_get_contents($schemaPath);
    if ($schema === false) {
        skip('prisma/schema.prisma not readable from here');
    }

    preg_match('/enum PackageType \{(.*?)\}/s', $schema, $m);
    assertTrue(isset($m[1]), 'could not find enum PackageType in the schema');

    $allowed = preg_split('/\s+/', trim($m[1])) ?: [];

    foreach (Packages::all() as $pkg) {
        assertTrue(
            in_array((string) $pkg['dbType'], $allowed, true),
            $pkg['dbType'] . ' is not a PackageType the database will accept',
        );
    }
});

test('exactly one package is featured, and it is the checkout default', function () {
    $featured = array_values(array_filter(Packages::all(), fn ($p) => $p['featured'] === true));
    assertSame(1, count($featured), 'expected exactly one featured package');
    assertSame((string) $featured[0]['id'], Packages::defaultId());
});

test('unknown package ids resolve to null rather than a default', function () {
    assertSame(null, Packages::find('does-not-exist'));
    assertSame(null, Packages::find(null));
});

test('lookup by database type works, for webhook attribution', function () {
    $pkg = Packages::findByDbType('MARKET_TEST');
    assertTrue($pkg !== null, 'MARKET_TEST should resolve');
    assertSame('market-test', (string) $pkg['id']);
});

test('every package has the fields the checkout page renders', function () {
    foreach (Packages::all() as $pkg) {
        foreach (['id', 'dbType', 'name', 'priceCents', 'tagline', 'duration', 'bestFor', 'deliverables', 'priceEnvVar'] as $field) {
            assertTrue(isset($pkg[$field]), "{$pkg['id']} is missing $field");
        }
        assertTrue($pkg['priceCents'] > 0, "{$pkg['id']} has a non-positive price");
        assertTrue($pkg['deliverables'] !== [], "{$pkg['id']} lists no deliverables");
    }
});

// -- Money ------------------------------------------------------------------

test('formats whole amounts without stray decimals', fn () => assertSame('$2,500', Pricing::format(250000)));
test('formats amounts with cents', fn () => assertSame('$995.50', Pricing::format(99550)));
test('formats a leading-zero cents amount', fn () => assertSame('$10.05', Pricing::format(1005)));
test('formats other currencies', function () {
    assertSame("\u{20AC}1,000", Pricing::format(100000, 'eur'));
    assertSame('NOK 1,000', Pricing::format(100000, 'nok'), 'unknown currencies fall back to the code');
});
