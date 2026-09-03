/**
 * Toast notification utilities
 * Non-intrusive feedback for user actions
 */

import Toast from 'react-native-toast-message';

export function showSuccessToast(message: string, subtitle?: string) {
  Toast.show({
    type: 'success',
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 2500,
    topOffset: 60,
  });
}

export function showErrorToast(message: string, subtitle?: string) {
  Toast.show({
    type: 'error',
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 3500,
    topOffset: 60,
  });
}

export function showInfoToast(message: string, subtitle?: string) {
  Toast.show({
    type: 'info',
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 2500,
    topOffset: 60,
  });
}

export function showWarningToast(message: string, subtitle?: string) {
  Toast.show({
    type: 'info', // Will use info type but styled as warning
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 60,
  });
}

/**
 * Show a toast with undo action
 * Useful for deletions
 */
export function showUndoToast(message: string, onUndo: () => void) {
  Toast.show({
    type: 'info',
    text1: message,
    text2: 'Tap to undo',
    position: 'top',
    visibilityTime: 5000,
    topOffset: 60,
    onPress: onUndo,
  });
}
