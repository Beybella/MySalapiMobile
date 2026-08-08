<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use App\Services\BrevoService;

class AuthController extends Controller
{
    public function __construct(private BrevoService $brevo) {}

    /**
     * POST /api/auth/send-password-reset
     * Generate a Supabase password reset link via Admin API,
     * then send it via Brevo so we bypass Supabase's broken SMTP.
     */
    public function sendPasswordReset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $supabaseUrl   = env('SUPABASE_URL');
        $serviceKey    = env('SUPABASE_SERVICE_KEY');
        $redirectTo    = 'https://krizxei.github.io/MySalapiMobile/reset-password.html';

        if (!$serviceKey) {
            return response()->json(['success' => false, 'error' => 'Service key not configured.'], 500);
        }

        // Generate password reset link using Supabase Admin API
        $response = Http::withHeaders([
            'apikey'        => $serviceKey,
            'Authorization' => "Bearer {$serviceKey}",
            'Content-Type'  => 'application/json',
        ])->post("{$supabaseUrl}/auth/v1/admin/generate_link", [
            'type'        => 'recovery',
            'email'       => $data['email'],
            'options'     => ['redirect_to' => $redirectTo],
        ]);

        if (!$response->successful()) {
            $errorCode = $response->json('error_code') ?? '';
            $status    = $response->status();

            if ($status === 404 || $errorCode === 'user_not_found') {
                return response()->json([
                    'success' => false,
                    'error'   => 'No account found with that email address.',
                    'code'    => 'user_not_found',
                ], 404);
            }

            \Illuminate\Support\Facades\Log::error('Password reset link generation failed', [
                'status' => $status,
                'body'   => $response->body(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'Could not generate reset link. Please try again.',
            ], 500);
        }

        $actionLink = $response->json('action_link');

        \Illuminate\Support\Facades\Log::info('Password reset link response', [
            'status'      => $response->status(),
            'action_link' => $actionLink,
            'body_keys'   => array_keys($response->json() ?? []),
        ]);

        if (!$actionLink) {
            // Try alternate key name
            $actionLink = $response->json('data.action_link')
                ?? $response->json('properties.action_link');
        }

        if (!$actionLink) {
            return response()->json([
                'success' => false,
                'error'   => 'No action link returned.',
            ], 500);
        }

        // Force the redirect_to to our GitHub Pages reset page,
        // overriding whatever Supabase stored in URL Configuration
        $resetPage   = 'https://krizxei.github.io/MySalapiMobile/reset-password.html';
        $actionLink  = preg_replace(
            '/redirect_to=[^&]+/',
            'redirect_to=' . urlencode($resetPage),
            $actionLink
        );
        $email   = $data['email'];
        $subject = 'MySalapi — Reset Your Password';
        $html    = $this->buildResetEmailHtml($actionLink, $email);
        $result  = $this->brevo->send($email, $subject, $html);

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * POST /api/auth/send-confirmation
     * Generate a Supabase email confirmation link and send it via Brevo.
     */
    public function sendConfirmationEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $supabaseUrl = env('SUPABASE_URL');
        $serviceKey  = env('SUPABASE_SERVICE_KEY');
        $redirectTo  = 'https://krizxei.github.io/MySalapiMobile/email-confirmed.html';

        if (!$serviceKey) {
            return response()->json(['success' => false, 'error' => 'Service key not configured.'], 500);
        }

        // Generate signup confirmation link using magiclink type
        // (signup type may not work with Admin API when user just created)
        $response = Http::withHeaders([
            'apikey'        => $serviceKey,
            'Authorization' => "Bearer {$serviceKey}",
            'Content-Type'  => 'application/json',
        ])->post("{$supabaseUrl}/auth/v1/admin/generate_link", [
            'type'    => 'magiclink', // Changed from 'signup' to 'magiclink'
            'email'   => $data['email'],
            'options' => ['redirect_to' => $redirectTo],
        ]);

        if (!$response->successful()) {
            \Illuminate\Support\Facades\Log::error('Confirmation link generation failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
                'email'  => $data['email'],
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'Could not generate confirmation link.',
                'details' => $response->json(),
            ], 500);
        }

        $actionLink = $response->json('action_link');
        if (!$actionLink) {
            return response()->json(['success' => false, 'error' => 'No action link returned.'], 500);
        }

        // Force redirect_to to our confirmed page, overriding Supabase URL config
        $confirmPage = 'https://krizxei.github.io/MySalapiMobile/email-confirmed.html';
        $actionLink  = preg_replace(
            '/redirect_to=[^&]+/',
            'redirect_to=' . urlencode($confirmPage),
            $actionLink
        );

        $html   = $this->buildConfirmationEmailHtml($actionLink, $data['email']);
        $result = $this->brevo->send($data['email'], 'MySalapi — Confirm Your Email', $html);

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    private function buildResetEmailHtml(string $resetLink, string $email): string
    {
        $safeEmail = htmlspecialchars($email);
        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>
          body{font-family:Arial,sans-serif;background:#F5F7F4;margin:0;padding:0;}
          .container{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
          .header{background:#5A7A5C;padding:32px;text-align:center;}
          .header h1{color:#fff;margin:0;font-size:22px;font-weight:700;}
          .body{padding:32px;}
          .body p{font-size:15px;color:#2C3B2D;line-height:1.6;}
          .btn{display:block;width:fit-content;margin:24px auto;background:#5A7A5C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;}
          .footer{padding:20px 32px;background:#F5F7F4;font-size:12px;color:#9FB5A0;text-align:center;}
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>MySalapi — Reset Password</h1></div>
            <div class="body">
              <p>Hi <strong>{$safeEmail}</strong>,</p>
              <p>We received a request to reset your MySalapi password. Click the button below to set a new password:</p>
              <a href="{$resetLink}" class="btn">Reset My Password</a>
              <p style="font-size:13px;color:#637464;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">MySalapi · Automated message. Do not reply.</div>
          </div>
        </body>
        </html>
        HTML;
    }

    private function buildConfirmationEmailHtml(string $confirmLink, string $email): string
    {
        $safeEmail = htmlspecialchars($email);
        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>
          body{font-family:Arial,sans-serif;background:#F5F7F4;margin:0;padding:0;}
          .container{max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
          .header{background:#5A7A5C;padding:32px;text-align:center;}
          .header h1{color:#fff;margin:0;font-size:22px;font-weight:700;}
          .body{padding:32px;}
          .body p{font-size:15px;color:#2C3B2D;line-height:1.6;}
          .btn{display:block;width:fit-content;margin:24px auto;background:#5A7A5C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;}
          .footer{padding:20px 32px;background:#F5F7F4;font-size:12px;color:#9FB5A0;text-align:center;}
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>MySalapi — Confirm Your Email</h1></div>
            <div class="body">
              <p>Hi <strong>{$safeEmail}</strong>,</p>
              <p>Welcome to MySalapi! Click the button below to confirm your email address and activate your account:</p>
              <a href="{$confirmLink}" class="btn">Confirm My Email</a>
              <p style="font-size:13px;color:#637464;">If you didn't create this account, you can safely ignore this email.</p>
            </div>
            <div class="footer">MySalapi · Automated message. Do not reply.</div>
          </div>
        </body>
        </html>
        HTML;
    }
}
