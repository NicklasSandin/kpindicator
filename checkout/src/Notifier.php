<?php

declare(strict_types=1);

namespace KPI\Checkout;

/**
 * "New paid signup" alerts, matching src/lib/notify.ts.
 *
 * Same contract as the Next.js helper: send through Resend when a key is
 * configured, otherwise write the message to the error log so the flow is
 * still observable in development. Never throws — a failed notification must
 * not affect a successful payment.
 */
final class Notifier
{
    public function __construct(
        private readonly ?string $apiKey,
        private readonly ?string $from,
        private readonly ?string $to,
    ) {
    }

    public function adminAlert(string $subject, string $body): void
    {
        if ($this->apiKey === null || $this->to === null) {
            error_log(sprintf('[checkout] (notification not sent — no RESEND_API_KEY) %s: %s', $subject, $body));

            return;
        }

        $payload = json_encode([
            'from' => $this->from ?? 'onboarding@resend.dev',
            'to' => [$this->to],
            'subject' => $subject,
            'text' => $body,
        ], JSON_UNESCAPED_SLASHES);

        if ($payload === false) {
            return;
        }

        $handle = curl_init('https://api.resend.com/emails');
        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
        ]);

        $response = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        if ($status < 200 || $status >= 300) {
            error_log(sprintf(
                '[checkout] Admin notification failed (HTTP %d) %s %s',
                $status,
                $error,
                is_string($response) ? $response : '',
            ));
        }
    }
}
