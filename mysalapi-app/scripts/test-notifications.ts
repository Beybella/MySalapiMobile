/**
 * Test script for push notifications
 * Run this in your app to verify notifications are working
 */

import {
  registerForPushNotifications,
  scheduleBillNotification,
  scheduleLoanNotification,
  sendImmediateNotification,
  getAllScheduledNotifications,
  getBadgeCount,
  setBadgeCount,
  NotificationData,
} from '../lib/notifications';

export async function testNotificationSystem() {
  console.log('🧪 Testing MySalapi Push Notifications...\n');

  // Test 1: Check permissions
  console.log('1️⃣ Testing permission request...');
  const token = await registerForPushNotifications();
  if (token) {
    console.log('✅ Permissions granted! Token:', token.substring(0, 20) + '...');
  } else {
    console.log('❌ Permissions denied or not on physical device');
    return;
  }

  // Test 2: Send immediate notification
  console.log('\n2️⃣ Sending test notification immediately...');
  await sendImmediateNotification(
    '✨ MySalapi Notification Test',
    'If you see this, notifications are working!',
    {
      type: 'bill',
      id: 'test-123',
      title: 'Test',
    } as NotificationData
  );
  console.log('✅ Immediate notification sent!');

  // Test 3: Schedule bill notification for 1 minute from now
  console.log('\n3️⃣ Scheduling bill notification for 1 minute from now...');
  const testDate = new Date();
  testDate.setMinutes(testDate.getMinutes() + 1);
  
  const billNotifIds = await scheduleBillNotification(
    'test-bill-id',
    'Electric Bill',
    2500,
    testDate,
    [0] // Send immediately at due time
  );
  console.log('✅ Bill notification scheduled! ID:', billNotifIds[0]);

  // Test 4: Schedule loan notification for 2 minutes from now
  console.log('\n4️⃣ Scheduling loan notification for 2 minutes from now...');
  const testDate2 = new Date();
  testDate2.setMinutes(testDate2.getMinutes() + 2);
  
  const loanNotifIds = await scheduleLoanNotification(
    'test-loan-id',
    'Emergency Loan',
    5000,
    testDate2,
    true, // is lender
    [0]
  );
  console.log('✅ Loan notification scheduled! ID:', loanNotifIds[0]);

  // Test 5: Check scheduled notifications
  console.log('\n5️⃣ Checking all scheduled notifications...');
  const scheduled = await getAllScheduledNotifications();
  console.log(`✅ Found ${scheduled.length} scheduled notifications:`);
  scheduled.forEach((notif, i) => {
    console.log(`   ${i + 1}. ${notif.content.title} - ${notif.trigger}`);
  });

  // Test 6: Badge count
  console.log('\n6️⃣ Testing badge count...');
  await setBadgeCount(3);
  const count = await getBadgeCount();
  console.log(`✅ Badge count set to: ${count}`);

  console.log('\n\n✅ All tests complete!');
  console.log('📱 You should receive:');
  console.log('   - 1 immediate notification (now)');
  console.log('   - 1 bill notification (in 1 minute)');
  console.log('   - 1 loan notification (in 2 minutes)');
  console.log('\n🔔 Make sure your device volume is on and notifications are enabled!');
}

// Quick test function - just send immediate notification
export async function quickTest() {
  console.log('🚀 Quick notification test...');
  await sendImmediateNotification(
    '💰 MySalapi',
    'Quick test notification from MySalapi!'
  );
  console.log('✅ Notification sent!');
}

// View all scheduled notifications
export async function viewScheduled() {
  console.log('📋 Viewing scheduled notifications...\n');
  const scheduled = await getAllScheduledNotifications();
  
  if (scheduled.length === 0) {
    console.log('No scheduled notifications found.');
    return;
  }

  console.log(`Found ${scheduled.length} scheduled notifications:\n`);
  scheduled.forEach((notif, i) => {
    const trigger = notif.trigger as any;
    const date = trigger.date ? new Date(trigger.date) : trigger.dateComponents;
    console.log(`${i + 1}. ${notif.content.title}`);
    console.log(`   Body: ${notif.content.body}`);
    console.log(`   Scheduled: ${date}`);
    console.log(`   ID: ${notif.identifier}\n`);
  });
}
