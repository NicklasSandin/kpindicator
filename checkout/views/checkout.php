<?php namespace KPI\Checkout;

/**
 * The checkout sheet: the order on the left, the payment on the right.
 *
 * Everything shown here — package, price, currency — is rendered from what PHP
 * resolved server-side. The only thing JavaScript adds is Stripe's Payment
 * Element, which has to be an iframe Stripe owns so card data never touches
 * this origin.
 *
 * @var array<string,mixed> $package
 * @var array<string,mixed> $price
 * @var string $priceLabel
 * @var bool $configured
 * @var array<string,string> $endpoints
 */

$this->set('title', sprintf('Checkout — %s — KPIndicator', (string) $package['name']));
$this->set('includePaymentScript', $configured);
?>

<main class="sheet">

    <section class="docket">
        <p class="eyebrow"><em>01</em> &nbsp;—&nbsp; Your order</p>

        <h1 class="display docket__name"><?= View::e((string) $package['name']) ?></h1>
        <p class="docket__tagline measure"><?= View::e((string) $package['tagline']) ?></p>

        <hr class="docket__rule">

        <p class="amount tnum"><?= View::e($priceLabel) ?></p>
        <p class="amount__note">
            <?= View::e(strtoupper((string) $price['currency'])) ?> &nbsp;·&nbsp; one-time &nbsp;·&nbsp; billed today
        </p>

        <div class="spec">
            <div class="spec__row">
                <span class="spec__label">Timeline</span>
                <p class="spec__value"><?= View::e((string) $package['duration']) ?></p>
            </div>
            <div class="spec__row">
                <span class="spec__label">Best for</span>
                <p class="spec__value"><?= View::e((string) $package['bestFor']) ?></p>
            </div>
            <div class="spec__row">
                <span class="spec__label">You get</span>
                <div class="spec__value">
                    <ul>
                        <?php foreach ((array) $package['deliverables'] as $deliverable): ?>
                            <li><?= View::e((string) $deliverable) ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <section class="payment">
        <p class="eyebrow"><em>02</em> &nbsp;—&nbsp; Payment</p>
        <h2 class="display payment__heading">Pay once, and we <em>start</em>.</h2>

        <?php if (!$configured): ?>
            <div class="notice notice--error" style="margin-top:2rem">
                <strong>Payments aren't switched on yet.</strong>
                This checkout needs a Stripe secret key and publishable key before it can take
                a card. Until then, email
                <a class="link" href="mailto:<?= View::e((string) $supportEmail) ?>"><?= View::e((string) $supportEmail) ?></a>
                and we'll invoice you directly for
                <?= View::e((string) $package['name']) ?>.
            </div>
        <?php else: ?>
            <form class="form" id="payment-form"
                  data-endpoint-intent="<?= View::e($endpoints['paymentIntent']) ?>"
                  data-endpoint-buyer="<?= View::e($endpoints['buyer']) ?>"
                  data-return-url="<?= View::e($endpoints['return']) ?>"
                  data-package="<?= View::e((string) $package['id']) ?>"
                  data-publishable-key="<?= View::e((string) $publishableKey) ?>"
                  novalidate>

                <div class="field">
                    <label class="field__label" for="email">Email <span>*</span></label>
                    <input type="email" id="email" name="email" autocomplete="email"
                           required placeholder="you@company.com"
                           value="<?= View::e((string) $prefillEmail) ?>">
                </div>

                <div class="field field--pair">
                    <div>
                        <label class="field__label" for="name">Name</label>
                        <input type="text" id="name" name="name" autocomplete="name" placeholder="Alex Nordin">
                    </div>
                    <div>
                        <label class="field__label" for="company">Company</label>
                        <input type="text" id="company" name="company" autocomplete="organization" placeholder="Optional">
                    </div>
                </div>

                <div class="element-shell">
                    <div id="payment-element">
                        <p class="element-loading">Loading secure payment field…</p>
                    </div>
                </div>

                <div class="notice notice--error" id="payment-message" role="alert" hidden></div>

                <button class="button" id="submit" type="submit" disabled>
                    <span class="button__spinner" id="spinner" hidden></span>
                    <span id="button-text">Pay <?= View::e($priceLabel) ?></span>
                </button>

                <p class="fineprint">
                    Card details go straight to Stripe — they never touch a KPIndicator server.
                    You'll get a Stripe receipt immediately and an intake email from us within
                    one business day. Questions first?
                    <a class="link" href="mailto:<?= View::e((string) $supportEmail) ?>">Email us</a>.
                </p>
            </form>
        <?php endif; ?>
    </section>

</main>
