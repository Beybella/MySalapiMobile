<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\BudgetController;

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
