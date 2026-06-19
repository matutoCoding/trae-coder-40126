import {
  addMinutes,
  differenceInMinutes,
  format,
  isBefore,
  isAfter,
  isSameDay,
  parse,
  parseISO,
  setHours,
  setMinutes,
  startOfDay
} from 'date-fns';
import { TimeRange, WEEKDAY_KEYS, WorkSchedule } from './types';

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

export function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTimeString(timeStr);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function buildDateTime(date: Date, timeStr: string): Date {
  const { hours, minutes } = parseTimeString(timeStr);
  return setMinutes(setHours(startOfDay(date), hours), minutes);
}

export function formatDateTime(iso: string, pattern = 'yyyy-MM-dd HH:mm'): string {
  return format(parseISO(iso), pattern);
}

export function formatDate(iso: string | Date, pattern = 'yyyy-MM-dd'): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(d, pattern);
}

export function formatTimeOnly(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

export function getWeekdayKey(date: Date): (typeof WEEKDAY_KEYS)[number] {
  return WEEKDAY_KEYS[date.getDay()];
}

export function isTimeInRange(time: string, range: TimeRange): boolean {
  const t = timeToMinutes(time);
  const s = timeToMinutes(range.start);
  const e = timeToMinutes(range.end);
  return t >= s && t < e;
}

export function doTimeRangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const aS = timeToMinutes(a.start);
  const aE = timeToMinutes(a.end);
  const bS = timeToMinutes(b.start);
  const bE = timeToMinutes(b.end);
  return aS < bE && bS < aE;
}

export function doDateTimesOverlap(
  startA: string, endA: string,
  startB: string, endB: string
): boolean {
  const sA = parseISO(startA).getTime();
  const eA = parseISO(endA).getTime();
  const sB = parseISO(startB).getTime();
  const eB = parseISO(endB).getTime();
  return sA < eB && sB < eA;
}

export function intersectTimeRanges(a: TimeRange, b: TimeRange): TimeRange | null {
  const start = Math.max(timeToMinutes(a.start), timeToMinutes(b.start));
  const end = Math.min(timeToMinutes(a.end), timeToMinutes(b.end));
  if (start >= end) return null;
  return { start: minutesToTime(start), end: minutesToTime(end) };
}

export function getTrainerWorkRangesForDate(
  schedule: WorkSchedule,
  date: Date
): TimeRange[] {
  const dateStr = formatDate(date);
  const exception = schedule.exceptions?.find(e => e.date === dateStr);
  if (exception) {
    return exception.ranges ?? [];
  }
  const key = getWeekdayKey(date);
  return schedule[key] ?? [];
}

export function minutesBetween(startIso: string, endIso: string): number {
  return differenceInMinutes(parseISO(endIso), parseISO(startIso));
}

export function getTimeOfDateTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

export function buildDateTimeRange(date: Date, range: TimeRange): { startAt: Date; endAt: Date } {
  return {
    startAt: buildDateTime(date, range.start),
    endAt: buildDateTime(date, range.end),
  };
}

export function splitRangeByCutoffPoints(
  range: TimeRange,
  cutoffs: string[]
): TimeRange[] {
  const allPoints = Array.from(new Set([range.start, range.end, ...cutoffs]))
    .map(timeToMinutes)
    .sort((a, b) => a - b);

  const startMin = timeToMinutes(range.start);
  const endMin = timeToMinutes(range.end);
  const segments: TimeRange[] = [];

  for (let i = 0; i < allPoints.length - 1; i++) {
    const s = allPoints[i];
    const e = allPoints[i + 1];
    if (s >= startMin && e <= endMin && s < e) {
      segments.push({ start: minutesToTime(s), end: minutesToTime(e) });
    }
  }
  return segments;
}

export {
  addMinutes,
  differenceInMinutes,
  format,
  isBefore,
  isAfter,
  isSameDay,
  parse,
  parseISO,
  startOfDay
};
