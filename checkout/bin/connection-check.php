<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * Connection self-check — run it from the CLI, prints no secrets:
 *
 *   php checkout/bin/connection-check.php
 *
 * Answers the four questions that actually block go-live: which key the
 * resolution chain lands on, whether Stripe accepts it, whether this account
 * accepts the pinned API version, and what is still missing.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

/** @var array<string,mixed> $app */
$app = require dirname(__DIR__) . '/bootstrap.php';

/** @var Env $env */
$env = $app['env'];
/** @var Stripe|null $stripe */
$stripe = $app['stripe'];

$line = static fn (string $label, string $value): string => sprintf("  %-16s %s\n", $label, $value);

echo "\nKPIndicator checkout — connection check\n\n";

$session = Http::sessionsWork();
echo $line('sessions', ($session['ok'] ? 'OK' : 'BROKEN') . '  ' . $session['path'] . '  (' . $session['detail'] . ')');

$sharedFile = $env->get('STRIPE_ENV_FILE');
echo $line('env file', $sharedFile ?? '(none — using checkout/.env and the repo .env)');

if ($sharedFile !== null && !is_readable($sharedFile)) {
    echo $line('', 'WARNING: that path is not readable from here.');
}

$secret = $env->first(['STRIPE_SECRET_KEY', 'STRIPE_KEY']);

if ($secret === null || $stripe === null) {
    echo $line('secret key', 'MISSING — set STRIPE_SECRET_KEY or STRIPE_KEY.');
    exit(1);
}

// Prefix only. Enough to tell live from test and secret from restricted;
// not enough to be worth anything to anyone reading a terminal over a shoulder.
echo $line('secret key', substr($secret, 0, 8) . '…  (' . strlen($secret) . ' chars)');

if (str_starts_with($secret, 'rk_')) {
    echo $line('', 'NOTE: rk_ is a RESTRICTED key. It must carry write access to');
    echo $line('', 'PaymentIntents, or creating a payment will fail at checkout.');
}

if ($stripe->isLiveMode()) {
    echo $line('', 'This is a LIVE key. Real cards, real charges.');
}

try {
    $account = $stripe->request('GET', '/account');
    echo $line('connection', 'OK');
    echo $line('account', (string) ($account['id'] ?? '?'));
    echo $line('business', (string) ($account['business_profile']['name']
        ?? $account['settings']['dashboard']['display_name'] ?? '?'));
    echo $line('country', ((string) ($account['country'] ?? '?'))
        . ' / ' . strtoupper((string) ($account['default_currency'] ?? '?')));
    echo $line('charges', !empty($account['charges_enabled']) ? 'enabled' : 'NOT ENABLED');
    echo $line('api version', Stripe::API_VERSION . ' accepted');
} catch (StripeException $e) {
    echo $line('connection', 'FAILED — ' . $e->getMessage());
    exit(1);
}

echo "\n";

$missing = [];

if (!$session['ok']) {
    $missing[] = 'Sessions cannot be written, so every CSRF check fails and the checkout '
        . 'cannot create a payment. Nothing else reports this — the page just says the '
        . 'session expired. Fix the directory above, or let the app use its own: '
        . 'mkdir -p checkout/storage/sessions && chown nginx:nginx checkout/storage/sessions';
}

if ($app['publishable_key'] === null) {
    $missing[] = 'STRIPE_PUBLISHABLE_KEY — dashboard > Developers > API keys.'
        . ' Must be the pk_ key from THIS account. Without it the card field cannot load.';
}

if (!is_string($app['webhook_secret']) || $app['webhook_secret'] === '') {
    $missing[] = 'STRIPE_WEBHOOK_SECRET — dashboard > Developers > Webhooks.'
        . ' Without it only buyers who wait for the redirect get an order recorded.';
}

if ($app['orders'] === null) {
    $reason = match (true) {
        $env->get('DATABASE_URL') === null => 'DATABASE_URL is not set',
        !extension_loaded('pdo_pgsql') => 'ext-pdo_pgsql is not installed (dnf install php-pgsql)',
        default => 'the database could not be opened — see the log line above',
    };
    $missing[] = 'Order recording is off: ' . $reason . '. Payments still work; orders just are not written.';
}

if ($missing === []) {
    echo "  Everything the checkout needs is configured.\n\n";
    exit(0);
}

echo "  Still to configure:\n";
foreach ($missing as $item) {
    echo '    - ' . $item . "\n";
}
echo "\n";

exit(1);
