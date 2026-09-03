/**
 * Network status detection hook
 * Monitors online/offline state and connection quality
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    // Check initial state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? true);
      setConnectionType(state.type);
      
      // Check if 2G connection (slow)
      if (state.type === 'cellular' && state.details) {
        const details = state.details as any;
        setIsSlowConnection(details.cellularGeneration === '2g');
      }
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
      setConnectionType(state.type);
      
      // Check connection quality
      if (state.type === 'cellular' && state.details) {
        const details = state.details as any;
        setIsSlowConnection(details.cellularGeneration === '2g');
      } else {
        setIsSlowConnection(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    isOnline,
    isSlowConnection,
    connectionType,
  };
}
