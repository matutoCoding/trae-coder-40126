import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  CalendarDays,
  CalendarCheck2,
  Percent,
  Receipt,
  ClipboardList,
  PawPrint,
  Bell,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useEffect } from 'react';
import { useAppStore } from '@/store/app';

const NAV_ITEMS = [
  { to: '/dashboard', label: '数据概览', icon: LayoutDashboard, hint: 'Dashboard' },
  { to: '/trainers', label: '训练师管理', icon: Users2, hint: 'Trainers' },
  { to: '/schedule', label: '排期日历', icon: CalendarDays, hint: 'Schedule' },
  { to: '/bookings', label: '预约管理', icon: CalendarCheck2, hint: 'Bookings' },
  { to: '/rates', label: '时段费率', icon: Percent, hint: 'Rates' },
  { to: '/bills', label: '账单中心', icon: Receipt, hint: 'Bills' },
  { to: '/assessments', label: '行为评估', icon: ClipboardList, hint: 'Assessments' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const fetchAll = useAppStore(s => s.fetchAll);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="flex h-full min-h-screen">
      <aside className="w-64 shrink-0 bg-white/70 backdrop-blur-md border-r border-stone-200/80 flex flex-col">
        <div className="px-6 py-6 border-b border-stone-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-soft">
            <PawPrint size={22} />
          </div>
          <div>
            <div className="font-display text-xl leading-none text-stone-900">萌兽学堂</div>
            <div className="text-[11px] text-stone-500 mt-1 tracking-wide uppercase">Pet Training</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 scroll-area">
          {NAV_ITEMS.map(({ to, label, icon: Icon, hint }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 -translate-y-0.5'
                    : 'text-stone-600 hover:bg-brand-50/60 hover:text-brand-600'
                }`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-none">{label}</div>
                <div className={`text-[10px] mt-1 tracking-wider uppercase ${
                  location.pathname.startsWith(to) ? 'text-white/70' : 'text-stone-400'
                }`}>
                  {hint}
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -mr-1 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-cream-50 p-4 relative paw-watermark overflow-hidden">
            <div className="text-[11px] uppercase tracking-wider text-brand-600 font-semibold">温馨提示</div>
            <div className="text-sm text-stone-700 mt-2 leading-relaxed">
              晚高峰时段费率上浮 50%，可优先选择平峰时段预约哦～
            </div>
            <div className="mt-3 text-xs font-medium text-brand-600">查看费率 →</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white/60 backdrop-blur-md border-b border-stone-200/80 flex items-center px-8 gap-4 sticky top-0 z-10">
          <div className="flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="搜索宠主、宠物名、训练师..."
              className="input pl-10 py-2 bg-stone-50/60"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:text-brand-600 hover:border-brand-200 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-stone-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white font-semibold">
                A
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-stone-800 leading-tight">管理员</div>
                <div className="text-xs text-stone-500">admin@paw.com</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto scroll-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
