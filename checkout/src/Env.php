<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * Dotenv reader.
 *
 * The checkout deliberately has no Composer dependencies, so this is a small
 * hand-rolled parser rather than vlucas/phpdotenv. It handles the subset of
 * the format the KPIndicator and BrandSentryPro `.env` files actually use:
 * `KEY=value`, optional single/double quotes, `#` comments, blank lines, and
 * an optional `export ` prefix.
 *
 * Resolution order is first-wins, so the caller lists files most-specific
 * first. Real process environment always beats any file — that is what lets a
 * production host (or `docker run -e`) override without editing anything.
 */
final class Env
{
    /** @var array<string,string> */
    private array $values = [];

    /**
     * @param string[] $files Paths to read, most-significant first. Missing
     *                        files are skipped silently — every file here is
     *                        optional by design.
     */
    public function __construct(array $files = [])
    {
        foreach ($files as $file) {
            $this->merge(self::parse($file));
        }
    }

    /** Merge without overwriting: earlier sources win. */
    private function merge(array $values): void
    {
        foreach ($values as $key => $value) {
            if (!array_key_exists($key, $this->values)) {
                $this->values[$key] = $value;
            }
        }
    }

    /**
     * Read one variable. Process environment beats file values.
     *
     * Values that are still on their placeholder (anything ending in `...`,
     * the convention used throughout `.env.example`) count as unset, so a
     * half-filled env behaves the same as an empty one instead of sending a
     * literal "sk_test_..." to Stripe. Mirrors src/lib/stripe.ts.
     */
    public function get(string $key, ?string $default = null): ?string
    {
        $value = getenv($key);

        if ($value === false || $value === '') {
            $value = $this->values[$key] ?? null;
        }

        if ($value === null || $value === '' || str_ends_with($value, '...')) {
            return $default;
        }

        return $value;
    }

    /** Read the first variable of several that is actually set. */
    public function first(array $keys, ?string $default = null): ?string
    {
        foreach ($keys as $key) {
            $value = $this->get($key);
            if ($value !== null) {
                return $value;
            }
        }

        return $default;
    }

    public function bool(string $key, bool $default = false): bool
    {
        $value = $this->get($key);
        if ($value === null) {
            return $default;
        }

        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Pull one file into a key => value map.
     *
     * @return array<string,string>
     */
    private static function parse(string $path): array
    {
        if ($path === '' || !is_readable($path) || !is_file($path)) {
            return [];
        }

        $out = [];

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (str_starts_with($line, 'export ')) {
                $line = trim(substr($line, 7));
            }

            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) {
                continue;
            }

            $key = trim($parts[0]);
            $value = trim($parts[1]);

            // Strip matched quotes. An unquoted value keeps everything up to a
            // trailing ` #` comment, which is how Laravel's reader behaves too.
            if (strlen($value) > 1 && (
                ($value[0] === '"' && str_ends_with($value, '"'))
                || ($value[0] === "'" && str_ends_with($value, "'"))
            )) {
                $value = substr($value, 1, -1);
            } elseif (str_contains($value, ' #')) {
                $value = rtrim(substr($value, 0, strpos($value, ' #')));
            }

            if ($key !== '') {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}
