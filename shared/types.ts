export interface TimeRange {
  start: string;
  end: string;
}

export interface WorkSchedule {
  monday?: TimeRange[];
  tuesday?: TimeRange[];
  wednesday?: TimeRange[];
  thursday?: TimeRange[];
  friday?: TimeRange[];
  saturday?: TimeRange[];
  sunday?: TimeRange[];
  exceptions?: { date: string; ranges: TimeRange[] | null }[];
}

export interface Trainer {
  id: string;
  name: string;
  avatar?: string;
  specialties: string[];
  experienceYears: number;
  baseHourlyRate: number;
  status: 'active' | 'inactive';
  workSchedule: WorkSchedule;
}

export interface Booking {
  id: string;
  trainerId: string;
  ownerName: string;
  ownerPhone?: string;
  petName: string;
  petType: 'dog' | 'cat' | 'other';
  petBreed?: string;
  startAt: string;
  endAt: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  cancelledAt?: string;
  billId?: string;
  courseType?: string;
}

export interface RateTier {
  id: string;
  name: string;
  color: string;
  multiplier: number;
  timeRanges: TimeRange[];
  applicableWeekdays: number[];
  priority: number;
  description?: string;
}

export interface BillingSegment {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  tierId: string;
  tierName: string;
  tierColor: string;
  unitPrice: number;
  subtotal: number;
}

export interface BillingResult {
  segments: BillingSegment[];
  totalMinutes: number;
  totalAmount: number;
  baseRate: number;
}

export interface Bill {
  id: string;
  bookingId: string;
  trainerId: string;
  segments: BillingSegment[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
  ownerName: string;
  petName: string;
  coursePeriod: string;
}

export interface Assessment {
  id: string;
  bookingId: string;
  trainerId: string;
  petName: string;
  score: number;
  tags: string[];
  notes: string;
  recommendations: string;
  createdAt: string;
  trainerName?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingBookings?: Booking[];
  message?: string;
  workRanges?: { start: string; end: string }[];
}

export type WeekdayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const WEEKDAY_KEYS: WeekdayKey[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];
