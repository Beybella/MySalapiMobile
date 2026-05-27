<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily cron: check upcoming bills and overdue loans
Schedule::call(function () {
    Http::post(config('app.url') . '/api/cron/daily');
})->dailyAt('08:00')->name('mysalapi-daily-checks')->withoutOverlapping();

