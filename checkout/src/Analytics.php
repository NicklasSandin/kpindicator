<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * Checkout funnel analytics, sent server-side to PostHog.
 *
 * Server-side on purpose. A checkout is exactly where client-side analytics are
 * least reliable — ad blockers and tracking protection are most aggressive on
 * payment pages, and the drop-off you most need to see is the one where the
 * browser never got far enough to report anything. Every event here is emitted
 * by PHP, from facts the server already knows.
 *
 * What is never captured: card details (they only ever exist inside Stripe's
 * iframe, on Stripe's origin), and the Stripe secret. Email, name and company
 * are captured only once the buyer has typed them, because at that point they
 * have handed them over to be invoiced anyway.
 *
 * Delivery happens after the response is flushed — see flush(). An analytics
 * outage must not add a second of latency to someone paying.
 */
final class Analytics
{
    /** @var array<int,array<string,mixed>> */
    private array $queue = [];

    public function __construct(
        private readonly ?string $apiKey,
        private readonly string $host = 'https://us.i.posthog.com',
        private readonly bool $enabled = true,
    ) {
    }

    public function isConfigured(): bool
    {
        return $this->enabled && $this->apiKey !== null;
    }

    /**
     * Queue an event. Cheap — no network happens here.
     *
     * @param array<string,mixed> $properties
     * @param array<string,mixed> $person Person properties, sent as PostHog's $set.
     */
    public function capture(string $event, string $distinctId, array $properties = [], array $person = []): void
    {
        if ($person !== []) {
            $properties['$set'] = $person;
        }

        $this->queue[] = [
            'event' => $event,
            'distinct_id' => $distinctId,
            'properties' => $properties + ['$lib' => 'kpindicator-checkout-php'],
            'timestamp' => gmdate('c'),
        ];
    }

    /**
     * Send everything queued.
     *
     * Called from a shutdown handler. Under PHP-FPM the response has already
     * been returned to the browser by then (fastcgi_finish_request), so the
     * buyer never waits on this.
     */
    public function flush(): void
    {
        if ($this->queue === []) {
            return;
        }

        $batch = $this->queue;
        $this->queue = [];

        if (!$this->isConfigured()) {
            foreach ($batch as $event) {
                error_log(sprintf('[checkout] (analytics not configured) %s %s', $event['event'], json_encode($event['properties'])));
            }

            return;
        }

        $payload = json_encode([
            'api_key' => $this->apiKey,
            'batch' => $batch,
        ], JSON_UNESCAPED_SLASHES);

        if ($payload === false) {
            return;
        }

        $handle = curl_init(rtrim($this->host, '/') . '/batch/');
        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);

        $response = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        curl_close($handle);

        if ($status < 200 || $status >= 300) {
            error_log(sprintf(
                '[checkout] analytics delivery failed (HTTP %d) for %d event(s): %s',
                $status,
                count($batch),
                is_string($response) ? substr($response, 0, 200) : '',
            ));
        }
    }

    /**
     * Properties worth attaching to every event: where the buyer came from and
     * what they are using. Referrer and UTM tags are how you tell an ad click
     * from a direct visit once the orders start arriving.
     *
     * @return array<string,mixed>
     */
    public static function requestContext(): array
    {
        $utm = [];
        foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $key) {
            if (isset($_GET[$key]) && is_string($_GET[$key]) && $_GET[$key] !== '') {
                $utm[$key] = mb_substr($_GET[$key], 0, 120);
            }
        }

        return array_filter([
            '$current_url' => Http::url(Http::path()),
            '$referrer' => $_SERVER['HTTP_REFERER'] ?? null,
            '$user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        ] + $utm, static fn ($v) => $v !== null);
    }
}
