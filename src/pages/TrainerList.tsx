import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  CalendarDays,
  Pencil,
  Ban,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app';
import { Trainer, WorkSchedule, WEEKDAY_KEYS } from '@shared/types';
import { formatCurrency } from '@shared/utils';

const AVAILABLE_SPECIALTIES = [
  '基础服从',
  '行为矫正',
  '敏捷训练',
  '嗅觉训练',
  '幼犬社会化',
  '老年犬护理',
  '护卫训练',
  '飞盘训练',
  '导盲犬训练',
  '猫行为咨询',
];

const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  monday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  tuesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  wednesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  thursday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  friday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  saturday: [{ start: '10:00', end: '16:00' }],
  sunday: [],
};

const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-600',
  'from-forest-400 to-forest-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
  const chars = name.trim().split('');
  return chars.length > 0 ? chars[0].toUpperCase() : '?';
}

interface TrainerFormData {
  name: string;
  specialties: string[];
  experienceYears: number;
  baseHourlyRate: number;
}

const INITIAL_FORM: TrainerFormData = {
  name: '',
  specialties: [],
  experienceYears: 1,
  baseHourlyRate: 150,
};

export default function TrainerList() {
  const navigate = useNavigate();
  const { trainers, fetchTrainers, createTrainer, updateTrainer, deactivateTrainer } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [form, setForm] = useState<TrainerFormData>(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [deactivateConfirm, setDeactivateConfirm] = useState<Trainer | null>(null);

  useEffect(() => {
    fetchTrainers().finally(() => setLoading(false));
  }, [fetchTrainers]);

  const activeCount = useMemo(() => trainers.filter(t => t.status === 'active').length, [trainers]);

  const openCreateModal = () => {
    setEditingTrainer(null);
    setForm(INITIAL_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setForm({
      name: trainer.name,
      specialties: [...trainer.specialties],
      experienceYears: trainer.experienceYears,
      baseHourlyRate: trainer.baseHourlyRate,
    });
    setFormError('');
    setModalOpen(true);
  };

  const toggleSpecialty = (tag: string) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(tag)
        ? prev.specialties.filter(s => s !== tag)
        : [...prev.specialties, tag],
    }));
  };

  const validateForm = (): string => {
    if (!form.name.trim()) return '请填写训练师姓名';
    if (form.specialties.length === 0) return '请至少选择一项专长';
    if (form.experienceYears < 0) return '资历年数不能为负数';
    if (form.baseHourlyRate <= 0) return '基础时薪必须大于0';
    return '';
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    try {
      if (editingTrainer) {
        const ok = await updateTrainer(editingTrainer.id, {
          name: form.name.trim(),
          specialties: form.specialties,
          experienceYears: form.experienceYears,
          baseHourlyRate: form.baseHourlyRate,
        });
        if (ok) {
          await fetchTrainers();
          setModalOpen(false);
        } else {
          setFormError('更新失败，请重试');
        }
      } else {
        const result = await createTrainer({
          name: form.name.trim(),
          specialties: form.specialties,
          experienceYears: form.experienceYears,
          baseHourlyRate: form.baseHourlyRate,
          workSchedule: DEFAULT_WORK_SCHEDULE,
        });
        if (result.success) {
          await fetchTrainers();
          setModalOpen(false);
        } else {
          setFormError(result.message || '创建失败，请重试');
        }
      }
    } catch {
      setFormError('操作失败，请重试');
    }
  };

  const handleDeactivate = async (trainer: Trainer) => {
    const ok = await deactivateTrainer(trainer.id);
    if (ok) {
      await fetchTrainers();
      setDeactivateConfirm(null);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] animate-fade-up">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="subtle">管理所有训练师资料、专长与排班</div>
          <h1 className="font-display text-4xl mt-1 text-stone-900">训练师管理</h1>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="chip bg-brand-50 text-brand-600">
              <CheckCircle2 size={12} className="mr-1" />在岗 {activeCount} 人
            </span>
            <span className="chip bg-stone-100 text-stone-500">
              总 {trainers.length} 人
            </span>
          </div>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          新增训练师
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 subtle">加载中…</div>
      ) : trainers.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🐾</div>
          <h2 className="font-display text-2xl text-stone-900 mb-2">还没有训练师</h2>
          <p className="subtle mb-6">点击右上角「新增训练师」开始添加吧</p>
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            添加第一位训练师
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trainers.map((t, idx) => (
            <div
              key={t.id}
              className="card p-6 relative overflow-hidden animate-fade-up group hover:shadow-soft transition-all duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`absolute -right-10 -top-10 w-28 h-28 rounded-full bg-gradient-to-br ${getAvatarGradient(t.name)} opacity-10 blur-xl`} />

              <div className="flex items-start gap-4 relative">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarGradient(t.name)} flex items-center justify-center text-white font-display text-2xl shadow-md shrink-0`}>
                  {getInitials(t.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-xl text-stone-900 truncate">{t.name}</h3>
                    {t.status === 'active' ? (
                      <span className="chip bg-forest-50 text-forest-600 border border-forest-100 shrink-0">
                        <CheckCircle2 size={10} className="mr-1" />active
                      </span>
                    ) : (
                      <span className="chip bg-stone-100 text-stone-500 shrink-0">
                        <XCircle size={10} className="mr-1" />inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} />
                      {t.experienceYears} 年资历
                    </span>
                  </div>
                </div>
              </div>

              {t.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {t.specialties.map(s => (
                    <span key={s} className="chip bg-cream-50 text-amber-700 border border-cream-100">
                      <Sparkles size={10} className="mr-1" />{s}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-brand-600">
                  <DollarSign size={16} strokeWidth={2.2} />
                  <span className="font-display text-xl">{formatCurrency(t.baseHourlyRate)}</span>
                  <span className="text-xs text-stone-400 ml-1">/ 时</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-outline !px-2.5 !py-1.5 text-xs"
                    onClick={() => navigate(`/trainers/${t.id}/schedule`)}
                    title="时段设置"
                  >
                    <CalendarDays size={14} />
                    <span className="hidden sm:inline">时段设置</span>
                  </button>
                  <button
                    className="btn-outline !px-2.5 !py-1.5 text-xs"
                    onClick={() => openEditModal(t)}
                    title="编辑"
                  >
                    <Pencil size={14} />
                  </button>
                  {t.status === 'active' && (
                    <button
                      className="btn-danger !px-2.5 !py-1.5 text-xs"
                      onClick={() => setDeactivateConfirm(t)}
                      title="停用"
                    >
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-up">
          <div className="card p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
              onClick={() => setModalOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="mb-6 pr-8">
              <h2 className="font-display text-2xl text-stone-900">
                {editingTrainer ? '编辑训练师' : '新增训练师'}
              </h2>
              <p className="subtle mt-1">
                {editingTrainer ? '修改训练师的基本资料' : '填写训练师基础信息，工作时间使用默认配置'}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="label">姓名</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入训练师姓名"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">专长（可多选）</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SPECIALTIES.map(tag => {
                    const active = form.specialties.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleSpecialty(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          active
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-brand-300 hover:text-brand-600'
                        }`}
                      >
                        {active && <CheckCircle2 size={10} className="inline mr-1" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">资历年数</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="number"
                      min={0}
                      className="input pl-10"
                      value={form.experienceYears}
                      onChange={e => setForm(p => ({ ...p, experienceYears: Number(e.target.value) || 0 }))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">年</span>
                  </div>
                </div>
                <div>
                  <label className="label">基础时薪（元/时）</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">¥</span>
                    <input
                      type="number"
                      min={1}
                      step={10}
                      className="input pl-8"
                      value={form.baseHourlyRate}
                      onChange={e => setForm(p => ({ ...p, baseHourlyRate: Number(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              {!editingTrainer && (
                <div className="rounded-2xl bg-cream-50 border border-cream-100 p-4 text-xs text-stone-600">
                  <div className="font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                    <Clock size={12} />
                    工作时间（默认配置）
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-stone-500">
                    {WEEKDAY_KEYS.slice(1, 6).map(day => (
                      <span key={day}>
                        {day === 'monday' && '周一'}
                        {day === 'tuesday' && '周二'}
                        {day === 'wednesday' && '周三'}
                        {day === 'thursday' && '周四'}
                        {day === 'friday' && '周五'}
                        ：09-12 / 14-18
                      </span>
                    ))}
                    <span>周六：10-16</span>
                    <span>周日：休息</span>
                  </div>
                </div>
              )}

              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                  取消
                </button>
                <button className="btn-primary" onClick={handleSubmit}>
                  <CheckCircle2 size={16} />
                  {editingTrainer ? '保存修改' : '创建训练师'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-up">
          <div className="card p-7 w-full max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <Ban size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-display text-xl text-stone-900">确认停用训练师？</h3>
                <p className="subtle mt-1.5">
                  停用后 <span className="font-semibold text-stone-700">{deactivateConfirm.name}</span> 将无法再接收新预约，历史数据会保留。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setDeactivateConfirm(null)}>
                取消
              </button>
              <button className="btn-danger" onClick={() => handleDeactivate(deactivateConfirm)}>
                <Ban size={16} />
                确认停用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
