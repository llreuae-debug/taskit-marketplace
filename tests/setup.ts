// Mock react-native-url-polyfill in Node test environment
jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  I18nManager: {
    isRTL: false,
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
  },
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
  },
}));

const memoryStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => memoryStore[key] ?? null),
  setItem: jest.fn(async (key: string, val: string) => {
    memoryStore[key] = val;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete memoryStore[key];
  }),
}));
