<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * Front controller for the KPIndicator custom checkout.
 *
 * Everything except mounting Stripe's Payment Element happens here in PHP: the
 * amount, the PaymentIntent, the buyer details, the confirmation, the webhook,
 * and writing the order into the project database. The browser never decides
 * what it is charged — it only renders an iframe Stripe owns and posts back a
 * package id.
 *
 *   GET  /                     checkout page for ?package=<id>
 *   POST /api/payment-intent   create (or replay) the PaymentIntent
 *   POST /api/buyer            attach email/name to the PaymentIntent
 *   GET  /return               Stripe redirects here after confirmation
 *   POST /webhook              payment_intent.* events
 *   GET  /health               configuration self-check, no secrets
 */

/** @var array<string,mixed> $app */
$app = require dirname(__DIR__) . '/bootstrap.php';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$path = Http::path();

/** @var Stripe|null $stripe */
$stripe = $app['stripe'];
/** @var View $view */
$view = $app['view'];
/** @var Pricing $pricing */
$pricing = $app['pricing'];
/** @var string|null $baseUrlConfig */
$baseUrlConfig = $app['base_url'];

$fulfilment = new Fulfilment($app['orders'], $app['notifier']);

try {
    switch (true) {
        // -- Checkout page --------------------------------------------------
        case $method === 'GET' && ($path === '/' || $path === '/checkout'):
            $requestedId = isset($_GET['package']) && is_string($_GET['package']) ? $_GET['package'] : null;
            $package = Packages::find($requestedId ?? Packages::defaultId());

            if ($package === null) {
                $view->render('error', [
                    'title' => 'No such package',
                    'message' => 'That package link is not one we sell. Pick one from the pricing page and try again.',
                    'siteUrl' => $app['site_url'],
                    'linkLabel' => 'See packages',
                    'linkHref' => $app['site_url'] . '/pricing',
                ], 404);
                break;
            }

            $price = $pricing->resolve($package);
            $prefillEmail = isset($_GET['email']) && is_string($_GET['email'])
                && filter_var($_GET['email'], FILTER_VALIDATE_EMAIL) ? $_GET['email'] : '';

            $view->render('checkout', [
                'package' => $package,
                'price' => $price,
                'priceLabel' => Pricing::format($price['amount'], $price['currency']),
                'publishableKey' => $app['publishable_key'],
                'configured' => $stripe !== null && $app['publishable_key'] !== null,
                'csrfToken' => Http::csrfToken(),
                'prefillEmail' => $prefillEmail,
                'siteUrl' => $app['site_url'],
                'supportEmail' => $app['support_email'],
                // A live key outside production is worth shouting about: every
                // card entered on this page is a real charge.
                'liveWarning' => $stripe !== null && $stripe->isLiveMode() && $app['is_production'] !== true,
                'endpoints' => [
                    'paymentIntent' => Http::url('/api/payment-intent', $baseUrlConfig),
                    'buyer' => Http::url('/api/buyer', $baseUrlConfig),
                    'return' => Http::url('/return', $baseUrlConfig),
                ],
            ]);
            break;

        // -- Create the PaymentIntent ---------------------------------------
        case $method === 'POST' && $path === '/api/payment-intent':
            if (!Http::csrfValid()) {
                Http::json(['error' => 'Your session expired. Reload the page and try again.'], 419);
                break;
            }

            if ($stripe === null) {
                Http::json([
                    'error' => "Payments aren't configured yet. Set STRIPE_SECRET_KEY (or STRIPE_KEY) and try again.",
                ], 501);
                break;
            }

            $body = Http::jsonBody();
            $package = Packages::find(is_string($body['packageId'] ?? null) ? $body['packageId'] : null);

            if ($package === null) {
                Http::json(['error' => 'Unknown package.'], 400);
                break;
            }

            // Priced server-side, every time. The request body contributes a
            // package id and nothing else.
            $price = $pricing->resolve($package);

            // Keyed on the session so a double-click, a reload, or a retried
            // request replays the same PaymentIntent instead of opening a
            // second one against the same buyer.
            $idempotencyKey = hash('sha256', implode('|', [
                session_id() ?: 'no-session',
                (string) $package['id'],
                (string) $price['amount'],
                $price['currency'],
            ]));

            $intent = $stripe->createPaymentIntent([
                'amount' => $price['amount'],
                'currency' => $price['currency'],
                'automatic_payment_methods' => ['enabled' => true],
                'description' => sprintf('KPIndicator — %s', (string) $package['name']),
                'metadata' => [
                    'packageId' => (string) $package['id'],
                    'packageType' => (string) $package['dbType'],
                    'packageName' => (string) $package['name'],
                    'priceId' => $price['priceId'],
                    'source' => 'php-checkout',
                ],
            ], $idempotencyKey);

            Http::rememberPaymentIntent((string) $intent['id'], [
                'packageId' => (string) $package['id'],
                'amount' => $price['amount'],
                'currency' => $price['currency'],
            ]);

            Http::json([
                'clientSecret' => $intent['client_secret'] ?? null,
                'paymentIntentId' => $intent['id'] ?? null,
                'amount' => $price['amount'],
                'currency' => $price['currency'],
            ]);
            break;

        // -- Attach buyer details -------------------------------------------
        case $method === 'POST' && $path === '/api/buyer':
            if (!Http::csrfValid()) {
                Http::json(['error' => 'Your session expired. Reload the page and try again.'], 419);
                break;
            }

            if ($stripe === null) {
                Http::json(['error' => 'Payments are not configured.'], 501);
                break;
            }

            $body = Http::jsonBody();
            $intentId = is_string($body['paymentIntentId'] ?? null) ? $body['paymentIntentId'] : '';
            $email = is_string($body['email'] ?? null) ? strtolower(trim($body['email'])) : '';
            $name = is_string($body['name'] ?? null) ? trim($body['name']) : '';
            $company = is_string($body['company'] ?? null) ? trim($body['company']) : '';

            // Only PaymentIntents this browser created. Without this check an
            // id alone would let anyone rewrite another buyer's receipt email.
            if ($intentId === '' || Http::recallPaymentIntent($intentId) === null) {
                Http::json(['error' => 'That payment session is no longer valid. Reload the page and try again.'], 400);
                break;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Http::json(['error' => 'Enter a valid email address so we can send your receipt and intake link.'], 422);
                break;
            }

            $stripe->updatePaymentIntent($intentId, [
                'receipt_email' => $email,
                'metadata' => [
                    'email' => $email,
                    'name' => $name !== '' ? mb_substr($name, 0, 120) : null,
                    'company' => $company !== '' ? mb_substr($company, 0, 120) : null,
                ],
            ]);

            Http::json(['ok' => true]);
            break;

        // -- Return from Stripe ---------------------------------------------
        case $method === 'GET' && $path === '/return':
            $intentId = isset($_GET['payment_intent']) && is_string($_GET['payment_intent']) ? $_GET['payment_intent'] : '';
            $clientSecret = isset($_GET['payment_intent_client_secret']) && is_string($_GET['payment_intent_client_secret'])
                ? $_GET['payment_intent_client_secret'] : '';

            // Shape-check before anything else: a malformed link is a broken
            // link, not a payment failure, and it should never reach Stripe.
            if ($stripe === null || !str_starts_with($intentId, 'pi_')) {
                $view->render('error', [
                    'title' => 'We lost the thread',
                    'message' => 'This confirmation link is missing its payment reference. If you were charged, email us and we will sort it out immediately — no need to pay again.',
                    'siteUrl' => $app['site_url'],
                    'linkLabel' => 'Back to pricing',
                    'linkHref' => $app['site_url'] . '/pricing',
                    'supportEmail' => $app['support_email'],
                ], 400);
                break;
            }

            $intent = $stripe->retrievePaymentIntent($intentId);

            // Stripe's own recommended check: the client secret in the URL must
            // match the one on the intent, so a guessed id reveals nothing.
            if (!is_string($intent['client_secret'] ?? null) || !hash_equals((string) $intent['client_secret'], $clientSecret)) {
                $view->render('error', [
                    'title' => 'That link is not valid',
                    'message' => 'This confirmation link does not match a payment we can verify. If you completed a payment, check your email for the Stripe receipt and contact us with it.',
                    'siteUrl' => $app['site_url'],
                    'linkLabel' => 'Back to pricing',
                    'linkHref' => $app['site_url'] . '/pricing',
                    'supportEmail' => $app['support_email'],
                ], 403);
                break;
            }

            $status = (string) ($intent['status'] ?? 'unknown');
            $outcome = $status === 'succeeded' ? $fulfilment->fulfil($intent) : null;

            $metadata = is_array($intent['metadata'] ?? null) ? $intent['metadata'] : [];
            $package = $outcome['package'] ?? Packages::find($metadata['packageId'] ?? null);

            $view->render('return', [
                'status' => $status,
                'package' => $package,
                'email' => $outcome['email'] ?? (is_string($metadata['email'] ?? null) ? $metadata['email'] : null),
                'amountLabel' => Pricing::format(
                    (int) ($intent['amount_received'] ?? $intent['amount'] ?? 0),
                    (string) ($intent['currency'] ?? 'usd'),
                ),
                'lastError' => is_array($intent['last_payment_error'] ?? null)
                    ? (string) ($intent['last_payment_error']['message'] ?? '')
                    : null,
                'retryHref' => $package !== null
                    ? Http::url('/?package=' . rawurlencode((string) $package['id']), $baseUrlConfig)
                    : Http::url('/', $baseUrlConfig),
                'siteUrl' => $app['site_url'],
                'supportEmail' => $app['support_email'],
            ]);
            break;

        // -- Webhook ---------------------------------------------------------
        case $method === 'POST' && $path === '/webhook':
            $secret = $app['webhook_secret'];

            if (!is_string($secret) || $secret === '') {
                Http::json(['error' => 'Webhook is not configured.'], 501);
                break;
            }

            try {
                // Raw body, not re-encoded JSON — the signature covers the bytes.
                $event = Stripe::constructEvent(
                    Http::rawBody(),
                    Http::header('Stripe-Signature'),
                    $secret,
                    (int) $app['webhook_tolerance'],
                );
            } catch (StripeException $e) {
                error_log('[checkout] Webhook rejected: ' . $e->getMessage());
                Http::json(['error' => 'Webhook Error: ' . $e->getMessage()], 400);
                break;
            }

            $type = (string) ($event['type'] ?? '');
            $object = is_array($event['data']['object'] ?? null) ? $event['data']['object'] : [];

            if ($type === 'payment_intent.succeeded') {
                $fulfilment->fulfil($object);
            } elseif ($type === 'payment_intent.payment_failed') {
                error_log(sprintf(
                    '[checkout] Payment failed for %s: %s',
                    (string) ($object['id'] ?? 'unknown'),
                    (string) ($object['last_payment_error']['message'] ?? 'no reason given'),
                ));
            }

            // Anything that verified gets a 200, including event types we do
            // not act on — otherwise Stripe retries them forever.
            Http::json(['received' => true]);
            break;

        // -- Health ----------------------------------------------------------
        case $method === 'GET' && $path === '/health':
            Http::json([
                'ok' => $stripe !== null && $app['publishable_key'] !== null,
                'php' => PHP_VERSION,
                'environment' => $app['environment'],
                'stripe' => [
                    'secret_key' => $stripe !== null,
                    'publishable_key' => $app['publishable_key'] !== null,
                    'webhook_secret' => is_string($app['webhook_secret']) && $app['webhook_secret'] !== '',
                    'mode' => $stripe === null ? null : ($stripe->isLiveMode() ? 'live' : 'test'),
                    'api_version' => Stripe::API_VERSION,
                ],
                'orders_database' => $app['orders'] !== null,
                'packages' => array_column(Packages::all(), 'id'),
            ]);
            break;

        default:
            if (str_starts_with($path, '/api/') || $path === '/webhook') {
                Http::json(['error' => 'Not found.'], 404);
                break;
            }

            $view->render('error', [
                'title' => 'Page not found',
                'message' => 'There is nothing at this address.',
                'siteUrl' => $app['site_url'],
                'linkLabel' => 'Back to kpindicator.com',
                'linkHref' => $app['site_url'],
            ], 404);
    }
} catch (StripeException $e) {
    error_log(sprintf('[checkout] Stripe error on %s %s: %s', $method, $path, $e->getMessage()));

    if (str_starts_with($path, '/api/')) {
        // A card_error or validation_error is the buyer's to fix, so Stripe's
        // wording is safe and useful. Everything else — including
        // invalid_request_error, which reports our own bad parameters and can
        // quote a key — stays behind a generic message.
        $safe = in_array($e->stripeType, ['card_error', 'validation_error'], true);
        Http::json(['error' => $safe ? $e->getMessage() : 'Stripe could not process that right now. Please try again.'], 402);
    } else {
        $view->render('error', [
            'title' => 'Payment could not be processed',
            'message' => 'Stripe could not complete this request. Nothing has been charged. Please try again, or email us and we will take the order manually.',
            'siteUrl' => $app['site_url'],
            'linkLabel' => 'Back to pricing',
            'linkHref' => $app['site_url'] . '/pricing',
            'supportEmail' => $app['support_email'],
        ], 502);
    }
} catch (\Throwable $e) {
    error_log(sprintf('[checkout] Unhandled error on %s %s: %s', $method, $path, $e->getMessage()));

    if (str_starts_with($path, '/api/')) {
        Http::json(['error' => 'Something went wrong on our side. Please try again.'], 500);
    } else {
        $view->render('error', [
            'title' => 'Something went wrong',
            'message' => 'We hit an unexpected error. If you were part-way through a payment, nothing was charged.',
            'siteUrl' => $app['site_url'],
            'linkLabel' => 'Back to pricing',
            'linkHref' => $app['site_url'] . '/pricing',
            'supportEmail' => $app['support_email'],
        ], 500);
    }
}
