<?php
/**
 * MySalapi Email Test Script
 * Run this to verify Brevo integration is working
 * 
 * Usage: php test-email.php your-email@example.com
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get email from command line argument
$testEmail = $argv[1] ?? 'notifications.mysalapi@gmail.com';

echo "🧪 Testing MySalapi Email System\n";
echo "================================\n\n";

// Check environment variables
echo "1. Checking environment variables...\n";
$brevoKey = env('BREVO_API_KEY');
$supabaseUrl = env('SUPABASE_URL');
$supabaseAnon = env('SUPABASE_ANON_KEY');
$supabaseService = env('SUPABASE_SERVICE_KEY');

if (!$brevoKey || str_starts_with($brevoKey, 'your_')) {
    echo "   ❌ BREVO_API_KEY not configured\n";
    exit(1);
}
echo "   ✅ BREVO_API_KEY configured\n";

if (!$supabaseUrl) {
    echo "   ❌ SUPABASE_URL not configured\n";
    exit(1);
}
echo "   ✅ SUPABASE_URL: $supabaseUrl\n";

if (!$supabaseService) {
    echo "   ❌ SUPABASE_SERVICE_KEY not configured\n";
    exit(1);
}
echo "   ✅ SUPABASE_SERVICE_KEY configured\n\n";

// Test Brevo connection
echo "2. Testing Brevo API connection...\n";
$brevoService = app(\App\Services\BrevoService::class);

$testHtml = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #32A08E;">🎉 MySalapi Email Test</h2>
    <p>If you're reading this, your email system is working!</p>
    <p><strong>Brevo Integration:</strong> ✅ Connected</p>
    <p><strong>Test Time:</strong> {DATE}</p>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
    <p style="font-size: 12px; color: #999;">
        This is a test email from MySalapi backend.<br>
        Your thesis project email notifications are ready! 🚀
    </p>
</body>
</html>
HTML;

$testHtml = str_replace('{DATE}', date('Y-m-d H:i:s'), $testHtml);

$result = $brevoService->send(
    $testEmail,
    'MySalapi Email Test - System Working! 🚀',
    $testHtml
);

if ($result['success']) {
    echo "   ✅ Email sent successfully!\n";
    echo "   📧 Sent to: $testEmail\n";
    echo "   📬 Message ID: " . ($result['id'] ?? 'N/A') . "\n\n";
} else {
    echo "   ❌ Email failed: " . ($result['error'] ?? 'Unknown error') . "\n\n";
    exit(1);
}

// Test Supabase connection
echo "3. Testing Supabase connection...\n";
$response = \Illuminate\Support\Facades\Http::withHeaders([
    'apikey' => $supabaseService,
    'Authorization' => "Bearer $supabaseService",
])->get("$supabaseUrl/rest/v1/users", [
    'select' => 'count',
    'limit' => 1,
]);

if ($response->successful()) {
    echo "   ✅ Supabase connected successfully\n\n";
} else {
    echo "   ❌ Supabase connection failed: " . $response->status() . "\n\n";
    exit(1);
}

echo "================================\n";
echo "✅ All tests passed!\n";
echo "Your email system is ready to send:\n";
echo "  • Bill reminders\n";
echo "  • Loan notifications (Singil)\n";
echo "  • Budget shortfall alerts\n";
echo "  • Group expense reminders\n\n";
echo "Check your email at: $testEmail\n";
echo "================================\n";
