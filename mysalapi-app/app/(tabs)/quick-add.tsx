// This is a hidden tab used only for the + button in the tab bar
// It redirects to the record-payment screen
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function QuickAddScreen() {
  const router = useRouter();

  useEffect(() => {
    router.push('/(tabs)/record-payment');
  }, []);

  return null;
}
