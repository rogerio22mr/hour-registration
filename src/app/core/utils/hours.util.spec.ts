import { formatHoursColon, parseHoursColon } from './hours.util';

describe('formatHoursColon', () => {
  it('formats decimal hours as signed h:mm', () => {
    expect(formatHoursColon(2.25)).toBe('2:15');
    expect(formatHoursColon(1.5)).toBe('1:30');
    expect(formatHoursColon(3)).toBe('3:00');
    expect(formatHoursColon(0)).toBe('0:00');
    expect(formatHoursColon(-1.75)).toBe('-1:45');
  });

  it('rounds to the nearest minute', () => {
    expect(formatHoursColon(1 / 3)).toBe('0:20');
  });
});

describe('parseHoursColon', () => {
  it('parses h:mm and bare hours into decimal hours', () => {
    expect(parseHoursColon('2:15')).toBe(2.25);
    expect(parseHoursColon('-1:45')).toBe(-1.75);
    expect(parseHoursColon('0:30')).toBe(0.5);
    expect(parseHoursColon('3')).toBe(3);
    expect(parseHoursColon('  2:05  ')).toBeCloseTo(2 + 5 / 60, 10);
  });

  it('returns null for invalid input', () => {
    expect(parseHoursColon('')).toBeNull();
    expect(parseHoursColon('abc')).toBeNull();
    expect(parseHoursColon('2:60')).toBeNull();
    expect(parseHoursColon('1:5:5')).toBeNull();
    expect(parseHoursColon(':30')).toBeNull();
  });

  it('round-trips with formatHoursColon', () => {
    for (const v of [0, 0.5, 2.25, -1.75, 8]) {
      expect(parseHoursColon(formatHoursColon(v))).toBeCloseTo(v, 10);
    }
  });
});
