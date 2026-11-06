import { beforeEach, vi } from 'vitest';

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