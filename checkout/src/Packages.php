<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * The package catalog, mirroring src/content/packages.ts.
 *
 * KEEP IN SYNC. The TypeScript file stays the source of truth for the
 * marketing site; this is the same data in the shape PHP needs, because the
 * checkout runs as its own app and cannot import a `.ts` module. `dbType` must
 * keep matching the PackageType enum in prisma/schema.prisma, and
 * `priceEnvVar` the STRIPE_PRICE_* names in .env.
 *
 * `priceCents` is only the fallback. When the matching STRIPE_PRICE_* env var
 * holds a real Price ID, Pricing resolves the amount from Stripe instead, so
 * the dashboard wins over this file.
 */
final class Packages
{
    /** @return array<int,array<string,mixed>> */
    public static function all(): array
    {
        return [
            [
                'id' => 'idea-check',
                'dbType' => 'IDEA_CHECK',
                'name' => 'Idea Check',
                'priceCents' => 99500,
                'tagline' => "Know if it's worth building before you spend a dollar on it.",
                'duration' => '3-5 business days',
                'bestFor' => 'A single idea you need a fast, honest read on before committing budget.',
                'deliverables' => [
                    '1 written assessment (PDF + dashboard)',
                    'Competitor teardown table',
                    'Recommended price range',
                ],
                'priceEnvVar' => 'STRIPE_PRICE_IDEA_CHECK',
                'featured' => false,
            ],
            [
                'id' => 'market-test',
                'dbType' => 'MARKET_TEST',
                'name' => 'Market Test',
                'priceCents' => 250000,
                'tagline' => 'Put one idea in front of real people and watch what happens.',
                'duration' => '2 weeks',
                'bestFor' => 'One idea, ready to see real demand signal, not just opinions.',
                'deliverables' => [
                    '1 live landing page',
                    'Traffic + conversion dashboard access',
                    'Campaign performance summary',
                ],
                'priceEnvVar' => 'STRIPE_PRICE_MARKET_TEST',
                'featured' => true,
            ],
            [
                'id' => 'validation-sprint',
                'dbType' => 'VALIDATION_SPRINT',
                'name' => 'Validation Sprint',
                'priceCents' => 490000,
                'tagline' => 'Test 3-5 ideas at once, kill the losers, double down on what hits.',
                'duration' => '3-4 weeks',
                'bestFor' => 'Founders and teams choosing between several directions, or studios validating a batch.',
                'deliverables' => [
                    'Up to 5 live landing pages',
                    'Per-idea go / no-go report',
                    'One portfolio-level recommendation',
                    'Qualified lead list, exported',
                ],
                'priceEnvVar' => 'STRIPE_PRICE_VALIDATION_SPRINT',
                'featured' => false,
            ],
            [
                'id' => 'presale-sprint',
                'dbType' => 'PRESALE_SPRINT',
                'name' => 'Presale Sprint',
                'priceCents' => 850000,
                'tagline' => "Stop asking if they'd buy it. Get them to actually put money down.",
                'duration' => '4-6 weeks',
                'bestFor' => "A validated idea you're about to greenlight for build, and want investor- or board-grade proof first.",
                'deliverables' => [
                    'Live preorder / booking flow',
                    'Booked demo calendar',
                    'Presale revenue and commitment report',
                ],
                'priceEnvVar' => 'STRIPE_PRICE_PRESALE_SPRINT',
                'featured' => false,
            ],
        ];
    }

    /** @return array<string,mixed>|null */
    public static function find(?string $id): ?array
    {
        foreach (self::all() as $package) {
            if ($package['id'] === $id) {
                return $package;
            }
        }

        return null;
    }

    /** @return array<string,mixed>|null */
    public static function findByDbType(?string $dbType): ?array
    {
        foreach (self::all() as $package) {
            if ($package['dbType'] === $dbType) {
                return $package;
            }
        }

        return null;
    }

    public static function defaultId(): string
    {
        foreach (self::all() as $package) {
            if ($package['featured'] === true) {
                return (string) $package['id'];
            }
        }

        return (string) self::all()[0]['id'];
    }
}
