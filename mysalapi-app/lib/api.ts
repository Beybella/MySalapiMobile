/**
 * MySalapi API client
 * Calls the Laravel backend for email sending.
 * All other data operations go directly through Supabase.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.5.172:8000/api';

async function post(endpoint: string, body: object): Promise<{ success: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message ?? `Server error ${res.status}` };
    return { success: true, ...data };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Make sure the Laravel server is running on your PC.' };
    }
    return { success: false, error: `Network error: ${err.message}. Make sure your phone and PC are on the same WiFi and the Laravel server is running.` };
  }
}

export function sendSingil(params: {
  recipient_email: string;
  lender_name: string;
  amount: number;
  purpose?: string;
  due_date?: string;
  payment_method?: string;
  payment_details?: string;
  notification_id?: string;
}) {
  return post('/email/singil', params);
}

export function sendGroupSingil(params: {
  recipient_email: string;
  payer_name: string;
  group_title: string;
  share_amount: number;
  payment_method?: string;
  payment_details?: string;
  notification_id?: string;
}) {
  return post('/email/group-singil', params);
}

export function sendBillReminder(params: {
  recipient_email: string;
  title: string;
  amount: number;
  due_date: string;
  days_left: number;
  notification_id?: string;
}) {
  return post('/email/bill-reminder', params);
}

export function sendShortfallAlert(params: {
  recipient_email: string;
  shortfall: number;
  bills: { title: string; amount: number; due_date: string }[];
  notification_id?: string;
}) {
  return post('/email/shortfall', params);
}
