import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_USER: '@falk/auth_user',
  PHOTOS: '@falk/photos',
  SHIPMENTS: '@falk/shipments',
  PENDING_UPLOADS: '@falk/pending_uploads',
} as const;

export const storage = {
  setItem: async (key: string, value: unknown): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  getItem: async <T>(key: string): Promise<T | null> => {
    const val = await AsyncStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : null;
  },

  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },

  KEYS,
};
