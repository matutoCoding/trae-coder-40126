import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/app';
import { Bill, Trainer } from '@shared/types';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
} from '@shared/utils';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Receipt,
  Clock,
  Users2,
  PawPrint,
  CalendarDays,
  Hash,
  CreditCard,
  CheckCircle2,
  Star,
  FileText,
  ArrowLeft,
} from 'lucide-react';

const STATUS_META: Record<
  Bill['status'],
  { label: string; chip: string; icon: any; iconBg: string; iconText: string }
> = {
  pending: {
    label: '待支付',
    chip: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: Clock,
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
  paid: {
    label: '已支付',
    chip: 'bg-forest-50 text-forest-600 border border-forest-200',
    icon: CheckCircle2,
    iconBg: 'bg-forest-100',
    iconText: 'text-forest-600',
  },
  cancelled: {
    label: '已取消',
    chip: 'bg-stone-100 text-stone-500 border border-stone-200',
    icon: FileText,
    iconBg: 'bg-stone-100',
    iconText: 'text-stone-500',
  },
};

function numberToChinese(num: number): string {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟', '万'];
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let intStr = '';
  if (intPart === 0) {
    intStr = '零';
  } else {
    const intDigits = intPart.toString().split('').map(Number).reverse();
    for (let i = 0; i < intDigits.length; i++) {
      if (intDigits[i] !== 0) {
        intStr = digits[intDigits[i]] + units[i] + intStr;
      } else if (!intStr.startsWith('零') && intStr !== '') {
        intStr = '零' + intStr;
      }
    }
    intStr = intStr.replace(/零+$/, '');
  }

  let decStr = '';
  if (decPart === 0) {
    decStr = '整';
  } else {
    const jiao = Math.floor(decPart / 10);
    const fen = decPart % 10;
    if (jiao) decStr += digits[jiao] + '角';
    if (fen) decStr += digits[fen] + '分';
  }

  return `人民币 ${intStr}元${decStr}`;
}

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const bills = useAppStore(s => s.bills);
  const bookings = useAppStore(s => s.bookings);
  const trainers = useAppStore(s => s.trainers);
  const assessments = useAppStore(s => s.assessments);
  const payBill = useAppStore(s => s.payBill);
  const fetchBills = useAppStore(s => s.fetchBills);
  const navigate = useNavigate();

  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const bill = useMemo(() => bills.find(b => b.id === id), [bills, id]);
  const booking = useMemo(
    () => bookings.find(b => b.id === bill?.bookingId),
    [bookings, bill]
  );
  const trainer = useMemo(
    () => trainers.find((t: Trainer) => t.id === bill?.trainerId),
    [trainers, bill]
  );
  const relatedAssessment = useMemo(
    () => assessments.find(a => a.bookingId === bill?.bookingId),
    [assessments, bill]
  );

  const totalMinutes = useMemo(
    () => bill?.segments.reduce((s, x) => s + x.durationMinutes, 0) ?? 0,
    [bill]
  );

  if (!bill) {
    return (
      <div className="space-y-6 max-w-[1200px] animate-fade-up">
        <button
          onClick={() => navigate('/bills')}
          className="text-sm text-stone-500 hover:text-brand-600 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> 返回账单列表
        </button>
        <div className="card p-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
            <Receipt size={32} strokeWidth={1.5} />
          </div>
          <div className="font-display text-xl text-stone-700 mt-5">
            账单不存在
          </div>
          <div className="subtle mt-1">可能已被删除或编号错误</div>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[bill.status];
  const StatusIcon = meta.icon;

  const handlePay = async () => {
    setPaying(true);
    await payBill(bill.id);
    setPaying(false);
  };

  const INFO_ITEMS = [
    {
      icon: Hash,
      label: '账单编号',
      value: bill.id.toUpperCase(),
      mono: true,
    },
    {
      icon: Receipt,
      label: '关联预约',
      value: booking ? booking.id.toUpperCase() : '—',
      mono: true,
    },
    {
      icon: CalendarDays,
      label: '创建时间',
      value: formatDateTime(bill.createdAt),
    },
    {
      icon: Users2,
      label: '训练师',
      value: trainer?.name ?? bill.trainerId,
    },
    {
      icon: Home,
      label: '宠主',
      value: bill.ownerName,
    },
    {
      icon: PawPrint,
      label: '宠物',
      value: bill.petName,
    },
    {
      icon: Clock,
      label: '课程时段',
      value: bill.coursePeriod,
    },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] animate-fade-up">
      <nav className="flex items-center gap-2 text-sm text-stone-500">
        <Link
          to="/bills"
          className="hover:text-brand-600 transition-colors flex items-center gap-1"
        >
          <Receipt size={14} />
          账单中心
        </Link>
        <ChevronRight size={13} className="text-stone-300" />
        <span className="text-stone-700 font-medium">详情</span>
      </nav>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl text-stone-900">
              账单详情
            </h1>
            <span className={`chip ${meta.chip} !py-1.5 !px-3 text-sm`}>
              <StatusIcon size={13} className="mr-1" />
              {meta.label}
            </span>
          </div>
          <div className="subtle mt-1">
            账单号 <span className="font-mono">{bill.id.toUpperCase()}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/bills')}
          className="btn-outline !py-2 text-xs"
        >
          <ArrowLeft size={13} />
          返回列表
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 animate-fade-up">
            <div className="flex items-center gap-3 mb-5">
              <div
                className={`w-10 h-10 rounded-xl ${meta.iconBg} flex items-center justify-center ${meta.iconText}`}
              >
                <StatusIcon size={18} />
              </div>
              <div>
                <h3 className="font-display text-lg text-stone-900">
                  账单状态
                </h3>
                <span className={`chip ${meta.chip} mt-1`}>{meta.label}</span>
              </div>
            </div>
            <div className="space-y-4">
              {INFO_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 pb-3 border-b border-stone-100 last:border-0 last:pb-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                        {item.label}
                      </div>
                      <div
                        className={`mt-0.5 text-sm text-stone-800 font-medium ${
                          item.mono ? 'font-mono' : ''
                        } truncate`}
                      >
                        {item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {relatedAssessment && (
            <div className="card p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center text-rose-600">
                  <Star size={18} fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-stone-900">
                    行为评估摘要
                  </h3>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {formatDateTime(relatedAssessment.createdAt)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < relatedAssessment.score ? 'currentColor' : 'none'}
                        strokeWidth={1.6}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-stone-700 ml-1">
                    {relatedAssessment.score}.0 分
                  </span>
                </div>

                {relatedAssessment.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {relatedAssessment.tags.map(tag => (
                      <span
                        key={tag}
                        className="chip bg-cream-50 text-amber-700 border border-amber-100 text-[11px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">
                    课堂笔记
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {relatedAssessment.notes}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50/60 to-cream-50 border border-brand-100">
                  <div className="text-xs text-brand-600 font-semibold uppercase tracking-wider mb-1">
                    训练师建议
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {relatedAssessment.recommendations}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 animate-fade-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-cream-50 flex items-center justify-center text-brand-600">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="font-display text-lg text-stone-900">
                  分段计费明细
                </h3>
                <div className="text-xs text-stone-400 mt-0.5">
                  按实际费率档位计算
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {bill.segments.map((seg, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl border border-stone-100 bg-white overflow-hidden hover:shadow-soft transition-shadow animate-fade-up"
                  style={{ animationDelay: `${100 + i * 60}ms` }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ background: seg.tierColor }}
                  />
                  <div className="p-5 pl-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ background: seg.tierColor }}
                        >
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-800">
                              {seg.tierName}
                            </span>
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: seg.tierColor }}
                            />
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5 font-mono">
                            {seg.startTime} – {seg.endTime}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-display text-2xl text-stone-900">
                          {formatCurrency(seg.subtotal)}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {formatDuration(seg.durationMinutes)} ×{' '}
                          {formatCurrency(seg.unitPrice)}/分钟
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-stone-100/80">
                      <div>
                        <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                          时长
                        </div>
                        <div className="text-sm font-semibold text-stone-700 mt-0.5">
                          {seg.durationMinutes} 分钟
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                          单价
                        </div>
                        <div className="text-sm font-semibold text-stone-700 mt-0.5">
                          {formatCurrency(seg.unitPrice)}/分
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                          小计
                        </div>
                        <div
                          className="text-sm font-semibold mt-0.5"
                          style={{ color: seg.tierColor }}
                        >
                          {formatCurrency(seg.subtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="card p-6 bg-gradient-to-br from-white via-cream-50/30 to-brand-50/40 border border-brand-100 animate-fade-up"
            style={{ animationDelay: '350ms' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">
                    课程总时长
                  </span>
                  <span className="font-semibold text-stone-800 font-mono text-lg">
                    {formatDuration(totalMinutes)}
                    <span className="text-xs text-stone-400 ml-1">
                      （{totalMinutes} 分钟）
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">
                    分段数
                  </span>
                  <span className="font-semibold text-stone-800">
                    {bill.segments.length} 段
                  </span>
                </div>
                {bill.status === 'paid' && bill.paidAt && (
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="text-sm text-stone-500">
                      <CheckCircle2 size={13} className="inline mr-1 text-forest-500" />
                      支付时间
                    </span>
                    <span className="font-semibold text-forest-700 text-sm">
                      {formatDateTime(bill.paidAt)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                  应付金额合计
                </div>
                <div className="font-display text-5xl mt-2 text-stone-900">
                  {formatCurrency(bill.totalAmount)}
                </div>
                <div className="text-xs text-stone-400 mt-2 italic">
                  {numberToChinese(bill.totalAmount)}
                </div>
              </div>
            </div>

            {bill.status === 'pending' && (
              <div className="mt-6 pt-6 border-t border-stone-200/80 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center animate-pulse-ring">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-stone-800">
                      完成支付以确认课程订单
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      支持微信、支付宝、银行卡等多种方式
                    </div>
                  </div>
                </div>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="btn-primary !py-3.5 !px-8 text-base shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30"
                >
                  {paying ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <CreditCard size={17} />
                      确认支付 {formatCurrency(bill.totalAmount)}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
