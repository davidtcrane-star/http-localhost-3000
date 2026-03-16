'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  Crown,
  Flame,
  Gem,
  Mail,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'math_sprint_v4';
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const simplify = (n: number, d: number): [number, number] => {
  const g = gcd(n, d);
  return [n / g, d / g];
};
const frac = (n: number, d: number) => `${n}/${d}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

type Question = {
  topic: string;
  skill: string;
  difficulty: number;
  prompt: string;
  answer: string;
  explanation: string;
  options: string[];
};

type HistoryEntry = {
  date: string;
  topic: string;
  accuracy: number;
  mins: number;
};

type WrongLogEntry = {
  prompt: string;
  skill: string;
  selected: string;
  correct: string;
};

type Profile = {
  student_name: string;
  grade_band: 'grade4' | 'grade7';
  active_avatar: string;
  unlocked_avatars: string[];
  xp: number;
  gems: number;
  level: number;
  streak_days: number;
  session_length: number;
  mastery: Record<string, number>;
  badges: string[];
  history: HistoryEntry[];
  teacher_assignment: { path: string; length: number; note: string };
  parent_email_preview: string;
};

const avatarShop = [
  { id: 'comet-fox', name: 'Comet Fox', cost: 0, emoji: '🦊' },
  { id: 'pixel-panda', name: 'Pixel Panda', cost: 40, emoji: '🐼' },
  { id: 'rocket-owl', name: 'Rocket Owl', cost: 60, emoji: '🦉' },
  { id: 'math-dragon', name: 'Math Dragon', cost: 100, emoji: '🐉' },
  { id: 'queen-quokka', name: 'Queen Quokka', cost: 140, emoji: '👑' },
];

const defaultProfile: Profile = {
  student_name: 'Math Explorer',
  grade_band: 'grade7',
  active_avatar: 'comet-fox',
  unlocked_avatars: ['comet-fox'],
  xp: 220,
  gems: 12,
  level: 3,
  streak_days: 5,
  session_length: 10,
  mastery: {
    Fractions: 72,
    Decimals: 81,
    Percent: 67,
    Integers: 76,
    Algebra: 63,
    Grade4Number: 80,
    Grade4Fractions: 76,
  },
  badges: ['First Sprint', '5-Day Streak'],
  history: [
    { date: 'Mon', topic: 'Fractions', accuracy: 70, mins: 10 },
    { date: 'Tue', topic: 'Decimals', accuracy: 82, mins: 10 },
    { date: 'Wed', topic: 'Algebra', accuracy: 64, mins: 10 },
    { date: 'Thu', topic: 'Fractions', accuracy: 88, mins: 10 },
    { date: 'Fri', topic: 'Percent', accuracy: 91, mins: 10 },
  ],
  teacher_assignment: { path: 'fractions', length: 10, note: 'Warm up with visual fractions, then sprint.' },
  parent_email_preview: 'Weekly report ready',
};

function loadLocal(): Profile {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

function saveLocal(profile: Profile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  return data.user?.id ?? null;
}

async function saveProfileToSupabase(profile: Profile) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email ?? '';

  const { error } = await supabase.from('student_profiles').upsert(
    {
      user_id: userId,
      email,
      student_name: profile.student_name,
      grade_band: profile.grade_band,
      active_avatar: profile.active_avatar,
      unlocked_avatars: profile.unlocked_avatars,
      xp: profile.xp,
      gems: profile.gems,
      level: profile.level,
      streak_days: profile.streak_days,
      session_length: profile.session_length,
      mastery: profile.mastery,
      badges: profile.badges,
      history: profile.history,
      teacher_assignment: profile.teacher_assignment,
      parent_email_preview: profile.parent_email_preview,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('Profile save failed:', error.message);
  }
}

async function loadProfileFromSupabase(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.log('No cloud profile yet, using local/default profile.');
    return null;
  }

  if (!data) return null;

  return {
    ...defaultProfile,
    student_name: data.student_name ?? defaultProfile.student_name,
    grade_band: data.grade_band ?? defaultProfile.grade_band,
    active_avatar: data.active_avatar ?? defaultProfile.active_avatar,
    unlocked_avatars: data.unlocked_avatars ?? defaultProfile.unlocked_avatars,
    xp: data.xp ?? defaultProfile.xp,
    gems: data.gems ?? defaultProfile.gems,
    level: data.level ?? defaultProfile.level,
    streak_days: data.streak_days ?? defaultProfile.streak_days,
    session_length: data.session_length ?? defaultProfile.session_length,
    mastery: data.mastery ?? defaultProfile.mastery,
    badges: data.badges ?? defaultProfile.badges,
    history: data.history ?? defaultProfile.history,
    teacher_assignment: data.teacher_assignment ?? defaultProfile.teacher_assignment,
    parent_email_preview: data.parent_email_preview ?? defaultProfile.parent_email_preview,
  };
}

async function saveSessionLogToSupabase(params: {
  topic: string;
  mode: string;
  accuracy: number;
  xp_earned: number;
  streak_peak: number;
  responses: WrongLogEntry[];
}) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from('session_logs').insert({
    user_id: userId,
    topic: params.topic,
    mode: params.mode,
    accuracy: params.accuracy,
    xp_earned: params.xp_earned,
    streak_peak: params.streak_peak,
    responses: params.responses,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Session log save failed:', error.message);
  }
}

function makeOptions(correct: string, wrongFn: () => string, count = 4) {
  const set = new Set([String(correct)]);
  while (set.size < count) set.add(String(wrongFn()));
  return shuffle([...set]);
}

function genFractionAdd(difficulty = 1): Question {
  const ds = difficulty === 1 ? [2, 3, 4, 5, 6, 8] : [3, 4, 5, 6, 8, 10, 12];
  const d1 = ds[rand(0, ds.length - 1)];
  const d2 = ds[rand(0, ds.length - 1)];
  const n1 = rand(1, d1 - 1);
  const n2 = rand(1, d2 - 1);
  const [sn, sd] = simplify(n1 * d2 + n2 * d1, d1 * d2);
  const answer = frac(sn, sd);
  return {
    topic: 'Fractions',
    skill: 'Add fractions',
    difficulty,
    prompt: `${frac(n1, d1)} + ${frac(n2, d2)} = ?`,
    answer,
    explanation: `Use a common denominator, add, then simplify to ${answer}.`,
    options: makeOptions(answer, () => frac(Math.max(1, sn + rand(-2, 2)), Math.max(2, sd + rand(-1, 2)))),
  };
}

function genFractionMultiply(difficulty = 1): Question {
  const ds = difficulty === 1 ? [2, 3, 4, 5, 6, 8] : [3, 4, 5, 6, 8, 10, 12];
  const d1 = ds[rand(0, ds.length - 1)];
  const d2 = ds[rand(0, ds.length - 1)];
  const n1 = rand(1, d1 - 1);
  const n2 = rand(1, d2 - 1);
  const [sn, sd] = simplify(n1 * n2, d1 * d2);
  const answer = frac(sn, sd);
  return {
    topic: 'Fractions',
    skill: 'Multiply fractions',
    difficulty,
    prompt: `${frac(n1, d1)} × ${frac(n2, d2)} = ?`,
    answer,
    explanation: 'Multiply top numbers, multiply bottom numbers, then simplify.',
    options: makeOptions(answer, () => frac(Math.max(1, sn + rand(-2, 2)), Math.max(2, sd + rand(-1, 2)))),
  };
}

function genDecimalOp(difficulty = 1): Question {
  const div = difficulty === 1 ? 100 : 10;
  const a = round2(rand(10, 999) / div);
  const b = round2(rand(10, 999) / div);
  const op = Math.random() > 0.5 ? '+' : '-';
  const answer = round2(op === '+' ? a + b : a - b);
  return {
    topic: 'Decimals',
    skill: op === '+' ? 'Add decimals' : 'Subtract decimals',
    difficulty,
    prompt: `${a} ${op} ${b} = ?`,
    answer: String(answer),
    explanation: `Line up decimal places and ${op === '+' ? 'add' : 'subtract'}.`,
    options: makeOptions(String(answer), () => String(round2(answer + rand(-20, 20) / 100))),
  };
}

function genPercent(): Question {
  const pct = [5, 10, 20, 25, 50, 75][rand(0, 5)];
  const base = rand(20, 240);
  const answer = round2((pct / 100) * base);
  return {
    topic: 'Percent',
    skill: 'Find a percent',
    difficulty: 1,
    prompt: `What is ${pct}% of ${base}?`,
    answer: String(answer),
    explanation: `Turn ${pct}% into ${pct / 100} and multiply.`,
    options: makeOptions(String(answer), () => String(round2(answer + rand(-12, 12)))),
  };
}

function genInteger(): Question {
  const a = rand(-20, 20);
  const b = rand(-20, 20);
  const op = Math.random() > 0.5 ? '+' : '-';
  const answer = op === '+' ? a + b : a - b;
  return {
    topic: 'Integers',
    skill: 'Integer operations',
    difficulty: 1,
    prompt: `${a} ${op} ${b} = ?`,
    answer: String(answer),
    explanation: 'Watch the signs carefully.',
    options: makeOptions(String(answer), () => String(answer + rand(-4, 4))),
  };
}

function genAlgebra(difficulty = 1): Question {
  const x = rand(-9, 9);
  const a = rand(2, difficulty === 1 ? 8 : 12);
  const b = rand(-12, 12);
  const c = a * x + b;
  return {
    topic: 'Algebra',
    skill: 'Solve equations',
    difficulty,
    prompt: `Solve for x: ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}`,
    answer: String(x),
    explanation: `Undo the constant first, then divide by ${a}.`,
    options: makeOptions(String(x), () => String(x + rand(-3, 3))),
  };
}

function genGrade4Number(): Question {
  const a = rand(100, 999);
  const b = rand(10, 99);
  return {
    topic: 'Grade4Number',
    skill: 'Add whole numbers',
    difficulty: 1,
    prompt: `${a} + ${b} = ?`,
    answer: String(a + b),
    explanation: 'Add by place value.',
    options: makeOptions(String(a + b), () => String(a + b + rand(-20, 20))),
  };
}

function genGrade4Fractions(): Question {
  const d = [2, 3, 4, 5, 6, 8][rand(0, 5)];
  const n = rand(1, d - 1);
  return {
    topic: 'Grade4Fractions',
    skill: 'Name the fraction',
    difficulty: 1,
    prompt: `Which fraction matches ${n} shaded parts out of ${d}?`,
    answer: frac(n, d),
    explanation: 'Fraction means shaded parts over total equal parts.',
    options: makeOptions(frac(n, d), () => frac(Math.max(1, n + rand(-1, 2)), d)),
  };
}

const banks: Record<string, ((difficulty?: number) => Question)[]> = {
  mixed: [genFractionAdd, genFractionMultiply, genDecimalOp, genPercent, genInteger, genAlgebra],
  fractions: [genFractionAdd, genFractionMultiply],
  decimals: [genDecimalOp],
  percent: [genPercent],
  integers: [genInteger],
  algebra: [genAlgebra],
  grade4number: [genGrade4Number],
  grade4fractions: [genGrade4Fractions],
};

function generateQuestion(path: string, difficulty = 1): Question {
  const bank = banks[path] || banks.mixed;
  return bank[rand(0, bank.length - 1)](difficulty);
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`tab-btn ${active ? 'tab-btn-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={18} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub ? <div className="stat-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-card">
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

function FractionBars({ n, d }: { n: number; d: number }) {
  return (
    <div className="fraction-visual-block">
      <div className="fraction-grid">
        {Array.from({ length: d }).map((_, i) => (
          <div key={i} className={`fraction-cell ${i < n ? 'fraction-filled' : ''}`} />
        ))}
      </div>
      <div className="muted-sm">{n} shaded parts out of {d} equal parts.</div>
    </div>
  );
}

function FractionCircle({ n, d }: { n: number; d: number }) {
  const angle = 360 / d;
  return (
    <div className="fraction-circle-wrap">
      <div className="fraction-circle">
        {Array.from({ length: d }).map((_, i) => (
          <div
            key={i}
            className={`fraction-spoke ${i < n ? 'fraction-spoke-filled' : ''}`}
            style={{ transform: `translateX(-50%) rotate(${i * angle}deg)` }}
          />
        ))}
      </div>
      <div className="muted-sm">Circle model for {n}/{d}</div>
    </div>
  );
}

function ConfettiBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="confetti-wrap">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="confetti-piece"
              initial={{ opacity: 1, y: -16, x: 0, rotate: 0 }}
              animate={{ opacity: 0, y: 220 + i * 4, x: (i % 2 === 0 ? 1 : -1) * (30 + i * 6), rotate: 260 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export default function MathSprintV4() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [activeTab, setActiveTab] = useState<'student' | 'shop' | 'parent' | 'teacher' | 'notes'>('student');
  const [screen, setScreen] = useState<'home' | 'play' | 'summary'>('home');
  const [path, setPath] = useState('mixed');
  const [difficulty, setDifficulty] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(generateQuestion('mixed', 1));
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [celebration, setCelebration] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'good' | 'bad'>('good');
  const [wrongLog, setWrongLog] = useState<WrongLogEntry[]>([]);
  const [teacherPath, setTeacherPath] = useState(defaultProfile.teacher_assignment.path);
  const [teacherLength, setTeacherLength] = useState(defaultProfile.teacher_assignment.length);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function initializeProfile() {
      const localProfile = loadLocal();
      setProfile(localProfile);
      setTeacherPath(localProfile.teacher_assignment.path);
      setTeacherLength(localProfile.teacher_assignment.length);

      const cloudProfile = await loadProfileFromSupabase();
      if (cloudProfile) {
        setProfile(cloudProfile);
        setTeacherPath(cloudProfile.teacher_assignment.path);
        setTeacherLength(cloudProfile.teacher_assignment.length);
        saveLocal(cloudProfile);
      }
    }

    initializeProfile();
  }, []);

  useEffect(() => {
    saveLocal(profile);
  }, [profile]);

  const totalQuestions = profile.session_length;
  const accuracy = questionIndex === 0 ? 0 : Math.round((correctCount / Math.max(1, questionIndex)) * 100);
  const activeAvatar = avatarShop.find((a) => a.id === profile.active_avatar) || avatarShop[0];
  const weeklyAverage = useMemo(
    () => Math.round(profile.history.reduce((a, b) => a + b.accuracy, 0) / profile.history.length),
    [profile.history],
  );

  const recommendedPath = useMemo(() => {
    const entries = Object.entries(profile.mastery).sort((a, b) => a[1] - b[1]);
    const lowest = entries[0]?.[0] || 'Fractions';
    const map: Record<string, string> = {
      Fractions: 'fractions',
      Decimals: 'decimals',
      Percent: 'percent',
      Integers: 'integers',
      Algebra: 'algebra',
      Grade4Number: 'grade4number',
      Grade4Fractions: 'grade4fractions',
    };
    return map[lowest] || 'fractions';
  }, [profile.mastery]);

  function updateProfile(patch: Partial<Profile>) {
    const nextProfile = { ...profile, ...patch } as Profile;
    setProfile(nextProfile);
    saveLocal(nextProfile);
    void saveProfileToSupabase(nextProfile);
  }

  function startSession(nextPath: string) {
    setPath(nextPath);
    setDifficulty(1);
    setQuestion(generateQuestion(nextPath, 1));
    setQuestionIndex(0);
    setSelected(null);
    setShowFeedback(false);
    setCorrectCount(0);
    setSessionXp(0);
    setSessionStreak(0);
    setCelebration('');
    setWrongLog([]);
    setScreen('play');
  }

  function adaptiveDifficulty(currentAccuracy: number, currentStreak: number) {
    if (currentAccuracy >= 85 || currentStreak >= 4) return 3;
    if (currentAccuracy >= 70 || currentStreak >= 2) return 2;
    return 1;
  }

  function answerQuestion(option: string) {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    const isCorrect = String(option) === String(question.answer);

    if (isCorrect) {
      const gain = 10 + (sessionStreak >= 2 ? 5 : 0) + (difficulty >= 3 ? 5 : 0);
      setCorrectCount((v) => v + 1);
      setSessionStreak((v) => v + 1);
      setSessionXp((v) => v + gain);
      setFeedbackTone('good');
      setCelebration(sessionStreak + 1 >= 4 ? 'Streak flames!' : 'Nice work!');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 900);
    } else {
      setSessionStreak(0);
      setFeedbackTone('bad');
      setCelebration('Learn it, then crush the next one.');
      setWrongLog((v) => [...v, { prompt: question.prompt, skill: question.skill, selected: option, correct: question.answer }]);
    }
  }

  function finishSession() {
    const finalAccuracy = Math.round((correctCount / totalQuestions) * 100);
    const keyMap: Record<string, string> = {
      fractions: 'Fractions',
      decimals: 'Decimals',
      percent: 'Percent',
      integers: 'Integers',
      algebra: 'Algebra',
      grade4number: 'Grade4Number',
      grade4fractions: 'Grade4Fractions',
    };
    const topicKey = keyMap[path];
    const mastery = { ...profile.mastery };

    if (topicKey) {
      mastery[topicKey] = Math.max(
        40,
        Math.min(99, mastery[topicKey] + (finalAccuracy >= 90 ? 5 : finalAccuracy >= 80 ? 3 : finalAccuracy >= 70 ? 1 : -1))
      );
    }

    const nextXp = profile.xp + sessionXp;
    const nextGems = profile.gems + (finalAccuracy >= 80 ? 2 : 1);

    const nextProfile: Profile = {
      ...profile,
      xp: nextXp,
      gems: nextGems,
      level: Math.max(1, Math.floor(nextXp / 100) + 1),
      mastery,
      history: [
        ...profile.history.slice(-11),
        { date: `S${profile.history.length + 1}`, topic: topicKey || 'Mixed', accuracy: finalAccuracy, mins: totalQuestions },
      ],
      badges: Array.from(
        new Set([
          ...profile.badges,
          ...(finalAccuracy === 100 ? ['Perfect Sprint'] : []),
          ...(sessionStreak >= 5 ? ['5 Answer Flame'] : []),
        ])
      ),
      parent_email_preview: `Weekly report: ${profile.student_name} averaged ${finalAccuracy}% in the latest session and should focus next on ${recommendedPath}.`,
    };

    setProfile(nextProfile);
    saveLocal(nextProfile);
    void saveProfileToSupabase(nextProfile);
    void saveSessionLogToSupabase({
      topic: topicKey || 'Mixed',
      mode: 'sprint',
      accuracy: finalAccuracy,
      xp_earned: sessionXp,
      streak_peak: sessionStreak,
      responses: wrongLog,
    });

    setScreen('summary');
  }

  function nextQuestion() {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= totalQuestions) {
      finishSession();
      return;
    }
    const nextAccuracy = Math.round((correctCount / Math.max(1, nextIndex)) * 100);
    const nextDiff = adaptiveDifficulty(nextAccuracy, sessionStreak);
    setDifficulty(nextDiff);
    setQuestion(generateQuestion(path, nextDiff >= 3 ? 2 : 1));
    setQuestionIndex(nextIndex);
    setSelected(null);
    setShowFeedback(false);
  }

  function buyAvatar(id: string) {
    const item = avatarShop.find((a) => a.id === id);
    if (!item) return;
    if (profile.unlocked_avatars.includes(id)) {
      updateProfile({ active_avatar: id });
      return;
    }
    if (profile.gems < item.cost) return;
    updateProfile({
      gems: profile.gems - item.cost,
      unlocked_avatars: [...profile.unlocked_avatars, id],
      active_avatar: id,
    });
  }

  function renderFractionVisual() {
    const parts = String(question.prompt).match(/(\d+)\/(\d+)/g);
    if (!parts?.length) return null;
    const [n, d] = parts[0].split('/').map(Number);
    return (
      <div className="two-col-grid compact-gap top-gap">
        <div className="mini-panel">
          <div className="eyebrow">Fraction bars</div>
          <FractionBars n={n} d={d} />
        </div>
        <div className="mini-panel">
          <div className="eyebrow">Fraction circle</div>
          <FractionCircle n={n} d={d} />
        </div>
      </div>
    );
  }

  return (
    <main className="page-bg">
      <div className="container">
        <section className="hero-card">
          <div>
            <div className="badge-row">
              <span className="hero-badge">Math Sprint V4</span>
              <span className="hero-badge">Daily Product Feel</span>
            </div>
            <h1 className="hero-title">Daily Math Adventure</h1>
            <p className="hero-subtitle">Confetti wins, streak flames, adaptive challenge, avatar shop, teacher tools, and weekly parent report previews.</p>
          </div>
          <div className="stats-grid">
            <StatCard icon={Star} label="XP" value={profile.xp} sub={`Level ${profile.level}`} />
            <StatCard icon={Gem} label="Gems" value={profile.gems} sub="Spend in shop" />
            <StatCard icon={Flame} label="Streak" value={profile.streak_days} sub="Daily habit" />
            <StatCard icon={Crown} label="Avatar" value={`${activeAvatar.emoji} ${activeAvatar.name}`} sub="Current" />
          </div>
        </section>

        <div className="tabs-wrap">
          <div className="tabs-header">
            <TabButton active={activeTab === 'student'} onClick={() => setActiveTab('student')}>Student</TabButton>
            <TabButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')}>XP Shop</TabButton>
            <TabButton active={activeTab === 'parent'} onClick={() => setActiveTab('parent')}>Parent</TabButton>
            <TabButton active={activeTab === 'teacher'} onClick={() => setActiveTab('teacher')}>Teacher</TabButton>
            <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>V4 Notes</TabButton>
          </div>

          {activeTab === 'student' && (
            <>
              {screen === 'home' && (
                <div className="two-col-grid">
                  <SectionCard title="Mission Control">
                    <div className="two-col-grid compact-gap">
                      <div>
                        <label className="field-label">Student name</label>
                        <input
                          className="text-input"
                          value={profile.student_name}
                          onChange={(e) => updateProfile({ student_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="field-label">Grade band</label>
                        <select className="text-input" value={profile.grade_band} onChange={(e) => updateProfile({ grade_band: e.target.value as 'grade4' | 'grade7' })}>
                          <option value="grade4">Grade 4</option>
                          <option value="grade7">Grade 7</option>
                        </select>
                      </div>
                    </div>

                    <div className="mission-grid">
                      <button className="mission-btn primary" onClick={() => startSession('mixed')}><Rocket size={18} /> Daily Sprint</button>
                      {profile.grade_band === 'grade7' ? (
                        <>
                          <button className="mission-btn" onClick={() => startSession('fractions')}><ShieldCheck size={18} /> Fractions</button>
                          <button className="mission-btn" onClick={() => startSession('decimals')}><Sparkles size={18} /> Decimals</button>
                          <button className="mission-btn" onClick={() => startSession('percent')}><BarChart3 size={18} /> Percent</button>
                          <button className="mission-btn" onClick={() => startSession('integers')}><Flame size={18} /> Integers</button>
                          <button className="mission-btn" onClick={() => startSession('algebra')}><Brain size={18} /> Algebra</button>
                        </>
                      ) : (
                        <>
                          <button className="mission-btn" onClick={() => startSession('grade4number')}><Sparkles size={18} /> Number Sense</button>
                          <button className="mission-btn" onClick={() => startSession('grade4fractions')}><ShieldCheck size={18} /> Fractions</button>
                        </>
                      )}
                    </div>
                  </SectionCard>

                  <div className="stack-gap">
                    <SectionCard title="Recommended next mission">
                      <div className="mini-panel">
                        <div className="muted-sm">Lowest mastery area</div>
                        <div className="panel-emphasis capitalize">{recommendedPath}</div>
                      </div>
                      <button className="action-btn top-gap" onClick={() => startSession(recommendedPath)}>Start recommended mission</button>
                    </SectionCard>

                    <SectionCard title="Momentum">
                      <div className="info-row"><span>Weekly average</span><strong>{weeklyAverage}%</strong></div>
                      <div className="info-row"><span>Badges</span><strong>{profile.badges.length}</strong></div>
                      <div className="info-row"><span>Current avatar</span><strong>{activeAvatar.emoji} {activeAvatar.name}</strong></div>
                    </SectionCard>
                  </div>
                </div>
              )}

              {screen === 'play' && (
                <div className="two-col-grid">
                  <div className="relative-block">
                    <ConfettiBurst show={showConfetti} />
                    <SectionCard title={`${profile.student_name}'s Mission`}>
                      <div className="header-row">
                        <span className="small-badge">Q {questionIndex + 1}/{totalQuestions}</span>
                        <span className="small-badge">Difficulty {difficulty}</span>
                      </div>
                      <div className="progress-shell"><div className="progress-fill" style={{ width: `${(questionIndex / totalQuestions) * 100}%` }} /></div>
                      <motion.div key={question.prompt} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="question-card">
                        <div className="muted-sm">{question.skill}</div>
                        <div className="question-text">{question.prompt}</div>
                        {(question.topic === 'Fractions' || question.topic === 'Grade4Fractions') ? renderFractionVisual() : null}
                      </motion.div>
                      <div className="answers-grid">
                        {question.options.map((option) => {
                          const isCorrect = String(option) === String(question.answer);
                          const isSelected = String(option) === String(selected);
                          const cls = showFeedback ? (isCorrect ? 'answer-btn correct' : isSelected ? 'answer-btn incorrect' : 'answer-btn') : 'answer-btn';
                          return (
                            <motion.button key={option} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className={cls} onClick={() => answerQuestion(option)}>
                              {option}
                            </motion.button>
                          );
                        })}
                      </div>
                      <AnimatePresence>
                        {showFeedback && (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="feedback-card">
                            <div className={`feedback-title ${feedbackTone === 'good' ? 'good' : 'bad'}`}>{feedbackTone === 'good' ? 'Correct!' : `Correct answer: ${question.answer}`}</div>
                            <div className="body-text top-gap-sm">{question.explanation}</div>
                            <div className={`celebration-box ${feedbackTone === 'good' ? 'good' : 'warn'}`}>{celebration}</div>
                            <div className="btn-row top-gap">
                              <button className="action-btn" onClick={nextQuestion}>Next</button>
                              <button className="secondary-btn" onClick={() => setScreen('home')}>Exit</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </SectionCard>
                  </div>

                  <div className="stack-gap">
                    <StatCard icon={Target} label="Accuracy" value={`${accuracy}%`} sub="This session" />
                    <StatCard icon={Flame} label="Streak Flames" value={sessionStreak} sub="Correct in a row" />
                    <StatCard icon={Star} label="Session XP" value={sessionXp} sub="Earned this run" />
                    <SectionCard title="Adaptive difficulty AI">
                      <div className="body-text">The next question gets tougher after strong accuracy or a hot streak, and stays gentle when momentum drops.</div>
                    </SectionCard>
                  </div>
                </div>
              )}

              {screen === 'summary' && (
                <div className="two-col-grid">
                  <SectionCard title="Session summary">
                    <div className="stats-grid top-gap-sm">
                      <StatCard icon={Target} label="Accuracy" value={`${Math.round((correctCount / totalQuestions) * 100)}%`} />
                      <StatCard icon={Star} label="XP Won" value={sessionXp} />
                      <StatCard icon={Gem} label="Gems Won" value={Math.max(1, Math.round(sessionXp / 15))} />
                    </div>
                    <div className="stack-gap top-gap">
                      {wrongLog.length ? wrongLog.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="mini-panel">
                          <div className="panel-emphasis-sm">{item.prompt}</div>
                          <div className="muted-sm">Selected: {item.selected} • Correct: {item.correct}</div>
                        </div>
                      )) : <div className="mini-panel">Perfect session. Ready for a harder mission.</div>}
                    </div>
                    <button className="action-btn top-gap" onClick={() => setScreen('home')}>Back to home</button>
                  </SectionCard>
                  <SectionCard title="Mastery tracker">
                    <div className="stack-gap">
                      {Object.entries(profile.mastery).map(([topic, val]) => (
                        <div key={topic}>
                          <div className="info-row"><span>{topic}</span><strong>{val}%</strong></div>
                          <div className="progress-shell small"><div className="progress-fill" style={{ width: `${val}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}
            </>
          )}

          {activeTab === 'shop' && (
            <div className="two-col-grid">
              <SectionCard title="XP Shop & Avatar Closet">
                <div className="shop-grid">
                  {avatarShop.map((item) => {
                    const owned = profile.unlocked_avatars.includes(item.id);
                    const active = profile.active_avatar === item.id;
                    return (
                      <div key={item.id} className="shop-card">
                        <div className="shop-emoji">{item.emoji}</div>
                        <div className="panel-emphasis-sm">{item.name}</div>
                        <div className="muted-sm">{owned ? 'Unlocked' : `${item.cost} gems`}</div>
                        <button className={`action-btn full ${active ? 'disabled' : ''}`} onClick={() => buyAvatar(item.id)}>
                          {active ? 'Active' : owned ? 'Equip' : 'Unlock'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
              <SectionCard title="Why the shop matters">
                <div className="stack-gap">
                  <div className="mini-panel">Gives daily practice a reward loop.</div>
                  <div className="mini-panel">Lets your daughter personalize the experience.</div>
                  <div className="mini-panel">Turns progress into something visible and fun.</div>
                  <div className="mini-panel"><ShoppingBag size={16} /> <span>Current gems: {profile.gems}</span></div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'parent' && (
            <div className="two-col-grid">
              <SectionCard title="Parent reports">
                <div className="stats-grid top-gap-sm">
                  <StatCard icon={BarChart3} label="Weekly average" value={`${weeklyAverage}%`} sub="Recent sessions" />
                  <StatCard icon={Flame} label="Habit" value={`${profile.streak_days} days`} sub="Current streak" />
                  <StatCard icon={Brain} label="Focus area" value={recommendedPath} sub="Suggested next" />
                </div>
                <div className="stack-gap top-gap">
                  {profile.history.map((entry, idx) => (
                    <div key={idx} className="info-row boxed"><span>{entry.date}</span><span>{entry.topic}</span><span>{entry.accuracy}%</span><span>{entry.mins} min</span></div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Weekly report email preview">
                <div className="mini-panel">
                  <div className="panel-emphasis-sm"><Mail size={16} /> Subject: Math Sprint Weekly Progress</div>
                  <div className="body-text top-gap-sm">{profile.parent_email_preview}</div>
                  <div className="body-text top-gap-sm">Suggested next step: 4 short sessions focused on <strong className="capitalize">{recommendedPath}</strong>.</div>
                </div>
                <div className="mini-panel top-gap">In production, this would be sent using a service like Resend or SendGrid.</div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'teacher' && (
            <div className="two-col-grid">
              <SectionCard title="Teacher dashboard">
                <div>
                  <label className="field-label">Assign mission</label>
                  <select className="text-input" value={teacherPath} onChange={(e) => setTeacherPath(e.target.value)}>
                    <option value="fractions">Fractions</option>
                    <option value="decimals">Decimals</option>
                    <option value="percent">Percent</option>
                    <option value="integers">Integers</option>
                    <option value="algebra">Algebra</option>
                    <option value="grade4number">Grade 4 Number Sense</option>
                    <option value="grade4fractions">Grade 4 Fractions</option>
                  </select>
                </div>
                <div className="top-gap">
                  <label className="field-label">Assigned length</label>
                  <select className="text-input" value={String(teacherLength)} onChange={(e) => setTeacherLength(Number(e.target.value))}>
                    <option value="8">8 questions</option>
                    <option value="10">10 questions</option>
                    <option value="12">12 questions</option>
                  </select>
                </div>
                <button
                  className="action-btn top-gap"
                  onClick={() => {
                    const nextTeacherAssignment = {
                      path: teacherPath,
                      length: teacherLength,
                      note: `Assigned ${teacherPath} for ${teacherLength} questions.`,
                    };
                    updateProfile({
                      teacher_assignment: nextTeacherAssignment,
                      session_length: teacherLength,
                    });
                    startSession(teacherPath);
                  }}
                >
                  <Users size={16} /> Launch assigned mission
                </button>
              </SectionCard>
              <SectionCard title="Teacher insights">
                <div className="stack-gap">
                  <div className="mini-panel">Best next topic: <strong className="capitalize">{recommendedPath}</strong></div>
                  <div className="mini-panel">Suggested note: {profile.teacher_assignment.note}</div>
                  <div className="mini-panel">Use fraction visuals for conceptual support before timed rounds.</div>
                  <div className="mini-panel">Assign harder work after 80%+ weekly average.</div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'notes' && (
            <SectionCard title="What V4 adds">
              <div className="stack-gap">
                <div className="mini-panel">Animated confetti burst on correct answers.</div>
                <div className="mini-panel">Streak flames language and visual reward loop.</div>
                <div className="mini-panel">Adaptive difficulty AI based on accuracy and streaks.</div>
                <div className="mini-panel">Visual fraction bars and circles.</div>
                <div className="mini-panel">XP shop with unlockable avatars.</div>
                <div className="mini-panel">Teacher dashboard with assign-and-launch workflow.</div>
                <div className="mini-panel">Parent weekly report email preview.</div>
                <div className="mini-panel"><strong>Name save fix included:</strong> the student name field uses direct local state updates through <code>updateProfile()</code>, which immediately updates React state, localStorage, and cloud save on every keystroke.</div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </main>
  );
}