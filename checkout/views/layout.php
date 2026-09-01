<?php namespace KPI\Checkout; ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= View::e($title ?? 'Checkout — KPIndicator') ?></title>
<?php /* A checkout page has nothing to offer a crawler and should never rank. */ ?>
<meta name="robots" content="noindex, nofollow">
<?php if (!empty($csrfToken)): ?>
<meta name="csrf-token" content="<?= View::e($csrfToken) ?>">
<?php endif; ?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&amp;family=IBM+Plex+Mono:wght@400;500&amp;family=Instrument+Serif:ital@0;1&amp;display=swap">
<link rel="stylesheet" href="<?= View::e(Http::url('/assets/checkout.css')) ?>">
</head>
<body>

<?php if (!empty($liveWarning)): ?>
<div class="livebar" role="status">
    Live Stripe key in a non-production environment — cards entered on this page are charged for real.
</div>
<?php endif; ?>

<header class="masthead">
    <a class="masthead__mark" href="<?= View::e($siteUrl ?? '/') ?>">KP<span>·</span>Indicator</a>
    <p class="masthead__meta">Secure checkout — payments by Stripe</p>
</header>

<?= $content ?>

<footer class="colophon">
    <span>KPIndicator — demand validation, measured</span>
    <span>
        <a class="link" href="<?= View::e(($siteUrl ?? '') . '/terms') ?>">Terms</a>
        &nbsp;·&nbsp;
        <a class="link" href="<?= View::e(($siteUrl ?? '') . '/privacy') ?>">Privacy</a>
    </span>
</footer>

<?php if (!empty($includePaymentScript)): ?>
<script src="https://js.stripe.com/v3/"></script>
<script src="<?= View::e(Http::url('/assets/checkout.js')) ?>" defer></script>
<?php endif; ?>
</body>
</html>
