import { describe, expect, it } from 'vitest';
import { daysInYear, isLeapYear, totalYearsToDate } from './calendar.js';

describe('calendar', () => {
  describe('isLeapYear', () => {
    it('should return true for years divisible by 400', () => {
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2400)).toBe(true);
    });

    it('should return false for years divisible by 100 but not 400', () => {
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
    });

    it('should return true for years divisible by 4 but not 100', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2004)).toBe(true);
    });

    it('should return false for years not divisible by 4', () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2022)).toBe(false);
      expect(isLeapYear(2021)).toBe(false);
    });

    it('should handle year 0', () => {
      expect(isLeapYear(0)).toBe(true); // 0 % 400 === 0
    });

    it('should handle negative years', () => {
      expect(isLeapYear(-4)).toBe(true);
      expect(isLeapYear(-100)).toBe(false);
      expect(isLeapYear(-400)).toBe(true);
    });
  });

  describe('daysInYear', () => {
    it('should return 366 for leap years', () => {
      expect(daysInYear(2024)).toBe(366);
      expect(daysInYear(2000)).toBe(366);
    });

    it('should return 365 for non-leap years', () => {
      expect(daysInYear(2023)).toBe(365);
      expect(daysInYear(1900)).toBe(365);
    });
  });

  describe('totalYearsToDate', () => {
    it('should convert exact year to January 1', () => {
      const date = totalYearsToDate(100);
      expect(date.year).toBe(100);
      expect(date.month).toBe(1);
      expect(date.monthName).toBe('January');
      expect(date.day).toBe(1);
      expect(date.dayOfYear).toBe(1);
      expect(date.week).toBe(1);
    });

    it('should handle mid-year correctly (non-leap year)', () => {
      // 100.5 = halfway through year 100 (non-leap, 365 days)
      const date = totalYearsToDate(100.5);
      expect(date.year).toBe(100);
      expect(date.dayOfYear).toBe(183); // Half of 365 = 182.5, floor + 1 = 183
    });

    it('should handle mid-year correctly (leap year)', () => {
      // Year 104 is a leap year (divisible by 4, not 100)
      const date = totalYearsToDate(104.5);
      expect(date.year).toBe(104);
      expect(date.dayOfYear).toBe(184); // Half of 366 = 183, floor + 1 = 184
    });

    it('should handle end of year correctly', () => {
      const date = totalYearsToDate(100.999);
      expect(date.year).toBe(100);
      expect(date.month).toBe(12);
      expect(date.day).toBe(31);
      expect(date.dayOfYear).toBe(365);
    });

    it('should handle leap year end correctly', () => {
      const date = totalYearsToDate(104.999);
      expect(date.year).toBe(104);
      expect(date.month).toBe(12);
      expect(date.day).toBe(31);
      expect(date.dayOfYear).toBe(366);
    });

    it('should calculate month correctly for various days', () => {
      // Use epsilon to avoid floating point precision issues
      const epsilon = 1e-10;

      // January 31
      let date = totalYearsToDate(100 + (30 + epsilon) / 365);
      expect(date.month).toBe(1);
      expect(date.day).toBe(31);

      // February 1
      date = totalYearsToDate(100 + (31 + epsilon) / 365);
      expect(date.month).toBe(2);
      expect(date.day).toBe(1);

      // December 31
      date = totalYearsToDate(100 + (364 + epsilon) / 365);
      expect(date.month).toBe(12);
      expect(date.day).toBe(31);
    });

    it('should calculate week correctly', () => {
      // Day 1 = week 1
      let date = totalYearsToDate(100);
      expect(date.week).toBe(1);

      // Day 7 = week 1
      date = totalYearsToDate(100 + 6 / 365);
      expect(date.week).toBe(1);

      // Day 8 = week 2
      date = totalYearsToDate(100 + 7 / 365);
      expect(date.week).toBe(2);
    });

    it('should include correct totalDaysInYear', () => {
      const nonLeap = totalYearsToDate(100);
      expect(nonLeap.totalDaysInYear).toBe(365);

      const leap = totalYearsToDate(104);
      expect(leap.totalDaysInYear).toBe(366);
    });

    it('should have correct month names', () => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      // Use a small epsilon to avoid floating point precision issues at month boundaries
      const epsilon = 1e-10;
      const daysBefore = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      for (let i = 0; i < daysBefore.length; i++) {
        // First day of each month
        const daysOffset = daysBefore[i];
        if (daysOffset === undefined) {
          continue;
        }
        const date = totalYearsToDate(100 + (daysOffset + epsilon) / 365);
        expect(date.month).toBe(i + 1);
        const expectedMonth = months[i];
        if (expectedMonth !== undefined) {
          expect(date.monthName).toBe(expectedMonth);
        }
      }
    });
  });
});
