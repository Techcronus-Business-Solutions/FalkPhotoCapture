import Toast from 'react-native-toast-message';
import { useAuthStore } from '../store/authStore';

// Prevents duplicate toast + logout when multiple 401s fire simultaneously
let isHandling401 = false;

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

export const handle401 = (): void => {
  if (isHandling401) return;
  isHandling401 = true;

  Toast.show({
    type: 'error',
    text1: 'Session Expired',
    text2:
      'You have logged in from another device.',
    visibleTime: 4000,
  });

  useAuthStore
    .getState()
    .logout()
    .finally(() => {
      // Reset flag after toast completes so future sessions work correctly
      setTimeout(() => {
        isHandling401 = false;
      }, 5000);
    });
};
