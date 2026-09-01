<?php

declare(strict_types=1);

/**
 * KPIndicator custom checkout — application bootstrap.
 *
 * Builds the whole app: autoloader, configuration, Stripe client, pricing,
 * order writer, notifier and view layer. public/index.php is the only caller.
 *
 * No Composer, no framework. Requirements: PHP 8.1+, ext-curl, ext-json, and
 * ext-pdo_sqlite if you want orders written into the local Prisma database.
 */

namespace KPI\Checkout;

if (PHP_VERSION_ID < 80100) {
    http_response_code(500);
    exit('The KPIndicator checkout needs PHP 8.1 or newer.');
}

foreach (['curl', 'json'] as $extension) {
    if (!extension_loaded($extension)) {
        http_response_code(500);
        exit('The KPIndicator checkout needs the PHP ' . $extension . ' extension.');
    }
}

spl_autoload_register(static function (string $class): void {
    $prefix = __NAMESPACE__ . '\\';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $file = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';

    if (is_file($file)) {
        require_once $file;
    }
});

/**
 * The repository root — the checkout lives one level inside it, and reads the
 * project's own .env and Prisma database from there.
 */
$projectRoot = dirname(__DIR__);

/**
 * Environment, most-specific first.
 *
 * checkout/.env wins, then the Next.js app's own .env at the repo root. That
 * second file is what makes "the same Stripe connection" the default: set the
 * keys once for the site and the checkout picks them up.
 */
$env = new Env([__DIR__ . '/.env', $projectRoot . '/.env']);

/**
 * Optional third source: an .env belonging to another app on this host, so the
 * checkout can share a Stripe connection with it rather than keeping a second
 * copy of the credentials. Point STRIPE_ENV_FILE at BrandSentryPro's .env and
 * both apps charge the same Stripe account from one file — rotate the key
 * there and this checkout follows, with no secret duplicated into this repo.
 * It is read last, so anything set locally still overrides it.
 */
$sharedEnvFile = $env->get('STRIPE_ENV_FILE');

if ($sharedEnvFile !== null) {
    $env = new Env([__DIR__ . '/.env', $projectRoot . '/.env', $sharedEnvFile]);
}

/**
 * The secret key. STRIPE_SECRET_KEY is this project's name for it;
 * STRIPE_KEY is BrandSentryPro's, so a shared env file resolves either way.
 */
$secretKey = $env->first(['STRIPE_SECRET_KEY', 'STRIPE_KEY']);

$stripe = $secretKey !== null
    ? new Stripe($secretKey, $env->get('STRIPE_API_VERSION', Stripe::API_VERSION) ?? Stripe::API_VERSION)
    : null;

/**
 * The publishable key cannot be derived from the secret key — Stripe exposes
 * it only in the dashboard, so it always has to be set explicitly.
 */
$publishableKey = $env->first(['STRIPE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']);

$checkoutEnv = strtolower($env->first(['CHECKOUT_ENV', 'APP_ENV'], 'development') ?? 'development');

/**
 * Funnel analytics. Flushed from a shutdown handler so an analytics outage
 * cannot add latency to someone paying — under PHP-FPM the response has already
 * gone to the browser by then.
 */
$analytics = new Analytics(
    $env->first(['POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_KEY']),
    $env->first(['POSTHOG_HOST', 'NEXT_PUBLIC_POSTHOG_HOST'], 'https://us.i.posthog.com') ?? 'https://us.i.posthog.com',
    $env->bool('CHECKOUT_ANALYTICS', true),
);

register_shutdown_function(static function () use ($analytics): void {
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }

    $analytics->flush();
});

return [
    'analytics' => $analytics,
    'root' => $projectRoot,
    'env' => $env,
    'environment' => $checkoutEnv,
    'is_production' => $checkoutEnv === 'production',

    'stripe' => $stripe,
    'publishable_key' => $publishableKey,
    'webhook_secret' => $env->get('STRIPE_WEBHOOK_SECRET'),
    'webhook_tolerance' => (int) ($env->get('STRIPE_WEBHOOK_TOLERANCE', '300') ?? '300'),

    'pricing' => new Pricing($env, $stripe),

    // Null when the database is unreachable or the driver is missing —
    // recording is best-effort, and Stripe stays the source of truth regardless.
    'orders' => Orders::open($env->get('DATABASE_URL')),

    'notifier' => new Notifier(
        $env->get('RESEND_API_KEY'),
        $env->get('RESEND_FROM_EMAIL'),
        $env->get('CONTACT_NOTIFICATION_EMAIL'),
    ),

    'view' => new View(__DIR__ . '/views'),

    // Where to send people back to on the marketing site.
    'site_url' => rtrim($env->first(['CHECKOUT_SITE_URL', 'NEXT_PUBLIC_SITE_URL'], 'http://localhost:3000') ?? '', '/'),

    // Public base URL of this checkout app. Set CHECKOUT_BASE_URL behind a
    // proxy or on a subpath; otherwise it is derived from the request.
    'base_url' => $env->get('CHECKOUT_BASE_URL'),

    'support_email' => $env->first(['CHECKOUT_SUPPORT_EMAIL', 'CONTACT_NOTIFICATION_EMAIL'], 'hello@kpindicator.com'),
];
