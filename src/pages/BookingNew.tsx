import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Users,
  User,
  Phone,
  PawPrint,
  Calendar,
  Clock,
  Sparkles,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Send,
  X,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app';
import { Booking, ConflictResult, BillingResult, BillingSegment } from '@shared/types';
import {
  formatCurrency,
  formatDuration,
  minutesBetween,
  buildDateTime,
  formatDate,
  formatDateTime,
  formatTimeOnly,
  parseISO,
} from '@shared/utils';

const COURSE_TYPES = [
  '基础服从课',
  '行为矫正课',
  '敏捷训练课',
  '幼犬社会化',
  '嗅觉训练课',
  '老年犬护理',
  '飞盘训练',
  '一对一私教课',
];

const PET_TYPES: { value: 'dog' | 'cat' | 'other'; label: string; emoji: string }[] = [
  { value: 'dog', label: '狗狗', emoji: '🐶' },
  { value: 'cat', label: '猫咪', emoji: '🐱' },
  { value: 'other', label: '其他', emoji: '🐾' },
];

function generateTimeOptions(step = 30): string[] {
  const options: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += step) {
      options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  options.push('23:30');
  return options;
}

const TIME_OPTIONS = generateTimeOptions(30);

function getDefaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

interface FormState {
  trainerId: string;
  ownerName: string;
  ownerPhone: string;
  petName: string;
  petType: 'dog' | 'cat' | 'other';
  petBreed: string;
  courseType: string;
  date: string;
  startTime: string;
  endTime: string;
}

const INITIAL_FORM: FormState = {
  trainerId: '',
  ownerName: '',
  ownerPhone: '',
  petName: '',
  petType: 'dog',
  petBreed: '',
  courseType: '',
  date: getDefaultDate(),
  startTime: '10:00',
  endTime: '11:00',
};

export default function BookingNew() {
  const navigate = useNavigate();
  const {
    trainers,
    fetchTrainers,
    checkConflict,
    previewBilling,
    createBooking,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [conflict, setConflict] = useState<ConflictResult | null>(null);
  const [conflictShake, setConflictShake] = useState(false);
  const [billing, setBilling] = useState<BillingResult | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const conflictTimer = useRef<number | null>(null);
  const billingTimer = useRef<number | null>(null);

  useEffect(() => {
    fetchTrainers().finally(() => setLoading(false));
  }, [fetchTrainers]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', msg: string) => setToast({ type, msg });

  const selectedTrainer = useMemo(
    () => trainers.find(t => t.id === form.trainerId) || null,
    [trainers, form.trainerId]
  );

  const activeTrainers = useMemo(
    () => trainers.filter(t => t.status === 'active'),
    [trainers]
  );

  const startIso = useMemo(() => {
    if (!form.date || !form.startTime) return '';
    return buildDateTime(parseISO(form.date), form.startTime).toISOString();
  }, [form.date, form.startTime]);

  const endIso = useMemo(() => {
    if (!form.date || !form.endTime) return '';
    return buildDateTime(parseISO(form.date), form.endTime).toISOString();
  }, [form.date, form.endTime]);

  const durationMinutes = useMemo(() => {
    if (!startIso || !endIso) return 0;
    return minutesBetween(startIso, endIso);
  }, [startIso, endIso]);

  const runConflictCheck = useCallback(async () => {
    if (!form.trainerId || !startIso || !endIso || durationMinutes <= 0) {
      setConflict(null);
      return;
    }
    const result = await checkConflict({
      trainerId: form.trainerId,
      startAt: startIso,
      endAt: endIso,
    });
    if (result) {
      setConflict(result);
      if (result.hasConflict) {
        setConflictShake(true);
        setTimeout(() => setConflictShake(false), 500);
      }
    } else {
      setConflict(null);
    }
  }, [form.trainerId, startIso, endIso, durationMinutes, checkConflict]);

  const runBillingPreview = useCallback(async () => {
    if (!form.trainerId || !startIso || !endIso || durationMinutes <= 0) {
      setBilling(null);
      return;
    }
    setBillingLoading(true);
    try {
      const result = await previewBilling({
        trainerId: form.trainerId,
        startAt: startIso,
        endAt: endIso,
      });
      setBilling(result);
    } catch (e) {
      setBilling({
        segments: [{
          startTime: form.startTime,
          endTime: form.endTime,
          durationMinutes,
          tierId: 'fallback',
          tierName: '标准计费',
          tierColor: '#F97316',
          unitPrice: Math.round((selectedTrainer?.baseHourlyRate || 150) / 60 * 100) / 100,
          subtotal: Math.round((selectedTrainer?.baseHourlyRate || 150) * durationMinutes / 60 * 100) / 100,
        }],
        totalMinutes: durationMinutes,
        totalAmount: Math.round((selectedTrainer?.baseHourlyRate || 150) * durationMinutes / 60 * 100) / 100,
        baseRate: selectedTrainer?.baseHourlyRate || 150,
      });
    } finally {
      setBillingLoading(false);
    }
  }, [form.trainerId, startIso, endIso, durationMinutes, previewBilling, form.startTime, form.endTime, selectedTrainer]);

  useEffect(() => {
    if (conflictTimer.current) window.clearTimeout(conflictTimer.current);
    conflictTimer.current = window.setTimeout(runConflictCheck, 350);
    return () => {
      if (conflictTimer.current) window.clearTimeout(conflictTimer.current);
    };
  }, [runConflictCheck]);

  useEffect(() => {
    if (billingTimer.current) window.clearTimeout(billingTimer.current);
    billingTimer.current = window.setTimeout(runBillingPreview, 350);
    return () => {
      if (billingTimer.current) window.clearTimeout(billingTimer.current);
    };
  }, [runBillingPreview]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFormErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.trainerId) errors.trainerId = '请选择训练师';
    if (!form.ownerName.trim()) errors.ownerName = '请填写宠主姓名';
    if (!form.ownerPhone.trim()) errors.ownerPhone = '请填写联系电话';
    if (!form.petName.trim()) errors.petName = '请填写宠物名字';
    if (!form.courseType) errors.courseType = '请选择课程类型';
    if (!form.date) errors.date = '请选择日期';
    if (!form.startTime) errors.startTime = '请选择开始时间';
    if (!form.endTime) errors.endTime = '请选择结束时间';
    if (durationMinutes <= 0) errors.endTime = '结束时间必须晚于开始时间';
    if (durationMinutes > 0 && durationMinutes < 30) errors.endTime = '课程时长最少30分钟';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (conflict?.hasConflict) {
      showToast('error', '时间存在冲突，请调整后再提交');
      setConflictShake(true);
      setTimeout(() => setConflictShake(false), 500);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createBooking({
        trainerId: form.trainerId,
        ownerName: form.ownerName.trim(),
        ownerPhone: form.ownerPhone.trim(),
        petName: form.petName.trim(),
        petType: form.petType,
        petBreed: form.petBreed.trim() || undefined,
        courseType: form.courseType,
        startAt: startIso,
        endAt: endIso,
      });
      if (result.success) {
        showToast('success', '预约创建成功！即将跳转…');
        setTimeout(() => navigate('/bookings'), 1200);
      } else {
        showToast('error', result.message || '创建失败，请重试');
      }
    } catch {
      showToast('error', '创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const TierCard = ({ seg, idx }: { seg: BillingSegment; idx: number }) => (
    <div
      key={`${seg.startTime}-${seg.endTime}-${idx}`}
      className="relative pl-0 rounded-xl bg-white border border-stone-100 p-4 overflow-hidden hover:shadow-sm transition-shadow animate-fade-up"
      style={{ animationDelay: `${idx * 60}ms` }}
    >
      <div
        className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-xl"
        style={{ backgroundColor: seg.tierColor }}
      />
      <div className="pl-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white mb-2"
            style={{ backgroundColor: seg.tierColor }}
          >
            <Sparkles size={9} />
            {seg.tierName}
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-0.5">
              <Clock size={11} />
              {seg.startTime} – {seg.endTime}
            </span>
            <span className="text-stone-300">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Timer size={11} />
              {formatDuration(seg.durationMinutes)}
            </span>
          </div>
          <div className="mt-1.5 text-xs text-stone-400">
            单价 {formatCurrency(seg.unitPrice)}/时
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-lg text-stone-900 leading-tight">
            {formatCurrency(seg.subtotal)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">小计</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-up max-w-[1400px]">
      <button
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-600 transition-colors mb-6 group"
        onClick={() => navigate('/bookings')}
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        返回预约列表
      </button>

      <div className="mb-6">
        <div className="subtle">创建一条新的宠物训练课程预约</div>
        <h1 className="font-display text-4xl mt-1 text-stone-900">新建预约</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="card p-6 space-y-5">
            <h2 className="font-display text-xl text-stone-900 flex items-center gap-2">
              <Calendar size={20} className="text-brand-500" />
              预约信息
            </h2>

            <div>
              <label className="label">
                训练师 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <select
                  className={`input pl-10 appearance-none ${formErrors.trainerId ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
                  value={form.trainerId}
                  onChange={e => updateField('trainerId', e.target.value)}
                  disabled={loading}
                >
                  <option value="">{loading ? '加载中…' : '请选择训练师'}</option>
                  {activeTrainers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {formatCurrency(t.baseHourlyRate)}/时
                    </option>
                  ))}
                </select>
              </div>
              {formErrors.trainerId && <p className="text-xs text-red-500 mt-1">{formErrors.trainerId}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  宠主姓名 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    className={`input pl-10 ${formErrors.ownerName ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
                    placeholder="请输入宠主姓名"
                    value={form.ownerName}
                    onChange={e => updateField('ownerName', e.target.value)}
                  />
                </div>
                {formErrors.ownerName && <p className="text-xs text-red-500 mt-1">{formErrors.ownerName}</p>}
              </div>

              <div>
                <label className="label">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="tel"
                    className={`input pl-10 ${formErrors.ownerPhone ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
                    placeholder="手机号"
                    value={form.ownerPhone}
                    onChange={e => updateField('ownerPhone', e.target.value)}
                  />
                </div>
                {formErrors.ownerPhone && <p className="text-xs text-red-500 mt-1">{formErrors.ownerPhone}</p>}
              </div>
            </div>

            <div className="border-t border-stone-100 pt-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
                <PawPrint size={16} className="text-amber-500" />
                宠物信息
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    宠物名字 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`input ${formErrors.petName ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
                    placeholder="如：旺财、咪咪"
                    value={form.petName}
                    onChange={e => updateField('petName', e.target.value)}
                  />
                  {formErrors.petName && <p className="text-xs text-red-500 mt-1">{formErrors.petName}</p>}
                </div>

                <div>
                  <label className="label">品种（可选）</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：金毛、英短"
                    value={form.petBreed}
                    onChange={e => updateField('petBreed', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="label">宠物类型</label>
                <div className="flex gap-2">
                  {PET_TYPES.map(pt => {
                    const active = form.petType === pt.value;
                    return (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => updateField('petType', pt.value)}
                        className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          active
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-brand-300 hover:text-brand-600'
                        }`}
                      >
                        <span className="text-lg">{pt.emoji}</span>
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="label">
                    课程类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`input appearance-none ${formErrors.courseType ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
                    value={form.courseType}
                    onChange={e => updateField('courseType', e.target.value)}
                  >
                    <option value="">请选择课程类型</option>
                    {COURSE_TYPES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {formErrors.courseType && <p className="text-xs text-red-500 mt-1">{formErrors.courseType}</p>}
                </div>

                <div>
                  <label className="label">
                    日期 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="date"
                      className={`input pl-10 ${formErrors.date ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
                      value={form.date}
                      min={formatDate(new Date())}
                      onChange={e => updateField('date', e.target.value)}
                    />
                  </div>
                  {formErrors.date && <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      开始时间 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <select
                        className={`input pl-10 appearance-none ${formErrors.startTime ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
                        value={form.startTime}
                        onChange={e => updateField('startTime', e.target.value)}
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={`s-${t}`} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    {formErrors.startTime && <p className="text-xs text-red-500 mt-1">{formErrors.startTime}</p>}
                  </div>

                  <div>
                    <label className="label">
                      结束时间 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <select
                        className={`input pl-10 appearance-none ${formErrors.endTime ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`}
                        value={form.endTime}
                        onChange={e => updateField('endTime', e.target.value)}
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={`e-${t}`} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    {formErrors.endTime && <p className="text-xs text-red-500 mt-1">{formErrors.endTime}</p>}
                    {!formErrors.endTime && durationMinutes > 0 && (
                      <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                        <Timer size={11} />
                        共 {formatDuration(durationMinutes)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {conflict?.hasConflict && (
              <div
                className={`rounded-2xl bg-red-50 border border-red-200 p-4 ${conflictShake ? 'animate-shake' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={18} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-red-700">⚠️ 时间冲突</div>
                    <p className="text-sm text-red-600 mt-1">
                      {conflict.message || '所选时段与该训练师的已有预约冲突，请调整时间。'}
                    </p>
                    {conflict.workRanges && conflict.workRanges.length > 0 && (
                      <div className="mt-3 bg-white/70 border border-red-100 rounded-xl px-3 py-2.5">
                        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                          📅 该训练师当日可约时段
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {conflict.workRanges.map((wr, i) => (
                            <span
                              key={i}
                              className="chip bg-forest-50 text-forest-700 border border-forest-200 text-xs"
                            >
                              <Clock size={10} className="mr-0.5" />
                              {wr.start} – {wr.end}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {conflict.conflictingBookings && conflict.conflictingBookings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {conflict.conflictingBookings.map((cb: Booking) => (
                          <div
                            key={cb.id}
                            className="bg-white/70 border border-red-100 rounded-xl px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2 text-red-700 font-medium">
                              <X size={10} />
                              {formatDateTime(cb.startAt, 'MM-dd HH:mm')} – {formatTimeOnly(cb.endAt)}
                            </div>
                            <div className="text-stone-500 mt-0.5">
                              {cb.petName} · {cb.ownerName}
                              {cb.courseType && ` · ${cb.courseType}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!conflict?.hasConflict && selectedTrainer && form.date && form.startTime && form.endTime && durationMinutes > 0 && conflict?.workRanges && conflict.workRanges.length > 0 && (
              <div className="rounded-2xl bg-forest-50 border border-forest-200 p-3.5 animate-fade-up">
                <div className="flex items-center gap-2 text-sm text-forest-700">
                  <CheckCircle2 size={15} />
                  <span className="font-medium">该时段可预约</span>
                  <span className="text-forest-600/80 text-xs ml-1">
                    · 训练师可约时段：{conflict.workRanges.map(r => `${r.start}-${r.end}`).join('、')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 opacity-10 blur-2xl" />

              <h2 className="font-display text-xl text-stone-900 flex items-center gap-2 mb-5 relative">
                <DollarSign size={20} className="text-brand-500" />
                实时计费试算
              </h2>

              {selectedTrainer ? (
                <div className="space-y-4 relative">
                  <div className="rounded-xl bg-gradient-to-br from-cream-50 to-brand-50 border border-cream-100 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-stone-500">当前训练师</div>
                        <div className="font-semibold text-stone-800 mt-0.5">{selectedTrainer.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-stone-500">基础时薪</div>
                        <div className="font-display text-lg text-brand-600">
                          {formatCurrency(selectedTrainer.baseHourlyRate)}
                        </div>
                      </div>
                    </div>
                    {form.date && form.startTime && form.endTime && durationMinutes > 0 && (
                      <div className="mt-3 pt-3 border-t border-cream-200 text-xs text-stone-500 flex items-center gap-2 flex-wrap">
                        <Calendar size={11} />
                        {form.date}
                        <span className="text-cream-300">·</span>
                        <Clock size={11} />
                        {form.startTime} – {form.endTime}
                        <span className="text-cream-300">·</span>
                        <Timer size={11} />
                        {formatDuration(durationMinutes)}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                        分段明细
                      </span>
                      {billingLoading && (
                        <span className="text-[11px] text-stone-400 animate-pulse">计算中…</span>
                      )}
                    </div>

                    {!form.trainerId || durationMinutes <= 0 ? (
                      <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center">
                        <div className="text-3xl mb-2">⏱️</div>
                        <div className="text-sm text-stone-500">填写训练师与时段后自动计算</div>
                      </div>
                    ) : billingLoading && !billing ? (
                      <div className="space-y-3">
                        {[0, 1].map(i => (
                          <div key={i} className="h-20 rounded-xl bg-stone-100 animate-pulse" />
                        ))}
                      </div>
                    ) : billing && billing.segments.length > 0 ? (
                      <div className="space-y-2.5">
                        {billing.segments.map((seg, idx) => (
                          <TierCard key={idx} seg={seg} idx={idx} />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-400">
                        暂无法计算费率
                      </div>
                    )}
                  </div>

                  <div className="border-t border-stone-150 pt-5 mt-5">
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <div className="text-xs text-stone-500">
                          共 {billing ? formatDuration(billing.totalMinutes) : '—'}
                        </div>
                        <div className="font-display text-sm text-stone-600 mt-0.5">合计金额</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-4xl text-brand-600 leading-none">
                          {billing ? formatCurrency(billing.totalAmount) : '—'}
                        </div>
                      </div>
                    </div>
                    {billing && billing.baseRate !== billing.totalAmount && (
                      <div className="mt-2 text-[11px] text-stone-400 text-right">
                        基准价 {formatCurrency(billing.baseRate)}
                        <ChevronRight size={10} className="inline" />
                        含时段费率
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-stone-200 p-10 text-center relative">
                  <div className="text-4xl mb-3">🐾</div>
                  <div className="text-sm text-stone-500">请先选择训练师以查看计费</div>
                </div>
              )}
            </div>

            <button
              className="btn-primary w-full !py-3.5 text-base shadow-lg"
              onClick={handleSubmit}
              disabled={submitting || conflict?.hasConflict || billingLoading}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  提交中…
                </>
              ) : (
                <>
                  <Send size={16} />
                  确认预约
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-stone-400">
              提交即表示确认上述时段与费用，预约创建后将自动生成账单
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-up">
          <div
            className={`card px-5 py-3.5 flex items-center gap-3 shadow-lg ${
              toast.type === 'success'
                ? 'bg-forest-50 border-forest-100'
                : 'bg-red-50 border-red-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-forest-500 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
            )}
            <span className={`text-sm font-medium ${toast.type === 'success' ? 'text-forest-700' : 'text-red-700'}`}>
              {toast.msg}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
