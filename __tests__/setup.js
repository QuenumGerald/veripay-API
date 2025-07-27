// Setup file for Jest tests
process.env.NODE_ENV = 'test';

// Mock console methods to keep test output clean
const originalConsole = Object.assign({}, console);

beforeAll(() => {
  // Suppress console output during tests
  global.console = Object.assign({}, originalConsole, {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  });
});

afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});
