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

        // Keep sessions inside the app rather than trusting the system path.
        //
        // On RHEL-family hosts session.save_path is /var/lib/php/session, owned
        // root:apache — because the php-fpm package is built for Apache. A pool
        // running as nginx cannot write there, and PHP does not complain: every
        // request just gets a fresh empty session. The only symptom is that
        // CSRF checks start failing, which is what took this checkout down on
        // its first live page load.
        $sessions = self::sessionPath();
        if ($sessions !== null) {
            ini_set('session.save_path', $sessions);
        }

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

    /**
     * The app's own session directory, created on demand.
     *
     * Returns null if it cannot be made writable, in which case PHP falls back
     * to the system path — which may or may not work, and sessionsWork() is
     * what actually tells you.
     */
    public static function sessionPath(): ?string
    {
        $path = dirname(__DIR__) . '/storage/sessions';

        if (!is_dir($path) && !@mkdir($path, 0770, true) && !is_dir($path)) {
            return null;
        }

        return is_writable($path) ? $path : null;
    }

    /**
     * Prove a session actually survives a write — the check that would have
     * caught the save_path ownership problem before a buyer did.
     *
     * @return array{ok:bool, path:string, detail:string}
     */
    public static function sessionsWork(): array
    {
        $own = self::sessionPath();
        $path = $own ?? (string) ini_get('session.save_path');
        $path = $path !== '' ? $path : sys_get_temp_dir();

        // Say so when the app's own directory could not be used. Sessions may
        // still work via the system path, but that path is the one whose
        // ownership is set for a different web server on RHEL hosts, so
        // "working" there is luck rather than configuration.
        $fallback = $own === null ? ' [fallback — the app\'s own directory is unavailable]' : '';

        if (!is_dir($path)) {
            return ['ok' => false, 'path' => $path, 'detail' => 'directory does not exist'];
        }

        $user = function_exists('posix_getpwuid') && function_exists('posix_geteuid')
            ? (posix_getpwuid(posix_geteuid())['name'] ?? 'this user')
            : 'this user';

        if (!is_writable($path)) {
            return ['ok' => false, 'path' => $path, 'detail' => 'not writable by ' . $user];
        }

        // is_writable() only consults the Unix permission bits. SELinux sits
        // underneath those and denies silently, which is exactly how a
        // correctly-chowned session directory can still swallow every write —
        // so prove it by writing.
        $probe = $path . '/.probe-' . bin2hex(random_bytes(4));

        if (@file_put_contents($probe, 'probe') === false) {
            $hint = trim((string) @shell_exec('getenforce 2>/dev/null')) === 'Enforcing'
                ? 'permissions look right but the write failed — SELinux is Enforcing, so check the file context '
                    . '(restorecon -Rv, or semanage fcontext -a -t httpd_sys_rw_content_t)'
                : 'permissions look right but the write failed';

            return ['ok' => false, 'path' => $path, 'detail' => $hint];
        }

        @unlink($probe);

        return ['ok' => true, 'path' => $path . $fallback, 'detail' => 'verified by writing as ' . $user];
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
