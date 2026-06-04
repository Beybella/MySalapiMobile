<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BrevoService
{
    /**
     * Send a transactional email via Brevo API.
     * Free tier: 300 emails/day, any recipient, no domain required.
     */
    public function send(string $to, string $subject, string $htmlBody): array
    {
        $apiKey = env('BREVO_API_KEY');

        if (!$apiKey || str_starts_with($apiKey, 'your_')) {
            Log::error('BrevoService: BREVO_API_KEY is not configured in .env');
            return ['success' => false, 'error' => 'Email service not configured. Set BREVO_API_KEY in .env'];
        }

        try {
            $response = Http::withHeaders([
                'api-key'      => $apiKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ])->post('https://api.brevo.com/v3/smtp/email', [
                'sender'      => [
                    'name'  => env('MAIL_FROM_NAME', 'MySalapi'),
                    'email' => env('MAIL_FROM_ADDRESS', 'noreply@mysalapi.app'),
                ],
                'to'          => [['email' => $to]],
                'subject'     => $subject,
                'htmlContent' => $htmlBody,
            ]);

            if ($response->successful()) {
                return ['success' => true, 'id' => $response->json('messageId') ?? ''];
            }

            $errorMsg = $response->json('message') ?? $response->body();
            Log::error('Brevo API error', ['status' => $response->status(), 'body' => $response->body()]);
            return ['success' => false, 'error' => "Brevo error: {$errorMsg}"];

        } catch (\Exception $e) {
            Log::error('BrevoService exception', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Build the Singil (debt collection) email HTML.
     */
    public function buildSingilHtml(array $data): string
    {
        $amount     = number_format($data['amount'], 2);
        $lenderName = htmlspecialchars($data['lender_name']);
        $purpose    = htmlspecialchars($data['purpose'] ?? 'loan');
        $dueDate    = htmlspecialchars($data['due_date'] ?? 'N/A');
        $payMethod  = htmlspecialchars($data['payment_method'] ?? '');
        $payDetails = htmlspecialchars($data['payment_details'] ?? '');

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>
          body{font-family:Arial,sans-serif;background:#f3fdfb;margin:0;padding:0;}
          .container{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
          .header{background:#32A08E;padding:28px 32px;}
          .header h1{color:#fff;margin:0;font-size:22px;}
          .header p{color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;}
          .body{padding:28px 32px;}
          .amount{font-size:36px;font-weight:800;color:#32A08E;margin:16px 0;}
          .detail{background:#f3fdfb;border-radius:8px;padding:16px;margin:16px 0;}
          .detail p{margin:6px 0;font-size:14px;color:#495057;}
          .footer{padding:20px 32px;background:#f3fdfb;font-size:12px;color:#adb5bd;text-align:center;}
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MySalapi &mdash; Payment Reminder</h1>
              <p>Sent via MySalapi Singil feature</p>
            </div>
            <div class="body">
              <p style="font-size:15px;color:#212529;">Hi, you have an outstanding payment to <strong>{$lenderName}</strong>.</p>
              <div class="amount">&#8369;{$amount}</div>
              <div class="detail">
                <p><strong>Purpose:</strong> {$purpose}</p>
                <p><strong>Due Date:</strong> {$dueDate}</p>
                <p><strong>Payment Method:</strong> {$payMethod}</p>
                <p><strong>Payment Details:</strong> {$payDetails}</p>
              </div>
              <p style="font-size:13px;color:#6c757d;">Please settle this at your earliest convenience. This is an automated reminder from MySalapi.</p>
            </div>
            <div class="footer">MySalapi &middot; This is an automated message. Do not reply.</div>
          </div>
        </body>
        </html>
        HTML;
    }

    /**
     * Build the bill reminder email HTML.
     */
    public function buildBillReminderHtml(array $data): string
    {
        $amount   = number_format($data['amount'], 2);
        $title    = htmlspecialchars($data['title']);
        $dueDate  = htmlspecialchars($data['due_date']);
        $daysLeft = (int) $data['days_left'];
        $urgency  = $daysLeft <= 1 ? 'TODAY' : "in {$daysLeft} day(s)";

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>
          body{font-family:Arial,sans-serif;background:#f3fdfb;margin:0;padding:0;}
          .container{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
          .header{background:#32A08E;padding:28px 32px;}.header h1{color:#fff;margin:0;font-size:22px;}
          .body{padding:28px 32px;}.amount{font-size:36px;font-weight:800;color:#32A08E;margin:16px 0;}
          .urgency{display:inline-block;background:#D9BF77;color:#1A2B28;padding:6px 14px;border-radius:20px;font-weight:700;font-size:13px;margin-bottom:16px;}
          .footer{padding:20px 32px;background:#f3fdfb;font-size:12px;color:#adb5bd;text-align:center;}
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>MySalapi &mdash; Bill Reminder</h1></div>
            <div class="body">
              <p style="font-size:15px;color:#212529;">Your bill <strong>{$title}</strong> is due <strong>{$urgency}</strong>.</p>
              <div class="amount">&#8369;{$amount}</div>
              <span class="urgency">Due: {$dueDate}</span>
              <p style="font-size:13px;color:#6c757d;">Log in to MySalapi to mark this bill as paid.</p>
            </div>
            <div class="footer">MySalapi &middot; Automated bill reminder.</div>
          </div>
        </body>
        </html>
        HTML;
    }

    /**
     * Build the shortfall alert email HTML.
     */
    public function buildShortfallHtml(array $data): string
    {
        $shortfall = number_format($data['shortfall'], 2);
        $billsHtml = '';
        foreach ($data['bills'] as $bill) {
            $name      = htmlspecialchars($bill['title']);
            $amount    = number_format($bill['amount'], 2);
            $due       = htmlspecialchars($bill['due_date']);
            $billsHtml .= "<tr>"
                        . "<td style='padding:8px;border-bottom:1px solid #dee2e6;'>{$name}</td>"
                        . "<td style='padding:8px;border-bottom:1px solid #dee2e6;'>&#8369;{$amount}</td>"
                        . "<td style='padding:8px;border-bottom:1px solid #dee2e6;'>{$due}</td>"
                        . "</tr>";
        }

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>
          body{font-family:Arial,sans-serif;background:#f3fdfb;margin:0;padding:0;}
          .container{max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
          .header{background:#DC3545;padding:28px 32px;}.header h1{color:#fff;margin:0;font-size:22px;}
          .body{padding:28px 32px;}.shortfall{font-size:36px;font-weight:800;color:#DC3545;margin:16px 0;}
          table{width:100%;border-collapse:collapse;font-size:14px;}
          th{background:#f3fdfb;padding:10px 8px;text-align:left;font-weight:700;color:#495057;}
          .footer{padding:20px 32px;background:#f3fdfb;font-size:12px;color:#adb5bd;text-align:center;}
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Budget Shortfall Alert</h1></div>
            <div class="body">
              <p style="font-size:15px;color:#212529;">Your available funds are not enough to cover all upcoming bills.</p>
              <div class="shortfall">&#8369;{$shortfall} short</div>
              <table>
                <thead><tr><th>Bill</th><th>Amount</th><th>Due Date</th></tr></thead>
                <tbody>{$billsHtml}</tbody>
              </table>
              <p style="font-size:13px;color:#6c757d;margin-top:16px;">Open MySalapi to review your budget plan and add fund sources.</p>
            </div>
            <div class="footer">MySalapi &middot; Smart Budget Planner alert.</div>
          </div>
        </body>
        </html>
        HTML;
    }
}
