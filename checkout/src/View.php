<?php

declare(strict_types=1);

namespace KPI\Checkout;

use RuntimeException;

/**
 * The world's smallest template layer: render a PHP file from views/ inside
 * views/layout.php. No engine, no compile step, no cache directory.
 *
 * Views are included from inside this object, so `$this->set()` is available to
 * them — that is how a view hands the layout its own <title> or asks for the
 * Stripe script, without the controller having to know either.
 */
final class View
{
    /** @var array<string,mixed> Values a view published for the layout. */
    private array $shared = [];

    public function __construct(private readonly string $viewPath)
    {
    }

    public function render(string $view, array $data = [], int $status = 200): void
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: text/html; charset=utf-8');
            header('X-Frame-Options: DENY');
            header('X-Content-Type-Options: nosniff');
            header('Referrer-Policy: strict-origin-when-cross-origin');
            // The buyer's own details are on this page; never let a proxy or
            // the back/forward cache serve it to someone else.
            header('Cache-Control: no-store, private');
        }

        // The inner view runs first so anything it set() is available to the
        // layout, which is rendered second with those values merged in.
        $content = $this->read($view, $data);

        echo $this->read('layout', array_merge($data, $this->shared, ['content' => $content]));
    }

    /** Publish a value from inside a view to the layout. */
    public function set(string $key, mixed $value): void
    {
        $this->shared[$key] = $value;
    }

    private function read(string $view, array $data): string
    {
        $file = $this->viewPath . '/' . $view . '.php';

        if (!is_file($file)) {
            throw new RuntimeException(sprintf('View "%s" does not exist.', $view));
        }

        extract($data, EXTR_SKIP);

        ob_start();

        try {
            include $file;
        } catch (\Throwable $e) {
            ob_end_clean();

            throw $e;
        }

        return (string) ob_get_clean();
    }

    /** Escape for HTML text and quoted-attribute contexts. */
    public static function e(?string $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
