import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/app';
import { Assessment, Trainer, Booking } from '@shared/types';
import { formatDateTime } from '@shared/utils';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Star,
  Plus,
  Search,
  Users2,
  Filter,
  FileText,
  Lightbulb,
  ArrowUpDown,
} from 'lucide-react';

const PRESET_TAGS = [
  '注意力集中',
  '进步明显',
  '服从性好',
  '社交需加强',
  '情绪稳定',
  '基础扎实',
  '反应敏捷',
  '学习速度快',
  '食物动力强',
  '胆小需鼓励',
  '好奇心强',
  '玩具动力强',
  '护食改善',
  '规则意识建立中',
  '进步大',
  '需加强练习',
];

type SortType = 'newest' | 'oldest' | 'score-high' | 'score-low';

export default function AssessmentList() {
  const assessments = useAppStore(s => s.assessments);
  const trainers = useAppStore(s => s.trainers);
  const fetchAssessments = useAppStore(s => s.fetchAssessments);
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    assessments.forEach(a => a.tags.forEach(t => set.add(t)));
    return Array.from(set);
  }, [assessments]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    let list = assessments
      .filter(a =>
        trainerFilter === 'all' ? true : a.trainerId === trainerFilter
      )
      .filter(a =>
        tagFilter === 'all' ? true : a.tags.includes(tagFilter)
      )
      .filter(a =>
        kw === ''
          ? true
          : a.petName.toLowerCase().includes(kw) ||
            a.notes.toLowerCase().includes(kw) ||
            a.recommendations.toLowerCase().includes(kw)
      );

    switch (sortBy) {
      case 'oldest':
        list = list.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'score-high':
        list = list.sort((a, b) => b.score - a.score);
        break;
      case 'score-low':
        list = list.sort((a, b) => a.score - b.score);
        break;
      default:
        list = list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return list;
  }, [assessments, trainerFilter, tagFilter, search, sortBy]);

  const getTrainerName = (id: string) =>
    (assessments.find(a => a.trainerId === id)?.trainerName) ||
    trainers.find((t: Trainer) => t.id === id)?.name ||
    id;

  return (
    <div className="space-y-6 max-w-[1400px] animate-fade-up">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="subtle">训练师课后记录宠物表现与训练建议</div>
          <h1 className="font-display text-4xl mt-1 text-stone-900">行为评估记录</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/assessments/new')}>
          <Plus size={16} />
          新建评估
        </button>
      </div>

      <div className="card p-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-stone-400 shrink-0" />
            <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
              筛选
            </span>
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
                placeholder="搜索宠物名/笔记关键词"
                className="input pl-9 py-2 bg-stone-50/60"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users2 size={15} className="text-stone-400 shrink-0" />
            <select
              value={trainerFilter}
              onChange={e => setTrainerFilter(e.target.value)}
              className="input py-2 bg-stone-50/60 w-36"
            >
              <option value="all">全部训练师</option>
              {trainers.map((t: Trainer) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <FileText size={15} className="text-stone-400 shrink-0" />
            <select
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="input py-2 bg-stone-50/60 w-36"
            >
              <option value="all">全部标签</option>
              {allTags.map(t => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-stone-400 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortType)}
              className="input py-2 bg-stone-50/60 w-36"
            >
              <option value="newest">最新创建</option>
              <option value="oldest">最早创建</option>
              <option value="score-high">评分从高到低</option>
              <option value="score-low">评分从低到高</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 && (
          <div className="col-span-full card p-16 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-3xl bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
              <ClipboardList size={32} strokeWidth={1.5} />
            </div>
            <div className="font-display text-xl text-stone-700 mt-5">
              暂无评估记录
            </div>
            <div className="subtle mt-1">
              完成课程后可在此记录宠物表现与建议
            </div>
            <button
              className="btn-primary mt-6"
              onClick={() => navigate('/assessments/new')}
            >
              <Plus size={14} />
              创建第一份评估
            </button>
          </div>
        )}

        {filtered.map((a: Assessment, idx: number) => (
          <div
            key={a.id}
            className="card p-6 hover:shadow-soft transition-all animate-fade-up group relative overflow-hidden"
            style={{ animationDelay: `${150 + idx * 50}ms` }}
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br from-brand-100 to-cream-50 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />

            <div className="flex items-start justify-between gap-3 relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-cream-50 flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform">
                  🐾
                </div>
                <div>
                  <div className="font-display text-xl text-stone-900">
                    {a.petName}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className="text-amber-500"
                        fill={i < a.score ? 'currentColor' : 'none'}
                        strokeWidth={1.6}
                      />
                    ))}
                    <span className="text-xs font-semibold text-amber-600 ml-1">
                      {a.score}.0
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">
                {formatDateTime(a.createdAt, 'MM-dd HH:mm')}
              </span>
            </div>

            {a.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {a.tags.slice(0, 4).map(tag => (
                  <span
                    key={tag}
                    className="chip bg-cream-50 text-amber-700 border border-amber-100 text-[11px]"
                  >
                    #{tag}
                  </span>
                ))}
                {a.tags.length > 4 && (
                  <span className="chip bg-stone-50 text-stone-500 border border-stone-200 text-[11px]">
                    +{a.tags.length - 4}
                  </span>
                )}
              </div>
            )}

            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-stone-50 to-white border border-stone-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                <FileText size={12} />
                课堂笔记
              </div>
              <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
                {a.notes}
              </p>
            </div>

            <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-brand-50/60 to-cream-50 border border-brand-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
                <Lightbulb size={12} />
                训练建议
              </div>
              <p className="text-sm text-stone-700 leading-relaxed line-clamp-2">
                {a.recommendations}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                  <Users2 size={13} className="text-violet-600" />
                </div>
                <span className="text-xs font-medium text-stone-600">
                  {getTrainerName(a.trainerId)}
                </span>
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                {a.id.slice(0, 12)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
