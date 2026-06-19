import { BillingResult, BillingSegment, Booking, ConflictResult, RateTier, Trainer } from '../../shared/types.js';
import {
  buildDateTime,
  differenceInMinutes,
  doDateTimesOverlap,
  format,
  getTrainerWorkRangesForDate,
  intersectTimeRanges,
  isSameDay,
  minutesToTime,
  parseISO,
  splitRangeByCutoffPoints,
  timeToMinutes,
} from '../../shared/utils.js';
import { JsonRepository } from '../db/repository.js';

export class ConflictChecker {
  constructor(private bookingRepo: JsonRepository<Booking>) {}

  check(
    trainerId: string,
    startAt: string,
    endAt: string,
    excludeBookingId?: string
  ): ConflictResult {
    const start = parseISO(startAt);
    const end = parseISO(endAt);

    if (end.getTime() <= start.getTime()) {
      return {
        hasConflict: true,
        message: '结束时间必须晚于开始时间',
      };
    }

    const conflicting = this.bookingRepo.findAll(b => {
      if (b.trainerId !== trainerId) return false;
      if (b.status === 'cancelled') return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (!isSameDay(start, parseISO(b.startAt)) && !isSameDay(start, parseISO(b.endAt))) {
        return false;
      }
      return doDateTimesOverlap(startAt, endAt, b.startAt, b.endAt);
    });

    if (conflicting.length > 0) {
      const names = conflicting
        .map(b => `${format(parseISO(b.startAt), 'HH:mm')}-${format(parseISO(b.endAt), 'HH:mm')}(${b.petName})`)
        .join('、');
      return {
        hasConflict: true,
        conflictingBookings: conflicting,
        message: `该训练师时段已被预约：${names}`,
      };
    }
    return { hasConflict: false };
  }

  checkAgainstWorkSchedule(
    trainer: Trainer,
    startAt: string,
    endAt: string
  ): ConflictResult {
    const start = parseISO(startAt);
    const end = parseISO(endAt);
    const workRanges = getTrainerWorkRangesForDate(trainer.workSchedule, start);

    if (workRanges.length === 0) {
      return { hasConflict: true, message: '该训练师当日不上班' };
    }

    const startTime = format(start, 'HH:mm');
    const endTime = format(end, 'HH:mm');
    const bookingRange = { start: startTime, end: endTime };

    let covered: { start: string; end: string } | null = null;
    for (const wr of workRanges) {
      const inter = intersectTimeRanges(bookingRange, wr);
      if (inter && inter.start === bookingRange.start && inter.end === bookingRange.end) {
        covered = inter;
        break;
      }
    }

    if (!covered) {
      const hours = workRanges.map(r => `${r.start}-${r.end}`).join('、');
      return {
        hasConflict: true,
        message: `预约时段不在训练师工作时间内，可约时段：${hours}`,
      };
    }
    return { hasConflict: false };
  }

  checkComprehensive(
    trainer: Trainer,
    startAt: string,
    endAt: string,
    excludeBookingId?: string
  ): ConflictResult & { workRanges?: { start: string; end: string }[] } {
    const start = parseISO(startAt);
    const workRanges = getTrainerWorkRangesForDate(trainer.workSchedule, start);
    const workResult = this.checkAgainstWorkSchedule(trainer, startAt, endAt);
    const bookingResult = this.check(trainer.id, startAt, endAt, excludeBookingId);

    if (bookingResult.hasConflict) {
      return { ...bookingResult, workRanges };
    }
    if (workResult.hasConflict) {
      return { ...workResult, workRanges };
    }
    return { hasConflict: false, workRanges };
  }
}

export class SegmentedBillingService {
  constructor(private rateRepo: JsonRepository<RateTier>) {}

  private buildFallbackTier(): RateTier {
    return {
      id: 'fallback_default',
      name: '标准费率',
      color: '#F97316',
      multiplier: 1.0,
      timeRanges: [{ start: '00:00', end: '24:00' }],
      applicableWeekdays: [],
      priority: 0,
      description: '系统默认费率（配置不完整时自动降级）',
    };
  }

  calculate(
    baseHourlyRate: number,
    startAt: string,
    endAt: string
  ): BillingResult {
    const start = parseISO(startAt);
    const end = parseISO(endAt);
    const totalMinutes = Math.max(0, differenceInMinutes(end, start));
    if (totalMinutes === 0) {
      return { segments: [], totalMinutes: 0, totalAmount: 0, baseRate: baseHourlyRate };
    }

    let allTiers = this.rateRepo
      .findAll()
      .sort((a, b) => b.priority - a.priority);

    if (allTiers.length === 0) {
      allTiers = [this.buildFallbackTier()];
    }

    const defaultTier = allTiers.find(t => t.priority === 0) ?? allTiers[allTiers.length - 1] ?? this.buildFallbackTier();

    const daySplits: Array<{ day: Date; dayStart: Date; dayEnd: Date }> = [];
    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= endDay) {
      const next = new Date(cursor);
      next.setDate(next.getDate() + 1);
      const ds = cursor < start ? start : cursor;
      const de = next > end ? end : next;
      daySplits.push({ day: new Date(cursor), dayStart: ds, dayEnd: de });
      cursor = next;
    }

    const segments: BillingSegment[] = [];

    for (const { day, dayStart, dayEnd } of daySplits) {
      const weekday = day.getDay();
      const applicableTiers = allTiers.filter(t =>
        t.applicableWeekdays.length === 0 || t.applicableWeekdays.includes(weekday)
      );

      const tStart = format(dayStart, 'HH:mm');
      const tEnd = format(dayEnd, 'HH:mm');
      const bookingRange = { start: tStart, end: tEnd };

      const cutoffPoints: string[] = ['00:00'];
      for (const tier of applicableTiers) {
        for (const tr of tier.timeRanges) {
          cutoffPoints.push(tr.start, tr.end);
        }
      }
      cutoffPoints.push('24:00');

      const subRanges = splitRangeByCutoffPoints(bookingRange, cutoffPoints);
      if (subRanges.length === 0) {
        subRanges.push(bookingRange);
      }

      for (const sub of subRanges) {
        let matchedTier: RateTier | undefined;
        for (const tier of applicableTiers) {
          for (const tr of tier.timeRanges) {
            const inter = intersectTimeRanges(sub, tr);
            if (inter &&
              timeToMinutes(inter.start) === timeToMinutes(sub.start) &&
              timeToMinutes(inter.end) === timeToMinutes(sub.end)) {
              if (!matchedTier || tier.priority > matchedTier.priority) {
                matchedTier = tier;
              }
            }
          }
        }
        if (!matchedTier) matchedTier = defaultTier;

        const duration = Math.max(
          1,
          timeToMinutes(sub.end) - timeToMinutes(sub.start)
        );
        const unitPrice = Math.round((baseHourlyRate * matchedTier.multiplier) / 60 * 100) / 100;
        const subtotal = Math.round(unitPrice * duration * 100) / 100;

        segments.push({
          startTime: sub.start,
          endTime: sub.end,
          durationMinutes: duration,
          tierId: matchedTier.id,
          tierName: matchedTier.name,
          tierColor: matchedTier.color,
          unitPrice,
          subtotal,
        });
      }
    }

    const totalAmount = Math.round(segments.reduce((s, x) => s + x.subtotal, 0) * 100) / 100;

    return {
      segments,
      totalMinutes,
      totalAmount,
      baseRate: baseHourlyRate,
    };
  }
}
