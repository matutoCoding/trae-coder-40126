import { Router } from 'express';
import { TrainerService, BookingService, RateService, BillService, AssessmentService, billRepo } from '../services/index.js';

const router = Router();

const ok = (res: any, data: any) => res.json({ success: true, data });
const fail = (res: any, message: string, status = 400) => res.status(status).json({ success: false, message });

const trainerService = new TrainerService();
const bookingService = new BookingService();
const rateService = new RateService();
const billService = new BillService();
const assessmentService = new AssessmentService();

router.get('/health', (_, res) => res.json({ ok: true }));

router.get('/trainers', (req, res) => {
  const status = req.query.status as string | undefined;
  ok(res, trainerService.list(status));
});

router.get('/trainers/:id', (req, res) => {
  const trainer = trainerService.get(req.params.id);
  if (!trainer) return ok(res, trainer);
  return fail(res, '训练师不存在', 404);
});

router.post('/trainers', (req, res) => {
  try {
    const trainer = trainerService.create(req.body);
    return ok(res, trainer);
  } catch (e: any) {
    return fail(res, e.message);
  }
});

router.put('/trainers/:id', (req, res) => {
  const trainer = trainerService.update(req.params.id, req.body);
  if (!trainer) return ok(res, trainer);
  return fail(res, '训练师不存在', 404);
});

router.delete('/trainers/:id', (req, res) => {
  trainerService.remove(req.params.id);
  return ok(res, { id: req.params.id });
});

router.get('/bookings', (req, res) => {
  const list = bookingService.list({
    trainerId: req.query.trainerId as string | undefined,
    status: req.query.status as string | undefined,
    ownerName: req.query.ownerName as string | undefined,
    date: req.query.date as string | undefined,
  });
  return ok(res, list);
});

router.post('/bookings/check-conflict', (req, res) => {
  const { trainerId, startAt, endAt, excludeBookingId } = req.body;
  if (!trainerId || !startAt || !endAt) {
    return fail(res, '缺少必要参数');
  }
  return ok(res, bookingService.checkConflict(trainerId, startAt, endAt, excludeBookingId));
});

router.post('/bookings', (req, res) => {
  try {
    const result = bookingService.create(req.body);
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message);
  }
});

router.post('/bookings/:id/cancel', (req, res) => {
  try {
    const result = bookingService.cancel(req.params.id);
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message);
  }
});

router.post('/bookings/:id/complete', (req, res) => {
  const result = bookingService.complete(req.params.id);
  if (!result) return fail(res, '预约不存在', 404);
  return ok(res, result);
});

router.get('/rates', (_, res) => ok(res, rateService.list()));

router.put('/rates', (req, res) => {
  try {
    return ok(res, rateService.bulkUpdate(req.body));
  } catch (e: any) {
    return fail(res, e.message);
  }
});

router.post('/billing/calculate', (req, res) => {
  try {
    const { trainerId, startAt, endAt } = req.body;
    const result = rateService.calculatePreview(trainerId, startAt, endAt);
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message);
  }
});

router.get('/bills', (req, res) => {
  const list = billService.list({
    status: req.query.status as string | undefined,
    trainerId: req.query.trainerId as string | undefined,
  });
  return ok(res, list);
});

router.get('/bills/stats', (_, res) => ok(res, billService.stats()));

router.get('/bills/:id', (req, res) => {
  const bill = billService.get(req.params.id);
  if (!bill) return fail(res, '账单不存在', 404);
  const booking = bookingService.get(bill.bookingId);
  const trainer = trainerService.get(bill.trainerId);
  return ok(res, { bill, booking, trainer });
});

router.post('/bills/:id/pay', (req, res) => {
  const result = billService.pay(req.params.id);
  if (!result) return fail(res, '账单不存在', 404);
  return ok(res, result);
});

router.get('/assessments', (_, res) => {
  const list = assessmentService.list();
  const trainers = new Map(trainerService.list().map(t => [t.id, t.name]));
  const enriched = list.map(a => ({
    ...a,
    trainerName: a.trainerName ?? trainers.get(a.trainerId),
  }));
  return ok(res, enriched);
});

router.post('/assessments', (req, res) => {
  try {
    const result = assessmentService.create(req.body);
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message);
  }
});

router.get('/dashboard/summary', (_, res) => {
  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const trainers = trainerService.list('active');
  const bookings = bookingService.list({ date: todayStr });
  const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const cancelled = bookings.filter(b => b.status === 'cancelled');
  const completed = bookings.filter(b => b.status === 'completed');
  const billStats = billService.stats();
  const assessments = assessmentService.list();
  const thisMonth = assessments.filter(a => {
    const d = new Date(a.createdAt);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  return ok(res, {
    activeTrainerCount: trainers.length,
    todayBookingCount: confirmed.length,
    todayCancelledCount: cancelled.length,
    todayCompletedCount: completed.length,
    revenue: billStats,
    assessmentCountThisMonth: thisMonth.length,
    recentBookings: bookings.slice(0, 8),
    recentAssessments: assessments.slice(0, 5),
  });
});

export default router;
