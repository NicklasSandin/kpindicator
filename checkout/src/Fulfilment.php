<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * What happens once Stripe says a PaymentIntent succeeded: record the order and
 * alert the team.
 *
 * Both the return page and the webhook call this with the same PaymentIntent,
 * and whichever lands first does the work — the return page so the buyer sees a
 * confirmed order immediately, the webhook so a closed tab or a redirect that
 * never completed still gets recorded. Orders::recordPaid is the idempotency
 * boundary, so calling this twice produces one order and one notification.
 */
final class Fulfilment
{
    public function __construct(
        private readonly ?Orders $orders,
        private readonly Notifier $notifier,
        private readonly ?Analytics $analytics = null,
    ) {
    }

    /**
     * @param array<string,mixed> $intent A PaymentIntent as returned by Stripe.
     * @return array{package:?array<string,mixed>, email:?string, amount:int, currency:string, recorded:bool}
     */
    public function fulfil(array $intent): array
    {
        $metadata = is_array($intent['metadata'] ?? null) ? $intent['metadata'] : [];

        $package = Packages::find($metadata['packageId'] ?? null)
            ?? Packages::findByDbType($metadata['packageType'] ?? null);

        $email = self::firstEmail([
            $intent['receipt_email'] ?? null,
            $metadata['email'] ?? null,
        ]);

        // amount_received is the authoritative figure — a partial capture or a
        // currency-converted charge can differ from the requested amount.
        $amount = (int) ($intent['amount_received'] ?? $intent['amount'] ?? 0);
        if ($amount <= 0) {
            $amount = (int) ($intent['amount'] ?? 0);
        }

        $currency = strtolower((string) ($intent['currency'] ?? 'usd'));
        $intentId = (string) ($intent['id'] ?? '');

        $result = [
            'package' => $package,
            'email' => $email,
            'amount' => $amount,
            'currency' => $currency,
            'recorded' => false,
        ];

        if ($package === null || $email === null || $intentId === '') {
            error_log(sprintf(
                '[checkout] PaymentIntent %s succeeded but could not be attributed (package=%s, email=%s).',
                $intentId !== '' ? $intentId : 'unknown',
                $package === null ? 'missing' : (string) $package['id'],
                $email === null ? 'missing' : 'present',
            ));

            return $result;
        }

        if ($this->orders === null) {
            return $result;
        }

        $recorded = $this->orders->recordPaid(
            $package,
            $email,
            is_string($metadata['name'] ?? null) ? $metadata['name'] : null,
            is_string($metadata['company'] ?? null) ? $metadata['company'] : null,
            $amount,
            $currency,
            $intentId,
        );

        $result['recorded'] = $recorded['created'];

        if ($recorded['created']) {
            // Emitted here rather than from the routes so exactly one completion
            // is reported per order. The return page and the webhook both call
            // fulfil(), and recordPaid() is the idempotency boundary — whichever
            // arrives second sees created=false and stays quiet.
            $this->analytics?->capture('checkout_completed', (string) ($metadata['visitorId'] ?? $email), [
                'package' => (string) $package['id'],
                'package_name' => (string) $package['name'],
                'amount' => $amount,
                'currency' => $currency,
                'payment_intent' => $intentId,
                'order_id' => $recorded['orderId'],
                'revenue' => round($amount / 100, 2),
            ], ['email' => $email]);

            $this->notifier->adminAlert(
                sprintf('New paid signup: %s', (string) $package['name']),
                sprintf(
                    "%s just paid %s %s for %s.\n\nPayment intent: %s",
                    $email,
                    Pricing::format($amount, $currency),
                    strtoupper($currency),
                    (string) $package['name'],
                    $intentId,
                ),
            );
        }

        return $result;
    }

    /** @param array<int,mixed> $candidates */
    private static function firstEmail(array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            if (is_string($candidate) && filter_var($candidate, FILTER_VALIDATE_EMAIL)) {
                return strtolower(trim($candidate));
            }
        }

        return null;
    }
}
