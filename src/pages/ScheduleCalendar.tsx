import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  ListFilter,
  Plus,
  X,
  Clock,
  User,
  PawPrint,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/app';
import {
  format,
  formatDate,
  formatTimeOnly,
  parseISO,
  isSameDay,
  differenceInMinutes,
  startOfDay,
} from '@shared/utils';
import {
  addDays,
  startOfWeek,
  endOfWeek,
  setHours,
  setMinutes,
} from 'date-fns';
import { Booking, Trainer } from '@shared/types';
import { useNavigate } from 'react-router-dom';

const START_HOUR = 7;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 48;
const TRAINER_HEADER_WIDTH = 200;
const TIME_COL_WIDTH = 72;

const WEEKDAY_ABBR = ['日', '一', '二', '三', '四', '五', '六'];

const PET_TYPE_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱', other: '🐾' };

type ViewMode = 'day' | 'week';

interface HoveredBooking {
  booking: Booking;
  x: number;
  y: number;
}

interface QuickBookingState {
  open: boolean;
  trainerId: string;
  date: Date;
  startTime: string;
  endTime: string;
}

export default function ScheduleCalendar() {
  const navigate = useNavigate();
  const trainers = useAppStore(s => s.trainers);
  const bookings = useAppStore(s => s.bookings);
  const fetchBookings = useAppStore(s => s.fetchBookings);
  const fetchTrainers = useAppStore(s => s.fetchTrainers);
  const createBooking = useAppStore(s => s.createBooking);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoveredBooking, setHoveredBooking] = useState<HoveredBooking | null>(null);
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(null);
  const [newPetName, setNewPetName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newCourseType, setNewCourseType] = useState('基础服从课');
  const [newPetType, setNewPetType] = useState<'dog' | 'cat' | 'other'>('dog');

  const today = new Date();

  useEffect(() => {
    fetchTrainers();
    fetchBookings();
  }, [fetchTrainers, fetchBookings]);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const visibleDates = useMemo(() => {
    const dates: Date[] = [];
    const days = viewMode === 'week' ? 7 : 1;
    const start = viewMode === 'week' ? weekStart : currentDate;
    for (let i = 0; i < days; i++) {
      dates.push(addDays(start, i));
    }
    return dates;
  }, [viewMode, weekStart, currentDate]);

  const visibleTrainers = useMemo(() => {
    if (selectedTrainerIds.length === 0) return trainers.filter(t => t.status === 'active');
    return trainers.filter(t => selectedTrainerIds.includes(t.id));
  }, [trainers, selectedTrainerIds]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    slots.push(`${END_HOUR.toString().padStart(2, '0')}:00`);
    return slots;
  }, []);

  const totalSlots = timeSlots.length - 1;
  const calendarHeight = totalSlots * SLOT_HEIGHT;

  const weekLabel = useMemo(() => {
    const start = visibleDates[0];
    const end = visibleDates[visibleDates.length - 1];
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.getMonth() + 1}月${start.getDate()}日 – ${end.getMonth() + 1}月${end.getDate()}日 ${end.getFullYear()}`;
    }
    return `${start.getMonth() + 1}月${start.getDate()}日 – ${end.getMonth() + 1}月${end.getDate()}日 ${end.getFullYear()}`;
  }, [visibleDates]);

  const bookingsByTrainerAndDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(b => {
      const key = `${b.trainerId}_${formatDate(b.startAt)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [bookings]);

  const goPrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const goNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const toggleTrainer = (id: string) => {
    setSelectedTrainerIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const getSlotOffset = (isoTime: string) => {
    const d = parseISO(isoTime);
    const minutesFromStart = (d.getHours() - START_HOUR) * 60 + d.getMinutes();
    return (minutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT;
  };

  const getBookingHeight = (startIso: string, endIso: string) => {
    const minutes = differenceInMinutes(endIso, startIso);
    return (minutes / SLOT_MINUTES) * SLOT_HEIGHT;
  };

  const handleSlotClick = (trainerId: string, date: Date, slotIndex: number) => {
    const startTimeMin = START_HOUR * 60 + slotIndex * SLOT_MINUTES;
    const endTimeMin = startTimeMin + SLOT_MINUTES * 2;
    const startTime = `${Math.floor(startTimeMin / 60).toString().padStart(2, '0')}:${(startTimeMin % 60).toString().padStart(2, '0')}`;
    const endTime = `${Math.floor(endTimeMin / 60).toString().padStart(2, '0')}:${(endTimeMin % 60).toString().padStart(2, '0')}`;
    setQuickBooking({ open: true, trainerId, date, startTime, endTime });
    setNewPetName('');
    setNewOwnerName('');
    setNewOwnerPhone('');
    setNewCourseType('基础服从课');
    setNewPetType('dog');
  };

  const goFullForm = (qb: QuickBookingState) => {
    const dateStr = formatDate(qb.date);
    navigate(`/bookings/new?trainerId=${qb.trainerId}&date=${dateStr}&start=${qb.startTime}&end=${qb.endTime}`);
  };

  const handleCreateQuickBooking = async () => {
    if (!quickBooking || !newPetName || !newOwnerName) return;
    const startDt = buildDateTime(quickBooking.date, quickBooking.startTime);
    const endDt = buildDateTime(quickBooking.date, quickBooking.endTime);
    const result = await createBooking({
      trainerId: quickBooking.trainerId,
      petName: newPetName,
      ownerName: newOwnerName,
      ownerPhone: newOwnerPhone,
      petType: newPetType,
      courseType: newCourseType,
      startAt: startDt.toISOString(),
      endAt: endDt.toISOString(),
      status: 'confirmed',
    });
    if (result.success) {
      setQuickBooking(null);
      navigate('/bookings');
    } else {
      alert(result.message || '创建失败');
    }
  };

  function buildDateTime(date: Date, timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    return setMinutes(setHours(startOfDay(date), h), m);
  }

  const getTrainerName = (id: string) => trainers.find(t => t.id === id)?.name ?? id;

  const getBookingBg = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-brand-500/50 border-brand-500/70';
      case 'completed':
        return 'bg-forest-500 border-forest-600';
      case 'cancelled':
        return 'bg-stone-200 border-stone-300';
    }
  };

  const getBookingText = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-white';
      case 'completed':
        return 'text-white';
      case 'cancelled':
        return 'text-stone-500 line-through';
    }
  };

  const cancelledPattern = {
    backgroundImage:
      'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(120,113,108,0.3) 4px, rgba(120,113,108,0.3) 8px)',
  };

  return (
    <div className="space-y-6 max-w-[1600px] animate-fade-up">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="subtle">全局查看所有训练师的课程排期</div>
          <h1 className="font-display text-4xl mt-1 text-stone-900">排期日历</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 rounded-xl p-1">
            <button
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'day' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
              onClick={() => setViewMode('day')}
            >
              <Calendar size={14} className="inline mr-1.5" />
              日
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'week' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
              onClick={() => setViewMode('week')}
            >
              <CalendarDays size={14} className="inline mr-1.5" />
              周
            </button>
          </div>
          <button
            className="btn-outline relative"
            onClick={() => setFilterOpen(v => !v)}
          >
            <ListFilter size={16} />
            训练师
            {selectedTrainerIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
                {selectedTrainerIds.length}
              </span>
            )}
          </button>
          <button className="btn-primary" onClick={() => navigate('/bookings/new')}>
            <Plus size={16} />
            新建预约
          </button>
        </div>
      </div>

      <div className="card p-5 animate-fade-up">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:border-brand-300 hover:text-brand-600 transition-colors" onClick={goPrev}>
              <ChevronLeft size={18} />
            </button>
            <button className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:border-brand-300 hover:text-brand-600 transition-colors" onClick={goNext}>
              <ChevronRight size={18} />
            </button>
            <button className="btn-secondary text-xs py-2" onClick={goToday}>
              今天
            </button>
            <div className="ml-2 font-display text-xl text-stone-900">{weekLabel}</div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-brand-500/50 border border-brand-500/70" />
              <span className="text-stone-600">已确认</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-forest-500 border border-forest-600" />
              <span className="text-stone-600">已完成</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-stone-200 border border-stone-300" style={cancelledPattern} />
              <span className="text-stone-600">已取消</span>
            </div>
          </div>
        </div>

        {filterOpen && (
          <div className="mb-5 p-4 rounded-2xl bg-cream-50/70 border border-cream-100 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-brand-600" />
              <span className="text-sm font-medium text-stone-700">筛选训练师</span>
              <span className="text-xs text-stone-500">（不选则显示全部）</span>
              {selectedTrainerIds.length > 0 && (
                <button
                  className="ml-auto text-xs text-brand-600 font-medium hover:underline"
                  onClick={() => setSelectedTrainerIds([])}
                >
                  清空
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {trainers.filter(t => t.status === 'active').map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTrainer(t.id)}
                  className={`chip border transition-all ${
                    selectedTrainerIds.includes(t.id)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-brand-300'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-auto scroll-area -mx-5 px-5" style={{ maxHeight: 'calc(100vh - 380px)' }}>
          <div className="relative min-w-max">
            <div className="flex sticky top-0 z-20 bg-white">
              <div
                className="shrink-0 border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm"
                style={{ width: TIME_COL_WIDTH }}
              />
              <div
                className="shrink-0 border-b border-l border-stone-200 bg-stone-50/80 backdrop-blur-sm"
                style={{ width: TRAINER_HEADER_WIDTH }}
              />
              {visibleDates.map((date, i) => {
                const isToday = isSameDay(date, today);
                return (
                  <div
                    key={i}
                    className={`flex-1 min-w-[140px] border-b border-l border-stone-200 py-3 text-center ${
                      isToday ? 'bg-brand-50/60 backdrop-blur-sm' : 'bg-stone-50/80 backdrop-blur-sm'
                    }`}
                  >
                    <div className={`text-[11px] uppercase tracking-wider font-semibold ${
                      isToday ? 'text-brand-600' : 'text-stone-500'
                    }`}>
                      周{WEEKDAY_ABBR[date.getDay()]}
                    </div>
                    <div className={`mt-1 font-display text-2xl ${
                      isToday
                        ? 'text-brand-600 w-10 h-10 mx-auto rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md'
                        : 'text-stone-900'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleTrainers.map((trainer, trainerIdx) => (
              <div key={trainer.id} className="flex border-b border-stone-100">
                <div
                  className="shrink-0 bg-stone-50/40"
                  style={{ width: TIME_COL_WIDTH }}
                >
                  <div
                    className="relative"
                    style={{ height: calendarHeight }}
                  >
                    {timeSlots.map((time, idx) => (
                      <div
                        key={idx}
                        className="absolute left-0 right-0 text-[10px] text-stone-400 text-right pr-3"
                        style={{ top: idx * SLOT_HEIGHT - 6 }}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="shrink-0 border-l border-stone-100 p-3 bg-gradient-to-b from-white to-stone-50/50 flex flex-col items-center justify-start gap-2"
                  style={{ width: TRAINER_HEADER_WIDTH, height: calendarHeight }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-cream-50 flex items-center justify-center text-2xl shadow-sm shrink-0">
                    {trainer.name.charAt(0)}
                  </div>
                  <div className="text-center shrink-0">
                    <div className="font-semibold text-stone-800 text-sm">{trainer.name}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{trainer.experienceYears}年经验</div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center shrink-0">
                    {trainer.specialties.slice(0, 3).map(s => (
                      <span key={s} className="chip bg-cream-50 text-amber-700 text-[10px] px-1.5 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                  <button
                    className="text-[11px] text-brand-600 font-medium hover:underline shrink-0 mt-auto"
                    onClick={() => navigate(`/trainers/${trainer.id}/schedule`)}
                  >
                    设置时段 →
                  </button>
                </div>

                {visibleDates.map((date, dateIdx) => {
                  const key = `${trainer.id}_${formatDate(date)}`;
                  const dayBookings = bookingsByTrainerAndDate.get(key) ?? [];

                  return (
                    <div
                      key={dateIdx}
                      className={`flex-1 min-w-[140px] relative border-l border-stone-100 ${
                        isSameDay(date, today) ? 'bg-brand-50/20' : ''
                      }`}
                      style={{ height: calendarHeight }}
                    >
                      {timeSlots.map((_, idx) => (
                        <div
                          key={idx}
                          className="absolute left-0 right-0 border-t border-stone-50 hover:bg-brand-50/30 cursor-pointer transition-colors"
                          style={{
                            top: idx * SLOT_HEIGHT,
                            height: SLOT_HEIGHT,
                          }}
                          onClick={() => handleSlotClick(trainer.id, date, idx)}
                        />
                      ))}

                      {dayBookings.map(booking => {
                        const top = getSlotOffset(booking.startAt);
                        const height = Math.max(getBookingHeight(booking.startAt, booking.endAt), SLOT_HEIGHT - 8);
                        if (top < 0 || top >= calendarHeight) return null;

                        return (
                          <div
                            key={booking.id}
                            className={`absolute left-1 right-1 rounded-xl border px-2 py-1.5 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 z-10 ${
                              getBookingBg(booking.status)
                            } ${booking.status === 'cancelled' ? '' : ''}`}
                            style={{
                              top,
                              height,
                              ...(booking.status === 'cancelled' ? cancelledPattern : {}),
                            }}
                            onMouseEnter={e => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const parentRect = e.currentTarget.closest('.overflow-auto')?.getBoundingClientRect();
                              setHoveredBooking({
                                booking,
                                x: rect.left - (parentRect?.left ?? 0) + rect.width + 8,
                                y: rect.top - (parentRect?.top ?? 0),
                              });
                            }}
                            onMouseLeave={() => setHoveredBooking(null)}
                            onClick={e => {
                              e.stopPropagation();
                              navigate('/bookings');
                            }}
                          >
                            <div className={`text-xs font-semibold truncate ${getBookingText(booking.status)}`}>
                              {PET_TYPE_EMOJI[booking.petType]} {booking.petName}
                            </div>
                            <div className={`text-[10px] mt-0.5 truncate ${getBookingText(booking.status)} opacity-90`}>
                              {formatTimeOnly(booking.startAt)}–{formatTimeOnly(booking.endAt)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}

            {visibleTrainers.length === 0 && (
              <div className="text-center py-20 subtle">暂无训练师数据 🐾</div>
            )}

            {hoveredBooking && (
              <div
                className="absolute z-50 w-72 card p-4 pointer-events-none animate-fade-up shadow-xl"
                style={{ left: hoveredBooking.x, top: hoveredBooking.y }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-cream-50 flex items-center justify-center text-2xl shrink-0">
                    {PET_TYPE_EMOJI[hoveredBooking.booking.petType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg text-stone-900">{hoveredBooking.booking.petName}</span>
                      {hoveredBooking.booking.status === 'confirmed' && (
                        <span className="chip bg-brand-50 text-brand-600 text-[10px] border border-brand-100">
                          <CheckCircle2 size={10} className="mr-0.5" />已确认
                        </span>
                      )}
                      {hoveredBooking.booking.status === 'completed' && (
                        <span className="chip bg-forest-50 text-forest-600 text-[10px] border border-forest-100">
                          <CheckCircle2 size={10} className="mr-0.5" />已完成
                        </span>
                      )}
                      {hoveredBooking.booking.status === 'cancelled' && (
                        <span className="chip bg-stone-100 text-stone-500 text-[10px]">
                          <XCircle size={10} className="mr-0.5" />已取消
                        </span>
                      )}
                    </div>
                    <div className="subtle text-xs mt-0.5">主人：{hoveredBooking.booking.ownerName}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-stone-600">
                    <Calendar size={13} className="text-brand-500 shrink-0" />
                    {format(parseISO(hoveredBooking.booking.startAt), 'yyyy年M月d日')}
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <Clock size={13} className="text-brand-500 shrink-0" />
                    {formatTimeOnly(hoveredBooking.booking.startAt)} – {formatTimeOnly(hoveredBooking.booking.endAt)}
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <User size={13} className="text-brand-500 shrink-0" />
                    训练师：{getTrainerName(hoveredBooking.booking.trainerId)}
                  </div>
                  {hoveredBooking.booking.ownerPhone && (
                    <div className="flex items-center gap-2 text-stone-600">
                      <Phone size={13} className="text-brand-500 shrink-0" />
                      {hoveredBooking.booking.ownerPhone}
                    </div>
                  )}
                  {hoveredBooking.booking.petBreed && (
                    <div className="flex items-center gap-2 text-stone-600">
                      <PawPrint size={13} className="text-brand-500 shrink-0" />
                      {hoveredBooking.booking.petBreed}
                    </div>
                  )}
                  {hoveredBooking.booking.courseType && (
                    <div className="flex items-center gap-2 text-stone-600">
                      <AlertCircle size={13} className="text-brand-500 shrink-0" />
                      {hoveredBooking.booking.courseType}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {quickBooking && (
        <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQuickBooking(null)}>
          <div className="card p-6 w-full max-w-md animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-2xl text-stone-900">快捷新建预约</h2>
                <div className="subtle text-sm mt-1">
                  {formatDate(quickBooking.date)} · {quickBooking.startTime} – {quickBooking.endTime}
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                onClick={() => setQuickBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">训练师</label>
                <div className="input bg-stone-50 flex items-center gap-2">
                  <User size={14} className="text-stone-400" />
                  {getTrainerName(quickBooking.trainerId)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">开始时间</label>
                  <input
                    type="time"
                    className="input"
                    value={quickBooking.startTime}
                    onChange={e => setQuickBooking({ ...quickBooking, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">结束时间</label>
                  <input
                    type="time"
                    className="input"
                    value={quickBooking.endTime}
                    onChange={e => setQuickBooking({ ...quickBooking, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">宠物类型</label>
                <div className="flex gap-2">
                  {(['dog', 'cat', 'other'] as const).map(pt => (
                    <button
                      key={pt}
                      onClick={() => setNewPetType(pt)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm transition-all ${
                        newPetType === pt
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-stone-200 text-stone-600 hover:border-brand-300'
                      }`}
                    >
                      {PET_TYPE_EMOJI[pt]} {pt === 'dog' ? '狗狗' : pt === 'cat' ? '猫咪' : '其他'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">宠物名字 *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="如：旺财"
                  value={newPetName}
                  onChange={e => setNewPetName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">主人姓名 *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="如：张先生"
                  value={newOwnerName}
                  onChange={e => setNewOwnerName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">联系电话</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="如：13800138000"
                  value={newOwnerPhone}
                  onChange={e => setNewOwnerPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="label">课程类型</label>
                <select
                  className="input"
                  value={newCourseType}
                  onChange={e => setNewCourseType(e.target.value)}
                >
                  <option value="基础服从课">基础服从课</option>
                  <option value="行为纠正课">行为纠正课</option>
                  <option value="敏捷训练课">敏捷训练课</option>
                  <option value="幼犬启蒙课">幼犬启蒙课</option>
                  <option value="高级技能课">高级技能课</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setQuickBooking(null)}>
                取消
              </button>
              {quickBooking && (
                <button
                  type="button"
                  className="btn-outline flex-1"
                  onClick={() => goFullForm(quickBooking)}
                >
                  去完整表单
                </button>
              )}
              <button
                className="btn-primary flex-1"
                disabled={!newPetName || !newOwnerName}
                onClick={handleCreateQuickBooking}
              >
                <Plus size={16} />
                创建预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
