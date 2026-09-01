<?php namespace KPI\Checkout;

/**
 * Where Stripe sends the buyer after confirmation.
 *
 * The status shown here comes from re-reading the PaymentIntent server-side,
 * never from the `redirect_status` query parameter — that one is attacker-
 * controlled, and this page is the buyer's proof that the money moved.
 *
 * @var string $status
 * @var array<string,mixed>|null $package
 * @var string|null $email
 * @var string $amountLabel
 */

$copy = match ($status) {
    'succeeded' => [
        'stamp' => 'go',
        'label' => 'Paid',
        'eyebrow' => 'Order confirmed',
        'heading' => 'Payment received.',
        'body' => "You'll get a Stripe receipt by email straight away. We'll follow up within one business day with your intake questions, and your project appears in the client dashboard as soon as we've set it up.",
    ],
    'processing' => [
        'stamp' => 'hold',
        'label' => 'Processing',
        'eyebrow' => 'Order pending',
        'heading' => 'Your payment is still clearing.',
        'body' => "Some payment methods take a little while to settle. There's nothing more for you to do — we'll email you the moment it confirms, and you won't be charged twice.",
    ],
    'requires_action', 'requires_confirmation' => [
        'stamp' => 'hold',
        'label' => 'Action needed',
        'eyebrow' => 'Order incomplete',
        'heading' => 'One more step is needed.',
        'body' => 'Your bank asked for an extra confirmation that never completed. Nothing has been charged. Start the payment again and finish the verification step.',
    ],
    'canceled' => [
        'stamp' => 'stop',
        'label' => 'Cancelled',
        'eyebrow' => 'Order cancelled',
        'heading' => 'This payment was cancelled.',
        'body' => 'Nothing was charged. You can start again whenever you are ready.',
    ],
    default => [
        'stamp' => 'stop',
        'label' => 'Not completed',
        'eyebrow' => 'Order incomplete',
        'heading' => "That payment didn't go through.",
        'body' => 'Your card was not charged. This is usually a decline from the bank rather than anything wrong with the order — trying a different card normally clears it.',
    ],
};

$this->set('title', $copy['heading'] . ' — KPIndicator');
?>

<main class="outcome">
    <span class="stamp stamp--<?= View::e($copy['stamp']) ?>"><?= View::e($copy['label']) ?></span>

    <p class="eyebrow" style="margin-top:1.25rem"><em>03</em> &nbsp;—&nbsp; <?= View::e($copy['eyebrow']) ?></p>
    <h1 class="display outcome__heading"><?= View::e($copy['heading']) ?></h1>
    <p class="outcome__body measure"><?= View::e($copy['body']) ?></p>

    <?php if ($status !== 'succeeded' && !empty($lastError)): ?>
        <div class="notice notice--error" style="margin-top:1.75rem">
            <strong>Stripe said:</strong> <?= View::e((string) $lastError) ?>
        </div>
    <?php endif; ?>

    <div class="spec outcome__receipt">
        <?php if ($package !== null): ?>
            <div class="spec__row">
                <span class="spec__label">Package</span>
                <p class="spec__value"><?= View::e((string) $package['name']) ?></p>
            </div>
        <?php endif; ?>
        <div class="spec__row">
            <span class="spec__label"><?= $status === 'succeeded' ? 'Charged' : 'Amount' ?></span>
            <p class="spec__value tnum"><?= View::e($amountLabel) ?></p>
        </div>
        <?php if (!empty($email)): ?>
            <div class="spec__row">
                <span class="spec__label">Receipt to</span>
                <p class="spec__value"><?= View::e((string) $email) ?></p>
            </div>
        <?php endif; ?>
    </div>

    <div class="outcome__actions">
        <?php if ($status === 'succeeded'): ?>
            <a class="button" href="<?= View::e($siteUrl . '/dashboard') ?>">Go to dashboard</a>
            <a class="button button--quiet" href="<?= View::e($siteUrl) ?>">Back to kpindicator.com</a>
        <?php elseif ($status === 'processing'): ?>
            <a class="button" href="<?= View::e($siteUrl) ?>">Back to kpindicator.com</a>
        <?php else: ?>
            <a class="button" href="<?= View::e((string) $retryHref) ?>">Try again</a>
            <a class="button button--quiet" href="<?= View::e($siteUrl . '/pricing') ?>">See packages</a>
        <?php endif; ?>
    </div>

    <p class="fineprint">
        Anything look wrong? Email
        <a class="link" href="mailto:<?= View::e((string) $supportEmail) ?>"><?= View::e((string) $supportEmail) ?></a>
        with your Stripe receipt and we'll fix it — don't pay twice.
    </p>
</main>
