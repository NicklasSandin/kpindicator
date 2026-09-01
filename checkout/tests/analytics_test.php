<?php

declare(strict_types=1);

namespace KPI\Checkout\Tests;

use KPI\Checkout\Analytics;

/**
 * Analytics must never be able to break a payment: unconfigured it degrades to
 * the log, and queueing an event does no network work at all.
 */

test('capturing does no network work and cannot throw when unconfigured', function () {
    $a = new Analytics(null);
    $a->capture('checkout_viewed', 'v_1', ['package' => 'market-test']);
    assertSame(false, $a->isConfigured());
});

test('an explicit off switch disables it even with a key present', function () {
    assertSame(false, (new Analytics('phc_key', 'https://us.i.posthog.com', false))->isConfigured());
    assertSame(true, (new Analytics('phc_key', 'https://us.i.posthog.com', true))->isConfigured());
});

test('flushing with no key writes to the log instead of sending', function () {
    $a = new Analytics(null);
    $a->capture('checkout_completed', 'v_1', ['amount' => 99500]);

    $log = tempnam(sys_get_temp_dir(), 'kpilog');
    $previous = ini_get('error_log');
    ini_set('error_log', $log);
    $a->flush();
    ini_set('error_log', $previous === false ? '' : $previous);

    $contents = (string) file_get_contents($log);
    @unlink($log);

    assertTrue(str_contains($contents, 'checkout_completed'), 'the event should reach the log');
    assertTrue(str_contains($contents, 'analytics not configured'), 'and say why it was not sent');
});

test('flushing an empty queue does nothing at all', function () {
    (new Analytics(null))->flush();
    assertTrue(true);
});

test('person properties are sent as PostHog $set', function () {
    $a = new Analytics(null);
    $a->capture('checkout_details_entered', 'v_1', ['has_company' => true], ['email' => 'ada@example.com']);

    $reflection = new \ReflectionProperty(Analytics::class, 'queue');
    $queue = $reflection->getValue($a);

    assertSame('ada@example.com', $queue[0]['properties']['$set']['email']);
    assertSame(true, $queue[0]['properties']['has_company']);
});

test('request context carries referrer and utm tags', function () {
    $savedServer = $_SERVER;
    $savedGet = $_GET;

    $_SERVER['HTTP_HOST'] = 'checkout.kpindicator.com';
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    $_SERVER['REQUEST_URI'] = '/?package=market-test&utm_source=google';
    $_SERVER['HTTP_REFERER'] = 'https://kpindicator.com/pricing';
    $_GET = ['utm_source' => 'google', 'utm_campaign' => 'validation-q3'];

    $context = Analytics::requestContext();

    $_SERVER = $savedServer;
    $_GET = $savedGet;

    assertSame('https://kpindicator.com/pricing', $context['$referrer']);
    assertSame('google', $context['utm_source'], 'ad attribution has to survive to the order');
    assertSame('validation-q3', $context['utm_campaign']);
});

test('overlong utm values are truncated rather than passed through', function () {
    $savedGet = $_GET;
    $_GET = ['utm_campaign' => str_repeat('x', 500)];
    $context = Analytics::requestContext();
    $_GET = $savedGet;

    assertSame(120, strlen($context['utm_campaign']));
});
