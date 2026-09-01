<?php

declare(strict_types=1);

namespace KPI\Checkout\Tests;

use KPI\Checkout\Stripe;
use KPI\Checkout\StripeException;

// -- Form encoding ----------------------------------------------------------
// Stripe takes bracketed form encoding. Getting this wrong charges the wrong
// amount or silently drops metadata the webhook later needs to attribute a sale.

test('encodes a scalar', fn () => assertSame('amount=250000', Stripe::encodeParams(['amount' => 250000])));

test('encodes nested metadata', fn () => assertSame(
    'metadata%5BpackageId%5D=market-test',
    Stripe::encodeParams(['metadata' => ['packageId' => 'market-test']]),
));

test('encodes booleans as Stripe expects, not as 1/0', fn () => assertSame(
    'automatic_payment_methods%5Benabled%5D=true',
    Stripe::encodeParams(['automatic_payment_methods' => ['enabled' => true]]),
));

test('drops nulls rather than sending empty values', fn () => assertSame(
    'b=1',
    Stripe::encodeParams(['a' => null, 'b' => 1]),
));

test('encodes list items with numeric indices', fn () => assertSame(
    'line_items%5B0%5D%5Bprice%5D=price_1',
    Stripe::encodeParams(['line_items' => [['price' => 'price_1']]]),
));

test('escapes values that would otherwise break the body', fn () => assertSame(
    'metadata%5Bnote%5D=a%26b%3Dc',
    Stripe::encodeParams(['metadata' => ['note' => 'a&b=c']]),
));

// -- Webhook signatures -----------------------------------------------------
// The security boundary. Anything that gets past this can forge a paid order.

$secret = 'whsec_test_secret';
$payload = '{"id":"evt_1","type":"payment_intent.succeeded","data":{"object":{"id":"pi_1"}}}';
$sign = static fn (int $t, string $body, string $key): string => 't=' . $t . ',v1=' . hash_hmac('sha256', $t . '.' . $body, $key);

test('accepts a correctly signed event', function () use ($secret, $payload, $sign) {
    $event = Stripe::constructEvent($payload, $sign(time(), $payload, $secret), $secret);
    assertSame('payment_intent.succeeded', $event['type']);
});

test('rejects a wrong signature', function () use ($secret, $payload) {
    assertThrows(fn () => Stripe::constructEvent($payload, 't=' . time() . ',v1=deadbeef', $secret));
});

test('rejects a signature made with a different secret', function () use ($secret, $payload, $sign) {
    assertThrows(fn () => Stripe::constructEvent($payload, $sign(time(), $payload, 'whsec_other'), $secret));
});

test('rejects a replayed old timestamp', function () use ($secret, $payload, $sign) {
    $old = time() - 4000;
    assertThrows(fn () => Stripe::constructEvent($payload, $sign($old, $payload, $secret), $secret));
});

test('rejects a body altered after signing', function () use ($secret, $payload, $sign) {
    $header = $sign(time(), $payload, $secret);
    $tampered = str_replace('pi_1', 'pi_2', $payload);
    assertThrows(fn () => Stripe::constructEvent($tampered, $header, $secret));
});

test('rejects a missing signature header', function () use ($secret, $payload) {
    assertThrows(fn () => Stripe::constructEvent($payload, null, $secret));
});

test('rejects a malformed signature header', function () use ($secret, $payload) {
    assertThrows(fn () => Stripe::constructEvent($payload, 'nonsense', $secret));
});

test('accepts when one of several v1 signatures matches (key rotation)', function () use ($secret, $payload) {
    $t = time();
    $good = hash_hmac('sha256', $t . '.' . $payload, $secret);
    $header = 't=' . $t . ',v1=deadbeef,v1=' . $good;
    assertSame('payment_intent.succeeded', Stripe::constructEvent($payload, $header, $secret)['type']);
});

// -- Id guards --------------------------------------------------------------

test('refuses to fetch a payment intent by a non-pi id', function () {
    $stripe = new Stripe('sk_test_x');
    $e = assertThrows(fn () => $stripe->retrievePaymentIntent('evil'));
    assertTrue($e instanceof StripeException, 'should be a StripeException');
});

test('refuses to fetch a price by a non-price id', function () {
    $stripe = new Stripe('sk_test_x');
    assertThrows(fn () => $stripe->retrievePrice('pi_123'));
});

test('recognises live keys, including restricted ones', function () {
    assertSame(true, (new Stripe('sk_live_x'))->isLiveMode());
    assertSame(true, (new Stripe('rk_live_x'))->isLiveMode(), 'rk_live is live, despite BrandSentryPro naming it a test key');
    assertSame(false, (new Stripe('sk_test_x'))->isLiveMode());
});
