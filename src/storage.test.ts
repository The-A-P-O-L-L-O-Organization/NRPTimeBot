import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadState, saveState } from './storage.js';

describe('storage', () => {
  const dataDir = join(__dirname, '..', 'data');
  const statePath = join(dataDir, 'state.json');

  beforeEach(() => {
    // Clean up actual state file for isolated tests
    if (existsSync(statePath)) {
      rmSync(statePath);
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (existsSync(statePath)) {
      rmSync(statePath);
    }
  });

  describe('loadState', () => {
    it("should return defaults when state file doesn't exist", () => {
      const state = loadState();
      expect(state.baseInGameYears).toBe(0);
      expect(state.rateYears).toBe(4);
      expect(state.paused).toBe(false);
      expect(state.lastAnnouncedYear).toBe(0);
      expect(typeof state.baseRealTimestamp).toBe('number');
      expect(state.baseRealTimestamp).toBeGreaterThan(0);
    });

    it('should load valid state from file', () => {
      const customState = {
        baseRealTimestamp: 1000000,
        baseInGameYears: 500,
        rateYears: 10,
        paused: true,
        pausedAtMs: 2000000,
        totalPausedMs: 500000,
        lastAnnouncedYear: 500,
      };
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(statePath, JSON.stringify(customState), 'utf-8');

      const state = loadState();
      expect(state.baseInGameYears).toBe(500);
      expect(state.rateYears).toBe(10);
      expect(state.paused).toBe(true);
    });

    it('should merge loaded state with defaults for missing fields', () => {
      const partialState = {
        baseRealTimestamp: 1000000,
        baseInGameYears: 500,
        rateYears: 10,
        paused: true,
      };
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(statePath, JSON.stringify(partialState), 'utf-8');

      const state = loadState();
      expect(state.baseInGameYears).toBe(500);
      expect(state.rateYears).toBe(10);
      expect(state.paused).toBe(true);
      expect(state.totalPausedMs).toBe(0);
      expect(state.pausedAtMs).toBe(0);
      expect(state.lastAnnouncedYear).toBe(0);
    });

    it('should return defaults when state file is invalid JSON', () => {
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(statePath, 'invalid json', 'utf-8');

      const state = loadState();
      expect(state.baseInGameYears).toBe(0);
      expect(state.rateYears).toBe(4);
    });

    it('should return defaults when state file has invalid structure', () => {
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(statePath, JSON.stringify({ invalid: 'structure' }), 'utf-8');

      const state = loadState();
      expect(state.baseInGameYears).toBe(0);
      expect(state.rateYears).toBe(4);
    });

    it('should handle null input in isValidState (internal)', () => {
      // Test the isValidState function's null check by calling loadState with null-like conditions
      // This is tested indirectly but we can verify the behavior
      // The isValidState function returns false for null, which triggers defaults
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(statePath, 'null', 'utf-8');

      const state = loadState();
      expect(state.baseInGameYears).toBe(0);
      expect(state.rateYears).toBe(4);
    });

    it('should create data directory when loading state and it does not exist', () => {
      // Ensure data directory doesn't exist
      if (existsSync(dataDir)) {
        rmSync(dataDir, { recursive: true, force: true });
      }
      // Also ensure state file doesn't exist
      if (existsSync(statePath)) {
        rmSync(statePath);
      }

      const state = loadState();
      expect(state.baseInGameYears).toBe(0);
      // The directory should be created by loadState
      expect(existsSync(dataDir)).toBe(true);
    });
  });

  describe('saveState', () => {
    it("should create data directory if it doesn't exist", () => {
      // Ensure data directory doesn't exist
      if (existsSync(dataDir)) {
        rmSync(dataDir, { recursive: true, force: true });
      }

      const state = {
        baseRealTimestamp: Date.now(),
        baseInGameYears: 100,
        rateYears: 4,
        paused: false,
        pausedAtMs: 0,
        totalPausedMs: 0,
        lastAnnouncedYear: 100,
      };

      // The function creates the directory automatically
      saveState(state);
      expect(existsSync(dataDir)).toBe(true);
    });

    it('should write valid JSON to state file', () => {
      const state = {
        baseRealTimestamp: 1000000,
        baseInGameYears: 500,
        rateYears: 10,
        paused: true,
        pausedAtMs: 2000000,
        totalPausedMs: 500000,
        lastAnnouncedYear: 500,
      };

      saveState(state);

      expect(existsSync(statePath)).toBe(true);

      const content = readFileSync(statePath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.baseInGameYears).toBe(500);
      expect(parsed.rateYears).toBe(10);
      expect(parsed.paused).toBe(true);
    });

    it('should format JSON with indentation', () => {
      const state = {
        baseRealTimestamp: 1000000,
        baseInGameYears: 100,
        rateYears: 4,
        paused: false,
        pausedAtMs: 0,
        totalPausedMs: 0,
        lastAnnouncedYear: 100,
      };

      saveState(state);

      const content = readFileSync(statePath, 'utf-8');
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });
  });
});
