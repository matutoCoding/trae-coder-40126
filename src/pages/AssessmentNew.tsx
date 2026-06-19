import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/app';
import { Booking, Trainer } from '@shared/types';
import { formatDateTime, generateId } from '@shared/utils';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Plus,
  X,
  Save,
  ClipboardList,
  Users2,
  PawPrint,
  CalendarDays,
  FileText,
  Lightbulb,
  CheckCircle2,
  Tag,
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
  '社会化良好',
  '咬手问题',
  '吠叫改善',
  '牵引随行好',
];

export default function AssessmentNew() {
  const bookings = useAppStore(s => s.bookings);
  const trainers = useAppStore(s => s.trainers);
  const createAssessment = useAppStore(s => s.createAssessment);
  const fetchBookings = useAppStore(s => s.fetchBookings);
  const navigate = useNavigate();

  const [bookingId, setBookingId] = useState<string>('');
  const [trainerId, setTrainerId] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [hoverScore, setHoverScore] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const selectedBooking = useMemo(
    () => bookings.find((b: Booking) => b.id === bookingId),
    [bookings, bookingId]
  );

  const availableBookings = useMemo(
    () =>
      bookings
        .filter((b: Booking) => b.status === 'completed')
        .sort(
          (a: Booking, b: Booking) =>
            new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        ),
    [bookings]
  );

  useEffect(() => {
    if (selectedBooking) {
      setTrainerId(selectedBooking.trainerId);
    }
  }, [selectedBooking]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag) return;
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setCustomTag('');
  };

  const handleSubmit = async () => {
    if (!bookingId || !trainerId || score === 0) return;
    setSubmitting(true);
    const result = await createAssessment({
      bookingId,
      trainerId,
      petName: selectedBooking?.petName ?? '',
      score,
      tags: selectedTags,
      notes,
      recommendations,
    });
    setSubmitting(false);
    if (result) {
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/assessments');
      }, 1500);
    }
  };

  const canSubmit =
    bookingId && trainerId && score > 0 && notes.trim().length > 0;

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto animate-fade-up pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/assessments')}
            className="w-10 h-10 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-brand-600 hover:border-brand-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="subtle">记录课后宠物表现与训练师建议</div>
            <h1 className="font-display text-3xl mt-1 text-stone-900">
              新建行为评估
            </h1>
          </div>
        </div>
        {submitSuccess && (
          <span className="chip bg-forest-50 text-forest-600 border border-forest-200 animate-fade-up">
            <CheckCircle2 size={13} className="mr-1" />
            创建成功，即将跳转...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 animate-fade-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center text-violet-600">
                <CalendarDays size={18} />
              </div>
              <div>
                <h3 className="font-display text-lg text-stone-900">
                  关联课程预约
                </h3>
                <div className="text-xs text-stone-400 mt-0.5">
                  选择已完成的课程进行评估
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="text-red-500 mr-0.5">*</span>
                  选择预约
                </label>
                <select
                  value={bookingId}
                  onChange={e => setBookingId(e.target.value)}
                  className="input"
                >
                  <option value="">请选择已完成的预约...</option>
                  {availableBookings.map((b: Booking) => (
                    <option key={b.id} value={b.id}>
                      {b.petName} · {b.ownerName} ·{' '}
                      {formatDateTime(b.startAt, 'MM-dd HH:mm')}
                    </option>
                  ))}
                </select>
                {availableBookings.length === 0 && (
                  <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    暂无可评估的预约，需先完成课程
                  </div>
                )}
              </div>

              <div>
                <label className="label">
                  <Users2 size={11} className="inline mr-1" />
                  训练师
                </label>
                <select
                  value={trainerId}
                  onChange={e => setTrainerId(e.target.value)}
                  disabled={!!selectedBooking}
                  className="input disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed"
                >
                  <option value="">请选择训练师...</option>
                  {trainers.map((t: Trainer) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedBooking && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-brand-50/60 via-cream-50 to-white border border-brand-100 animate-fade-up">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                      🐾
                    </div>
                    <div>
                      <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                        宠物
                      </div>
                      <div className="font-semibold text-stone-800 mt-0.5 flex items-center gap-2">
                        <PawPrint size={13} className="text-brand-500" />
                        {selectedBooking.petName}
                        {selectedBooking.petBreed && (
                          <span className="text-xs font-normal text-stone-500">
                            · {selectedBooking.petBreed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Users2 size={15} className="text-violet-600" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                        宠主
                      </div>
                      <div className="font-semibold text-stone-800 mt-0.5">
                        {selectedBooking.ownerName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <CalendarDays size={15} className="text-forest-600" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                        课程时间
                      </div>
                      <div className="font-semibold text-stone-800 mt-0.5 text-sm">
                        {formatDateTime(selectedBooking.startAt, 'MM月dd日 HH:mm')} -{' '}
                        {formatDateTime(selectedBooking.endAt, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-amber-600">
                <Star size={18} fill="currentColor" />
              </div>
              <div>
                <h3 className="font-display text-lg text-stone-900">
                  综合评分
                </h3>
                <div className="text-xs text-stone-400 mt-0.5">
                  5颗星 = 非常优秀，1颗星 = 需要加强
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const displayScore = hoverScore || score;
                  const filled = i < displayScore;
                  return (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setHoverScore(i + 1)}
                      onMouseLeave={() => setHoverScore(0)}
                      onClick={() => setScore(i + 1)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          filled ? 'text-amber-500' : 'text-stone-200'
                        }`}
                        fill={filled ? 'currentColor' : 'none'}
                        strokeWidth={1.8}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl text-stone-900">
                  {score}
                </span>
                <span className="text-stone-400 text-lg">/ 5</span>
              </div>
              {score > 0 && (
                <span className="chip bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200">
                  {score === 5
                    ? '非常优秀 🌟'
                    : score === 4
                    ? '表现良好 👍'
                    : score === 3
                    ? '中等水平 ⭐'
                    : score === 2
                    ? '需要提升 📈'
                    : '需重点关注 💪'}
                </span>
              )}
            </div>
          </div>

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center text-rose-600">
                <Tag size={18} />
              </div>
              <div>
                <h3 className="font-display text-lg text-stone-900">
                  行为标签
                </h3>
                <div className="text-xs text-stone-400 mt-0.5">
                  可多选预设标签或添加自定义标签
                </div>
              </div>
              {selectedTags.length > 0 && (
                <span className="chip bg-brand-50 text-brand-600 border border-brand-200 ml-auto">
                  已选 {selectedTags.length} 个
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`chip !py-1.5 !px-3 cursor-pointer transition-all border ${
                        active
                          ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-brand-500 shadow-sm shadow-brand-500/20'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50'
                      }`}
                    >
                      {active && <CheckCircle2 size={11} className="mr-1" />}
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-stone-100">
                <div className="label">自定义标签</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={e => setCustomTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    placeholder="输入自定义标签后回车或点击添加"
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    disabled={!customTag.trim()}
                    className="btn-outline"
                  >
                    <Plus size={14} />
                    添加
                  </button>
                </div>
              </div>

              {selectedTags.length > 0 && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-2">
                    已选择标签（点击可移除）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="chip bg-gradient-to-r from-brand-50 to-cream-50 text-brand-700 border border-brand-200 cursor-pointer hover:from-red-50 hover:to-red-50 hover:text-red-600 hover:border-red-200 transition-colors !py-1.5 !px-3"
                      >
                        #{tag}
                        <X size={11} className="ml-1 opacity-60" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '240ms' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 flex items-center justify-center text-sky-600">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-display text-lg text-stone-900">
                  课堂笔记
                </h3>
                <div className="text-xs text-stone-400 mt-0.5">
                  记录本节课的具体表现、行为观察等
                </div>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例如：宠物今日状态极佳，对指令响应迅速，连续完成了坐、卧、等待三项基础动作。但遇到大型犬时仍有紧张情绪，需继续加强社会化训练。"
              rows={6}
              className="input resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs ${
                  notes.trim().length === 0
                    ? 'text-red-500'
                    : notes.length > 500
                    ? 'text-amber-600'
                    : 'text-stone-400'
                }`}
              >
                {notes.trim().length === 0
                  ? '* 课堂笔记为必填项'
                  : `已输入 ${notes.length} 字`}
              </span>
            </div>
          </div>

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '320ms' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-600">
                <Lightbulb size={18} />
              </div>
              <div>
                <h3 className="font-display text-lg text-stone-900">
                  训练师建议
                </h3>
                <div className="text-xs text-stone-400 mt-0.5">
                  给宠主的后续训练方向与居家练习建议
                </div>
              </div>
            </div>
            <textarea
              value={recommendations}
              onChange={e => setRecommendations(e.target.value)}
              placeholder="例如：建议增加日常遛弯时长，消耗多余精力后训练效果更佳。下一阶段推荐进阶服从课，强化干扰环境下的指令稳定性。"
              rows={5}
              className="input resize-none leading-relaxed"
            />
            <div className="text-xs text-stone-400 mt-2">
              {recommendations.length > 0
                ? `已输入 ${recommendations.length} 字`
                : '选填，提供针对性建议可帮助宠主更好地配合训练'}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-5">
            <div className="card p-5 bg-gradient-to-br from-white via-cream-50/50 to-brand-50/30 border border-brand-100 animate-fade-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-sm">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h3 className="font-display text-lg text-stone-900">
                    评估摘要
                  </h3>
                  <div className="text-xs text-stone-400 mt-0.5">
                    实时预览
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-white/70 border border-stone-100">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold mb-1">
                    宠物
                  </div>
                  <div className="font-semibold text-stone-800 flex items-center gap-2">
                    <span className="text-lg">🐾</span>
                    {selectedBooking?.petName || (
                      <span className="text-stone-300 font-normal text-sm">
                        待选择
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/70 border border-stone-100">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold mb-1">
                    评分
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < score
                            ? 'text-amber-500'
                            : 'text-stone-200'
                        }
                        fill={i < score ? 'currentColor' : 'none'}
                        strokeWidth={1.6}
                      />
                    ))}
                    {score > 0 ? (
                      <span className="font-display text-xl text-stone-800 ml-1">
                        {score}.0
                      </span>
                    ) : (
                      <span className="text-stone-300 text-sm">未评分</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/70 border border-stone-100">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold mb-2">
                    标签
                  </div>
                  {selectedTags.length === 0 ? (
                    <span className="text-stone-300 text-sm">未选择标签</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTags.slice(0, 6).map(tag => (
                        <span
                          key={tag}
                          className="chip bg-cream-50 text-amber-700 border border-amber-100 text-[10px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {selectedTags.length > 6 && (
                        <span className="chip bg-stone-50 text-stone-500 border border-stone-200 text-[10px]">
                          +{selectedTags.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white/70 border border-stone-100">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold mb-1">
                    笔记长度
                  </div>
                  <div className="text-sm font-semibold text-stone-800">
                    {notes.length} 字
                    {notes.trim().length > 0 && (
                      <span className="text-forest-600 text-xs ml-1 font-normal">
                        ✓ 已填写
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">关联预约</span>
                  <span
                    className={`font-medium ${
                      bookingId ? 'text-forest-600' : 'text-stone-300'
                    }`}
                  >
                    {bookingId ? '✓ 已选择' : '未完成'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">综合评分</span>
                  <span
                    className={`font-medium ${
                      score > 0 ? 'text-forest-600' : 'text-stone-300'
                    }`}
                  >
                    {score > 0 ? `✓ ${score}分` : '未完成'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">课堂笔记</span>
                  <span
                    className={`font-medium ${
                      notes.trim().length > 0
                        ? 'text-forest-600'
                        : 'text-stone-300'
                    }`}
                  >
                    {notes.trim().length > 0 ? '✓ 已填写' : '未完成'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="btn-primary w-full !py-3.5 shadow-lg shadow-brand-500/25"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    提交评估
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/assessments')}
                className="btn-outline w-full !py-2.5 mt-3"
              >
                <ArrowLeft size={13} />
                取消返回
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
