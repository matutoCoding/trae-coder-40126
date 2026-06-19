import { addDays, startOfWeek, setHours, setMinutes, startOfToday } from 'date-fns';
import { Assessment, Bill, Booking, RateTier, Trainer } from '../../shared/types.js';
import { generateId } from '../../shared/utils.js';

const today = startOfToday();
const thisWeekMonday = startOfWeek(today, { weekStartsOn: 1 });

function d(offsetDays: number, h: number, m = 0): string {
  return addDays(setMinutes(setHours(today, h), m), offsetDays).toISOString();
}

export const defaultWorkSchedule = {
  monday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '21:00' }],
  tuesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '21:00' }],
  wednesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '21:00' }],
  thursday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '21:00' }],
  friday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '22:00' }],
  saturday: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '21:00' }],
  sunday: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '19:00' }],
  exceptions: [] as { date: string; ranges: { start: string; end: string }[] | null }[],
};

export const MOCK_TRAINERS: Trainer[] = [
  {
    id: 'trainer_001',
    name: '陈老师',
    specialties: ['基础服从', '行为纠正', '幼犬启蒙'],
    experienceYears: 8,
    baseHourlyRate: 300,
    status: 'active',
    workSchedule: { ...defaultWorkSchedule },
  },
  {
    id: 'trainer_002',
    name: '林老师',
    specialties: ['敏捷训练', '飞盘狗', '运动犬'],
    experienceYears: 6,
    baseHourlyRate: 280,
    status: 'active',
    workSchedule: { ...defaultWorkSchedule,
      saturday: [{ start: '10:00', end: '18:00' }],
      sunday: [{ start: '09:00', end: '17:00' }],
    },
  },
  {
    id: 'trainer_003',
    name: '王老师',
    specialties: ['猫咪行为', '家庭礼仪', '脱敏训练'],
    experienceYears: 5,
    baseHourlyRate: 260,
    status: 'active',
    workSchedule: { ...defaultWorkSchedule,
      monday: [{ start: '14:00', end: '21:00' }],
      wednesday: [{ start: '14:00', end: '21:00' }],
    },
  },
  {
    id: 'trainer_004',
    name: '赵老师',
    specialties: ['护卫犬', '高级服从', '工作犬训练'],
    experienceYears: 12,
    baseHourlyRate: 400,
    status: 'active',
    workSchedule: { ...defaultWorkSchedule,
      sunday: [],
    },
  },
  {
    id: 'trainer_005',
    name: 'Sarah老师',
    specialties: ['响片训练', '正向强化', '竞技犬'],
    experienceYears: 7,
    baseHourlyRate: 350,
    status: 'active',
    workSchedule: { ...defaultWorkSchedule },
  },
];

export const MOCK_RATE_TIERS: RateTier[] = [
  {
    id: 'rate_morning_peak',
    name: '早高峰',
    color: '#F97316',
    multiplier: 1.3,
    timeRanges: [{ start: '07:00', end: '09:00' }],
    applicableWeekdays: [1, 2, 3, 4, 5],
    priority: 10,
    description: '工作日清晨黄金时段',
  },
  {
    id: 'rate_peak',
    name: '晚高峰',
    color: '#EF4444',
    multiplier: 1.5,
    timeRanges: [{ start: '17:00', end: '20:00' }],
    applicableWeekdays: [1, 2, 3, 4, 5, 6],
    priority: 20,
    description: '下班后热门训练时段',
  },
  {
    id: 'rate_night',
    name: '夜间档',
    color: '#8B5CF6',
    multiplier: 1.8,
    timeRanges: [{ start: '20:00', end: '22:00' }],
    applicableWeekdays: [],
    priority: 30,
    description: '夜间特殊时段额外费用',
  },
  {
    id: 'rate_weekend',
    name: '周末平峰',
    color: '#10B981',
    multiplier: 1.2,
    timeRanges: [{ start: '09:00', end: '17:00' }],
    applicableWeekdays: [0, 6],
    priority: 5,
    description: '周末白天基础档',
  },
  {
    id: 'rate_normal',
    name: '平峰',
    color: '#3B82F6',
    multiplier: 1.0,
    timeRanges: [{ start: '09:00', end: '17:00' }],
    applicableWeekdays: [1, 2, 3, 4, 5],
    priority: 0,
    description: '工作日常规时段基础价',
  },
];

export function generateMockBookings(): Booking[] {
  const bookings: Booking[] = [];
  const base = [
    { trainer: 'trainer_001', day: 0, s: 9, e: 11, owner: '张先生', pet: '豆豆', type: 'dog' as const, breed: '金毛' },
    { trainer: 'trainer_001', day: 0, s: 14, e: 16, owner: '李女士', pet: '小白', type: 'dog' as const, breed: '柯基' },
    { trainer: 'trainer_001', day: 1, s: 17, e: 20, owner: '王先生', pet: '旺财', type: 'dog' as const, breed: '拉布拉多' },
    { trainer: 'trainer_002', day: 0, s: 10, e: 11.5, owner: '刘小姐', pet: '饭团', type: 'dog' as const, breed: '边牧' },
    { trainer: 'trainer_002', day: 2, s: 16, e: 19, owner: '周先生', pet: '雪球', type: 'dog' as const, breed: '萨摩耶' },
    { trainer: 'trainer_003', day: 1, s: 15, e: 17, owner: '孙女士', pet: '咪咪', type: 'cat' as const, breed: '布偶' },
    { trainer: 'trainer_003', day: 3, s: 18, e: 21, owner: '吴先生', pet: '花花', type: 'cat' as const, breed: '英短' },
    { trainer: 'trainer_004', day: 0, s: 9, e: 12, owner: '郑先生', pet: '虎子', type: 'dog' as const, breed: '德牧' },
    { trainer: 'trainer_004', day: 2, s: 14, e: 17, owner: '冯女士', pet: '黑风', type: 'dog' as const, breed: '马犬' },
    { trainer: 'trainer_005', day: 1, s: 10, e: 13, owner: '陈先生', pet: '布丁', type: 'dog' as const, breed: '泰迪' },
    { trainer: 'trainer_005', day: 4, s: 18, e: 21.5, owner: '韩女士', pet: '咖啡', type: 'other' as const, breed: '侏儒兔' },
    { trainer: 'trainer_001', day: 5, s: 8, e: 10, owner: '许先生', pet: '毛毛', type: 'dog' as const, breed: '比熊' },
    { trainer: 'trainer_002', day: 6, s: 10, e: 13, owner: '邓女士', pet: '球球', type: 'dog' as const, breed: '柴犬' },
  ];

  for (let i = 0; i < base.length; i++) {
    const b = base[i];
    const startH = Math.floor(b.s);
    const startM = Math.round((b.s - startH) * 60);
    const endH = Math.floor(b.e);
    const endM = Math.round((b.e - endH) * 60);
    bookings.push({
      id: `booking_${(i + 1).toString().padStart(3, '0')}`,
      trainerId: b.trainer,
      ownerName: b.owner,
      ownerPhone: '138****' + Math.floor(1000 + Math.random() * 9000),
      petName: b.pet,
      petType: b.type,
      petBreed: b.breed,
      startAt: d(b.day, startH, startM),
      endAt: d(b.day, endH, endM),
      status: i % 7 === 0 ? 'completed' : 'confirmed',
      createdAt: d(-Math.floor(Math.random() * 5) - 1, 10),
      courseType: i % 2 === 0 ? '一对一私教课' : '小班课',
    });
  }
  return bookings;
}

export function generateMockBills(bookings: Booking[], trainers: Trainer[]): Bill[] {
  return bookings
    .filter(b => b.status !== 'cancelled')
    .map((b, idx) => {
      const baseRate = trainers.find(t => t.id === b.trainerId)?.baseHourlyRate ?? 300;
      const mins = (Date.parse(b.endAt) - Date.parse(b.startAt)) / 60000;
      const segments = mockSegments(b, baseRate);
      const total = segments.reduce((s, x) => s + x.subtotal, 0);
      const dateStart = new Date(b.startAt);
      const dateEnd = new Date(b.endAt);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return {
        id: `bill_${(idx + 1).toString().padStart(3, '0')}`,
        bookingId: b.id,
        trainerId: b.trainerId,
        segments,
        totalAmount: Math.round(total * 100) / 100,
        status: b.status === 'completed' ? 'paid' : 'pending',
        paidAt: b.status === 'completed' ? new Date(dateEnd.getTime() + 3600_000).toISOString() : undefined,
        createdAt: b.createdAt,
        ownerName: b.ownerName,
        petName: b.petName,
        coursePeriod: `${dateStart.getMonth() + 1}/${dateStart.getDate()} ${pad(dateStart.getHours())}:${pad(dateStart.getMinutes())}-${pad(dateEnd.getHours())}:${pad(dateEnd.getMinutes())}`,
      };
    });
}

function mockSegments(booking: Booking, baseRate: number) {
  const tiers = [
    { name: '平峰', color: '#3B82F6', mult: 1.0 },
    { name: '晚高峰', color: '#EF4444', mult: 1.5 },
    { name: '夜间档', color: '#8B5CF6', mult: 1.8 },
    { name: '早高峰', color: '#F97316', mult: 1.3 },
  ];
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const totalMin = (end.getTime() - start.getTime()) / 60000;
  const cutoff = Math.min(totalMin, 60);
  const seg1Min = cutoff;
  const seg2Min = totalMin - cutoff;
  const sh = start.getHours();
  let t1Idx = 0;
  if (sh >= 20) t1Idx = 2; else if (sh >= 17) t1Idx = 1; else if (sh < 9 && sh >= 7) t1Idx = 3;
  const t2Idx = (t1Idx + 1) % tiers.length;
  const t1 = tiers[t1Idx];
  const t2 = tiers[t2Idx];
  const price1 = baseRate * t1.mult / 60;
  const price2 = baseRate * t2.mult / 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const mid = new Date(start.getTime() + seg1Min * 60000);
  const seg1 = {
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(mid.getHours())}:${pad(mid.getMinutes())}`,
    durationMinutes: seg1Min,
    tierId: 'seg_' + t1.name,
    tierName: t1.name,
    tierColor: t1.color,
    unitPrice: Math.round(price1 * 100) / 100,
    subtotal: Math.round(price1 * seg1Min * 100) / 100,
  };
  if (seg2Min <= 0) return [seg1];
  const seg2 = {
    startTime: `${pad(mid.getHours())}:${pad(mid.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    durationMinutes: seg2Min,
    tierId: 'seg_' + t2.name,
    tierName: t2.name,
    tierColor: t2.color,
    unitPrice: Math.round(price2 * 100) / 100,
    subtotal: Math.round(price2 * seg2Min * 100) / 100,
  };
  return [seg1, seg2];
}

export function generateMockAssessments(bookings: Booking[]): Assessment[] {
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const sampleNotes = [
    '宠物今日状态极佳，对指令响应迅速，连续完成了坐、卧、等待三项基础动作。回家后可加强等待练习。',
    '初步接触脱敏训练，对陌生环境的适应度提升明显，但遇到大型犬时仍有紧张情绪。',
    '响片训练效果显著，已能完成简单的连锁行为。建议每日15分钟强化练习。',
    '行为纠正取得阶段性成果，护食问题明显改善，但在家中仍需持续管理。',
    '敏捷障碍完成度高，跨栏和隧道表现优异，下次课可引入S型绕杆训练。',
  ];
  const tagsPool = [
    ['注意力集中', '进步明显', '服从性好'],
    ['社交需加强', '情绪稳定', '基础扎实'],
    ['反应敏捷', '学习速度快', '食物动力强'],
    ['胆小需鼓励', '好奇心强', '玩具动力强'],
    ['护食改善', '规则意识建立中', '进步大'],
  ];
  const recs = [
    '建议增加日常遛弯时长，消耗多余精力后训练效果更佳。',
    '下一阶段推荐进阶服从课，强化干扰环境下的指令稳定性。',
    '可考虑加入周末社会化小组课，提升与其他宠物的社交能力。',
    '建议两周后复查行为问题，视情况调整训练方案。',
    '推荐敏捷体验课，充分发挥运动天赋。',
  ];

  return completedBookings.slice(0, 5).map((b, i) => ({
    id: `assess_${(i + 1).toString().padStart(3, '0')}`,
    bookingId: b.id,
    trainerId: b.trainerId,
    petName: b.petName,
    score: 4 + (i % 2),
    tags: tagsPool[i % tagsPool.length],
    notes: sampleNotes[i % sampleNotes.length],
    recommendations: recs[i % recs.length],
    createdAt: new Date(new Date(b.endAt).getTime() + 7200_000).toISOString(),
  }));
}

export const MOCK_BOOKINGS = generateMockBookings();
export const MOCK_BILLS = generateMockBills(MOCK_BOOKINGS, MOCK_TRAINERS);
export const MOCK_ASSESSMENTS = generateMockAssessments(MOCK_BOOKINGS);

export { thisWeekMonday };
