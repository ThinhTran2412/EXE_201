import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN:  'sm_access_token',
  REFRESH_TOKEN: 'sm_refresh_token',
  ROLE:          'sm_role',
  USER_ID:       'sm_user_id',
} as const;

export const tokenStorage = {
  async save(access: string, refresh: string, role: string, userId: string) {
    await AsyncStorage.multiSet([
      [KEYS.ACCESS_TOKEN,  access],
      [KEYS.REFRESH_TOKEN, refresh],
      [KEYS.ROLE,          role],
      [KEYS.USER_ID,       userId],
    ]);
  },

  async getAccess(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async getRefresh(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  async getRole(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ROLE);
  },

  async getUserId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.USER_ID);
  },

  async clear() {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
