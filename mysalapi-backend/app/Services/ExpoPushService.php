<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    /**
     * Send a push notification via Expo Push API
     */
    public function send(string $pushToken, string $title, string $body, array $data = []): array
    {
        // Validate Expo push token format
        if (!$this->isValidExpoPushToken($pushToken)) {
            Log::warning('Invalid Expo push token format', ['token' => $pushToken]);
            return ['success' => false, 'error' => 'Invalid push token format'];
        }

        try {
            $response = Http::post('https://exp.host/--/api/v2/push/send', [
                'to' => $pushToken,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'default',
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                // Check if Expo API returned an error
                if (isset($result['data'][0]['status']) && $result['data'][0]['status'] === 'error') {
                    $errorMessage = $result['data'][0]['message'] ?? 'Unknown error';
                    Log::error('Expo Push API error', ['error' => $errorMessage]);
                    return ['success' => false, 'error' => $errorMessage];
                }
                
                return ['success' => true, 'receipt_id' => $result['data'][0]['id'] ?? null];
            }

            $errorMsg = $response->json('message') ?? $response->body();
            Log::error('Expo Push API error', ['status' => $response->status(), 'body' => $response->body()]);
            return ['success' => false, 'error' => "Expo error: {$errorMsg}"];

        } catch (\Exception $e) {
            Log::error('ExpoPushService exception', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Send push notifications to multiple devices
     */
    public function sendToMultiple(array $pushTokens, string $title, string $body, array $data = []): array
    {
        // Filter valid tokens
        $validTokens = array_filter($pushTokens, fn($token) => $this->isValidExpoPushToken($token));
        
        if (empty($validTokens)) {
            return ['success' => false, 'error' => 'No valid push tokens provided'];
        }

        try {
            $messages = array_map(function ($token) use ($title, $body, $data) {
                return [
                    'to' => $token,
                    'title' => $title,
                    'body' => $body,
                    'data' => $data,
                    'sound' => 'default',
                    'priority' => 'high',
                    'channelId' => 'default',
                ];
            }, $validTokens);

            $response = Http::post('https://exp.host/--/api/v2/push/send', $messages);

            if ($response->successful()) {
                return ['success' => true, 'results' => $response->json()];
            }

            $errorMsg = $response->json('message') ?? $response->body();
            Log::error('Expo Push API batch error', ['status' => $response->status(), 'body' => $response->body()]);
            return ['success' => false, 'error' => "Expo error: {$errorMsg}"];

        } catch (\Exception $e) {
            Log::error('ExpoPushService batch exception', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Validate Expo push token format
     */
    private function isValidExpoPushToken(string $token): bool
    {
        // Expo push tokens start with ExponentPushToken[ or ExpoPushToken[
        return str_starts_with($token, 'ExponentPushToken[') || 
               str_starts_with($token, 'ExpoPushToken[') ||
               $token === 'local-only'; // For development/testing
    }
}
