import { create } from 'zustand';
import { Trainer, Booking, Bill, RateTier, Assessment, BillingResult, ConflictResult } from '@shared/types';
import { http } from '@/utils/http';

interface AppState {
  trainers: Trainer[];
  bookings: Booking[];
  bills: Bill[];
  rates: RateTier[];
  assessments: Assessment[];
  loading: Partial<Record<string, boolean>>;

  fetchAll: () => Promise<void>;
  fetchTrainers: () => Promise<void>;
  fetchBookings: (filters?: any) => Promise<void>;
  fetchBills: (filters?: any) => Promise<void>;
  fetchRates: () => Promise<void>;
  fetchAssessments: () => Promise<void>;

  createTrainer: (p: any) => Promise<{ success: boolean; data?: Trainer; message?: string }>;
  updateTrainer: (id: string, p: any) => Promise<boolean>;
  deactivateTrainer: (id: string) => Promise<boolean>;

  createBooking: (p: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  cancelBooking: (id: string) => Promise<boolean>;
  completeBooking: (id: string) => Promise<boolean>;
  checkConflict: (p: any) => Promise<ConflictResult | null>;

  previewBilling: (p: any) => Promise<BillingResult | null>;
  saveRates: (tiers: RateTier[]) => Promise<boolean>;

  payBill: (id: string) => Promise<boolean>;

  createAssessment: (p: any) => Promise<Assessment | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  trainers: [],
  bookings: [],
  bills: [],
  rates: [],
  assessments: [],
  loading: {},

  setLoading: (key: string, v: boolean) => set(s => ({ loading: { ...s.loading, [key]: v } })),

  fetchAll: async () => {
    await Promise.all([
      get().fetchTrainers(),
      get().fetchBookings(),
      get().fetchBills(),
      get().fetchRates(),
      get().fetchAssessments(),
    ]);
  },

  fetchTrainers: async () => {
    const res = await http.get<Trainer[]>('/trainers');
    if (res.success && res.data) set({ trainers: res.data });
  },

  fetchBookings: async (filters) => {
    const res = await http.get<Booking[]>('/bookings', filters);
    if (res.success && res.data) set({ bookings: res.data });
  },

  fetchBills: async (filters) => {
    const res = await http.get<Bill[]>('/bills', filters);
    if (res.success && res.data) set({ bills: res.data });
  },

  fetchRates: async () => {
    const res = await http.get<RateTier[]>('/rates');
    if (res.success && res.data) set({ rates: res.data });
  },

  fetchAssessments: async () => {
    const res = await http.get<Assessment[]>('/assessments');
    if (res.success && res.data) set({ assessments: res.data });
  },

  createTrainer: async (p) => {
    const res = await http.post<Trainer>('/trainers', p);
    if (res.success && res.data) {
      set(s => ({ trainers: [...s.trainers, res.data!] }));
      return { success: true, data: res.data };
    }
    return { success: false, message: res.message };
  },

  updateTrainer: async (id, p) => {
    const res = await http.put<Trainer>(`/trainers/${id}`, p);
    if (res.success && res.data) {
      set(s => ({ trainers: s.trainers.map(t => t.id === id ? res.data! : t) }));
      return true;
    }
    return false;
  },

  deactivateTrainer: async (id) => {
    const res = await http.delete(`/trainers/${id}`);
    if (res.success) {
      set(s => ({ trainers: s.trainers.map(t => t.id === id ? { ...t, status: 'inactive' } : t) }));
      return true;
    }
    return false;
  },

  createBooking: async (p) => {
    const res = await http.post('/bookings', p);
    if (res.success && res.data) {
      await Promise.all([get().fetchBookings(), get().fetchBills()]);
      return { success: true, data: res.data };
    }
    return { success: false, message: res.message };
  },

  cancelBooking: async (id) => {
    const res = await http.post(`/bookings/${id}/cancel`);
    if (res.success) {
      await Promise.all([get().fetchBookings(), get().fetchBills()]);
      return true;
    }
    return false;
  },

  completeBooking: async (id) => {
    const res = await http.post(`/bookings/${id}/complete`);
    if (res.success) {
      set(s => ({ bookings: s.bookings.map(b => b.id === id ? { ...b, status: 'completed' } : b) }));
      return true;
    }
    return false;
  },

  checkConflict: async (p) => {
    const res = await http.post<ConflictResult>('/bookings/check-conflict', p);
    return res.success ? res.data ?? null : null;
  },

  previewBilling: async (p) => {
    const res = await http.post<BillingResult>('/billing/calculate', p);
    return res.success ? res.data ?? null : null;
  },

  saveRates: async (tiers) => {
    const res = await http.put<RateTier[]>('/rates', tiers);
    if (res.success && res.data) {
      set({ rates: res.data });
      return true;
    }
    return false;
  },

  payBill: async (id) => {
    const res = await http.post(`/bills/${id}/pay`);
    if (res.success) {
      set(s => ({ bills: s.bills.map(b => b.id === id ? { ...b, status: 'paid' } : b) }));
      return true;
    }
    return false;
  },

  createAssessment: async (p) => {
    const res = await http.post<Assessment>('/assessments', p);
    if (res.success && res.data) {
      set(s => ({ assessments: [res.data!, ...s.assessments] }));
      return res.data;
    }
    return null;
  },
}));
