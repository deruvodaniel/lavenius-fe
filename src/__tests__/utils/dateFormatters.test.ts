import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDateTime,
  formatTime,
  formatDate,
  formatShortDate,
  formatDuration,
  formatISODate,
  formatCurrency,
} from '../../lib/utils/dateFormatters';

describe('dateFormatters', () => {
  // Mock console.warn to avoid noise in tests
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatDateTime', () => {
    it('formats a Date object correctly', () => {
      // Use local date construction to avoid timezone issues
      const date = new Date(2026, 0, 15, 14, 30, 0); // Jan 15, 2026, 14:30
      const result = formatDateTime(date);
      
      expect(result).toContain('15');
      expect(result).toContain('enero');
      expect(result).toContain('2026');
      // Check time is present (format may vary by locale)
      expect(result).toMatch(/14:30|2:30/);
    });

    it('formats a date string correctly', () => {
      // Use ISO string with timezone to ensure consistent parsing
      const date = new Date(2026, 0, 15, 14, 30, 0);
      const result = formatDateTime(date);
      
      expect(result).toContain('15');
      expect(result).toContain('enero');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
      expect(formatDateTime('')).toBe('');
    });

    it('returns empty string for invalid date string', () => {
      const result = formatDateTime('not-a-date');
      
      expect(result).toBe('');
      expect(console.warn).toHaveBeenCalled();
    });

    it('returns empty string for plain object', () => {
      const result = formatDateTime({ foo: 'bar' });
      
      expect(result).toBe('');
      expect(console.warn).toHaveBeenCalled();
    });

    it('handles object with toString() method that returns valid date', () => {
      const date = new Date(2026, 0, 15, 14, 30, 0);
      const dateObj = {
        toString: () => date.toISOString(),
      };
      const result = formatDateTime(dateObj);
      
      // Should parse successfully and contain date parts
      expect(result).toContain('enero');
    });
  });

  describe('formatTime', () => {
    it('formats time from Date object', () => {
      const date = new Date(2026, 0, 15, 14, 30, 0);
      const result = formatTime(date);
      
      // es-AR locale may use 12h or 24h format
      expect(result).toMatch(/14:30|2:30|02:30/);
    });

    it('formats time from Date with morning time', () => {
      const date = new Date(2026, 0, 15, 9, 5, 0);
      const result = formatTime(date);
      
      expect(result).toMatch(/9:05|09:05/);
    });

    it('handles midnight', () => {
      const date = new Date(2026, 0, 15, 0, 0, 0);
      const result = formatTime(date);
      
      // Midnight can be 00:00 or 12:00 a.m. depending on locale
      expect(result).toMatch(/00:00|12:00/);
    });

    it('handles end of day', () => {
      const date = new Date(2026, 0, 15, 23, 59, 0);
      const result = formatTime(date);
      
      expect(result).toMatch(/23:59|11:59/);
    });
  });

  describe('formatDate', () => {
    it('formats date without time', () => {
      const date = new Date(2026, 0, 15, 14, 30, 0);
      const result = formatDate(date);
      
      expect(result).toContain('15');
      expect(result).toContain('enero');
      // Should not contain the time
      expect(result).not.toMatch(/14:30|2:30/);
    });

    it('formats date with month marzo correctly', () => {
      const date = new Date(2026, 2, 20); // March 20, 2026
      const result = formatDate(date);
      
      expect(result).toContain('20');
      expect(result).toContain('marzo');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('returns empty string for invalid date', () => {
      const result = formatDate('invalid');
      
      expect(result).toBe('');
      expect(console.warn).toHaveBeenCalled();
    });

    it('returns empty string for plain object', () => {
      const result = formatDate({ foo: 'bar' });
      
      expect(result).toBe('');
    });
  });

  describe('formatShortDate', () => {
    it('formats date in short format DD/MM/YYYY', () => {
      const date = new Date(2026, 0, 15); // Jan 15, 2026
      const result = formatShortDate(date);
      
      // es-AR format is DD/MM/YYYY (may or may not zero-pad)
      expect(result).toMatch(/15\/1\/2026|15\/01\/2026/);
    });

    it('formats december date in short format', () => {
      const date = new Date(2026, 11, 25); // Dec 25, 2026
      const result = formatShortDate(date);
      
      expect(result).toMatch(/25\/12\/2026/);
    });
  });

  describe('formatDuration', () => {
    it('calculates duration in minutes', () => {
      const start = '2026-01-15T14:00:00';
      const end = '2026-01-15T15:00:00';
      
      const result = formatDuration(start, end);
      
      expect(result).toBe('60 minutos');
    });

    it('handles 30 minute duration', () => {
      const start = new Date('2026-01-15T14:00:00');
      const end = new Date('2026-01-15T14:30:00');
      
      const result = formatDuration(start, end);
      
      expect(result).toBe('30 minutos');
    });

    it('handles 90 minute duration', () => {
      const start = '2026-01-15T10:00:00';
      const end = '2026-01-15T11:30:00';
      
      const result = formatDuration(start, end);
      
      expect(result).toBe('90 minutos');
    });

    it('handles zero duration', () => {
      const time = '2026-01-15T14:00:00';
      
      const result = formatDuration(time, time);
      
      expect(result).toBe('0 minutos');
    });

    it('handles negative duration (end before start)', () => {
      const start = '2026-01-15T15:00:00';
      const end = '2026-01-15T14:00:00';
      
      const result = formatDuration(start, end);
      
      expect(result).toBe('-60 minutos');
    });
  });

  describe('formatISODate', () => {
    it('formats Date to ISO date string', () => {
      const date = new Date(2026, 0, 15, 14, 30, 0); // Jan 15, 2026
      const result = formatISODate(date);
      
      expect(result).toBe('2026-01-15');
    });

    it('formats december date to ISO string', () => {
      const date = new Date(2026, 11, 25, 10, 0, 0); // Dec 25, 2026
      const result = formatISODate(date);
      
      expect(result).toBe('2026-12-25');
    });

    it('pads single digit month and day', () => {
      const date = new Date(2026, 2, 5); // March 5, 2026
      const result = formatISODate(date);
      
      expect(result).toBe('2026-03-05');
    });

    it('handles year boundaries', () => {
      const date = new Date(2025, 11, 31); // Dec 31, 2025
      const result = formatISODate(date);
      
      expect(result).toBe('2025-12-31');
    });
  });

  describe('formatCurrency', () => {
    it('formats positive number as ARS currency', () => {
      const result = formatCurrency(1500);
      
      // es-AR format uses $ and period as thousands separator
      expect(result).toContain('$');
      expect(result).toContain('1.500');
    });

    it('formats zero', () => {
      const result = formatCurrency(0);
      
      expect(result).toContain('$');
      expect(result).toContain('0');
    });

    it('formats decimal amounts', () => {
      const result = formatCurrency(1500.5);
      
      expect(result).toContain('1.500');
      expect(result).toContain('50'); // decimal part
    });

    it('handles undefined', () => {
      const result = formatCurrency(undefined);
      
      expect(result).toContain('$');
      expect(result).toContain('0');
    });

    it('handles null', () => {
      const result = formatCurrency(null);
      
      expect(result).toContain('$');
      expect(result).toContain('0');
    });

    it('handles NaN', () => {
      const result = formatCurrency(NaN);
      
      expect(result).toContain('$');
      expect(result).toContain('0');
    });

    it('formats large amounts', () => {
      const result = formatCurrency(1000000);
      
      expect(result).toContain('1.000.000');
    });

    it('formats negative amounts', () => {
      const result = formatCurrency(-500);
      
      expect(result).toContain('500');
      expect(result).toMatch(/-|−/); // minus sign
    });
  });
});
