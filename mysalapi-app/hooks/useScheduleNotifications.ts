import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  scheduleBillNotification,
  scheduleLoanNotification,
  cancelAllNotifications,
} from '@/lib/notifications';

export function useScheduleNotifications() {
  const { user } = useAuth();

  const scheduleAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Cancel existing notifications first
      await cancelAllNotifications();

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14); // Next 14 days (to catch 7-day reminders)

      // Schedule bill notifications
      const { data: bills } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'unpaid')
        .gte('due_date', now.toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0]);

      if (bills) {
        for (const bill of bills) {
          await scheduleBillNotification(
            bill.id,
            bill.title,
            bill.amount,
            new Date(bill.due_date)
          );
        }
      }

      // Schedule loan notifications (as lender)
      const { data: loansAsLender } = await supabase
        .from('loans')
        .select('*')
        .eq('lender_id', user.id)
        .eq('status', 'active')
        .gte('due_date', now.toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0]);

      if (loansAsLender) {
        for (const loan of loansAsLender) {
          await scheduleLoanNotification(
            loan.id,
            loan.purpose || 'Loan',
            loan.amount_remaining,
            new Date(loan.due_date),
            true // is lender
          );
        }
      }

      // Schedule loan notifications (as borrower)
      const { data: loansAsBorrower } = await supabase
        .from('loans')
        .select('*')
        .eq('borrower_id', user.id)
        .eq('status', 'active')
        .gte('due_date', now.toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0]);

      if (loansAsBorrower) {
        for (const loan of loansAsBorrower) {
          await scheduleLoanNotification(
            loan.id,
            loan.purpose || 'Loan',
            loan.amount_remaining,
            new Date(loan.due_date),
            false // is borrower
          );
        }
      }

      console.log('✅ Notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initial schedule
    scheduleAllNotifications();

    // Re-schedule notifications when bills or loans change
    const billsChannel = supabase
      .channel('bills_changes_' + user.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          scheduleAllNotifications();
        }
      );

    const loansChannel = supabase
      .channel('loans_changes_' + user.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
        },
        () => {
          scheduleAllNotifications();
        }
      );

    // Subscribe to channels
    billsChannel.subscribe();
    loansChannel.subscribe();

    return () => {
      supabase.removeChannel(billsChannel);
      supabase.removeChannel(loansChannel);
    };
  }, [user, scheduleAllNotifications]);

  return { scheduleAllNotifications };
}
