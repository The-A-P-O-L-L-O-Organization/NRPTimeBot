import { beforeEach, describe, expect, it } from 'vitest';
import type { BotState } from './storage.js';
import { calculateTime, formatTime } from './timekeeper.js';

describe('timekeeper', () => {
  const MS_PER_DAY = 86400000;
  let baseState: BotState;

  beforeEach(() => {
    baseState = {
      baseRealTimestamp: Date.now(),
      baseInGameYears: 100,
      rateYears: 4,
      paused: false,
      pausedAtMs: 0,
      totalPausedMs: 0,
      lastAnnouncedYear: 100,
    };
  });

  describe('calculateTime', () => {
    it('should return correct time at base timestamp', () => {
      const result = calculateTime(baseState, baseState.baseRealTimestamp);
      expect(result.totalYears).toBe(100);
      expect(result.date.year).toBe(100);
      expect(result.progress).toBe(0);
      expect(result.paused).toBe(false);
    });

    it('should progress time correctly after half a day', () => {
      // Use a rate that doesn't result in integer years for half day
      const testState: BotState = { ...baseState, rateYears: 3 };
      const halfDayMs = MS_PER_DAY / 2;
      const result = calculateTime(testState, testState.baseRealTimestamp + halfDayMs);
      // 100 + 3 * 0.5 = 101.5
      expect(result.totalYears).toBeCloseTo(101.5, 1);
      expect(result.progress).toBeCloseTo(0.5, 1);
    });

    it('should progress time correctly after a full day', () => {
      const result = calculateTime(baseState, baseState.baseRealTimestamp + MS_PER_DAY);
      expect(result.totalYears).toBe(104); // 100 + 4 * 1
      expect(result.progress).toBe(0);
      expect(result.date.year).toBe(104);
    });

    it('should handle paused state correctly', () => {
      const pausedState: BotState = {
        ...baseState,
        paused: true,
        pausedAtMs: baseState.baseRealTimestamp + MS_PER_DAY,
      };
      const result = calculateTime(pausedState, baseState.baseRealTimestamp + MS_PER_DAY * 2);
      // Time should be frozen at the pause point (1 day elapsed = 4 years)
      expect(result.totalYears).toBe(104);
      expect(result.paused).toBe(true);
    });

    it('should account for totalPausedMs', () => {
      const stateWithPause: BotState = {
        ...baseState,
        totalPausedMs: MS_PER_DAY, // 1 day worth of paused time
      };
      const result = calculateTime(stateWithPause, baseState.baseRealTimestamp + MS_PER_DAY * 2);
      // 2 days elapsed - 1 day paused = 1 day effective = 4 years
      expect(result.totalYears).toBe(104);
    });

    it('should handle different rates', () => {
      const fastState: BotState = { ...baseState, rateYears: 10 };
      const result = calculateTime(fastState, baseState.baseRealTimestamp + MS_PER_DAY);
      expect(result.totalYears).toBe(110); // 100 + 10 * 1
    });

    it('should handle rate of 0', () => {
      const zeroRateState: BotState = { ...baseState, rateYears: 0 };
      const result = calculateTime(zeroRateState, baseState.baseRealTimestamp + MS_PER_DAY * 10);
      expect(result.totalYears).toBe(100);
      expect(result.progress).toBe(0);
    });
  });

  describe('formatTime', () => {
    it('should format time result correctly', () => {
      const timeResult = {
        totalYears: 100.5,
        date: {
          year: 100,
          month: 7,
          monthName: 'July',
          day: 15,
          dayOfYear: 196,
          week: 28,
          totalDaysInYear: 365,
        },
        progress: 0.5,
        rateText: '4 years per day',
        paused: false,
        nextYearInMs: 43200000, // 12 hours
      };

      const formatted = formatTime(timeResult);
      expect(formatted).toContain('Year 100');
      expect(formatted).toContain('July');
      expect(formatted).toContain('Day: 15');
      expect(formatted).toContain('50.0%');
      expect(formatted).toContain('4 years per day');
      expect(formatted).toContain('Running');
    });

    it('should show paused status', () => {
      const timeResult = {
        totalYears: 100,
        date: {
          year: 100,
          month: 1,
          monthName: 'January',
          day: 1,
          dayOfYear: 1,
          week: 1,
          totalDaysInYear: 365,
        },
        progress: 0,
        rateText: '4 years per day',
        paused: true,
        nextYearInMs: 0,
      };

      const formatted = formatTime(timeResult);
      expect(formatted).toContain('Paused');
    });
  });

  describe('formatDuration', () => {
    // Testing the internal formatDuration function via formatTime
    it('should format days and hours', () => {
      const timeResult = {
        totalYears: 100,
        date: {
          year: 100,
          month: 1,
          monthName: 'January',
          day: 1,
          dayOfYear: 1,
          week: 1,
          totalDaysInYear: 365,
        },
        progress: 0,
        rateText: '4 years per day',
        paused: false,
        nextYearInMs: 90000000, // 1 day 1 hour
      };

      const formatted = formatTime(timeResult);
      expect(formatted).toContain('1d 1h');
    });

    it('should format hours and minutes', () => {
      const timeResult = {
        totalYears: 100,
        date: {
          year: 100,
          month: 1,
          monthName: 'January',
          day: 1,
          dayOfYear: 1,
          week: 1,
          totalDaysInYear: 365,
        },
        progress: 0,
        rateText: '4 years per day',
        paused: false,
        nextYearInMs: 3660000, // 1 hour 1 minute
      };

      const formatted = formatTime(timeResult);
      expect(formatted).toContain('1h 1m');
    });

    it('should format minutes and seconds', () => {
      const timeResult = {
        totalYears: 100,
        date: {
          year: 100,
          month: 1,
          monthName: 'January',
          day: 1,
          dayOfYear: 1,
          week: 1,
          totalDaysInYear: 365,
        },
        progress: 0,
        rateText: '4 years per day',
        paused: false,
        nextYearInMs: 61000, // 1 minute 1 second
      };

      const formatted = formatTime(timeResult);
      expect(formatted).toContain('1m 1s');
    });

    it('should format seconds only', () => {
      const timeResult = {
        totalYears: 100,
        date: {
          year: 100,
          month: 1,
          monthName: 'January',
          day: 1,
          dayOfYear: 1,
          week: 1,
          totalDaysInYear: 365,
        },
        progress: 0,
        rateText: '4 years per day',
        paused: false,
        nextYearInMs: 500, // 500ms = 0.5s -> 0s
      };

      const formatted = formatTime(timeResult);
      expect(formatted).toContain('0s');
    });
  });
});
