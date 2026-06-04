<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use App\Services\BrevoService;
use Carbon\Carbon;

class BudgetController extends Controller
{
    public function __construct(private BrevoService $brevo) {}

    /**
     * POST /api/cron/daily
     * Master daily job: check bills + overdue loans for all users.
     */
    public function runDailyChecks(Request $request): JsonResponse
    {
        $billResult    = $this->checkUpcomingBills($request);
        $overdueResult = $this->checkOverdueLoans($request);

        return response()->json([
            'bills'   => $billResult->getData(),
            'overdue' => $overdueResult->getData(),
        ]);
    }

    /**
     * POST /api/budget/check-bills
     * Find bills due within reminder_days_before and send email reminders.
     */
    public function checkUpcomingBills(Request $request): JsonResponse
    {
        $supabaseUrl = env('SUPABASE_URL');
        $serviceKey  = env('SUPABASE_SERVICE_KEY') ?: env('SUPABASE_ANON_KEY');
        $today       = Carbon::today()->toDateString();
        $sent        = 0;
        $errors      = 0;

        // Fetch all unpaid bills
        $response = Http::withHeaders([
            'apikey'        => $serviceKey,
            'Authorization' => "Bearer {$serviceKey}",
        ])->get("{$supabaseUrl}/rest/v1/bill_reminders", [
            'select'  => 'id,user_id,title,amount,due_date,reminder_days_before',
            'is_paid' => 'eq.false',
        ]);

        if (!$response->successful()) {
            return response()->json(['error' => 'Failed to fetch bills'], 500);
        }

        $bills = $response->json();

        foreach ($bills as $bill) {
            $dueDate  = Carbon::parse($bill['due_date']);
            $daysLeft = Carbon::today()->diffInDays($dueDate, false);

            // Only send if within reminder window and not already sent today
            if ($daysLeft < 0 || $daysLeft > $bill['reminder_days_before']) continue;

            // Get user email
            $userResp = Http::withHeaders([
                'apikey'        => $serviceKey,
                'Authorization' => "Bearer {$serviceKey}",
            ])->get("{$supabaseUrl}/rest/v1/users", [
                'select' => 'email',
                'id'     => "eq.{$bill['user_id']}",
            ]);

            $userEmail = $userResp->json()[0]['email'] ?? null;
            if (!$userEmail) continue;

            // Check if reminder already sent today
            $existingResp = Http::withHeaders([
                'apikey'        => $serviceKey,
                'Authorization' => "Bearer {$serviceKey}",
            ])->get("{$supabaseUrl}/rest/v1/email_notifications", [
                'select'           => 'id',
                'subject_cost_id'  => "eq.{$bill['id']}",
                'notification_type'=> "eq.bill_reminder",
                'sent_at'          => "gte.{$today}T00:00:00",
            ]);

            if (!empty($existingResp->json())) continue;

            // Create notification record
            $notifResp = Http::withHeaders([
                'apikey'        => $serviceKey,
                'Authorization' => "Bearer {$serviceKey}",
                'Prefer'        => 'return=representation',
            ])->post("{$supabaseUrl}/rest/v1/email_notifications", [
                'recipient_email'   => $userEmail,
                'subject_email'     => "Bill Reminder: {$bill['title']}",
                'notification_type' => 'bill_reminder',
                'subject_cost_id'   => $bill['id'],
                'status'            => 'pending',
            ]);

            $notifId = $notifResp->json()[0]['id'] ?? null;

            // Send email
            $html   = $this->brevo->buildBillReminderHtml([
                'title'     => $bill['title'],
                'amount'    => $bill['amount'],
                'due_date'  => $bill['due_date'],
                'days_left' => max(0, (int) $daysLeft),
            ]);
            $result = $this->brevo->send($userEmail, "Bill Reminder: {$bill['title']}", $html);

            // Update notification status
            if ($notifId) {
                Http::withHeaders([
                    'apikey'        => $serviceKey,
                    'Authorization' => "Bearer {$serviceKey}",
                ])->patch("{$supabaseUrl}/rest/v1/email_notifications?id=eq.{$notifId}", [
                    'status'  => $result['success'] ? 'sent' : 'failed',
                    'sent_at' => $result['success'] ? now()->toISOString() : null,
                    'error_message' => $result['error'] ?? null,
                ]);
            }

            $result['success'] ? $sent++ : $errors++;
        }

        return response()->json(['sent' => $sent, 'errors' => $errors]);
    }

    /**
     * POST /api/budget/check-overdue
     * Find overdue loans and notify lenders.
     */
    public function checkOverdueLoans(Request $request): JsonResponse
    {
        $supabaseUrl = env('SUPABASE_URL');
        $serviceKey  = env('SUPABASE_SERVICE_KEY') ?: env('SUPABASE_ANON_KEY');
        $today       = Carbon::today()->toDateString();
        $sent        = 0;

        $response = Http::withHeaders([
            'apikey'        => $serviceKey,
            'Authorization' => "Bearer {$serviceKey}",
        ])->get("{$supabaseUrl}/rest/v1/loans", [
            'select'  => 'id,lender_id,borrower_id,amount_remaining,purpose,due_date,payment_method,payment_details',
            'status'  => 'neq.paid',
            'due_date'=> "lt.{$today}",
        ]);

        if (!$response->successful()) {
            return response()->json(['error' => 'Failed to fetch loans'], 500);
        }

        $loans = $response->json();

        foreach ($loans as $loan) {
            // Get lender + borrower emails
            $lenderResp   = Http::withHeaders(['apikey' => $serviceKey, 'Authorization' => "Bearer {$serviceKey}"])
                ->get("{$supabaseUrl}/rest/v1/users", ['select' => 'email,full_name', 'id' => "eq.{$loan['lender_id']}"]);
            $borrowerResp = Http::withHeaders(['apikey' => $serviceKey, 'Authorization' => "Bearer {$serviceKey}"])
                ->get("{$supabaseUrl}/rest/v1/users", ['select' => 'email', 'id' => "eq.{$loan['borrower_id']}"]);

            $lender   = $lenderResp->json()[0] ?? null;
            $borrower = $borrowerResp->json()[0] ?? null;
            if (!$lender || !$borrower) continue;

            // Check if already sent today
            $existing = Http::withHeaders(['apikey' => $serviceKey, 'Authorization' => "Bearer {$serviceKey}"])
                ->get("{$supabaseUrl}/rest/v1/email_notifications", [
                    'select'            => 'id',
                    'subject_cost_id'   => "eq.{$loan['id']}",
                    'notification_type' => 'eq.overdue_loan',
                    'sent_at'           => "gte.{$today}T00:00:00",
                ]);
            if (!empty($existing->json())) continue;

            // Send Singil to borrower
            $html   = $this->brevo->buildSingilHtml([
                'lender_name'    => $lender['full_name'] ?? $lender['email'],
                'amount'         => $loan['amount_remaining'],
                'purpose'        => $loan['purpose'],
                'due_date'       => $loan['due_date'] . ' (OVERDUE)',
                'payment_method' => $loan['payment_method'],
                'payment_details'=> $loan['payment_details'],
            ]);
            $result = $this->brevo->send(
                $borrower['email'],
                "OVERDUE: Payment due to {$lender['full_name']}",
                $html
            );

            // Log notification
            Http::withHeaders(['apikey' => $serviceKey, 'Authorization' => "Bearer {$serviceKey}"])
                ->post("{$supabaseUrl}/rest/v1/email_notifications", [
                    'recipient_email'   => $borrower['email'],
                    'subject_email'     => "OVERDUE loan reminder",
                    'notification_type' => 'overdue_loan',
                    'subject_cost_id'   => $loan['id'],
                    'status'            => $result['success'] ? 'sent' : 'failed',
                    'sent_at'           => $result['success'] ? now()->toISOString() : null,
                ]);

            if ($result['success']) $sent++;
        }

        return response()->json(['sent' => $sent]);
    }
}

