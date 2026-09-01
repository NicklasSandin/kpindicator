<?php

declare(strict_types=1);

/**
 * Router for PHP's built-in server — local development only.
 *
 *   php -S localhost:8787 -t checkout/public checkout/router.php
 *
 * Real deployments use nginx or Apache (see README.md); this exists so the
 * checkout can be run without either. Returning false hands static files back
 * to the built-in server; everything else goes to the front controller.
 */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if (is_string($path) && $path !== '/' && is_file(__DIR__ . '/public' . $path)) {
    return false;
}

require __DIR__ . '/public/index.php';
