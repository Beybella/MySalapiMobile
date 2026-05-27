<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\ResendService;
use Illuminate\Support\Facades\Http;

class EmailController extends Controller
{
    public function __construct(private ResendService $resend) {}

    /**
     * POST /api/email/singil
     * Send a debt collection email for a direct loan.
     */
    public function sendSingil(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipient_email'  => 'required|email',
            'lender_name'      => 'required|string',
            'amount'           => 'required|numeric|min:0.01',
            'purpose'          => 'nullable|string',
            'due_date'         => 'nullable|string',
            'payment_method'   => 'nullable|string',
            'payment_details'  => 'nullable|string',
            'notification_id'  => 'nullable|uuid',
        ]);

        $html   = $this->resend->buildSingilHtml($data);
        $result = $this->resend->send(
            $data['recipient_email'],
            "Payment Reminder from {$data['lender_name']} via MySalapi",
            $html
        );

        $this->updateNotificationStatus($data['notification_id'] ?? null, $result);

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * POST /api/email/bill-reminder
     * Send a bill due-date reminder email.
     */
    public function sendBillReminder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipient_email'  => 'required|email',
            'title'            => 'required|string',
            'amount'           => 'required|numeric|min:0.01',
            'due_date'         => 'required|string',
            'days_left'        => 'required|integer',
            'notification_id'  => 'nullable|uuid',
        ]);

        $html   = $this->resend->buildBillReminderHtml($data);
        $result = $this->resend->send(
            $data['recipient_email'],
            "Bill Reminder: {$data['title']} due {$data['due_date']}",
            $html
        );

        $this->updateNotificationStatus($data['notification_id'] ?? null, $result);

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * POST /api/email/shortfall
     * Send a budget shortfall alert email.
     */
    public function sendShortfallAlert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipient_email'  => 'required|email',
            'shortfall'        => 'required|numeric|min:0.01',
            'bills'            => 'required|array',
            'bills.*.title'    => 'required|string',
            'bills.*.amount'   => 'required|numeric',
            'bills.*.due_date' => 'required|string',
            'notification_id'  => 'nullable|uuid',
        ]);

        $html   = $this->resend->buildShortfallHtml($data);
        $result = $this->resend->send(
            $data['recipient_email'],
            'MySalapi — Budget Shortfall Alert',
            $html
        );

        $this->updateNotificationStatus($data['notification_id'] ?? null, $result);

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * POST /api/email/group-singil
     * Send a group expense collection email.
     */
    public function sendGroupSingil(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipient_email'  => 'required|email',
            'payer_name'       => 'required|string',
            'group_title'      => 'required|string',
            'share_amount'     => 'required|numeric|min:0.01',
            'payment_method'   => 'nullable|string',
            'payment_details'  => 'nullable|string',
            'notification_id'  => 'nullable|uuid',
        ]);

        $amount  = number_format($data['share_amount'], 2);
        $payer   = htmlspecialchars($data['payer_name']);
        $title   = htmlspecialchars($data['group_title']);
        $method  = htmlspecialchars($data['payment_method'] ?? '');
        $details = htmlspecialchars($data['payment_details'] ?? '');

        $html = <<<HTML
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
          body{font-family:Arial,sans-serif;background:#f8f9fa;margin:0;padding:0;}
          .container{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
          .header{background:#6F42C1;padding:28px 32px;}.header h1{color:#fff;margin:0;font-size:22px;}
          .body{padding:28px 32px;}.amount{font-size:36px;font-weight:800;color:#6F42C1;margin:16px 0;}
          .detail{background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0;}.detail p{margin:6px 0;font-size:14px;color:#495057;}
          .footer{padding:20px 32px;background:#f8f9fa;font-size:12px;color:#adb5bd;text-align:center;}
        </style></head>
        <body><div class="container">
          <div class="header"><h1>MySalapi — Group Expense Reminder</h1></div>
          <div class="body">
            <p style="font-size:15px;color:#212529;"><strong>{$payer}</strong> is collecting for <strong>{$title}</strong>.</p>
            <div class="amount">₱{$amount}</div>
            <div class="detail">
              <p><strong>Group:</strong> {$title}</p>
              <p><strong>Payment Method:</strong> {$method}</p>
              <p><strong>Payment Details:</strong> {$details}</p>
            </div>
            <p style="font-size:13px;color:#6c757d;">Please settle your share at your earliest convenience.</p>
          </div>
          <div class="footer">MySalapi · Automated group expense reminder.</div>
        </div></body></html>
        HTML;

        $result = $this->resend->send(
            $data['recipient_email'],
            "Group Expense Reminder: {$title} — ₱{$amount}",
            $html
        );

        $this->updateNotificationStatus($data['notification_id'] ?? null, $result);

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * Update the email_notifications record in Supabase after sending.
     */
    private function updateNotificationStatus(?string $notificationId, array $result): void
    {
        if (!$notificationId) return;

        $supabaseUrl = env('SUPABASE_URL');
        $serviceKey  = env('SUPABASE_SERVICE_KEY') ?: env('SUPABASE_ANON_KEY');

        Http::withHeaders([
            'apikey'        => $serviceKey,
            'Authorization' => "Bearer {$serviceKey}",
            'Content-Type'  => 'application/json',
        ])->patch("{$supabaseUrl}/rest/v1/email_notifications?id=eq.{$notificationId}", [
            'status'        => $result['success'] ? 'sent' : 'failed',
            'error_message' => $result['error'] ?? null,
            'sent_at'       => $result['success'] ? now()->toISOString() : null,
        ]);
    }
}
