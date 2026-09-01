<?php

declare(strict_types=1);

namespace KPI\Checkout;

use RuntimeException;

/** Any non-2xx from Stripe, or a transport/verification failure. */
final class StripeException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?string $stripeType = null,
        public readonly ?string $stripeCode = null,
        public readonly int $status = 0,
        public readonly ?string $requestId = null,
    ) {
        parent::__construct($message);
    }
}

/**
 * A minimal, dependency-free Stripe REST client.
 *
 * BrandSentryPro runs stripe/stripe-php 7.128 under Composer; this checkout is
 * a standalone PHP app with no vendor directory, so it talks to the same REST
 * API over cURL instead. It only needs PaymentIntents, Prices and webhook
 * signature verification — a few hundred lines rather than a 2 MB SDK.
 */
final class Stripe
{
    private const API_BASE = 'https://api.stripe.com/v1';

    /**
     * Pinned API version. BrandSentryPro pins the same one because the account
     * default rejects newer Elements features (see CheckoutController::
     * createCustomCheckoutSession). Pinning here means an account-level version
     * bump can never silently change this app's response shapes.
     */
    public const API_VERSION = '2026-03-25.dahlia';

    private const MAX_ATTEMPTS = 3;

    public function __construct(
        private readonly string $apiKey,
        private readonly string $apiVersion = self::API_VERSION,
        private readonly int $timeout = 30,
    ) {
    }

    /** True for a live-mode key — the checkout surfaces this in non-production. */
    public function isLiveMode(): bool
    {
        return str_starts_with($this->apiKey, 'sk_live_') || str_starts_with($this->apiKey, 'rk_live_');
    }

    // -- PaymentIntents -----------------------------------------------------

    public function createPaymentIntent(array $params, ?string $idempotencyKey = null): array
    {
        return $this->request('POST', '/payment_intents', $params, $idempotencyKey);
    }

    public function retrievePaymentIntent(string $id): array
    {
        $this->assertId($id, 'pi_', 'payment intent');

        return $this->request('GET', '/payment_intents/' . rawurlencode($id));
    }

    public function updatePaymentIntent(string $id, array $params): array
    {
        $this->assertId($id, 'pi_', 'payment intent');

        return $this->request('POST', '/payment_intents/' . rawurlencode($id), $params);
    }

    // -- Prices -------------------------------------------------------------

    public function retrievePrice(string $id): array
    {
        $this->assertId($id, 'price_', 'price');

        return $this->request('GET', '/prices/' . rawurlencode($id));
    }

    /** Cheap credential check for the health endpoint. */
    public function ping(): array
    {
        return $this->request('GET', '/payment_intents', ['limit' => 1]);
    }

    // -- Transport ----------------------------------------------------------

    /**
     * Issue one request, retrying transport errors, 429s and 5xxs.
     *
     * Retries reuse the same idempotency key, so a retried POST can never
     * charge twice — Stripe replays the original response instead.
     */
    public function request(string $method, string $path, array $params = [], ?string $idempotencyKey = null): array
    {
        $method = strtoupper($method);
        $url = self::API_BASE . $path;
        $body = null;

        if ($method === 'GET') {
            $query = self::encodeParams($params);
            if ($query !== '') {
                $url .= '?' . $query;
            }
        } else {
            $body = self::encodeParams($params);
        }

        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Stripe-Version: ' . $this->apiVersion,
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
        ];

        if ($idempotencyKey !== null && $idempotencyKey !== '') {
            $headers[] = 'Idempotency-Key: ' . $idempotencyKey;
        }

        $lastError = null;

        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            $handle = curl_init();
            curl_setopt_array($handle, [
                CURLOPT_URL => $url,
                CURLOPT_CUSTOMREQUEST => $method,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_TIMEOUT => $this->timeout,
                CURLOPT_USERAGENT => 'KPIndicator-Checkout/1.0 (php-curl)',
                CURLOPT_HEADER => true,
            ]);

            if ($body !== null) {
                curl_setopt($handle, CURLOPT_POSTFIELDS, $body);
            }

            $raw = curl_exec($handle);
            $errno = curl_errno($handle);
            $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
            $headerSize = (int) curl_getinfo($handle, CURLINFO_HEADER_SIZE);
            $curlError = curl_error($handle);
            curl_close($handle);

            if ($errno !== 0 || !is_string($raw)) {
                $lastError = new StripeException('Could not reach Stripe: ' . $curlError);
                if ($this->shouldRetry($attempt, 0)) {
                    $this->backoff($attempt);
                    continue;
                }
                throw $lastError;
            }

            $requestId = self::headerValue(substr($raw, 0, $headerSize), 'request-id');
            $decoded = json_decode(substr($raw, $headerSize), true);

            if (!is_array($decoded)) {
                $lastError = new StripeException('Unreadable response from Stripe.', status: $status, requestId: $requestId);
                if ($this->shouldRetry($attempt, $status)) {
                    $this->backoff($attempt);
                    continue;
                }
                throw $lastError;
            }

            if ($status >= 400) {
                $error = $decoded['error'] ?? [];
                $lastError = new StripeException(
                    (string) ($error['message'] ?? 'Stripe returned HTTP ' . $status . '.'),
                    isset($error['type']) ? (string) $error['type'] : null,
                    isset($error['code']) ? (string) $error['code'] : null,
                    $status,
                    $requestId,
                );

                if ($this->shouldRetry($attempt, $status)) {
                    $this->backoff($attempt);
                    continue;
                }

                throw $lastError;
            }

            return $decoded;
        }

        throw $lastError ?? new StripeException('Stripe request failed.');
    }

    private function shouldRetry(int $attempt, int $status): bool
    {
        if ($attempt >= self::MAX_ATTEMPTS) {
            return false;
        }

        return $status === 0 || $status === 409 || $status === 429 || $status >= 500;
    }

    private function backoff(int $attempt): void
    {
        // 0.5s, then 1s, plus jitter so parallel requests don't resynchronise.
        usleep((int) ((0.5 * (2 ** ($attempt - 1))) * 1_000_000) + random_int(0, 200_000));
    }

    private function assertId(string $id, string $prefix, string $label): void
    {
        if (!str_starts_with($id, $prefix)) {
            throw new StripeException(sprintf('Refusing to query Stripe with a non-Stripe %s id.', $label));
        }
    }

    private static function headerValue(string $rawHeaders, string $name): ?string
    {
        foreach (preg_split('/\r?\n/', $rawHeaders) ?: [] as $line) {
            $parts = explode(':', $line, 2);
            if (count($parts) === 2 && strcasecmp(trim($parts[0]), $name) === 0) {
                return trim($parts[1]);
            }
        }

        return null;
    }

    // -- Encoding -----------------------------------------------------------

    /**
     * Stripe takes form-encoded bodies with bracketed nesting
     * (`metadata[packageId]=market-test`). Nulls are dropped, booleans become
     * the literals Stripe expects.
     */
    public static function encodeParams(array $params): string
    {
        $pairs = [];
        self::flatten($params, '', $pairs);

        return implode('&', $pairs);
    }

    private static function flatten(array $params, string $prefix, array &$out): void
    {
        foreach ($params as $key => $value) {
            if ($value === null) {
                continue;
            }

            $name = $prefix === '' ? (string) $key : $prefix . '[' . $key . ']';

            if (is_array($value)) {
                self::flatten($value, $name, $out);
                continue;
            }

            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }

            $out[] = rawurlencode($name) . '=' . rawurlencode((string) $value);
        }
    }

    // -- Webhooks -----------------------------------------------------------

    /**
     * Verify a webhook signature and return the decoded event.
     *
     * Same scheme stripe-php implements: HMAC-SHA256 over "<timestamp>.<body>",
     * compared in constant time against every v1 signature in the header, with
     * a replay window. $payload must be the exact raw body — any reserialising
     * (json_decode/json_encode) invalidates the signature.
     */
    public static function constructEvent(string $payload, ?string $signatureHeader, string $secret, int $tolerance = 300): array
    {
        if ($signatureHeader === null || $signatureHeader === '') {
            throw new StripeException('Missing Stripe-Signature header.');
        }

        $timestamp = null;
        $signatures = [];

        foreach (explode(',', $signatureHeader) as $part) {
            $bits = explode('=', trim($part), 2);
            if (count($bits) !== 2) {
                continue;
            }
            if ($bits[0] === 't') {
                $timestamp = (int) $bits[1];
            } elseif ($bits[0] === 'v1') {
                $signatures[] = $bits[1];
            }
        }

        if ($timestamp === null || $timestamp <= 0 || $signatures === []) {
            throw new StripeException('Malformed Stripe-Signature header.');
        }

        if ($tolerance > 0 && abs(time() - $timestamp) > $tolerance) {
            throw new StripeException('Stripe-Signature timestamp is outside the tolerance window.');
        }

        $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);

        $verified = false;
        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                $verified = true;
            }
        }

        if (!$verified) {
            throw new StripeException('Stripe webhook signature verification failed.');
        }

        $event = json_decode($payload, true);

        if (!is_array($event) || !isset($event['type'])) {
            throw new StripeException('Stripe webhook payload was not a readable event.');
        }

        return $event;
    }
}
