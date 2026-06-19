import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  X,
  CalendarX,
  Clock3,
  Pencil,
  AlertTriangle,
  Check,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppStore } from '@/store/app';
import { TimeRange, WeekdayKey, WorkSchedule, WEEKDAY_KEYS } from '@shared/types';
import { formatDate } from '@shared/utils';

const WEEKDAY_LABELS: { key: WeekdayKey; label: string; short: string; icon: typeof Sun }[] = [
  { key: 'monday', label: '星期一', short: '一', icon: Sun },
  { key: 'tuesday', label: '星期二', short: '二', icon: Sun },
  { key: 'wednesday', label: '星期三', short: '三', icon: Sun },
  { key: 'thursday', label: '星期四', short: '四', icon: Sun },
  { key: 'friday', label: '星期五', short: '五', icon: Sun },
  { key: 'saturday', label: '星期六', short: '六', icon: Moon },
  { key: 'sunday', label: '星期日', short: '日', icon: Moon },
];

interface ExceptionForm {
  editId: string | null;
  date: string;
  isOff: boolean;
  ranges: TimeRange[];
}

function emptySchedule(): WorkSchedule {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
    exceptions: [],
  };
}

function deepCloneSchedule(s: WorkSchedule | undefined): WorkSchedule {
  if (!s) return emptySchedule();
  return {
    monday: s.monday ? s.monday.map(r => ({ ...r })) : [],
    tuesday: s.tuesday ? s.tuesday.map(r => ({ ...r })) : [],
    wednesday: s.wednesday ? s.wednesday.map(r => ({ ...r })) : [],
    thursday: s.thursday ? s.thursday.map(r => ({ ...r })) : [],
    friday: s.friday ? s.friday.map(r => ({ ...r })) : [],
    saturday: s.saturday ? s.saturday.map(r => ({ ...r })) : [],
    sunday: s.sunday ? s.sunday.map(r => ({ ...r })) : [],
    exceptions: s.exceptions ? s.exceptions.map(e => ({ date: e.date, ranges: e.ranges ? e.ranges.map(r => ({ ...r })) : null })) : [],
  };
}

export default function TrainerSchedule() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trainers = useAppStore(s => s.trainers);
  const updateTrainer = useAppStore(s => s.updateTrainer);

  const trainer = useMemo(() => trainers.find(t => t.id === id), [trainers, id]);

  const [schedule, setSchedule] = useState<WorkSchedule>(emptySchedule());
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exceptionForm, setExceptionForm] = useState<ExceptionForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trainer) {
      setSchedule(deepCloneSchedule(trainer.workSchedule));
    }
  }, [trainer]);

  if (!trainer) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center animate-fade-up">
        <div className="font-display text-2xl text-stone-700 mb-2">训练师不存在 🐾</div>
        <button className="btn-primary mt-4" onClick={() => navigate('/trainers')}>
          <ChevronLeft size={16} />
          返回训练师列表
        </button>
      </div>
    );
  }

  const getRanges = (key: WeekdayKey): TimeRange[] => schedule[key] ?? [];

  const setRanges = (key: WeekdayKey, ranges: TimeRange[]) => {
    setSchedule(prev => ({ ...prev, [key]: ranges }));
  };

  const addRange = (key: WeekdayKey) => {
    const current = getRanges(key);
    setRanges(key, [...current, { start: '09:00', end: '12:00' }]);
  };

  const removeRange = (key: WeekdayKey, index: number) => {
    const current = getRanges(key);
    setRanges(key, current.filter((_, i) => i !== index));
  };

  const updateRange = (key: WeekdayKey, index: number, field: 'start' | 'end', value: string) => {
    const current = getRanges(key);
    const updated = current.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    setRanges(key, updated);

    const errKey = `${key}-${index}`;
    if (updated[index].start >= updated[index].end) {
      setErrors(prev => ({ ...prev, [errKey]: '结束时间必须晚于开始时间' }));
    } else {
      setErrors(prev => {
        const n = { ...prev };
        delete n[errKey];
        return n;
      });
    }
  };

  const copyDayToAll = (key: WeekdayKey) => {
    const source = getRanges(key).map(r => ({ ...r }));
    WEEKDAY_LABELS.forEach(d => {
      if (d.key !== key) {
        setRanges(d.key, source.map(r => ({ ...r })));
      }
    });
  };

  const clearAll = () => {
    if (!confirm('确定清空所有工作日设置？')) return;
    WEEKDAY_LABELS.forEach(d => setRanges(d.key, []));
  };

  const exceptions = schedule.exceptions ?? [];

  const openAddException = () => {
    const today = new Date();
    setExceptionForm({
      editId: null,
      date: formatDate(today),
      isOff: true,
      ranges: [{ start: '09:00', end: '12:00' }],
    });
  };

  const openEditException = (date: string) => {
    const ex = exceptions.find(e => e.date === date);
    if (!ex) return;
    setExceptionForm({
      editId: date,
      date: ex.date,
      isOff: ex.ranges === null,
      ranges: ex.ranges ?? [{ start: '09:00', end: '12:00' }],
    });
  };

  const removeException = (date: string) => {
    setSchedule(prev => ({
      ...prev,
      exceptions: (prev.exceptions ?? []).filter(e => e.date !== date),
    }));
  };

  const saveException = () => {
    if (!exceptionForm) return;
    const newEx = {
      date: exceptionForm.date,
      ranges: exceptionForm.isOff ? null : exceptionForm.ranges.filter(r => r.start < r.end),
    };

    setSchedule(prev => {
      const list = (prev.exceptions ?? []).filter(e => e.date !== exceptionForm.date);
      list.push(newEx);
      list.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, exceptions: list };
    });
    setExceptionForm(null);
  };

  const addExceptionRange = () => {
    if (!exceptionForm) return;
    setExceptionForm({
      ...exceptionForm,
      ranges: [...exceptionForm.ranges, { start: '14:00', end: '18:00' }],
    });
  };

  const removeExceptionRange = (idx: number) => {
    if (!exceptionForm) return;
    setExceptionForm({
      ...exceptionForm,
      ranges: exceptionForm.ranges.filter((_, i) => i !== idx),
    });
  };

  const updateExceptionRange = (idx: number, field: 'start' | 'end', value: string) => {
    if (!exceptionForm) return;
    const ranges = exceptionForm.ranges.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    setExceptionForm({ ...exceptionForm, ranges });
  };

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) {
      alert('请先修正时间范围设置中的错误');
      return;
    }
    setSaving(true);
    const ok = await updateTrainer(trainer.id, { workSchedule: schedule });
    setSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const getTotalWeeklyHours = () => {
    let totalMinutes = 0;
    WEEKDAY_LABELS.forEach(({ key }) => {
      (schedule[key] ?? []).forEach(r => {
        const [sh, sm] = r.start.split(':').map(Number);
        const [eh, em] = r.end.split(':').map(Number);
        totalMinutes += Math.max(0, eh * 60 + em - (sh * 60 + sm));
      });
    });
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-up">
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <button
          className="hover:text-brand-600 transition-colors flex items-center gap-1"
          onClick={() => navigate('/trainers')}
        >
          <ChevronLeft size={14} />
          训练师管理
        </button>
        <ChevronRight size={14} className="text-stone-300" />
        <span className="text-stone-700 font-medium">时段设置</span>
      </div>

      <div className="card p-6 animate-fade-up">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-display text-2xl shadow-lg">
              {trainer.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-3xl text-stone-900">{trainer.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="subtle flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" />
                  {trainer.experienceYears}年经验
                </span>
                <span className="chip bg-cream-50 text-amber-700">
                  周工作时长：{getTotalWeeklyHours()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => navigate(-1)}>
              <X size={15} />
              取消
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>保存中...</>
              ) : saveSuccess ? (
                <>
                  <Check size={15} />
                  已保存
                </>
              ) : (
                <>
                  <Save size={15} />
                  保存设置
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl text-stone-900 flex items-center gap-2">
              <Clock3 size={20} className="text-brand-500" />
              每周固定工作时段
            </h2>
            <div className="subtle text-sm mt-0.5">设置训练师每周固定的可预约时间</div>
          </div>
          <button className="btn-outline text-xs py-2" onClick={clearAll}>
            <Trash2 size={13} />
            清空全部
          </button>
        </div>

        <div className="space-y-3">
          {WEEKDAY_LABELS.map(({ key, label, short, icon: DayIcon }, dayIdx) => {
            const ranges = getRanges(key);
            const isWeekend = key === 'saturday' || key === 'sunday';
            return (
              <div
                key={key}
                className={`rounded-2xl border transition-all group ${
                  ranges.length > 0
                    ? isWeekend
                      ? 'border-violet-100 bg-violet-50/30'
                      : 'border-brand-100 bg-brand-50/30'
                    : 'border-stone-150 bg-white hover:border-stone-200'
                }`}
                style={{ animationDelay: `${dayIdx * 40}ms` }}
              >
                <div className="flex items-stretch">
                  <div
                    className={`w-20 shrink-0 p-4 flex flex-col items-center justify-center gap-1 rounded-l-2xl ${
                      isWeekend
                        ? 'bg-gradient-to-br from-violet-100/70 to-violet-50'
                        : 'bg-gradient-to-br from-brand-100/70 to-brand-50'
                    }`}
                  >
                    <DayIcon size={16} className={isWeekend ? 'text-violet-600' : 'text-brand-600'} />
                    <div className={`font-display text-2xl leading-none ${isWeekend ? 'text-violet-700' : 'text-brand-700'}`}>
                      {short}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-stone-500">{label}</div>
                  </div>

                  <div className="flex-1 p-4 space-y-2.5">
                    {ranges.length === 0 && (
                      <div className="text-xs text-stone-400 py-1.5 italic flex items-center gap-2">
                        <CalendarX size={13} />
                        当日休息（无可预约时段）
                      </div>
                    )}

                    {ranges.map((range, idx) => {
                      const errKey = `${key}-${idx}`;
                      const hasErr = !!errors[errKey];
                      return (
                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                          <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${hasErr ? 'border-red-300 bg-red-50/50 animate-shake' : 'border-stone-200 bg-white'}`}>
                            <input
                              type="time"
                              className="input border-0 bg-transparent shadow-none !px-2 !py-1 w-24 text-sm focus:ring-0"
                              value={range.start}
                              onChange={e => updateRange(key, idx, 'start', e.target.value)}
                            />
                            <span className="text-stone-400 px-1">→</span>
                            <input
                              type="time"
                              className="input border-0 bg-transparent shadow-none !px-2 !py-1 w-24 text-sm focus:ring-0"
                              value={range.end}
                              onChange={e => updateRange(key, idx, 'end', e.target.value)}
                            />
                          </div>
                          {hasErr && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              {errors[errKey]}
                            </span>
                          )}
                          <button
                            className="w-8 h-8 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                            onClick={() => removeRange(key, idx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        className="chip border border-dashed border-brand-300 text-brand-600 bg-brand-50/40 hover:bg-brand-50 transition-colors"
                        onClick={() => addRange(key)}
                      >
                        <Plus size={12} />
                        新增时段
                      </button>
                      {ranges.length > 0 && (
                        <button
                          className="chip text-stone-500 hover:text-brand-600 hover:bg-brand-50 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => copyDayToAll(key)}
                          title="复制到全周"
                        >
                          复制到全周
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl text-stone-900 flex items-center gap-2">
              <CalendarX size={20} className="text-rose-500" />
              例外日期（节假日 / 调休）
            </h2>
            <div className="subtle text-sm mt-0.5">设置特殊日期的工作安排，优先级高于每周固定时段</div>
          </div>
          <button className="btn-primary text-xs py-2" onClick={openAddException}>
            <Plus size={14} />
            添加例外
          </button>
        </div>

        {exceptions.length === 0 && (
          <div className="text-center py-12 rounded-2xl bg-gradient-to-br from-stone-50 to-white border border-dashed border-stone-200">
            <CalendarX size={32} className="text-stone-300 mx-auto mb-3" />
            <div className="subtle">暂无例外日期设置</div>
            <div className="text-xs text-stone-400 mt-1">节假日、请假等特殊安排可在此处配置</div>
          </div>
        )}

        {exceptions.length > 0 && (
          <div className="rounded-2xl border border-stone-150 overflow-hidden">
            <div className="grid grid-cols-12 bg-stone-50/80 border-b border-stone-150 text-xs uppercase tracking-wider font-semibold text-stone-500">
              <div className="col-span-4 px-4 py-3">日期</div>
              <div className="col-span-5 px-4 py-3">安排</div>
              <div className="col-span-3 px-4 py-3 text-right">操作</div>
            </div>
            <div>
              {exceptions.map((ex, idx) => (
                <div
                  key={ex.date}
                  className="grid grid-cols-12 items-center border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="col-span-4 px-4 py-3.5">
                    <div className="font-semibold text-stone-800 text-sm">{ex.date}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {new Date(ex.date + 'T00:00:00').toLocaleDateString('zh-CN', { weekday: 'long' })}
                    </div>
                  </div>
                  <div className="col-span-5 px-4 py-3.5">
                    {ex.ranges === null ? (
                      <span className="chip bg-red-50 text-red-600 border border-red-100">
                        <CalendarX size={11} className="mr-1" />
                        全天休假
                      </span>
                    ) : ex.ranges.length === 0 ? (
                      <span className="chip bg-stone-100 text-stone-500">
                        <CalendarX size={11} className="mr-1" />
                        无可预约时段
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {ex.ranges.map((r, i) => (
                          <span
                            key={i}
                            className="chip bg-forest-50 text-forest-600 border border-forest-100"
                          >
                            {r.start} – {r.end}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-3 px-4 py-3.5 flex items-center justify-end gap-1.5">
                    <button
                      className="w-8 h-8 rounded-lg border border-stone-200 text-stone-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-center transition-colors"
                      onClick={() => openEditException(ex.date)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg border border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                      onClick={() => removeException(ex.date)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {exceptionForm && (
        <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setExceptionForm(null)}>
          <div className="card p-6 w-full max-w-lg animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-2xl text-stone-900">
                  {exceptionForm.editId ? '编辑例外日期' : '添加例外日期'}
                </h2>
                <div className="subtle text-sm mt-0.5">设置该天的特殊工作安排</div>
              </div>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                onClick={() => setExceptionForm(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">例外日期</label>
                <input
                  type="date"
                  className="input"
                  value={exceptionForm.date}
                  onChange={e => setExceptionForm({ ...exceptionForm, date: e.target.value })}
                />
              </div>

              <div>
                <label className="label">当日安排</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExceptionForm({ ...exceptionForm, isOff: true })}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                      exceptionForm.isOff
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <CalendarX size={14} className="inline mr-1.5" />
                    全天休假
                  </button>
                  <button
                    onClick={() => setExceptionForm({ ...exceptionForm, isOff: false })}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                      !exceptionForm.isOff
                        ? 'border-forest-400 bg-forest-50 text-forest-700'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <Clock3 size={14} className="inline mr-1.5" />
                    自定义时段
                  </button>
                </div>
              </div>

              {!exceptionForm.isOff && (
                <div className="space-y-2.5 pt-2">
                  <label className="label">工作时段</label>
                  {exceptionForm.ranges.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 p-1.5 rounded-xl border border-stone-200 bg-white">
                        <input
                          type="time"
                          className="input border-0 bg-transparent shadow-none !px-2 !py-1 w-full text-sm focus:ring-0"
                          value={r.start}
                          onChange={e => updateExceptionRange(idx, 'start', e.target.value)}
                        />
                        <span className="text-stone-400 px-1 shrink-0">→</span>
                        <input
                          type="time"
                          className="input border-0 bg-transparent shadow-none !px-2 !py-1 w-full text-sm focus:ring-0"
                          value={r.end}
                          onChange={e => updateExceptionRange(idx, 'end', e.target.value)}
                        />
                      </div>
                      <button
                        className="w-8 h-8 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                        onClick={() => removeExceptionRange(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="chip border border-dashed border-brand-300 text-brand-600 bg-brand-50/40 hover:bg-brand-50 transition-colors mt-1"
                    onClick={addExceptionRange}
                  >
                    <Plus size={12} />
                    新增时段
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setExceptionForm(null)}>
                取消
              </button>
              <button
                className="btn-primary flex-1"
                disabled={!exceptionForm.date}
                onClick={saveException}
              >
                <Check size={15} />
                {exceptionForm.editId ? '保存修改' : '添加例外'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
