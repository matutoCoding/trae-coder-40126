import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/app';
import { Bill, Trainer } from '@shared/types';
import { formatCurrency, formatDateTime } from '@shared/utils';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  HandCoins,
  CircleDollarSign,
  Clock,
  FileText,
  ChevronRight,
  CreditCard,
  Search,
  Users2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'paid' | 'cancelled';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '已支付' },
  { key: 'cancelled', label: '已取消' },
];

const STATUS_META: Record<
  Bill['status'],
  { label: string; chip: string; dot: string }
> = {
  pending: {
    label: '待支付',
    chip: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  paid: {
    label: '已支付',
    chip: 'bg-forest-50 text-forest-600 border border-forest-200',
    dot: 'bg-forest-500',
  },
  cancelled: {
    label: '已取消',
    chip: 'bg-stone-100 text-stone-500 border border-stone-200',
    dot: 'bg-stone-400',
  },
};

export default function BillList() {
  const bills = useAppStore(s => s.bills);
  const trainers = useAppStore(s => s.trainers);
  const fetchBills = useAppStore(s => s.fetchBills);
  const payBill = useAppStore(s => s.payBill);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [payingId, setPayingId] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const stats = useMemo(() => {
    const activeBills = bills.filter(b => b.status !== 'cancelled');
    const totalRevenue = activeBills.reduce((s, b) => s + b.totalAmount, 0);
    const paid = bills
      .filter(b => b.status === 'paid')
      .reduce((s, b) => s + b.totalAmount, 0);
    const pending = bills
      .filter(b => b.status === 'pending')
      .reduce((s, b) => s + b.totalAmount, 0);
    return {
      totalRevenue,
      paid,
      pending,
      count: bills.length,
      activeCount: activeBills.length,
    };
  }, [bills]);

  const handleMarkPaid = async (billId: string) => {
    setPayingId(billId);
    const ok = await payBill(billId);
    setPayingId('');
    if (ok) {
      setToast({ type: 'success', msg: '已标记为收款成功' });
    } else {
      setToast({ type: 'error', msg: '操作失败，请重试' });
    }
  };

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return bills
      .filter(b => (statusFilter === 'all' ? true : b.status === statusFilter))
      .filter(b =>
        trainerFilter === 'all' ? true : b.trainerId === trainerFilter
      )
      .filter(b =>
        kw === ''
          ? true
          : b.ownerName.toLowerCase().includes(kw) ||
            b.petName.toLowerCase().includes(kw) ||
            b.id.toLowerCase().includes(kw)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [bills, statusFilter, trainerFilter, search]);

  const getTrainerName = (id: string) =>
    trainers.find((t: Trainer) => t.id === id)?.name ?? id;

  const STAT_CARDS = [
    {
      key: 'total',
      label: '累计营收',
      value: formatCurrency(stats.totalRevenue),
      icon: HandCoins,
      color: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
    },
    {
      key: 'paid',
      label: '已收款',
      value: formatCurrency(stats.paid),
      icon: CircleDollarSign,
      color: 'from-forest-500 to-emerald-600',
      iconBg: 'bg-forest-100',
      iconText: 'text-forest-600',
    },
    {
      key: 'pending',
      label: '待收款',
      value: formatCurrency(stats.pending),
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
    },
    {
      key: 'count',
      label: '有效账单数',
      value: `${stats.activeCount} 单`,
      icon: FileText,
      color: 'from-brand-500 to-brand-600',
      iconBg: 'bg-brand-100',
      iconText: 'text-brand-600',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] animate-fade-up">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="subtle">查看所有课程账单、追踪支付状态</div>
          <h1 className="font-display text-4xl mt-1 text-stone-900">账单中心</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAT_CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={c.key}
              className="card p-6 relative overflow-hidden animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`}
              />
              <div className="flex items-start justify-between relative">
                <div>
                  <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
                    {c.label}
                  </div>
                  <div className="font-display text-3xl mt-3 text-stone-900 animate-count-up">
                    {c.value}
                  </div>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl ${c.iconBg} flex items-center justify-center ${c.iconText} shadow-sm`}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5 animate-fade-up" style={{ animationDelay: '250ms' }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map(tab => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`chip !py-2 !px-4 cursor-pointer transition-all border ${
                    active
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-brand-300 hover:text-brand-600'
                  }`}
                >
                  {tab.label}
                  {tab.key !== 'all' && (
                    <span
                      className={`ml-1.5 text-[10px] font-semibold ${
                        active ? 'text-white/80' : 'text-stone-400'
                      }`}
                    >
                      {bills.filter(b => b.status === tab.key).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-w-[200px] max-w-xs">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索宠主/宠物/账单号"
                className="input pl-9 py-2 bg-stone-50/60"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users2 size={15} className="text-stone-400 shrink-0" />
            <select
              value={trainerFilter}
              onChange={e => setTrainerFilter(e.target.value)}
              className="input py-2 bg-stone-50/60 w-40"
            >
              <option value="all">全部训练师</option>
              {trainers.map((t: Trainer) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="card p-16 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-3xl bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
              <Receipt size={32} strokeWidth={1.5} />
            </div>
            <div className="font-display text-xl text-stone-700 mt-5">暂无匹配账单</div>
            <div className="subtle mt-1">调整筛选条件或稍后再试</div>
          </div>
        )}

        {filtered.map((bill, idx) => {
          const meta = STATUS_META[bill.status];
          return (
            <div
              key={bill.id}
              className="card p-6 hover:shadow-soft transition-all animate-fade-up group cursor-pointer"
              style={{ animationDelay: `${300 + idx * 40}ms` }}
              onClick={() => navigate(`/bills/${bill.id}`)}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-stone-500 font-semibold tracking-wide">
                      {bill.id.toUpperCase()}
                    </span>
                    <span className={`chip ${meta.chip}`}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${meta.dot} mr-1.5`}
                      />
                      {meta.label}
                    </span>
                    <span className="text-xs text-stone-400">
                      {formatDateTime(bill.createdAt)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-100 to-cream-50 flex items-center justify-center text-lg">
                        🐾
                      </div>
                      <div>
                        <div className="text-sm">
                          <span className="font-semibold text-stone-800">
                            {bill.ownerName}
                          </span>
                          <span className="text-stone-400 mx-1">·</span>
                          <span className="font-medium text-stone-700">
                            {bill.petName}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          宠主 / 宠物
                        </div>
                      </div>
                    </div>

                    <div className="w-px h-10 bg-stone-100 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                        <Users2 size={16} className="text-violet-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-stone-800">
                          {getTrainerName(bill.trainerId)}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">训练师</div>
                      </div>
                    </div>

                    <div className="w-px h-10 bg-stone-100 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-100 to-forest-50 flex items-center justify-center">
                        <Clock size={16} className="text-forest-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-stone-800">
                          {bill.coursePeriod}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">课程时段</div>
                      </div>
                    </div>
                  </div>

                  {bill.segments.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-stone-100/80">
                      <span className="text-xs text-stone-400 mr-1">分段明细：</span>
                      {bill.segments.map((seg, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-50 border border-stone-100"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: seg.tierColor }}
                          />
                          <span className="text-xs text-stone-600 font-medium">
                            {seg.tierName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-stone-400 uppercase tracking-wider">
                      合计金额
                    </div>
                    <div className="font-display text-3xl mt-1 text-stone-900">
                      {formatCurrency(bill.totalAmount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {bill.status === 'pending' && (
                      <button
                        className="btn-success !py-2 !px-4 text-xs"
                        disabled={payingId === bill.id}
                        onClick={async e => {
                          e.stopPropagation();
                          await handleMarkPaid(bill.id);
                        }}
                      >
                        {payingId === bill.id ? (
                          <>
                            <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            处理中
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} />
                            标记已收款
                          </>
                        )}
                      </button>
                    )}
                    <button
                      className="btn-outline !py-2 !px-4 text-xs group-hover:border-brand-300 group-hover:text-brand-600"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/bills/${bill.id}`);
                      }}
                    >
                      查看详情
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
