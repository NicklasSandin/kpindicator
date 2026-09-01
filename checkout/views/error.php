<?php namespace KPI\Checkout;

/**
 * Anything that went wrong before or outside a payment.
 *
 * @var string $title
 * @var string $message
 */

$this->set('title', $title . ' — KPIndicator');
?>

<main class="outcome">
    <p class="eyebrow"><em>—</em> &nbsp;&nbsp; Checkout</p>
    <h1 class="display outcome__heading"><?= View::e($title) ?></h1>
    <p class="outcome__body measure"><?= View::e($message) ?></p>

    <div class="outcome__actions">
        <a class="button" href="<?= View::e((string) ($linkHref ?? $siteUrl)) ?>">
            <?= View::e((string) ($linkLabel ?? 'Back to kpindicator.com')) ?>
        </a>
    </div>

    <?php if (!empty($supportEmail)): ?>
        <p class="fineprint">
            Need a hand? Email
            <a class="link" href="mailto:<?= View::e((string) $supportEmail) ?>"><?= View::e((string) $supportEmail) ?></a>.
        </p>
    <?php endif; ?>
</main>
