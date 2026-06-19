import { useEffect, useState } from 'react';
import { http } from '@/utils/http';
import {
  Users2,
  CalendarCheck2,
  HandCoins,
  ClipboardList,
  TrendingUp,
  CalendarRange,
  Star,
  ChevronRight,
  XCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatTimeOnly } from '@shared/utils';
import { useAppStore } from '@/store/app';
import { useNavigate } from 'react-router-dom';
import { Booking, Assessment } from '@shared/types';

interface DashboardSummary {
  activeTrainerCount: number;
  todayBookingCount: number;
  todayCancelledCount: number;
  todayCompletedCount: number;
  revenue: { totalRevenue: number; paid: number; pending: number; totalCount: number };
  assessmentCountThisMonth: number;
  recentBookings: Booking[];
  recentAssessments: Assessment[];
}

const STAT_CARDS = [
  {
    key: 'trainers',
    label: '在岗训练师',
    icon: Users2,
    color: 'from-brand-500 to-brand-600',
    bg: 'bg-brand-50',
    iconBg: 'bg-brand-100',
    iconText: 'text-brand-600',
  },
  {
    key: 'bookings',
    label: '今日预约',
    icon: CalendarCheck2,
    color: 'from-forest-500 to-forest-600',
    bg: 'bg-forest-50',
    iconBg: 'bg-forest-100',
    iconText: 'text-forest-600',
  },
  {
    key: 'revenue',
    label: '累计营收',
    icon: HandCoins,
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
  },
  {
    key: 'assessments',
    label: '本月评估',
    icon: ClipboardList,
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-600',
  },
];

const PET_TYPE_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱', other: '🐾' };

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const trainers = useAppStore(s => s.trainers);
  const navigate = useNavigate();

  useEffect(() => {
    http.get<DashboardSummary>('/dashboard/summary').then(r => {
      if (r.success && r.data) setSummary(r.data);
    });
  }, []);

  const getTrainerName = (id: string) => trainers.find(t => t.id === id)?.name ?? id;

  const stats = summary
    ? [
        { value: summary.activeTrainerCount, suffix: '人' },
        { value: summary.todayBookingCount, suffix: '节' },
        { value: summary.revenue.totalRevenue, prefix: '¥', decimals: 2 },
        { value: summary.assessmentCountThisMonth, suffix: '份' },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-[1400px] animate-fade-up">
      <div className="flex items-end justify-between">
        <div>
          <div className="subtle">欢迎回来，今天也要和毛孩子们一起进步 🐾</div>
          <h1 className="font-display text-4xl mt-1 text-stone-900">运营总览</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/bookings/new')}>
          <CalendarRange size={16} />
          新建预约
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAT_CARDS.map((c, i) => {
          const Icon = c.icon;
          const s = stats[i];
          const displayValue = s
            ? (s.prefix ?? '') +
              (typeof s.value === 'number' && s.decimals
                ? s.value.toFixed(s.decimals)
                : s.value) +
              (s.suffix ?? '')
            : '—';
          return (
            <div
              key={c.key}
              className="card p-6 relative overflow-hidden animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className="flex items-start justify-between relative">
                <div>
                  <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">{c.label}</div>
                  <div className="font-display text-4xl mt-3 text-stone-900 animate-count-up">
                    {displayValue}
                  </div>
                  {i === 1 && summary && (
                    <div className="flex items-center gap-2 mt-3 text-xs">
                      <span className="chip bg-forest-50 text-forest-600">
                        <CheckCircle2 size={12} className="mr-1" />完成 {summary.todayCompletedCount}
                      </span>
                      <span className="chip bg-red-50 text-red-600">
                        <XCircle size={12} className="mr-1" />取消 {summary.todayCancelledCount}
                      </span>
                    </div>
                  )}
                  {i === 2 && summary && (
                    <div className="flex items-center gap-2 mt-3 text-xs">
                      <span className="chip bg-forest-50 text-forest-600">
                        已收 ¥{summary.revenue.paid.toFixed(0)}
                      </span>
                      <span className="chip bg-amber-50 text-amber-700">
                        待收 ¥{summary.revenue.pending.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-2xl ${c.iconBg} flex items-center justify-center ${c.iconText} shadow-sm`}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 animate-fade-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-xl text-stone-900">今日课程排程</h2>
              <div className="subtle mt-0.5">实时查看当日所有训练师预约安排</div>
            </div>
            <button className="btn-outline text-xs py-2" onClick={() => navigate('/schedule')}>
              完整日历
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3 max-h-[440px] scroll-area pr-2">
            {summary?.recentBookings?.length === 0 && (
              <div className="text-center py-16 subtle">今日暂无排程 🐾</div>
            )}
            {summary?.recentBookings.map((b, idx) => (
              <div
                key={b.id}
                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-soft hover:bg-stone-50/80 ${
                  b.status === 'cancelled'
                    ? 'border-red-100 bg-red-50/50 opacity-75'
                    : b.status === 'completed'
                    ? 'border-forest-100 bg-forest-50/30'
                    : 'border-stone-150 bg-white border'
                }`}
                onClick={() => navigate('/bookings')}
                style={{ animationDelay: `${300 + idx * 40}ms` }}
              >
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-brand-100 to-cream-50 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  {PET_TYPE_EMOJI[b.petType]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{b.petName}</span>
                    <span className="subtle">· {b.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="flex items-center gap-1 text-stone-600">
                      <Clock size={12} />
                      {formatTimeOnly(b.startAt)} – {formatTimeOnly(b.endAt)}
                    </span>
                    <span className="text-stone-400">|</span>
                    <span className="text-stone-600">{getTrainerName(b.trainerId)}</span>
                    {b.courseType && (
                      <>
                        <span className="text-stone-400">|</span>
                        <span className="text-stone-600">{b.courseType}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {b.status === 'confirmed' && (
                    <span className="chip bg-brand-50 text-brand-600 border border-brand-100">
                      已确认
                    </span>
                  )}
                  {b.status === 'completed' && (
                    <span className="chip bg-forest-50 text-forest-600 border border-forest-100">
                      已完成
                    </span>
                  )}
                  {b.status === 'cancelled' && (
                    <span className="chip bg-stone-100 text-stone-500">
                      已取消
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 animate-fade-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-xl text-stone-900">最近评估记录</h2>
              <div className="subtle mt-0.5">训练师课后填写的表现反馈</div>
            </div>
            <button className="text-xs text-brand-600 font-medium hover:underline" onClick={() => navigate('/assessments')}>
              查看全部
            </button>
          </div>
          <div className="space-y-4 max-h-[440px] scroll-area pr-1">
            {summary?.recentAssessments.map((a, idx) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-stone-50 to-white border border-stone-100 hover:shadow-soft transition-shadow animate-fade-up"
                style={{ animationDelay: `${400 + idx * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800">{a.petName}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < a.score ? 'currentColor' : 'none'}
                          strokeWidth={1.6}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {formatDateTime(a.createdAt, 'MM-dd HH:mm')}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed line-clamp-2">
                  {a.notes}
                </p>
                {a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {a.tags.map(tag => (
                      <span key={tag} className="chip bg-cream-50 text-amber-700 text-[10px] px-2 py-0.5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!summary?.recentAssessments.length && (
              <div className="text-center py-16 subtle">暂无评估记录</div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 animate-fade-up" style={{ animationDelay: '450ms' }}>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={20} className="text-brand-500" />
          <h2 className="font-display text-xl text-stone-900">费率档位速查</h2>
          <span className="subtle ml-2">（不同时段适用不同费率倍率）</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: '早高峰', mult: '×1.3', time: '07:00 – 09:00', color: '#F97316', week: '工作日' },
            { name: '平峰', mult: '×1.0', time: '09:00 – 17:00', color: '#3B82F6', week: '工作日' },
            { name: '晚高峰', mult: '×1.5', time: '17:00 – 20:00', color: '#EF4444', week: '工作日/周六' },
            { name: '夜间档', mult: '×1.8', time: '20:00 – 22:00', color: '#8B5CF6', week: '每日' },
          ].map(r => (
            <div key={r.name} className="p-5 rounded-2xl border border-stone-100 bg-white relative overflow-hidden group hover:shadow-soft transition-shadow">
              <div className="absolute top-0 left-0 h-1 w-full" style={{ background: r.color }} />
              <div className="flex items-center justify-between">
                <div className="font-semibold text-stone-800">{r.name}</div>
                <div className="font-display text-xl" style={{ color: r.color }}>
                  {r.mult}
                </div>
              </div>
              <div className="mt-2 text-xs text-stone-500">{r.time}</div>
              <div className="mt-1 text-[11px] text-stone-400">{r.week}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
