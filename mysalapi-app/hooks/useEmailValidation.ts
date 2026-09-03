/**
 * Real-time email validation hook
 * Validates format and checks if user exists in MySalapi
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type ValidationStatus = 'idle' | 'valid' | 'invalid' | 'checking';

export interface EmailValidation {
  status: ValidationStatus;
  message: string;
  isValid: boolean;
}

export function useEmailValidation(email: string, enabled: boolean = true): EmailValidation {
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!enabled || !email) {
      setStatus('idle');
      setMessage('');
      return;
    }

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('invalid');
      setMessage('Invalid email format');
      return;
    }

    // Debounce user lookup
    const timer = setTimeout(async () => {
      setStatus('checking');
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('email', email.toLowerCase().trim())
          .single();

        if (error || !data) {
          setStatus('invalid');
          setMessage('Not registered. They must sign up first.');
        } else {
          setStatus('valid');
          setMessage(data.full_name ? `✓ ${data.full_name}` : '✓ User found');
        }
      } catch (err) {
        setStatus('invalid');
        setMessage('Could not verify email');
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [email, enabled]);

  return {
    status,
    message,
    isValid: status === 'valid',
  };
}
