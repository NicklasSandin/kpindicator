<?php

declare(strict_types=1);

namespace KPI\Checkout\Tests;

/**
 * Test runner for the checkout.
 *
 *   php checkout/tests/run.php
 *
 * No PHPUnit, for the same reason there is no Composer anywhere else here: the
 * app has no dependencies and adding one just to assert things would be the
 * largest thing in the project. Every *_test.php in this directory is loaded,
 * registers cases with test(), and the runner reports.
 *
 * Cases that need a database read DATABASE_URL and skip themselves when it is
 * absent, so the suite stays runnable on a laptop with nothing installed.
 */

require_once dirname(__DIR__) . '/src/Env.php';
require_once dirname(__DIR__) . '/src/Stripe.php';
require_once dirname(__DIR__) . '/src/Packages.php';
require_once dirname(__DIR__) . '/src/Pricing.php';
require_once dirname(__DIR__) . '/src/Orders.php';
require_once dirname(__DIR__) . '/src/Notifier.php';
require_once dirname(__DIR__) . '/src/Fulfilment.php';
require_once dirname(__DIR__) . '/src/Http.php';
require_once dirname(__DIR__) . '/src/Analytics.php';

final class Skip extends \RuntimeException
{
}

/** @var array<int,array{0:string,1:callable}> */
$GLOBALS['kpi_tests'] = [];

function test(string $name, callable $fn): void
{
    $GLOBALS['kpi_tests'][] = [$name, $fn];
}

function skip(string $why): void
{
    throw new Skip($why);
}

function assertSame(mixed $expected, mixed $actual, string $what = ''): void
{
    if ($expected !== $actual) {
        throw new \RuntimeException(sprintf(
            '%sexpected %s, got %s',
            $what !== '' ? $what . ': ' : '',
            var_export($expected, true),
            var_export($actual, true),
        ));
    }
}

function assertTrue(bool $actual, string $what = 'expected true'): void
{
    if (!$actual) {
        throw new \RuntimeException($what);
    }
}

function assertThrows(callable $fn, string $what = 'expected an exception'): \Throwable
{
    try {
        $fn();
    } catch (\Throwable $e) {
        return $e;
    }

    throw new \RuntimeException($what);
}

foreach (glob(__DIR__ . '/*_test.php') ?: [] as $file) {
    require_once $file;
}

$pass = $fail = $skipped = 0;
$failures = [];

echo "\nKPIndicator checkout — test suite\n\n";

foreach ($GLOBALS['kpi_tests'] as [$name, $fn]) {
    try {
        $fn();
        $pass++;
        printf("  \033[32m✓\033[0m %s\n", $name);
    } catch (Skip $e) {
        $skipped++;
        printf("  \033[33m–\033[0m %s  (skipped: %s)\n", $name, $e->getMessage());
    } catch (\Throwable $e) {
        $fail++;
        $failures[] = [$name, $e->getMessage()];
        printf("  \033[31m✗\033[0m %s\n", $name);
    }
}

printf("\n  %d passed, %d failed, %d skipped\n", $pass, $fail, $skipped);

if ($failures !== []) {
    echo "\n";
    foreach ($failures as [$name, $message]) {
        printf("  \033[31m%s\033[0m\n      %s\n", $name, $message);
    }
    echo "\n";
}

exit($fail === 0 ? 0 : 1);
