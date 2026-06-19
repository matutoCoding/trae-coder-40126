import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app';
import { RateTier, TimeRange } from '@shared/types';
import { generateId } from '@shared/utils';
import {
  Plus,
  Trash2,
  Save,
  X,
  Clock,
  Calendar,
  Percent,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const WEEKDAY_OPTIONS = [
  { value: 0, label: '日' },
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
];

const COLOR_PALETTE = [
  '#F97316',
  '#EF4444',
  '#8B5CF6',
  '#10B981',
  '#3B82F6',
  '#EC4899',
  '#F59E0B',
  '#06B6D4',
  '#6366F1',
  '#84CC16',
];

interface EditingTier extends Omit<RateTier, 'id'> {
  id?: string;
  isNew?: boolean;
}

function createEmptyTier(): EditingTier {
  return {
    name: '',
    color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
    multiplier: 1.0,
    timeRanges: [{ start: '09:00', end: '17:00' }],
    applicableWeekdays: [1, 2, 3, 4, 5],
    priority: 0,
    isNew: true,
  };
}

export default function RateConfig() {
  const rates = useAppStore(s => s.rates);
  const fetchRates = useAppStore(s => s.fetchRates);
  const saveRates = useAppStore(s => s.saveRates);
  const saveSingleTierStore = useAppStore(s => s.saveSingleTier);

  const [editingMap, setEditingMap] = useState<Record<string, EditingTier>>({});
  const [showNewTier, setShowNewTier] = useState(false);
  const [newTier, setNewTier] = useState<EditingTier>(createEmptyTier());
  const [savingAll, setSavingAll] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savingTierId, setSavingTierId] = useState<string>('');
  const [singleTierSuccess, setSingleTierSuccess] = useState<string>('');

  useEffect(() => {
    if (saveError) {
      const t = setTimeout(() => setSaveError(''), 4000);
      return () => clearTimeout(t);
    }
  }, [saveError]);

  useEffect(() => {
    if (singleTierSuccess) {
      const t = setTimeout(() => setSingleTierSuccess(''), 2000);
      return () => clearTimeout(t);
    }
  }, [singleTierSuccess]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const startEditing = (tier: RateTier) => {
    setEditingMap(prev => ({ ...prev, [tier.id]: { ...tier } }));
  };

  const cancelEditing = (id: string) => {
    setEditingMap(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateEditing = (id: string, patch: Partial<EditingTier>) => {
    setEditingMap(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveSingleTier = async (id: string) => {
    const editing = editingMap[id];
    if (!editing) return;
    setSavingTierId(id);
    setSaveError('');
    const tier: RateTier = {
      id,
      name: editing.name,
      color: editing.color,
      multiplier: editing.multiplier,
      timeRanges: editing.timeRanges,
      applicableWeekdays: editing.applicableWeekdays,
      priority: editing.priority,
      description: editing.description,
    };
    const res = await saveSingleTierStore(tier);
    setSavingTierId('');
    if (res.success) {
      setSingleTierSuccess(id);
      cancelEditing(id);
    } else {
      setSaveError(res.message || '保存失败，请检查配置');
    }
  };

  const validateBeforeSave = (tiers: RateTier[]): string => {
    if (!tiers || tiers.length === 0) {
      return '至少需要保留一个费率档位';
    }
    const hasDefault = tiers.some(t => t.priority === 0);
    if (!hasDefault) {
      return '请至少保留一个优先级为 0 的默认档位，否则系统无法兜底计费';
    }
    for (const t of tiers) {
      if (!t.name?.trim()) {
        return '所有档位必须填写名称';
      }
      if (!t.timeRanges || t.timeRanges.length === 0) {
        return `档位「${t.name}」必须至少设置一个时段`;
      }
      for (const r of t.timeRanges) {
        if (r.start >= r.end) {
          return `档位「${t.name}」存在无效时段（${r.start}-${r.end}）`;
        }
      }
      if (typeof t.multiplier !== 'number' || t.multiplier <= 0) {
        return `档位「${t.name}」的费率系数必须为正数`;
      }
    }
    return '';
  };

  const deleteTier = async (id: string) => {
    const allTiers = rates.filter(r => r.id !== id);
    const err = validateBeforeSave(allTiers);
    if (err) {
      setSaveError(err);
      return;
    }
    setSaveError('');
    const res = await saveRates(allTiers);
    if (!res.success) {
      setSaveError(res.message || '删除失败');
    }
  };

  const updateWeekday = (id: string, day: number, selected: boolean) => {
    const current = editingMap[id]?.applicableWeekdays ?? [];
    const next = selected ? [...current, day].sort() : current.filter(d => d !== day);
    updateEditing(id, { applicableWeekdays: next });
  };

  const addTimeRange = (id: string) => {
    const current = editingMap[id]?.timeRanges ?? [];
    updateEditing(id, { timeRanges: [...current, { start: '12:00', end: '14:00' }] });
  };

  const removeTimeRange = (id: string, index: number) => {
    const current = editingMap[id]?.timeRanges ?? [];
    updateEditing(id, { timeRanges: current.filter((_, i) => i !== index) });
  };

  const updateTimeRange = (id: string, index: number, patch: Partial<TimeRange>) => {
    const current = editingMap[id]?.timeRanges ?? [];
    const next = current.map((r, i) => (i === index ? { ...r, ...patch } : r));
    updateEditing(id, { timeRanges: next });
  };

  const addNewTimeRange = () => {
    setNewTier(prev => ({
      ...prev,
      timeRanges: [...prev.timeRanges, { start: '12:00', end: '14:00' }],
    }));
  };

  const removeNewTimeRange = (index: number) => {
    setNewTier(prev => ({
      ...prev,
      timeRanges: prev.timeRanges.filter((_, i) => i !== index),
    }));
  };

  const updateNewTimeRange = (index: number, patch: Partial<TimeRange>) => {
    setNewTier(prev => ({
      ...prev,
      timeRanges: prev.timeRanges.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  };

  const updateNewWeekday = (day: number, selected: boolean) => {
    setNewTier(prev => ({
      ...prev,
      applicableWeekdays: selected
        ? [...prev.applicableWeekdays, day].sort()
        : prev.applicableWeekdays.filter(d => d !== day),
    }));
  };

  const submitNewTier = async () => {
    if (!newTier.name.trim()) return;
    const newRateTier: RateTier = {
      id: generateId('rate'),
      name: newTier.name,
      color: newTier.color,
      multiplier: newTier.multiplier,
      timeRanges: newTier.timeRanges,
      applicableWeekdays: newTier.applicableWeekdays,
      priority: newTier.priority,
      description: newTier.description,
    };
    const allTiers = [...rates, newRateTier];
    const err = validateBeforeSave(allTiers);
    if (err) {
      setSaveError(err);
      return;
    }
    setSaveError('');
    const res = await saveSingleTierStore(newRateTier);
    if (res.success) {
      setShowNewTier(false);
      setNewTier(createEmptyTier());
    } else {
      setSaveError(res.message || '创建失败');
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setSaveError('');
    const finalTiers: RateTier[] = rates.map(r => {
      const editing = editingMap[r.id];
      return editing ? ({ ...editing, id: r.id } as RateTier) : r;
    });
    if (showNewTier && newTier.name.trim()) {
      finalTiers.push({
        id: generateId('rate'),
        name: newTier.name,
        color: newTier.color,
        multiplier: newTier.multiplier,
        timeRanges: newTier.timeRanges,
        applicableWeekdays: newTier.applicableWeekdays,
        priority: newTier.priority,
        description: newTier.description,
      });
    }
    const err = validateBeforeSave(finalTiers);
    if (err) {
      setSaveError(err);
      setSavingAll(false);
      return;
    }
    const res = await saveRates(finalTiers);
    setSavingAll(false);
    if (res.success) {
      setEditingMap({});
      setShowNewTier(false);
      setNewTier(createEmptyTier());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } else {
      setSaveError(res.message || '保存失败');
    }
  };

  const displayTiers: Array<RateTier | EditingTier & { id?: string }> = [...rates].sort(
    (a, b) => b.priority - a.priority
  );

  const renderWeekdayChips = (
    weekdays: number[],
    onChange: (day: number, selected: boolean) => void,
    editing: boolean
  ) => (
    <div className="flex flex-wrap gap-1.5">
      {WEEKDAY_OPTIONS.map(opt => {
        const active = weekdays.includes(opt.value);
        if (!editing) {
          return active ? (
            <span
              key={opt.value}
              className="chip bg-brand-50 text-brand-600 border border-brand-100"
            >
              {opt.label}
            </span>
          ) : null;
        }
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value, !active)}
            className={`chip cursor-pointer transition-all border ${
              active
                ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                : 'bg-white text-stone-500 border-stone-200 hover:border-brand-300 hover:text-brand-500'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const renderTimeRanges = (
    ranges: TimeRange[],
    editing: boolean,
    onAdd?: () => void,
    onRemove?: (i: number) => void,
    onChange?: (i: number, p: Partial<TimeRange>) => void
  ) => (
    <div className="space-y-2">
      {ranges.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Clock size={14} className="text-stone-400 shrink-0" />
          {editing ? (
            <>
              <input
                type="time"
                value={r.start}
                onChange={e => onChange?.(i, { start: e.target.value })}
                className="input py-1.5 px-2.5 w-24 text-xs"
              />
              <span className="text-stone-400 text-xs">—</span>
              <input
                type="time"
                value={r.end}
                onChange={e => onChange?.(i, { end: e.target.value })}
                className="input py-1.5 px-2.5 w-24 text-xs"
              />
              {ranges.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove?.(i)}
                  className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </>
          ) : (
            <span className="text-sm text-stone-700 font-mono">
              {r.start} – {r.end}
            </span>
          )}
        </div>
      ))}
      {editing && (
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 pl-4"
        >
          <Plus size={12} /> 添加时段
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px] animate-fade-up pb-28">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="subtle">配置不同时段的费率倍率，影响账单自动计算</div>
          <h1 className="font-display text-4xl mt-1 text-stone-900">时段费率档位维护</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowNewTier(true)} disabled={showNewTier}>
          <Plus size={16} />
          新增档位
        </button>
      </div>

      <div className="card p-5 animate-fade-up">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle size={18} />
          </div>
          <div className="text-sm text-stone-600 leading-relaxed">
            <span className="font-semibold text-stone-800">说明：</span>
            系统按<strong className="text-brand-600">优先级从高到低</strong>匹配费率档位，
            同一时间跨多个档位时取最高优先级。倍率 = 每段单价 ÷ 训练师基础时薪/60。
            请确保各档位时段不冲突，或合理设置优先级。
          </div>
        </div>
      </div>

      {showNewTier && (
        <div className="card p-6 border-2 border-dashed border-brand-300 bg-gradient-to-br from-brand-50/60 to-white animate-fade-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Percent size={18} className="text-brand-600" />
              <h3 className="font-display text-xl text-stone-900">新增费率档位</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowNewTier(false);
                setNewTier(createEmptyTier());
              }}
              className="w-8 h-8 rounded-xl text-stone-400 hover:bg-stone-100 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-3">
              <label className="label">档位名称</label>
              <input
                type="text"
                value={newTier.name}
                onChange={e => setNewTier(prev => ({ ...prev, name: e.target.value }))}
                placeholder="如：早高峰"
                className="input"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="label">标识颜色</label>
              <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-stone-50 border border-stone-100">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTier(prev => ({ ...prev, color: c }))}
                    className={`w-7 h-7 rounded-lg transition-all ${
                      newTier.color === c
                        ? 'ring-2 ring-offset-2 ring-brand-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className="label">倍率</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">×</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newTier.multiplier}
                  onChange={e =>
                    setNewTier(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 0 }))
                  }
                  className="input pl-8"
                />
              </div>
            </div>
            <div className="lg:col-span-3">
              <label className="label">
                <Calendar size={12} className="inline mr-1" />
                适用星期
              </label>
              {renderWeekdayChips(newTier.applicableWeekdays, updateNewWeekday, true)}
            </div>
            <div className="lg:col-span-2">
              <label className="label">优先级</label>
              <input
                type="number"
                value={newTier.priority}
                onChange={e =>
                  setNewTier(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                }
                className="input"
              />
            </div>
            <div className="lg:col-span-12">
              <label className="label">适用时段</label>
              {renderTimeRanges(
                newTier.timeRanges,
                true,
                addNewTimeRange,
                removeNewTimeRange,
                updateNewTimeRange
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setShowNewTier(false);
                setNewTier(createEmptyTier());
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={submitNewTier}
              disabled={!newTier.name.trim()}
              className="btn-primary"
            >
              <Save size={14} />
              创建档位
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-gradient-to-r from-stone-50 to-cream-50 border-b border-stone-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  档位名称
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-600 uppercase tracking-wider w-32">
                  倍率
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  适用时段
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  适用星期
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-600 uppercase tracking-wider w-28">
                  优先级
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-stone-600 uppercase tracking-wider w-48">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTiers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-stone-400">
                    暂无费率档位，点击右上角「新增档位」开始配置
                  </td>
                </tr>
              )}
              {displayTiers.map((tier, idx) => {
                const id = tier.id!;
                const editing = editingMap[id];
                const data = editing ?? tier;
                const isEditing = !!editing;
                return (
                  <tr
                    key={id}
                    className={`border-b border-stone-100 last:border-0 transition-colors ${
                      isEditing ? 'bg-brand-50/40' : 'hover:bg-stone-50/60'
                    }`}
                    style={{ animationDelay: `${150 + idx * 40}ms` }}
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                          style={{ background: data.color }}
                        />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editing.name}
                            onChange={e => updateEditing(id, { name: e.target.value })}
                            className="input py-1.5 px-2.5 text-sm w-32"
                          />
                        ) : (
                          <div className="font-semibold text-stone-800">{data.name}</div>
                        )}
                        {isEditing && (
                          <div className="flex gap-1 p-1.5 rounded-lg bg-stone-50 border border-stone-100">
                            {COLOR_PALETTE.slice(0, 6).map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => updateEditing(id, { color: c })}
                                className={`w-5 h-5 rounded-md transition-all ${
                                  editing.color === c
                                    ? 'ring-2 ring-offset-1 ring-brand-400 scale-110'
                                    : 'hover:scale-105'
                                }`}
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {isEditing ? (
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium text-sm">
                            ×
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={editing.multiplier}
                            onChange={e =>
                              updateEditing(id, { multiplier: parseFloat(e.target.value) || 0 })
                            }
                            className="input py-1.5 pl-8 pr-2.5 text-sm"
                          />
                        </div>
                      ) : (
                        <div
                          className="font-display text-2xl"
                          style={{ color: data.color }}
                        >
                          ×{data.multiplier.toFixed(1)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderTimeRanges(
                        data.timeRanges,
                        isEditing,
                        () => addTimeRange(id),
                        i => removeTimeRange(id, i),
                        (i, p) => updateTimeRange(id, i, p)
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {data.applicableWeekdays.length === 0 ? (
                        <span className="subtle text-xs">每天</span>
                      ) : (
                        renderWeekdayChips(
                          data.applicableWeekdays,
                          (d, s) => updateWeekday(id, d, s),
                          isEditing
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editing.priority}
                          onChange={e =>
                            updateEditing(id, { priority: parseInt(e.target.value) || 0 })
                          }
                          className="input py-1.5 px-2.5 text-sm w-20"
                        />
                      ) : (
                        <span className="font-mono text-sm text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
                          P{data.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex justify-end gap-2 items-center">
                        {singleTierSuccess === id && (
                          <span className="chip bg-forest-50 text-forest-600 border border-forest-100 animate-fade-up text-xs">
                            <CheckCircle2 size={10} className="mr-0.5" />
                            已保存
                          </span>
                        )}
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveSingleTier(id)}
                              disabled={savingTierId === id}
                              className="btn-success !py-1.5 !px-3 text-xs"
                            >
                              {savingTierId === id ? (
                                <>
                                  <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                  保存中
                                </>
                              ) : (
                                <>
                                  <Save size={12} />
                                  保存本档
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelEditing(id)}
                              className="btn-secondary !py-1.5 !px-3 text-xs"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(tier as RateTier)}
                              className="btn-outline !py-1.5 !px-3 text-xs"
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTier(id)}
                              className="btn-danger !py-1.5 !px-3 text-xs"
                            >
                              <Trash2 size={12} />
                              删除
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 ml-64 z-20">
        <div className="mx-8 mb-6">
          <div className="card p-4 flex items-center justify-between flex-wrap gap-4 shadow-soft border border-brand-100 bg-gradient-to-r from-white via-white to-brand-50/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-sm">
                <Percent size={18} />
              </div>
              <div>
                <div className="subtle text-xs">当前配置</div>
                <div className="font-semibold text-stone-800">
                  <span className="text-brand-600 font-display text-xl">
                    {rates.length}
                  </span>{' '}
                  个费率档位
                  {Object.keys(editingMap).length > 0 && (
                    <span className="chip bg-amber-50 text-amber-700 ml-2 border border-amber-100">
                      {Object.keys(editingMap).length} 档编辑中
                    </span>
                  )}
                  {showNewTier && (
                    <span className="chip bg-forest-50 text-forest-700 ml-2 border border-forest-100">
                      1 档待创建
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveError && (
                <span className="chip bg-red-50 text-red-600 border border-red-200 animate-fade-up">
                  <AlertCircle size={12} className="mr-1" />
                  {saveError}
                </span>
              )}
              {saveSuccess && (
                <span className="chip bg-forest-50 text-forest-600 border border-forest-100 animate-fade-up">
                  <CheckCircle2 size={12} className="mr-1" />
                  保存成功
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={
                  savingAll ||
                  (Object.keys(editingMap).length === 0 &&
                    !(showNewTier && newTier.name.trim()))
                }
                className="btn-primary !py-3 !px-6 text-sm"
              >
                {savingAll ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    保存所有修改
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
