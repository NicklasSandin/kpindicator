<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * Request/response plumbing: routing path, absolute URLs, JSON in and out,
 * session and CSRF. Everything the front controller needs and nothing else.
 */
final class Http
{
    private const SESSION_NAME = 'kpi_checkout';

    /**
     * The route path, independent of where the app is mounted.
     *
     * Works with a rewrite to index.php (`/checkout/return`) and without one
     * (`/checkout/public/index.php/return`), so the same code runs under nginx,
     * Apache and `php -S`.
     */
    public static function path(): string
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $uri = is_string($uri) ? $uri : '/';

        $base = self::mountPath();
        if ($base !== '' && str_starts_with($uri, $base)) {
            $uri = substr($uri, strlen($base));
        }

        if (str_starts_with($uri, '/index.php')) {
            $uri = substr($uri, strlen('/index.php'));
        }

        $uri = '/' . trim($uri, '/');

        return $uri === '/' ? '/' : rtrim($uri, '/');
    }

    /** Directory the front controller is served from, e.g. "" or "/checkout". */
    private static function mountPath(): string
    {
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        $dir = str_replace('\\', '/', dirname($script));

        return $dir === '/' || $dir === '.' ? '' : rtrim($dir, '/');
    }

    /**
     * Absolute base URL of this app. Stripe redirects back here after
     * confirmation, so it has to be right even behind a proxy — set
     * CHECKOUT_BASE_URL there rather than trusting forwarded headers blindly.
     */
    public static function baseUrl(?string $configured = null): string
    {
        if ($configured !== null && $configured !== '') {
            return rtrim($configured, '/');
        }

        $https = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
            || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';

        $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');

        return ($https ? 'https://' : 'http://') . $host . self::mountPath();
    }

    public static function url(string $path, ?string $configuredBase = null): string
    {
        return self::baseUrl($configuredBase) . '/' . ltrim($path, '/');
    }

    // -- JSON ---------------------------------------------------------------

    /** @return array<string,mixed> */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $decoded = is_string($raw) ? json_decode($raw, true) : null;

        return is_array($decoded) ? $decoded : [];
    }

    public static function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($data, JSON_UNESCAPED_SLASHES);
    }

    public static function rawBody(): string
    {
        $raw = file_get_contents('php://input');

        return is_string($raw) ? $raw : '';
    }

    public static function header(string $name): ?string
    {
        $key = 'HTTP_' . str_replace('-', '_', strtoupper($name));
        $value = $_SERVER[$key] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    // -- Session and CSRF ---------------------------------------------------

    /**
     * The session holds which PaymentIntents this browser created, so the
     * buyer-details endpoint can only ever touch one of its own — without it,
     * a PaymentIntent id would be enough to rewrite someone else's receipt
     * email. SameSite=Lax still sends the cookie on Stripe's top-level GET
     * redirect back to /return.
     */
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $https = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
            || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';

        session_name(self::SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => self::mountPath() . '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => $https,
        ]);
        session_start();
    }

    public static function csrfToken(): string
    {
        self::startSession();

        if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_token'];
    }

    public static function csrfValid(): bool
    {
        self::startSession();

        $expected = $_SESSION['csrf_token'] ?? null;
        $given = self::header('X-CSRF-Token');

        return is_string($expected) && is_string($given) && hash_equals($expected, $given);
    }

    /** Remember a PaymentIntent this browser is allowed to modify. */
    public static function rememberPaymentIntent(string $id, array $context): void
    {
        self::startSession();

        $intents = $_SESSION['payment_intents'] ?? [];
        $intents[$id] = $context;

        // Cap the list so a scripted page-reload loop can't grow the session
        // file without bound.
        if (count($intents) > 20) {
            $intents = array_slice($intents, -20, null, true);
        }

        $_SESSION['payment_intents'] = $intents;
    }

    /** @return array<string,mixed>|null */
    public static function recallPaymentIntent(string $id): ?array
    {
        self::startSession();

        $context = $_SESSION['payment_intents'][$id] ?? null;

        return is_array($context) ? $context : null;
    }
}
