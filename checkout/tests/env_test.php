<?php

declare(strict_types=1);

namespace KPI\Checkout\Tests;

use KPI\Checkout\Env;

/**
 * The dotenv reader decides which Stripe key the checkout charges with, so its
 * edge cases are not cosmetic. The placeholder rule in particular: a half-filled
 * .env must behave like an empty one rather than sending "sk_test_..." to
 * Stripe as if it were a key.
 */

$write = static function (string $body): string {
    $path = tempnam(sys_get_temp_dir(), 'kpienv');
    file_put_contents($path, $body);

    return $path;
};

test('reads a plain value', function () use ($write) {
    assertSame('plain', (new Env([$write("A=plain\n")]))->get('A'));
});

test('strips double and single quotes', function () use ($write) {
    $env = new Env([$write("A=\"double\"\nB='single'\n")]);
    assertSame('double', $env->get('A'));
    assertSame('single', $env->get('B'));
});

test('treats a trailing ... placeholder as unset', function () use ($write) {
    assertSame(null, (new Env([$write("STRIPE_SECRET_KEY=sk_test_...\n")]))->get('STRIPE_SECRET_KEY'));
});

test('treats an empty value as unset', function () use ($write) {
    assertSame(null, (new Env([$write("A=\nB=\"\"\n")]))->get('A'));
});

test('ignores comments and blank lines', function () use ($write) {
    $env = new Env([$write("# a comment\n\nA=kept\n")]);
    assertSame('kept', $env->get('A'));
});

test('strips a trailing inline comment from an unquoted value', function () use ($write) {
    assertSame('bare', (new Env([$write("A=bare # trailing\n")]))->get('A'));
});

test('keeps a # inside a quoted value', function () use ($write) {
    assertSame('pa#ss', (new Env([$write("A=\"pa#ss\"\n")]))->get('A'));
});

test('handles an export prefix', function () use ($write) {
    assertSame('v', (new Env([$write("export A=v\n")]))->get('A'));
});

test('keeps = inside a value, as connection strings contain', function () use ($write) {
    assertSame('a=b=c', (new Env([$write("A=a=b=c\n")]))->get('A'));
});

test('earlier files win over later ones', function () use ($write) {
    $env = new Env([$write("A=first\n"), $write("A=second\n")]);
    assertSame('first', $env->get('A'), 'checkout/.env must beat the repo .env');
});

test('falls through to a later file when the earlier one omits the key', function () use ($write) {
    $env = new Env([$write("A=first\n"), $write("B=second\n")]);
    assertSame('second', $env->get('B'));
});

test('first() picks the first key that is actually set', function () use ($write) {
    // Exactly the STRIPE_SECRET_KEY / STRIPE_KEY alias case.
    $env = new Env([$write("STRIPE_SECRET_KEY=sk_test_...\nSTRIPE_KEY=sk_live_real\n")]);
    assertSame('sk_live_real', $env->first(['STRIPE_SECRET_KEY', 'STRIPE_KEY']));
});

test('missing files are ignored rather than fatal', function () {
    assertSame(null, (new Env(['/definitely/not/here.env']))->get('A'));
});

test('bool() reads the usual truthy spellings', function () use ($write) {
    $env = new Env([$write("A=true\nB=1\nC=yes\nD=off\n")]);
    assertSame(true, $env->bool('A'));
    assertSame(true, $env->bool('B'));
    assertSame(true, $env->bool('C'));
    assertSame(false, $env->bool('D'));
    assertSame(true, $env->bool('MISSING', true), 'default is respected');
});
