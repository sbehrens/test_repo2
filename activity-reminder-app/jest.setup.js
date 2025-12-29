// jest.setup.js
// Note: @testing-library/react-native v12.4+ includes matchers by default

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  Link: 'Link',
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(),
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    })
  ),
}));

// Mock expo-speech-recognition
jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    requestPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
    getPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
    getStateAsync: jest.fn(() => Promise.resolve('inactive')),
    getSupportedLocales: jest.fn(() => Promise.resolve(['en-US'])),
    getDefaultLocale: jest.fn(() => Promise.resolve('en-US')),
    isRecognitionAvailable: jest.fn(() => Promise.resolve(true)),
  },
  useSpeechRecognitionEvent: jest.fn(),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
// Note: This mock may not be needed in all setups
if (typeof jest !== 'undefined') {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
    default: {
      API: {
        setUseNativeDriver: jest.fn(),
      },
    },
  }), { virtual: true });
}
