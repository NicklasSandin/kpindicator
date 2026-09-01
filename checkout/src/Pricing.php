<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * Works out what to charge for a package.
 *
 * The Stripe dashboard wins where it can: if the package's STRIPE_PRICE_* env
 * var holds a Price ID, the amount and currency come from that Price, so a
 * price change in Stripe takes effect without a deploy. Otherwise the catalog
 * amount in Packages is used — the same graceful fallback the Next.js
 * /api/checkout route has, which is what keeps the flow demoable before Stripe
 * is fully configured.
 *
 * Either way the amount is decided server-side. Nothing the browser sends can
 * influence what the buyer is charged.
 */
final class Pricing
{
    public function __construct(
        private readonly Env $env,
        private readonly ?Stripe $stripe,
    ) {
    }

    /**
     * @param array<string,mixed> $package
     * @return array{amount:int, currency:string, source:string, priceId:?string}
     */
    public function resolve(array $package): array
    {
        $fallback = [
            'amount' => (int) $package['priceCents'],
            'currency' => 'usd',
            'source' => 'catalog',
            'priceId' => null,
        ];

        $priceId = $this->env->get((string) $package['priceEnvVar']);

        if ($priceId === null || $this->stripe === null) {
            return $fallback;
        }

        try {
            $price = $this->stripe->retrievePrice($priceId);
        } catch (StripeException $e) {
            // A bad or deleted Price ID must not take checkout down — charge
            // the catalog amount and leave a trail for whoever fixes the env.
            error_log(sprintf(
                '[checkout] Price %s for package %s could not be read (%s); falling back to the catalog amount.',
                $priceId,
                (string) $package['id'],
                $e->getMessage(),
            ));

            return $fallback;
        }

        $amount = $price['unit_amount'] ?? null;

        if (!is_int($amount) || $amount <= 0) {
            error_log(sprintf(
                '[checkout] Price %s has no usable unit_amount (tiered or metered?); falling back to the catalog amount.',
                $priceId,
            ));

            return $fallback;
        }

        return [
            'amount' => $amount,
            'currency' => strtolower((string) ($price['currency'] ?? 'usd')),
            'source' => 'stripe_price',
            'priceId' => $priceId,
        ];
    }

    /** Money for display: 250000 usd -> "$2,500". Cents shown only when non-zero. */
    public static function format(int $amountCents, string $currency = 'usd'): string
    {
        $symbols = ['usd' => '$', 'eur' => "\u{20AC}", 'gbp' => "\u{00A3}", 'sek' => 'kr '];
        $symbol = $symbols[strtolower($currency)] ?? (strtoupper($currency) . ' ');
        $whole = intdiv($amountCents, 100);
        $cents = $amountCents % 100;

        return $symbol . number_format($whole) . ($cents !== 0 ? '.' . str_pad((string) $cents, 2, '0', STR_PAD_LEFT) : '');
    }
}
