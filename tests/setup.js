// 테스트 환경 설정
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock DOM elements that AnnotateShot uses
global.document = {
  ...global.document,
  getElementById: jest.fn(() => ({
    value: '',
    style: { display: 'block' },
    addEventListener: jest.fn(),
  })),
};

// Mock browser APIs
global.window = {
  ...global.window,
  innerWidth: 1200,
  innerHeight: 800,
  devicePixelRatio: 1,
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
};