<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| MySalapi API Routes
|--------------------------------------------------------------------------
| All routes are stateless and verified via Supabase JWT middleware.
*/

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok', 'app' => 'MySalapi']));

// Email notifications (Singil + Bill Reminders)
Route::prefix('email')->group(function () {
    Route::post('/singil', [EmailController::class, 'sendSingil']);
    Route::post('/bill-reminder', [EmailController::class, 'sendBillReminder']);
    Route::post('/shortfall', [EmailController::class, 'sendShortfallAlert']);
    Route::post('/group-singil', [EmailController::class, 'sendGroupSingil']);
});

// Budget planner (cron-triggered)
Route::prefix('budget')->group(function () {
    Route::post('/check-bills', [BudgetController::class, 'checkUpcomingBills']);
    Route::post('/check-overdue', [BudgetController::class, 'checkOverdueLoans']);
});

// Cron endpoint (called by scheduler or external cron)
Route::post('/cron/daily', [BudgetController::class, 'runDailyChecks']);

// Auth emails via Brevo (bypasses Supabase's broken SMTP)
Route::prefix('auth')->group(function () {
    Route::post('/send-password-reset', [AuthController::class, 'sendPasswordReset']);
    Route::post('/send-confirmation', [AuthController::class, 'sendConfirmationEmail']);
});
