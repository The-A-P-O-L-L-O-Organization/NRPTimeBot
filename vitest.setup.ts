import { beforeEach, vi } from "vitest";

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  vi.resetAllMocks();
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.info = vi.fn();
  console.debug = vi.fn();
});

// Restore console after all tests
// (handled by vitest automatically with vi.restoreAllMocks())