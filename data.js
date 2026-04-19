// ═══════════════════════════════════════════════════════
// data.js — All static data for Planner 2026
// ═══════════════════════════════════════════════════════

// ─── CONSTANTS ──────────────────────────────────────────
export const YEAR_START = new Date(2026, 0, 1);
export const YEAR_END   = new Date(2026, 11, 31);
export const RAM_START  = new Date(2026, 1, 17);
export const RAM_END    = new Date(2026, 2, 18);

// ─── GOALS ───────────────────────────────────────────────
export const DEFAULT_GOALS = [
  { id:'quran',    icon:'☽',  color:'#c9a84c', title:'Complete Quran (60×)',          sub:'60 full readings this year',             detail:'10 juz/day in Ramadan · 2 juz/day outside · track every khatm', tier:'core' },
  { id:'hifz',     icon:'🕌', color:'#a87fc9', title:'Full Hifz — 30 Juz',           sub:'2 new pages/day in Ramadan',             detail:'1 page/day outside Ramadan · Juz 30 first · revise daily',       tier:'core' },
  { id:'tasbeeh',  icon:'✦',  color:'#7eb89a', title:'1 Million Tasbeeh',             sub:'~3,311/day across 302 days',             detail:'After each salah: 33+33+33 = 99 × 5 prayers + dedicated sessions',tier:'core' },
  { id:'audit',    icon:'📋', color:'#6b9fd4', title:'ACCA → Practising Certificate', sub:'Complete PER · build audit portfolio',   detail:'1hr/day: PER documentation + ISA study + case studies + LinkedIn', tier:'core' },
  { id:'reading',  icon:'📖', color:'#c47fa4', title:'Reading Journey — 20 Books',    sub:'20 pages/day · 1 book every 10–15 days', detail:'Morning 15–20p + Night 10–15p · track on Goodreads · mix genres', tier:'core' },
  { id:'fitness',  icon:'💪', color:'#d46b6b', title:'Fitness — BMI 28→24',           sub:'Dumbbells + cycling · 5 days/week',      detail:'PPL split + cardio · post-Iftar in Ramadan · progressive overload', tier:'core' },
  { id:'excel_ppt',icon:'📊', color:'#d4844a', title:'Excel & PowerPoint Mastery',    sub:'Beginner → Audit-grade professional',    detail:'45min/day · tie to real audit work · build actual templates',      tier:'stretch' },
  { id:'english',  icon:'🎤', color:'#8a9fd4', title:'English Mastery',               sub:'Confident speaking & professional writing',detail:'30min/day: 3min daily recording + shadowing + 5 words/day',       tier:'stretch' },
  { id:'arabic',   icon:'ع',  color:'#9fd4b8', title:'Arabic Journey',                sub:'Conversational Gulf/MSA Arabic',         detail:'30–45min/day · Duolingo + shadowing + 5 words/day on post-its',   tier:'stretch' },
  { id:'journaling',icon:'✍️',color:'#d4c44a', title:'Bilingual Journaling',          sub:'5 sentences English + 5 Arabic daily',  detail:'10–15min/night · advances English + Arabic + self-reflection',    tier:'stretch' },
  { id:'muhasabah',icon:'🌙', color:'#4a8fa8', title:'Night Routine',                 sub:'Evening wind-down · 302 nights',         detail:'Witr → reading → journal → tomorrow plan → phone off by 10:15pm', tier:'stretch' },
  { id:'linkedin', icon:'🔗', color:'#4a70a8', title:'LinkedIn & Network',            sub:'52 posts · 260 connections · 4 articles', detail:'15min/day: 1 post/week + 5 connections/week + 4 in-depth articles', tier:'stretch' },
];

// Goal Templates
export const GOAL_TEMPLATES = {
  student: {
    label: '🎓 Student',
    desc: 'Balanced for full-time students juggling exams + deen',
    goals: [
      { id:'quran', title:'Daily Quran Revision', sub:'1 juz/day revision', detail:'Morning recitation + tafseer notes' },
      { id:'hifz',  title:'Hifz Journey', sub:'1 page/day new + 1 page revision', detail:'Juz 30 → 29 priority' },
      { id:'tasbeeh',title:'Daily Tasbeeh', sub:'1,000/day across prayers', detail:'After each salah × 5' },
      { id:'english',title:'English & Communication', sub:'30min/day', detail:'Shadowing + 3 words/day' },
      { id:'reading',title:'Reading — 12 Books', sub:'15 pages/day', detail:'Mix: textbooks + self-help + Islamic' },
    ],
  },
  professional: {
    label: '💼 Working Professional',
    desc: 'For those in full-time work building deen alongside career',
    goals: [
      { id:'quran', title:'Quran — 30 Khatm', sub:'5 pages/day', detail:'Morning 3p + evening 2p' },
      { id:'tasbeeh',title:'1 Million Tasbeeh', sub:'3,311/day', detail:'After salah + commute time' },
      { id:'audit', title:'ACCA PER Completion', sub:'1hr/day', detail:'Lunchtime study + evening PER docs' },
      { id:'fitness',title:'Fitness — 4 days/week', sub:'30min sessions', detail:'Early morning or post-work' },
      { id:'linkedin',title:'LinkedIn Growth', sub:'1 post/week', detail:'Share professional insights + audit tips' },
      { id:'reading',title:'Reading — 15 Books', sub:'20 pages/day', detail:'Morning commute + before sleep' },
    ],
  },
  hifz: {
    label: '🕌 Full-Time Hifz',
    desc: 'For those dedicating this year primarily to Quran memorisation',
    goals: [
      { id:'hifz',  title:'Full Hifz — 30 Juz', sub:'3 new pages/day + 5 revision', detail:'Sabaq + Sabqi + Manzil system' },
      { id:'quran', title:'Daily Quran Recitation', sub:'2 juz/day recitation', detail:'Beautiful voice + tajweed focus' },
      { id:'tasbeeh',title:'5 Million Tasbeeh', sub:'16,556/day', detail:'After each salah + night sessions' },
      { id:'arabic',title:'Quranic Arabic', sub:'45min/day', detail:'Understand what you memorise' },
      { id:'muhasabah',title:'Night Routine', sub:'Strict 10pm lights-out', detail:'Tahajjud → Hifz revision at Fajr' },
      { id:'fitness',title:'Health & Energy', sub:'30min walk/day', detail:'Physical health supports memory' },
    ],
  },
};

// ─── JUZ DATA ─────────────────────────────────────────────
export const JUZ_LIST = [
  { num:1,  pages:21, startSurah:"Al-Fatiha + Al-Baqarah 1–141" },
  { num:2,  pages:20, startSurah:"Al-Baqarah 142–252" },
  { num:3,  pages:20, startSurah:"Al-Baqarah 253 → Al-Imran 92" },
  { num:4,  pages:20, startSurah:"Al-Imran 93 → An-Nisa 23" },
  { num:5,  pages:20, startSurah:"An-Nisa 24–147" },
  { num:6,  pages:20, startSurah:"An-Nisa 148 → Al-Maidah 81" },
  { num:7,  pages:20, startSurah:"Al-Maidah 82 → Al-Anam 110" },
  { num:8,  pages:20, startSurah:"Al-Anam 111 → Al-Araf 87" },
  { num:9,  pages:20, startSurah:"Al-Araf 88 → Al-Anfal 40" },
  { num:10, pages:20, startSurah:"Al-Anfal 41 → At-Tawbah 92" },
  { num:11, pages:20, startSurah:"At-Tawbah 93 → Hud 5" },
  { num:12, pages:20, startSurah:"Hud 6 → Yusuf 52" },
  { num:13, pages:20, startSurah:"Yusuf 53 → Ibrahim 52" },
  { num:14, pages:20, startSurah:"Al-Hijr → An-Nahl 128" },
  { num:15, pages:20, startSurah:"Al-Isra → Al-Kahf 74" },
  { num:16, pages:20, startSurah:"Al-Kahf 75 → Ta-Ha 135" },
  { num:17, pages:20, startSurah:"Al-Anbiya → Al-Hajj 78" },
  { num:18, pages:20, startSurah:"Al-Muminun → Al-Furqan 20" },
  { num:19, pages:20, startSurah:"Al-Furqan 21 → An-Naml 55" },
  { num:20, pages:20, startSurah:"An-Naml 56 → Al-Ankabut 45" },
  { num:21, pages:20, startSurah:"Al-Ankabut 46 → Al-Ahzab 30" },
  { num:22, pages:20, startSurah:"Al-Ahzab 31 → Ya-Sin 27" },
  { num:23, pages:20, startSurah:"Ya-Sin 28 → Az-Zumar 31" },
  { num:24, pages:20, startSurah:"Az-Zumar 32 → Fussilat 46" },
  { num:25, pages:20, startSurah:"Fussilat 47 → Al-Jathiyah 37" },
  { num:26, pages:20, startSurah:"Al-Ahqaf → Adh-Dhariyat 30" },
  { num:27, pages:20, startSurah:"Adh-Dhariyat 31 → Al-Hadid 29" },
  { num:28, pages:20, startSurah:"Al-Mujadilah → At-Tahrim 12" },
  { num:29, pages:20, startSurah:"Al-Mulk (67) → Al-Mursalat (77)" },
  { num:30, pages:23, startSurah:"An-Naba (78) → An-Nas (114)" },
];

export const JUZ30_SURAHS = [
  { num:78, name:'An-Naba' },   { num:79, name:'An-Naziat' },  { num:80, name:"'Abasa" },
  { num:81, name:'At-Takwir' }, { num:82, name:'Al-Infitar' }, { num:83, name:'Al-Mutaffifin' },
  { num:84, name:'Al-Inshiqaq' },{ num:85, name:'Al-Buruj' }, { num:86, name:'At-Tariq' },
  { num:87, name:'Al-Ala' },    { num:88, name:'Al-Ghashiyah' },{ num:89, name:'Al-Fajr' },
  { num:90, name:'Al-Balad' },  { num:91, name:'Ash-Shams' },  { num:92, name:'Al-Layl' },
  { num:93, name:'Ad-Duha' },   { num:94, name:'Ash-Sharh' },  { num:95, name:'At-Tin' },
  { num:96, name:'Al-Alaq' },   { num:97, name:'Al-Qadr' },    { num:98, name:'Al-Bayyinah' },
  { num:99, name:'Az-Zalzalah' },{ num:100, name:'Al-Adiyat' },{ num:101, name:'Al-Qariah' },
  { num:102, name:'At-Takathur' },{ num:103, name:'Al-Asr' },  { num:104, name:'Al-Humazah' },
  { num:105, name:'Al-Fil' },   { num:106, name:'Quraysh' },   { num:107, name:'Al-Maun' },
  { num:108, name:'Al-Kawthar' },{ num:109, name:'Al-Kafirun' },{ num:110, name:'An-Nasr' },
  { num:111, name:'Al-Masad' }, { num:112, name:'Al-Ikhlas' }, { num:113, name:'Al-Falaq' },
  { num:114, name:'An-Nas' },
];

export const HUSARY_BASE = 'https://server8.mp3quran.net/afs/';
export const husaryUrl = (n) => HUSARY_BASE + String(n).padStart(3, '0') + '.mp3';

// ─── QUOTES ───────────────────────────────────────────────
export const DAILY_QUOTES = {
  quran:    [
    { t:"The best of you are those who learn the Quran and teach it.", a:"Prophet Muhammad ﷺ" },
    { t:"Indeed in the remembrance of Allah do hearts find rest.", a:"Quran 13:28" },
    { t:"Make the Quran the spring of your heart and the light of your chest.", a:"Ibn al-Qayyim" },
    { t:"Knowledge is the life of the mind.", a:"Ali ibn Abi Talib (RA)" },
  ],
  hifz:     [
    { t:"We have certainly made the Quran easy for remembrance.", a:"Quran 54:17" },
    { t:"The one who struggles with the Quran will have double the reward.", a:"Prophet Muhammad ﷺ" },
    { t:"Memorise with understanding — each word has a soul.", a:"Imam al-Nawawi" },
    { t:"The heart that holds the Quran will never be empty.", a:"Ibn al-Qayyim" },
  ],
  tasbeeh:  [
    { t:"The best dhikr is La ilaha illallah.", a:"Prophet Muhammad ﷺ" },
    { t:"Indeed in the remembrance of Allah do hearts find rest.", a:"Quran 13:28" },
    { t:"Two words light on the tongue, heavy on the scales: SubhanAllahi wa bihamdihi.", a:"Prophet Muhammad ﷺ" },
  ],
  audit:    [
    { t:"An investment in knowledge pays the best interest.", a:"Benjamin Franklin" },
    { t:"We are what we repeatedly do. Excellence is not an act but a habit.", a:"Aristotle" },
    { t:"It takes 20 years to build a reputation and 5 minutes to ruin it.", a:"Warren Buffett" },
  ],
  reading:  [
    { t:"A reader lives a thousand lives before he dies.", a:"George R.R. Martin" },
    { t:"Not all readers are leaders, but all leaders are readers.", a:"Harry S. Truman" },
    { t:"There is no friend as loyal as a book.", a:"Ernest Hemingway" },
  ],
  fitness:  [
    { t:"A strong believer is better and more beloved to Allah than a weak believer.", a:"Prophet Muhammad ﷺ" },
    { t:"Take care of your body. It is the only place you have to live.", a:"Jim Rohn" },
    { t:"The first wealth is health.", a:"Ralph Waldo Emerson" },
  ],
  excel_ppt:[ { t:"Without data you are just another person with an opinion.", a:"W. Edwards Deming" }, { t:"Simplicity is the ultimate sophistication.", a:"Leonardo da Vinci" } ],
  english:  [ { t:"The limits of my language mean the limits of my world.", a:"Ludwig Wittgenstein" }, { t:"All the great speakers were bad speakers at first.", a:"Ralph Waldo Emerson" } ],
  arabic:   [ { t:"Learn Arabic — it strengthens the mind and ennobles the character.", a:"Umar ibn al-Khattab (RA)" }, { t:"Arabic is the vessel that carries the Quran.", a:"Imam al-Shafi'i" } ],
  journaling:[ { t:"The unexamined life is not worth living.", a:"Socrates" }, { t:"Journal writing is a voyage to the interior.", a:"Christina Baldwin" } ],
  muhasabah:[ { t:"Hold yourself accountable before you are held accountable.", a:"Umar ibn al-Khattab (RA)" }, { t:"Reflection is the lamp of the heart.", a:"Ibn Ata'illah al-Iskandari" } ],
  linkedin: [ { t:"Be so good they cannot ignore you.", a:"Steve Martin" }, { t:"Your network is your net worth.", a:"Porter Gale" } ],
};

// ─── TRACKER ITEMS ────────────────────────────────────────
export function getTrackerItems(goalId) {
  switch (goalId) {
    case 'quran':
      return Array.from({ length:60 }, (_, i) => ({
        id: `q_k${i}`, label: `Khatm ${i + 1}`,
        children: Array.from({ length:30 }, (_, j) => ({ id:`q_k${i}_j${j}`, label:`Juz ${j + 1}` })),
      }));
    case 'hifz':
      return Array.from({ length:30 }, (_, i) => ({
        id: `h_j${i}`, label: `Juz ${i + 1} — ${JUZ_LIST[i].startSurah}`,
        children: Array.from({ length: JUZ_LIST[i].pages }, (_, j) => ({ id:`h_j${i}_p${j}`, label:`Page ${j + 1}` })),
      }));
    case 'tasbeeh':
      return [{ id:'ts_daily', label:'5,000 Daily Sessions → 1,000,000 total',
        children: Array.from({ length:200 }, (_, i) => ({ id:'ts_d'+i, label:`Session ${i+1} — 5,000 tasbeeh · Running: ${((i+1)*5000).toLocaleString()} / 1,000,000` })),
      }];
    case 'audit':
      return [
        { id:'au_per', label:'PER: Document all competencies', children: Array.from({length:13},(_,j)=>({ id:`au_po${j}`, label:`Performance Objective ${j+1}` })) },
        { id:'au_isa', label:'ISA Standards study', children: ["ISA 200","ISA 210","ISA 220","ISA 230","ISA 240","ISA 250","ISA 260","ISA 265","ISA 300","ISA 315","ISA 330","ISA 500","ISA 700"].map((s,j)=>({ id:`au_isa${j}`, label:s })) },
        { id:'au_case', label:'Case studies: PCAOB/FRC reports', children: Array.from({length:10},(_,j)=>({ id:`au_cs${j}`, label:`Case Study ${j+1}` })) },
        { id:'au_mock', label:'Mock audit simulation' }, { id:'au_sign', label:'PER sign-off with supervisor' }, { id:'au_app', label:'Applications to audit firms' },
      ];
    case 'reading':
      return [
        { id:'r_faith',   label:'Faith & Spiritual Growth (3 books)', children:[{id:'r_f0',label:"Don't Be Sad — Dr. Aaidh al-Qarni"},{id:'r_f1',label:"In the Early Hours — Khurram Murad"},{id:'r_f2',label:"Reclaim Your Heart — Yasmin Mogahed"}] },
        { id:'r_acca',    label:'Audit & Finance (3 books)', children:[{id:'r_a0',label:"The Trusted Advisor — Maister"},{id:'r_a1',label:"The Intelligent Investor — Graham"},{id:'r_a2',label:"Thinking Fast and Slow — Kahneman"}] },
        { id:'r_health',  label:'Health & Fitness (3 books)', children:[{id:'r_h0',label:"Atomic Habits — James Clear"},{id:'r_h1',label:"Why We Sleep — Matthew Walker"},{id:'r_h2',label:"The Body — Bill Bryson"}] },
        { id:'r_prod',    label:'Productivity (4 books)', children:[{id:'r_p0',label:"Deep Work — Cal Newport"},{id:'r_p1',label:"The One Thing — Gary Keller"},{id:'r_p2',label:"Can't Hurt Me — David Goggins"},{id:'r_p3',label:"12 Rules for Life — Jordan Peterson"}] },
        { id:'r_comm',    label:'Communication (3 books)', children:[{id:'r_c0',label:"Talk Like TED — Carmine Gallo"},{id:'r_c1',label:"How to Win Friends — Dale Carnegie"},{id:'r_c2',label:"The Art of Public Speaking — Lucas"}] },
        { id:'r_wealth',  label:'Wealth & Finance (2 books)', children:[{id:'r_w0',label:"Rich Dad Poor Dad — Kiyosaki"},{id:'r_w1',label:"The Millionaire Next Door"}] },
        { id:'r_arabic',  label:'Arabic & Quran Understanding (2 books)', children:[{id:'r_ar0',label:"Madinah Arabic Book 1"},{id:'r_ar1',label:"Quranic Arabic for Beginners"}] },
      ];
    case 'fitness':
      return [
        { id:'fi_ppl',       label:'PPL Workout Sessions (44 weeks)', children: Array.from({length:44},(_,j)=>({id:`fi_pp${j}`,label:`Week ${j+1}`})) },
        { id:'fi_cardio',    label:'Cycling Sessions (44 weeks)', children: Array.from({length:44},(_,j)=>({id:`fi_cy${j}`,label:`Week ${j+1}`})) },
        { id:'fi_nutrition', label:'Nutrition tracking (302 days)', children: Array.from({length:302},(_,j)=>({id:`fi_nu${j}`,label:`Day ${j+1}`})) },
        { id:'fi_bmi',       label:'BMI Checkpoints', children:[{id:'fi_b0',label:'Start: Log current BMI'},{id:'fi_b1',label:'Month 1 check'},{id:'fi_b2',label:'Month 3 check'},{id:'fi_b3',label:'Month 6 check'},{id:'fi_b4',label:'Month 9 check'},{id:'fi_b5',label:'End: Final BMI — target 24'}] },
      ];
    case 'excel_ppt':
      return [
        { id:'ep_excel', label:'Excel Modules', children: ["Formulas & Functions","VLOOKUP/XLOOKUP","IF & Nested IF","Pivot Tables","Charts & Graphs","Conditional Formatting","Power Query","Macros intro","Audit workpapers","Dashboards"].map((s,i)=>({id:`ep_e${i}`,label:s})) },
        { id:'ep_ppt',   label:'PowerPoint Modules', children: ["Slide Structure","Master Slides","Animations","Transitions","SmartArt","Storyline Design","Executive Decks","Presenting live","Audit presentations","Final project deck"].map((s,i)=>({id:`ep_p${i}`,label:s})) },
        { id:'ep_proj',  label:'Projects', children:[{id:'ep_pr0',label:'Audit dashboard in Excel'},{id:'ep_pr1',label:'Full professional PPT deck'},{id:'ep_pr2',label:'Excel audit template'}] },
      ];
    case 'english':
      return [
        { id:'en_speak',   label:'Daily Speaking (302 days)', children: Array.from({length:302},(_,j)=>({id:`en_sp${j}`,label:`Day ${j+1} — 3 min recording`})) },
        { id:'en_shadow',  label:'Daily Shadowing (302 days)', children: Array.from({length:302},(_,j)=>({id:`en_sh${j}`,label:`Day ${j+1} — 10 min`})) },
        { id:'en_vocab',   label:'Daily Vocabulary (302 days)', children: Array.from({length:302},(_,j)=>({id:`en_vo${j}`,label:`Day ${j+1} — 5 words`})) },
        { id:'en_grammar', label:'Grammar Drills (52 weeks)', children: Array.from({length:52},(_,j)=>({id:`en_gr${j}`,label:`Week ${j+1}`})) },
        { id:'en_writing', label:'Weekly Writing (44 weeks)', children: Array.from({length:44},(_,j)=>({id:`en_wr${j}`,label:`Week ${j+1}`})) },
      ];
    case 'arabic':
      return [
        { id:'ar_duolingo', label:'Duolingo Arabic (302 days)', children: Array.from({length:302},(_,j)=>({id:`ar_d${j}`,label:`Day ${j+1}`})) },
        { id:'ar_shadow',   label:'Shadowing (302 days)', children: Array.from({length:302},(_,j)=>({id:`ar_sh${j}`,label:`Day ${j+1}`})) },
        { id:'ar_vocab',    label:'Vocabulary (302 days — 5 words/day)', children: Array.from({length:302},(_,j)=>({id:`ar_v${j}`,label:`Day ${j+1}`})) },
        { id:'ar_phrases',  label:'Core phrases (100)', children: Array.from({length:100},(_,j)=>({id:`ar_ph${j}`,label:`Phrase ${j+1}`})) },
      ];
    case 'journaling':
      return [
        { id:'jo_daily',  label:'Daily Journal Entries (302 nights)', children: Array.from({length:302},(_,j)=>{const b=new Date(2026,2,4);b.setDate(b.getDate()+j);return{id:`jo_d${j}`,label:b.toDateString().slice(0,10)};}) },
        { id:'jo_review', label:'Weekly Review (44 weeks)', children: Array.from({length:44},(_,j)=>({id:`jo_wr${j}`,label:`Week ${j+1} review`})) },
      ];
    case 'muhasabah':
      return [
        { id:'mu_daily',  label:'Night Routine (302 nights)', children: Array.from({length:302},(_,j)=>{const b=new Date(2026,2,4);b.setDate(b.getDate()+j);const isFri=b.getDay()===5;return{id:`mu_d${j}`,label:b.toDateString().slice(0,10)+(isFri?' 🌟':'')};}) },
        { id:'mu_habits', label:'Habit Upgrades', children:[
          {id:'mu_h0',label:'Phone off by 10:15pm — 14 days straight'},{id:'mu_h1',label:'Witr before sleep — 30 days straight'},
          {id:'mu_h2',label:'Read 20 pages every night — 30 days'},{id:'mu_h3',label:'Write tomorrow top 3 the night before'},
          {id:'mu_h4',label:'Journal 5 English + 5 Arabic — 21 days'},{id:'mu_h5',label:'No eating 2 hours before sleep — 4 weeks'},
          {id:'mu_h6',label:'Hifz revision aloud before sleep — 14 days'},{id:'mu_h7',label:'10pm bedtime — 1 full week'},
        ]},
      ];
    case 'linkedin':
      return [
        { id:'li_posts',    label:'52 Weekly Posts', children: Array.from({length:52},(_,j)=>({id:`li_p${j}`,label:`Week ${j+1} post`})) },
        { id:'li_articles', label:'4 In-Depth Articles', children:[{id:'li_a0',label:'Q1: ACCA Affiliate Practical Guide to PER'},{id:'li_a1',label:'Q2: 10 Excel Skills Every Auditor Needs'},{id:'li_a2',label:'Q3: Building a Brand as a Young Finance Pro'},{id:'li_a3',label:'Q4: 2026 Year in Review'}] },
        { id:'li_connect',  label:'Connection Strategy (52 weeks)', children: Array.from({length:52},(_,j)=>({id:`li_c${j}`,label:`Week ${j+1}: 5 connections`})) },
        { id:'li_profile',  label:'Profile Optimisation', children:[{id:'li_pr0',label:'Headline optimised'},{id:'li_pr1',label:'Summary: 3-paragraph story'},{id:'li_pr2',label:'Experience: achievements not duties'},{id:'li_pr3',label:'ACCA + PER under Certifications'}] },
      ];
    default: return [];
  }
}

export function getDefaultBadHabits() {
  return [
    { id:'bh_social',  name:'Mindless Social Media', color:'#e03e3e' },
    { id:'bh_late',    name:'Sleeping After 11pm',   color:'#d4844a' },
    { id:'bh_junk',    name:'Junk Food / Sugar',     color:'#c47fa4' },
    { id:'bh_procras', name:'Procrastination',        color:'#6b9fd4' },
  ];
}
