import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  CheckSquare,
  UserX,
  Calendar,
  Filter,
  Users,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app';
import { Booking } from '@shared/types';
import { formatDateTime, formatTimeOnly, formatDuration, minutesBetween, formatDate } from '@shared/utils';

const PET_TYPE_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱', other: '🐾' };
const PET_TYPE_LABEL: Record<string, string> = { dog: '狗狗', cat: '猫咪', other: '其他' };

type StatusFilter = 'all' | 'confirmed' | 'completed' | 'cancelled';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'confirmed', label: '已确认' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function BookingList() {
  const navigate = useNavigate();
  const {
    trainers,
    bookings,
    bills,
    fetchTrainers,
    fetchBookings,
    fetchBills,
    completeBooking,
    cancelBooking,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [trainerFilter, setTrainerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    Promise.all([fetchTrainers(), fetchBookings(), fetchBills()]).finally(() => setLoading(false));
  }, [fetchTrainers, fetchBookings, fetchBills]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', msg: string) => setToast({ type, msg });

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => {
        if (trainerFilter && b.trainerId !== trainerFilter) return false;
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (ownerSearch && !b.ownerName.toLowerCase().includes(ownerSearch.toLowerCase())) return false;
        if (dateFilter) {
          const bDate = formatDate(b.startAt);
          if (bDate !== dateFilter) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [bookings, trainerFilter, statusFilter, ownerSearch, dateFilter]);

  const getTrainerName = (id: string) => trainers.find(t => t.id === id)?.name ?? '-';

  const getBillId = (bookingId: string) => bills.find(b => b.bookingId === bookingId)?.id;

  const getStatusChip = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="chip bg-brand-50 text-brand-600 border border-brand-100">
            <CheckCircle2 size={10} className="mr-1" />已确认
          </span>
        );
      case 'completed':
        return (
          <span className="chip bg-forest-50 text-forest-600 border border-forest-100">
            <CheckSquare size={10} className="mr-1" />已完成
          </span>
        );
      case 'cancelled':
        return (
          <span className="chip bg-stone-100 text-stone-500">
            <XCircle size={10} className="mr-1" />已取消
          </span>
        );
    }
  };

  const handleComplete = async (booking: Booking) => {
    const ok = await completeBooking(booking.id);
    if (ok) {
      showToast('success', `预约已标记完成：${booking.petName}`);
    } else {
      showToast('error', '操作失败，请重试');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const ok = await cancelBooking(cancelTarget.id);
    setCancelling(false);
    if (ok) {
      showToast('success', `预约已退订：${cancelTarget.petName}`);
      setCancelTarget(null);
    } else {
      showToast('error', '退订失败，请重试');
    }
  };

  const statusCounts = useMemo(() => ({
    all: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }), [bookings]);

  const clearFilters = () => {
    setTrainerFilter('');
    setStatusFilter('all');
    setOwnerSearch('');
    setDateFilter('');
  };

  const hasFilters = trainerFilter || statusFilter !== 'all' || ownerSearch || dateFilter;

  return (
    <div className="space-y-6 max-w-[1500px] animate-fade-up">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="subtle">查看与管理所有宠物训练课程预约</div>
          <h1 className="font-display text-4xl mt-1 text-stone-900">预约管理</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/bookings/new')}>
          <Plus size={16} />
          新建预约
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUS_OPTIONS.map(opt => {
          const count = statusCounts[opt.value];
          const active = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`card p-4 text-left transition-all hover:shadow-soft ${
                active ? 'ring-2 ring-brand-400 ring-offset-2 bg-brand-50/40' : ''
              }`}
            >
              <div className="text-xs text-stone-500">{opt.label}</div>
              <div className="font-display text-2xl mt-1 text-stone-900">{count}</div>
            </button>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-stone-500" />
          <span className="font-semibold text-sm text-stone-700">筛选条件</span>
          {hasFilters && (
            <button
              className="ml-auto text-xs text-stone-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
              onClick={clearFilters}
            >
              <X size={12} />
              清除筛选
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">训练师</label>
            <div className="relative">
              <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <select
                className="input pl-10 appearance-none"
                value={trainerFilter}
                onChange={e => setTrainerFilter(e.target.value)}
              >
                <option value="">全部训练师</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">日期</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="date"
                className="input pl-10"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">宠主姓名</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="搜索宠主姓名"
                value={ownerSearch}
                onChange={e => setOwnerSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">状态</label>
            <select
              className="input appearance-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-100">
                <th className="text-left px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">时间</th>
                <th className="text-left px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">宠主 / 宠物</th>
                <th className="text-left px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">训练师</th>
                <th className="text-left px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">课程</th>
                <th className="text-left px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">时长</th>
                <th className="text-left px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">状态</th>
                <th className="text-right px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 subtle">加载中…</td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="text-center py-16">
                      <div className="text-4xl mb-3">🐾</div>
                      <div className="subtle mb-1">暂无符合条件的预约</div>
                      <div className="text-xs text-stone-400">试试调整筛选条件</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, idx) => {
                  const duration = minutesBetween(b.startAt, b.endAt);
                  const billId = getBillId(b.id);
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-stone-50 hover:bg-cream-50/40 transition-colors animate-fade-up"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-stone-800">{formatDateTime(b.startAt, 'MM-dd')}</div>
                        <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                          <Clock size={11} />
                          {formatTimeOnly(b.startAt)} – {formatTimeOnly(b.endAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cream-50 to-brand-50 flex items-center justify-center text-xl shrink-0">
                            {PET_TYPE_EMOJI[b.petType]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-800 truncate">
                              {b.petName}
                              <span className="text-[10px] text-stone-400 ml-1.5 font-normal">
                                {PET_TYPE_LABEL[b.petType]}
                                {b.petBreed && ` · ${b.petBreed}`}
                              </span>
                            </div>
                            <div className="text-xs text-stone-500 truncate mt-0.5">
                              {b.ownerName}
                              {b.ownerPhone && <span className="ml-2 text-stone-400">{b.ownerPhone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-stone-700">{getTrainerName(b.trainerId)}</span>
                      </td>
                      <td className="px-5 py-4">
                        {b.courseType ? (
                          <span className="chip bg-violet-50 text-violet-600 border border-violet-100">
                            {b.courseType}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-stone-600">{formatDuration(duration)}</span>
                      </td>
                      <td className="px-5 py-4">{getStatusChip(b.status)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {billId && (
                            <button
                              className="btn-outline !px-2.5 !py-1.5 text-xs"
                              onClick={() => navigate(`/bills/${billId}`)}
                              title="查看账单"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">账单</span>
                            </button>
                          )}
                          {b.status === 'confirmed' && (
                            <>
                              <button
                                className="btn-success !px-2.5 !py-1.5 text-xs"
                                onClick={() => handleComplete(b)}
                                title="完成课程"
                              >
                                <CheckSquare size={14} />
                                <span className="hidden sm:inline">完成</span>
                              </button>
                              <button
                                className="btn-danger !px-2.5 !py-1.5 text-xs"
                                onClick={() => setCancelTarget(b)}
                                title="退订"
                              >
                                <UserX size={14} />
                                <span className="hidden sm:inline">退订</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredBookings.length > 0 && (
          <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50 text-xs text-stone-500 flex items-center justify-between">
            <span>共 {filteredBookings.length} 条记录</span>
            <span>按预约时间倒序排列</span>
          </div>
        )}
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-up">
          <div className="card p-7 w-full max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-display text-xl text-stone-900">确认退订此预约？</h3>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{PET_TYPE_EMOJI[cancelTarget.petType]}</span>
                    <span className="font-semibold text-stone-700">{cancelTarget.petName}</span>
                    <span className="text-stone-400">· {cancelTarget.ownerName}</span>
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-1">
                    <Clock size={11} />
                    {formatDateTime(cancelTarget.startAt, 'yyyy-MM-dd HH:mm')} – {formatTimeOnly(cancelTarget.endAt)}
                  </div>
                </div>
                <p className="subtle mt-3 text-xs">
                  退订后将无法恢复，已关联的账单也会同步取消。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                再想想
              </button>
              <button className="btn-danger" onClick={handleConfirmCancel} disabled={cancelling}>
                {cancelling ? '处理中…' : '确认退订'}
              </button>
            </div>
          </div>
        </div>
      )}

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
