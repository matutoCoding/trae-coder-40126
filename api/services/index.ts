import { Assessment, Bill, Booking, RateTier, Trainer } from '../../shared/types.js';
import { generateId } from '../../shared/utils.js';
import {
  MOCK_ASSESSMENTS,
  MOCK_BILLS,
  MOCK_BOOKINGS,
  MOCK_RATE_TIERS,
  MOCK_TRAINERS,
} from '../db/mockData.js';
import { JsonRepository } from '../db/repository.js';
import { ConflictChecker, SegmentedBillingService } from './core.js';

export const trainerRepo = new JsonRepository<Trainer>('trainers.json', MOCK_TRAINERS);
export const bookingRepo = new JsonRepository<Booking>('bookings.json', MOCK_BOOKINGS);
export const rateRepo = new JsonRepository<RateTier>('rates.json', MOCK_RATE_TIERS);
export const billRepo = new JsonRepository<Bill>('bills.json', MOCK_BILLS);
export const assessmentRepo = new JsonRepository<Assessment>('assessments.json', MOCK_ASSESSMENTS);

export const conflictChecker = new ConflictChecker(bookingRepo);
export const billingService = new SegmentedBillingService(rateRepo);

export class TrainerService {
  list(status?: string) {
    if (status) return trainerRepo.findAll(t => t.status === status);
    return trainerRepo.findAll();
  }

  get(id: string) {
    return trainerRepo.findById(id);
  }

  create(payload: Omit<Trainer, 'id'>) {
    const trainer: Trainer = { ...payload, id: generateId('trainer') };
    return trainerRepo.create(trainer);
  }

  update(id: string, payload: Partial<Trainer>) {
    return trainerRepo.update(id, t => ({ ...t, ...payload }));
  }

  remove(id: string) {
    return trainerRepo.update(id, t => ({ ...t, status: 'inactive' }));
  }
}

export class BookingService {
  list(filters?: { trainerId?: string; status?: string; ownerName?: string; date?: string }) {
    return bookingRepo.findAll(b => {
      if (filters?.trainerId && b.trainerId !== filters.trainerId) return false;
      if (filters?.status && b.status !== filters.status) return false;
      if (filters?.ownerName && !b.ownerName.includes(filters.ownerName)) return false;
      if (filters?.date) {
        const d = filters.date;
        if (!b.startAt.startsWith(d) && !b.endAt.startsWith(d)) return false;
      }
      return true;
    }).sort((a, b) => a.startAt.localeCompare(b.startAt));
  }

  get(id: string) {
    return bookingRepo.findById(id);
  }

  checkConflict(
    trainerId: string,
    startAt: string,
    endAt: string,
    excludeBookingId?: string
  ) {
    return conflictChecker.check(trainerId, startAt, endAt, excludeBookingId);
  }

  create(payload: Omit<Booking, 'id' | 'createdAt' | 'status'>) {
    const trainer = trainerRepo.findById(payload.trainerId);
    if (!trainer) {
      throw new Error('训练师不存在');
    }

    const scheduleConflict = conflictChecker.checkAgainstWorkSchedule(
      trainer,
      payload.startAt,
      payload.endAt
    );
    if (scheduleConflict.hasConflict) {
      throw new Error(scheduleConflict.message);
    }

    const conflict = conflictChecker.check(payload.trainerId, payload.startAt, payload.endAt);
    if (conflict.hasConflict) {
      throw new Error(conflict.message ?? '时段冲突');
    }

    const billing = billingService.calculate(trainer.baseHourlyRate, payload.startAt, payload.endAt);

    const booking: Booking = {
      ...payload,
      id: generateId('booking'),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const start = new Date(payload.startAt);
    const end = new Date(payload.endAt);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const bill: Bill = {
      id: generateId('bill'),
      bookingId: booking.id,
      trainerId: booking.trainerId,
      segments: billing.segments,
      totalAmount: billing.totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ownerName: booking.ownerName,
      petName: booking.petName,
      coursePeriod: `${start.getMonth() + 1}/${start.getDate()} ${pad(start.getHours())}:${pad(start.getMinutes())}-${pad(end.getHours())}:${pad(end.getMinutes())}`,
    };

    booking.billId = bill.id;
    bookingRepo.create(booking);
    billRepo.create(bill);

    return { booking, bill, billing };
  }

  cancel(id: string) {
    const booking = bookingRepo.findById(id);
    if (!booking) throw new Error('预约不存在');
    if (booking.status === 'cancelled') throw new Error('预约已退订');

    const updated = bookingRepo.update(id, b => ({
      ...b,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    }));

    if (booking.billId) {
      billRepo.update(booking.billId, b => ({ ...b, status: 'cancelled' }));
    }

    return updated;
  }

  complete(id: string) {
    return bookingRepo.update(id, b => ({ ...b, status: 'completed' }));
  }
}

export class RateService {
  list() {
    return rateRepo.findAll().sort((a, b) => a.priority - b.priority);
  }

  bulkUpdate(tiers: RateTier[]) {
    rateRepo.bulkReplace(tiers);
    return this.list();
  }

  calculatePreview(trainerId: string, startAt: string, endAt: string) {
    const trainer = trainerRepo.findById(trainerId);
    if (!trainer) throw new Error('训练师不存在');
    return billingService.calculate(trainer.baseHourlyRate, startAt, endAt);
  }
}

export class BillService {
  list(filters?: { status?: string; trainerId?: string }) {
    return billRepo.findAll(b => {
      if (filters?.status && b.status !== filters.status) return false;
      if (filters?.trainerId && b.trainerId !== filters.trainerId) return false;
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string) {
    return billRepo.findById(id);
  }

  pay(id: string) {
    return billRepo.update(id, b => ({
      ...b,
      status: 'paid',
      paidAt: new Date().toISOString(),
    }));
  }

  stats() {
    const bills = billRepo.findAll(b => b.status !== 'cancelled');
    const totalRevenue = bills.reduce((s, b) => s + b.totalAmount, 0);
    const paid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.totalAmount, 0);
    const pending = bills.filter(b => b.status === 'pending').reduce((s, b) => s + b.totalAmount, 0);
    return {
      totalCount: bills.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      pending: Math.round(pending * 100) / 100,
    };
  }
}

export class AssessmentService {
  list() {
    return assessmentRepo.findAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string) {
    return assessmentRepo.findById(id);
  }

  create(payload: Omit<Assessment, 'id' | 'createdAt'>) {
    const trainer = trainerRepo.findById(payload.trainerId);
    const item: Assessment = {
      ...payload,
      id: generateId('assess'),
      createdAt: new Date().toISOString(),
      trainerName: trainer?.name,
    };
    return assessmentRepo.create(item);
  }
}
