<?php

declare(strict_types=1);

namespace KPI\Checkout\Tests;

use KPI\Checkout\Http;

/**
 * Routing has to work whether the app is served from a domain root with a
 * rewrite, from a subpath, or through PHP's built-in server — a wrong route
 * means Stripe's return_url lands on a 404 after the card has been charged.
 */

$withServer = static function (array $server, callable $fn) {
    $saved = $_SERVER;
    $_SERVER = array_merge($_SERVER, $server);
    try {
        return $fn();
    } finally {
        $_SERVER = $saved;
    }
};

test('routes at a domain root behind a rewrite', function () use ($withServer) {
    assertSame('/', $withServer(['REQUEST_URI' => '/', 'SCRIPT_NAME' => '/index.php'], fn () => Http::path()));
});

test('routes an api path at a domain root', function () use ($withServer) {
    assertSame('/api/payment-intent', $withServer(
        ['REQUEST_URI' => '/api/payment-intent', 'SCRIPT_NAME' => '/index.php'],
        fn () => Http::path(),
    ));
});

test('ignores the query string when routing', function () use ($withServer) {
    assertSame('/', $withServer(['REQUEST_URI' => '/?package=market-test', 'SCRIPT_NAME' => '/index.php'], fn () => Http::path()));
});

test('routes when mounted on a subpath', function () use ($withServer) {
    assertSame('/return', $withServer(
        ['REQUEST_URI' => '/checkout/return', 'SCRIPT_NAME' => '/checkout/index.php'],
        fn () => Http::path(),
    ));
});

test('routes with index.php in the path, as without a rewrite', function () use ($withServer) {
    assertSame('/webhook', $withServer(
        ['REQUEST_URI' => '/index.php/webhook', 'SCRIPT_NAME' => '/index.php'],
        fn () => Http::path(),
    ));
});

test('normalises a trailing slash', function () use ($withServer) {
    assertSame('/return', $withServer(['REQUEST_URI' => '/return/', 'SCRIPT_NAME' => '/index.php'], fn () => Http::path()));
});

test('builds an https base url behind a proxy header', function () use ($withServer) {
    assertSame('https://checkout.kpindicator.com', $withServer(
        ['HTTP_HOST' => 'checkout.kpindicator.com', 'HTTP_X_FORWARDED_PROTO' => 'https', 'SCRIPT_NAME' => '/index.php'],
        fn () => Http::baseUrl(),
    ));
});

test('a configured base url overrides what the request implies', function () use ($withServer) {
    assertSame('https://configured.example', $withServer(
        ['HTTP_HOST' => 'wrong.example', 'SCRIPT_NAME' => '/index.php'],
        fn () => Http::baseUrl('https://configured.example/'),
    ));
});

test('builds the return url Stripe redirects to', function () use ($withServer) {
    assertSame('https://checkout.kpindicator.com/return', $withServer(
        ['HTTP_HOST' => 'checkout.kpindicator.com', 'HTTPS' => 'on', 'SCRIPT_NAME' => '/index.php'],
        fn () => Http::url('/return'),
    ));
});

test('sessions are writable, or says why not', function () {
    $result = Http::sessionsWork();
    assertTrue($result['ok'], 'sessions unusable at ' . $result['path'] . ': ' . $result['detail']);
});
