// ═══════════════════════════════════════════════════════
// ui.js — All rendering functions for Planner 2026
// Tabs: Home, Goals, Progress, Hifz, Schedule, Habits, Year Grid, History, Tasbeeh
// PATCHED: error boundaries, roundRect polyfill, null-safety, tasbeeh display fix
// ═══════════════════════════════════════════════════════

import {
  checks, hifzSt, hifzPages, hifzNotes, weekRevs, favs, streaks, customGoals,
  badHabits, habitLog, tasbeehCount, khatmCount, streakFreezes, currentTab, pctRegistry, _themeManual,
  _openJuz, _hifzView,
  setChecks, setHifzSt, setHifzPages, setHifzNotes, setFavs, setStreaks, setWeekRevs,
  setCustomGoals, setBadHabits, setHabitLog, setTasbeehCount, setKhatmCount, setCurrentTab,
  setPctRegistry, setThemeManual, setOpenJuz, setHifzView, setStreakFreezes,
  getGoals, getGoalProgress, getGoalPct, getDailyQuote, getGeneralQuote,
  calcStreak, recordToday, saveState, today, todayKey, dayOfYear, daysLeft, isRamadan, weekNum,
  updateGlobalPcts, applyTheme, toggleTheme, toggleHabit, getHabitStreak,
  addTasbeeh, searchGoals, getSmartSuggestion, useStreakFreeze,
  doExport, copyExportCode, doImport, exportJSON, exportCSV, exportNotionText,
  buildPayload, idbSet
} from './app.js';

import {
  JUZ_LIST, JUZ30_SURAHS, husaryUrl, GOAL_TEMPLATES, DEFAULT_GOALS, getTrackerItems, getDefaultBadHabits
} from './data.js';

// ─── CANVAS roundRect POLYFILL (Android WebView < 99) ───
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

// ─── VIRTUAL DOM HELPER ──────────────────────────────────
export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'innerHTML') el.innerHTML = v;
    else el.setAttribute(k, v);
  });
  children.forEach((c) => {
    if (c == null) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}

// ─── ERROR BOUNDARY ──────────────────────────────────────
function safeRender(name, fn) {
  try {
    return fn();
  } catch (err) {
    console.error(`[ui.js] render error in ${name}:`, err);
    const d = document.createElement('div');
    d.style.cssText = 'padding:24px;text-align:center;color:var(--text-muted);font-family:monospace;font-size:12px';
    d.innerHTML = `<div style="font-size:22px;margin-bottom:8px">⚠️</div>
      <div style="color:var(--text-sub);font-weight:700;margin-bottom:6px">${name} failed to load</div>
      <div style="color:var(--text-dim);font-size:10px;margin-bottom:12px">${err.message || 'Unknown error'}</div>
      <button onclick="window.render && window.render()" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-family:monospace;font-size:11px;color:var(--text-muted);cursor:pointer">Retry</button>`;
    return d;
  }
}

// ─── TOAST ──────────────────────────────────────────────
let _toastTimer = null;
export function showToast(msg, isErr = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast' + (isErr ? ' err' : '');
  requestAnimationFrame(() => { t.classList.add('show'); });
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── BANNER ──────────────────────────────────────────────
export function updateBanner() {
  const el = document.getElementById('date-banner');
  if (!el) return;
  try {
    const t = today();
    const day = t.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
    const dLeft = daysLeft();
    el.textContent = `${day} · ${dLeft} days left in 2026${isRamadan() ? ' · 🌙 Ramadan Mubarak' : ''}`;
  } catch(e) { el.textContent = new Date().toDateString(); }
}

export function updateStreakBadge() {
  const badge = document.getElementById('streak-badge');
  if (!badge) return;
  try {
    const s = calcStreak();
    badge.textContent = `🔥 ${s} day streak`;
    badge.style.display = s > 0 ? '' : 'none';
  } catch(e) { badge.style.display = 'none'; }
}

// ─── TAB SWITCH ──────────────────────────────────────────
export function showTab(tab) {
  setCurrentTab(tab);
  document.querySelectorAll('.tab-bar button').forEach((b) => b.classList.remove('active'));
  const btn = document.getElementById('tab-' + tab);
  if (btn) btn.classList.add('active');
  render();
}
window.showTab = showTab;

// ─── MAIN RENDER ─────────────────────────────────────────
export function render() {
  setPctRegistry({});
  const c = document.getElementById('main-content');
  if (!c) return;
  c.innerHTML = '';
  const frag = document.createDocumentFragment();

  const tab = currentTab || 'home';
  const renderers = {
    home:     () => safeRender('Home',     renderHome),
    goals:    () => safeRender('Goals',    renderGoals),
    progress: () => safeRender('Progress', renderProgress),
    hifz:     () => safeRender('Hifz',     renderHifz),
    schedule: () => safeRender('Schedule', renderSchedule),
    habits:   () => safeRender('Habits',   renderHabits),
    days:     () => safeRender('Year Grid',renderYearGrid),
    history:  () => safeRender('History',  renderHistory),
    tasbeeh:  () => safeRender('Tasbeeh',  renderTasbeeh),
  };

  const fn = renderers[tab];
  if (fn) frag.appendChild(fn());

  c.appendChild(frag);
  try { updateStreakBadge(); } catch(e) {}
}
window.render = render;

// ─── HOME TAB ────────────────────────────────────────────
function renderHome() {
  const d = document.createElement('div');
  const q = getGeneralQuote();
  const streak = calcStreak();
  const dLeft = daysLeft();
  const goals = getGoals();
  const totalPct = goals.length ? Math.round(goals.reduce((s, g) => s + getGoalPct(g.id), 0) / goals.length) : 0;
  const tc = Number(tasbeehCount) || 0;

  // Quote card
  if (q) {
    d.appendChild(h('div', { className:'card', style:{borderColor:'#c9a84c22', background:'#c9a84c06', marginBottom:'14px'} }, [
      h('div', { className:'italic', style:{color:'#c9a84ccc', fontSize:'13px', lineHeight:'1.6', marginBottom:'6px', fontFamily:'Georgia,serif'} }, [`"${q.t}"`]),
      h('div', { style:{color:'#c9a84c88', fontSize:'10px', fontFamily:'monospace'} }, [`— ${q.a}`]),
    ]));
  }

  // Stats row
  d.appendChild(h('div', { style:{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'14px'} }, [
    statCard('🔥', streak + ' day', 'Streak', '#c9a84c'),
    statCard('📅', dLeft + '', 'Days Left', '#6b9fd4'),
    statCard('📊', totalPct + '%', 'Overall', '#7eb89a'),
  ]));

  // Smart suggestions
  try {
    const suggestions = getSmartSuggestion();
    if (suggestions.length > 0) {
      d.appendChild(h('div', { style:{marginBottom:'14px'} }, [
        h('div', { className:'label', style:{marginBottom:'8px'} }, ['💡 Smart Suggestions']),
        ...suggestions.map((s) =>
          h('div', { className:'card', style:{borderColor:s.color+'33', background:s.color+'08', marginBottom:'8px', padding:'12px 14px'} }, [
            h('div', { style:{display:'flex', gap:'8px', alignItems:'flex-start'} }, [
              h('div', { style:{fontSize:'16px', flexShrink:'0'} }, [s.icon]),
              h('div', {}, [
                h('div', { style:{color:s.color, fontSize:'11px', fontWeight:'700', marginBottom:'2px'} }, [s.goalTitle]),
                h('div', { style:{color:'var(--text-muted)', fontSize:'11px', lineHeight:'1.4'} }, [s.message]),
              ]),
            ]),
          ])
        ),
      ]));
    }
  } catch(e) {}

  // Streak freeze UI
  if (streak === 0 && streakFreezes > 0) {
    d.appendChild(h('div', { className:'card', style:{borderColor:'#6b9fd433', background:'#6b9fd408', marginBottom:'14px'} }, [
      h('div', { style:{fontSize:'12px', color:'#6b9fd4', fontWeight:'700', marginBottom:'6px'} }, ['🛡️ Streak Freeze Available']),
      h('div', { style:{fontSize:'11px', color:'var(--text-muted)', marginBottom:'10px'} }, [`You have ${streakFreezes} freeze token${streakFreezes !== 1 ? 's' : ''}. Use one to protect your streak from yesterday's miss.`]),
      h('button', { className:'btn-gold', style:{fontSize:'11px', padding:'8px 14px'}, onclick:() => {
        if (useStreakFreeze()) {
          render(); showToast('🛡️ Streak freeze used! Streak protected.');
        } else {
          showToast('No missing day to protect', true);
        }
      } }, ['Use Streak Freeze']),
    ]));
  }

  // Earn freezes hint
  if (streakFreezes < 5) {
    const nextFreeze = [7, 14, 30, 60, 90].find((n) => streak < n);
    if (nextFreeze) {
      d.appendChild(h('div', { style:{fontSize:'10px', color:'var(--text-dim)', fontFamily:'monospace', marginBottom:'12px', textAlign:'center'} }, [
        `🛡️ Earn a streak freeze at ${nextFreeze} days (${nextFreeze - streak} more) · ${streakFreezes}/5 tokens`
      ]));
    }
  }

  // Goal overview — quick tiles
  d.appendChild(h('div', { className:'label', style:{marginBottom:'8px'} }, ["Today's Goals"]));
  const grid = h('div', { style:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px'} });
  goals.slice(0, 6).forEach((g) => {
    const pct = getGoalPct(g.id);
    const tile = h('div', { className:'card', style:{padding:'12px', cursor:'pointer', borderColor:g.color+'22'} }, [
      h('div', { style:{fontSize:'20px', marginBottom:'6px'} }, [g.icon]),
      h('div', { style:{fontSize:'11px', color:'var(--text-sub)', fontWeight:'700', marginBottom:'4px', lineHeight:'1.3'} }, [g.title.split('—')[0].trim()]),
      h('div', { className:'bar-track', style:{marginBottom:'4px'} }, [h('div', { className:'bar-fill', style:{width:pct+'%', background:g.color} }, [])]),
      h('div', { style:{fontSize:'10px', color:g.color, fontFamily:'monospace', fontWeight:'700'} }, [pct + '%']),
    ]);
    tile.onclick = () => { showTab('goals'); };
    grid.appendChild(tile);
  });
  d.appendChild(grid);

  // Quick nav to Tasbeeh
  d.appendChild(h('button', { style:{width:'100%', background:'#7eb89a18', border:'1px solid #7eb89a44', borderRadius:'12px', padding:'12px', color:'#7eb89a', fontSize:'12px', fontFamily:'monospace', fontWeight:'700', cursor:'pointer', marginBottom:'10px'}, onclick:() => showTab('tasbeeh') }, [
    `✦ Tasbeeh Counter — ${tc.toLocaleString()} / 1,000,000`
  ]));

  return d;
}

function statCard(icon, val, label, color) {
  return h('div', { className:'card', style:{textAlign:'center', padding:'12px 8px', borderColor:color+'22'} }, [
    h('div', { style:{fontSize:'18px', marginBottom:'4px'} }, [icon]),
    h('div', { style:{fontSize:'16px', fontWeight:'800', color, fontFamily:'monospace', marginBottom:'2px'} }, [val]),
    h('div', { style:{fontSize:'9px', color:'var(--text-dim)', fontFamily:'monospace', letterSpacing:'1px', textTransform:'uppercase'} }, [label]),
  ]);
}

// ─── TASBEEH TAB ─────────────────────────────────────────
function renderTasbeeh() {
  const d = document.createElement('div');
  const tc = Number(tasbeehCount) || 0;
  const remaining = Math.max(0, 1000000 - tc);
  const pct = Math.min(100, Math.round(tc / 10000));

  d.appendChild(h('div', { className:'label', style:{marginBottom:'12px'} }, ['✦ Tasbeeh Counter']));

  // Big counter card
  d.appendChild(h('div', { className:'card', style:{textAlign:'center', padding:'32px 20px', borderColor:'#7eb89a33', background:'#7eb89a06', marginBottom:'14px'} }, [
    h('div', { style:{fontSize:'11px', color:'var(--text-dim)', fontFamily:'monospace', letterSpacing:'2px', marginBottom:'8px'} }, ['TOTAL TASBEEH']),
    h('div', { id:'tasbeeh-display', style:{fontSize:'48px', fontWeight:'900', fontFamily:'monospace', color:'#7eb89a', letterSpacing:'-2px', marginBottom:'4px', lineHeight:'1', transition:'transform .15s'} }, [tc.toLocaleString()]),
    h('div', { style:{fontSize:'12px', color:'var(--text-muted)', fontFamily:'monospace', marginBottom:'16px'} }, [`${remaining.toLocaleString()} remaining · ${pct}% of 1M`]),
    h('div', { className:'bar-track', style:{height:'8px', marginBottom:'20px'} }, [
      h('div', { className:'bar-fill', style:{width:pct+'%', background:'linear-gradient(90deg,#7eb89a,#a8d4c4)'} }, []),
    ]),
    // Counter buttons
    h('div', { style:{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px', marginBottom:'12px'} }, [
      tasbBtn('+33', 33, '#7eb89a'),
      tasbBtn('+99', 99, '#7eb89a'),
      tasbBtn('+100', 100, '#6b9fd4'),
      tasbBtn('+500', 500, '#c9a84c'),
    ]),
    h('div', { style:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'} }, [
      tasbBtn('+1,000', 1000, '#a87fc9'),
      tasbBtn('+5,000', 5000, '#c47fa4'),
    ]),
  ]));

  // Session guide
  d.appendChild(h('div', { className:'card', style:{marginBottom:'12px'} }, [
    h('div', { style:{fontSize:'12px', color:'var(--text-sub)', fontWeight:'700', marginBottom:'10px'} }, ['📿 Daily Session Guide']),
    sessionRow('After Fajr', '99 × SubhanAllah', '+99'),
    sessionRow('After Dhuhr', '99 × Alhamdulillah', '+99'),
    sessionRow('After Asr', '99 × Allahu Akbar', '+99'),
    sessionRow('After Maghrib', '33+33+33', '+99'),
    sessionRow('After Isha', '33+33+33', '+99'),
    h('div', { style:{borderTop:'1px solid var(--border3)', paddingTop:'8px', marginTop:'8px', display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text-muted)', fontFamily:'monospace'} }, [
      h('span', {}, ['Daily from prayers:']),
      h('span', { style:{color:'#7eb89a', fontWeight:'700'} }, ['495 tasbeeh']),
    ]),
    h('div', { style:{display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text-muted)', fontFamily:'monospace', marginTop:'4px'} }, [
      h('span', {}, ['Target/day to reach 1M:']),
      h('span', { style:{color:'var(--gold)', fontWeight:'700'} }, ['3,311 tasbeeh']),
    ]),
  ]));

  // Milestones
  const milestones = [10000, 50000, 100000, 250000, 500000, 750000, 1000000];
  const nextMile = milestones.find((m) => m > tc);
  if (nextMile) {
    d.appendChild(h('div', { className:'card', style:{borderColor:'#c9a84c22'} }, [
      h('div', { className:'label', style:{marginBottom:'8px'} }, ['🏆 Next Milestone']),
      h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center'} }, [
        h('div', {}, [
          h('div', { style:{color:'var(--gold)', fontFamily:'monospace', fontSize:'18px', fontWeight:'800'} }, [nextMile.toLocaleString()]),
          h('div', { style:{color:'var(--text-muted)', fontSize:'10px', fontFamily:'monospace'} }, [`${(nextMile - tc).toLocaleString()} to go`]),
        ]),
        h('div', { style:{textAlign:'right'} }, [
          h('div', { style:{fontSize:'11px', color:'var(--text-dim)'} }, [`${Math.ceil((nextMile - tc) / 3311)} days at target pace`]),
        ]),
      ]),
    ]));
  }

  return d;
}

function tasbBtn(label, amount, color) {
  return h('button', {
    style:{background:color+'18', border:`1px solid ${color}44`, borderRadius:'10px', padding:'10px 8px', color, fontFamily:'monospace', fontSize:'12px', fontWeight:'700', cursor:'pointer', transition:'all .12s'},
    onclick: () => {
      addTasbeeh(amount);
      const display = document.getElementById('tasbeeh-display');
      if (display) {
        const tc2 = Number(tasbeehCount) || 0;
        display.style.transform = 'scale(1.08)';
        display.textContent = tc2.toLocaleString();
        setTimeout(() => { display.style.transform = ''; }, 150);
      }
      saveState();
    }
  }, [label]);
}

function sessionRow(prayer, dhikr, amount) {
  return h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border3)'} }, [
    h('div', {}, [
      h('div', { style:{fontSize:'11px', color:'var(--text-sub)', fontWeight:'600'} }, [prayer]),
      h('div', { style:{fontSize:'10px', color:'var(--text-muted)'} }, [dhikr]),
    ]),
    h('div', { style:{color:'#7eb89a', fontFamily:'monospace', fontSize:'11px', fontWeight:'700'} }, [amount]),
  ]);
}

// ─── GOALS TAB ────────────────────────────────────────────
function renderGoals() {
  const d = document.createElement('div');

  // Search bar
  const searchWrap = h('div', { style:{position:'relative', marginBottom:'14px'} }, []);
  const searchInput = h('input', { type:'text', placeholder:'🔍  Search goals and tasks…', style:{paddingLeft:'12px', fontSize:'13px'} });
  let searchTimer = null;
  const resultsBox = h('div', { style:{marginTop:'8px'} });
  searchInput.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = searchInput.value.trim();
      resultsBox.innerHTML = '';
      if (q.length < 2) return;
      try {
        const results = searchGoals(q);
        if (!results.length) {
          resultsBox.appendChild(h('div', { style:{color:'var(--text-muted)', fontSize:'12px', fontFamily:'monospace', textAlign:'center', padding:'12px'} }, ['No results found']));
          return;
        }
        results.forEach((r) => {
          const row = h('div', { className:'card', style:{padding:'10px 14px', marginBottom:'6px', cursor:'pointer', borderColor:r.color+'22', display:'flex', alignItems:'center', gap:'10px'} }, [
            h('div', { style:{fontSize:'16px'} }, [r.icon]),
            h('div', { style:{flex:'1', minWidth:'0'} }, [
              h('div', { style:{fontSize:'11px', color:r.color, fontFamily:'monospace', marginBottom:'2px'} }, [r.goalTitle]),
              h('div', { style:{fontSize:'12px', color:'var(--text-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'} }, [r.label]),
            ]),
            r.type === 'item' ? h('div', { style:{width:'16px', height:'16px', border:`2px solid ${r.done ? r.color : 'var(--border2)'}`, borderRadius:'4px', background:r.done ? r.color : 'transparent', flexShrink:'0', display:'flex', alignItems:'center', justifyContent:'center'} }, [r.done ? h('span', {style:{color:'#0a0a0a', fontSize:'9px', fontWeight:'800'}}, ['✓']) : null]) : null,
          ]);
          row.onclick = () => { searchInput.value = ''; resultsBox.innerHTML = ''; openGoalModal(r.goalId); };
          resultsBox.appendChild(row);
        });
      } catch(e) {}
    }, 200);
  };
  searchWrap.appendChild(searchInput);
  searchWrap.appendChild(resultsBox);
  d.appendChild(searchWrap);

  // Goal templates
  d.appendChild(h('div', { style:{marginBottom:'12px', display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center'} }, [
    h('div', { className:'label', style:{marginBottom:'0'} }, ['Goal Templates']),
    ...Object.entries(GOAL_TEMPLATES).map(([key, tmpl]) =>
      h('button', {
        style:{background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'8px', padding:'5px 10px', fontSize:'10px', fontFamily:'monospace', color:'var(--text-muted)', cursor:'pointer'},
        onclick: () => openTemplateModal(key, tmpl),
      }, [tmpl.label])
    ),
  ]));

  // Saved quotes
  if (favs && favs.length > 0) {
    d.appendChild(h('div', { className:'card', style:{borderColor:'#a87fc933', background:'#a87fc908', marginBottom:'14px'} }, [
      h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'} }, [
        h('div', { className:'label' }, [`❤️ Saved Quotes (${favs.length})`]),
        h('button', { style:{color:'var(--text-muted)', fontSize:'10px', fontFamily:'monospace', cursor:'pointer'}, onclick:() => { setFavs([]); idbSet('p26_favs', []); render(); } }, ['clear all']),
      ]),
      ...favs.slice().reverse().map((q) =>
        h('div', { style:{borderLeft:'2px solid #a87fc966', paddingLeft:'10px', marginBottom:'8px'} }, [
          h('div', { className:'italic', style:{fontSize:'11px', color:'var(--text-sub)', lineHeight:'1.5'} }, [`"${q.t}"`]),
          h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'2px'} }, [
            h('div', { style:{color:'#a87fc988', fontSize:'9px', fontFamily:'monospace'} }, ['— ' + q.a]),
            h('button', { style:{fontSize:'12px', cursor:'pointer'}, onclick:() => { setFavs(favs.filter((f) => f.t !== q.t)); idbSet('p26_favs', favs); render(); } }, ['❤️']),
          ]),
        ])
      ),
    ]));
  }

  // Goals list
  d.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'} }, [
    h('div', { className:'label' }, ['Your Goals']),
    h('button', { style:{background:'#c9a84c18', border:'1px solid #c9a84c44', borderRadius:'8px', padding:'5px 10px', color:'var(--gold)', fontSize:'10px', fontFamily:'monospace', cursor:'pointer'}, onclick:openAddGoalModal }, ['+ Add Goal']),
  ]));

  getGoals().forEach((g) => {
    const q = getDailyQuote(g.id);
    const pct = getGoalPct(g.id);
    const isFav = q && favs && favs.some((f) => f.t === q.t);

    const pctLabel = h('span', { style:{color:g.color, fontSize:'9px', fontFamily:'monospace', fontWeight:'700'} }, [pct + '%']);
    const barFill = h('div', { className:'bar-fill', style:{width:pct+'%', background:g.color} }, []);
    const pctRow = h('div', { style:{marginBottom:'8px', display:pct > 0 ? '' : 'none'} }, [
      h('div', { style:{display:'flex', justifyContent:'space-between', marginBottom:'3px'} }, [
        h('span', { style:{color:'var(--text-muted)', fontSize:'9px', fontFamily:'monospace'} }, ['Progress']), pctLabel]),
      h('div', { className:'bar-track' }, [barFill]),
    ]);
    pctRegistry['g_' + g.id] = { pctBadge:pctLabel, barFill, pctText:null, pctRow };

    const card = h('div', { className:'card', style:{borderColor:`${g.color}22`, cursor:'pointer', marginBottom:'10px'} }, [
      h('div', { style:{display:'flex', gap:'12px', alignItems:'flex-start'} }, [
        h('div', { style:{fontSize:'22px', lineHeight:'1', flexShrink:'0'} }, [g.icon]),
        h('div', { style:{flex:'1', minWidth:'0'} }, [
          h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'flex-start'} }, [
            h('div', { style:{color:g.color, fontSize:'13px', fontWeight:'700', fontFamily:'Georgia,serif', marginBottom:'2px'} }, [g.title]),
            h('div', { style:{display:'flex', gap:'4px', alignItems:'center'} }, [
              g.tier ? h('span', { style:{fontSize:'8px', background:g.tier==='core'?'#c9a84c22':'var(--surface2)', color:g.tier==='core'?'var(--gold)':'var(--text-dim)', border:'1px solid '+(g.tier==='core'?'#c9a84c44':'var(--border)'), borderRadius:'4px', padding:'1px 5px', fontFamily:'monospace'} }, [g.tier]) : null,
              h('button', { style:{fontSize:'12px', color:'var(--text-dim)', cursor:'pointer', padding:'0 4px'}, onclick:(e) => { e.stopPropagation(); openEditGoalModal(g.id); } }, ['✏️']),
            ]),
          ]),
          h('div', { style:{color:'var(--text-muted)', fontSize:'10px', marginBottom:'8px'} }, [g.sub]),
          pctRow,
          q ? h('div', { style:{borderLeft:`2px solid ${g.color}55`, paddingLeft:'8px'} }, [
            h('div', { className:'italic', style:{color:`${g.color}cc`, fontSize:'10px', lineHeight:'1.5'} }, [`"${q.t}"`]),
            h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'2px'} }, [
              h('div', { style:{color:`${g.color}88`, fontSize:'9px', fontFamily:'monospace'} }, ['— ' + q.a]),
              h('button', { style:{fontSize:'12px', padding:'0 4px', opacity:isFav?1:.4, cursor:'pointer'}, onclick:(e) => { e.stopPropagation(); toggleFav(q, g.id); } }, ['❤️']),
            ]),
          ]) : null,
        ]),
      ]),
    ]);
    card.onclick = () => openGoalModal(g.id);
    card.onmouseenter = () => { card.style.borderColor = `${g.color}44`; card.style.transform = 'translateY(-1px)'; };
    card.onmouseleave = () => { card.style.borderColor = `${g.color}22`; card.style.transform = ''; };
    d.appendChild(card);
  });

  return d;
}

function toggleFav(q, goalId) {
  const exists = favs && favs.some((f) => f.t === q.t);
  setFavs(exists ? favs.filter((f) => f.t !== q.t) : [...(favs||[]), {...q, goalId}]);
  idbSet('p26_favs', favs);
  render();
}

function openTemplateModal(key, tmpl) {
  const box = document.getElementById('goal-edit-box');
  if (!box) return;
  box.innerHTML = '';
  box.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'} }, [
    h('div', { style:{fontSize:'15px', fontWeight:'700', fontFamily:'Georgia,serif'} }, [`${tmpl.label} Template`]),
    h('button', { style:{color:'var(--text-dim)', fontSize:'24px', cursor:'pointer'}, onclick:() => document.getElementById('goal-edit-modal').style.display = 'none' }, ['×']),
  ]));
  box.appendChild(h('div', { style:{fontSize:'12px', color:'var(--text-muted)', marginBottom:'14px'} }, [tmpl.desc]));
  box.appendChild(h('div', { style:{fontSize:'11px', color:'var(--text-dim)', fontFamily:'monospace', marginBottom:'8px'} }, [`This template includes ${tmpl.goals.length} goals:`]));
  tmpl.goals.forEach((g) => {
    const existing = DEFAULT_GOALS.find((dg) => dg.id === g.id);
    box.appendChild(h('div', { style:{display:'flex', gap:'8px', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border3)'} }, [
      h('div', { style:{fontSize:'16px'} }, [existing ? existing.icon : '⭐']),
      h('div', {}, [
        h('div', { style:{fontSize:'11px', color:'var(--text-sub)', fontWeight:'600'} }, [g.title]),
        h('div', { style:{fontSize:'10px', color:'var(--text-muted)'} }, [g.sub]),
      ]),
    ]));
  });
  box.appendChild(h('button', { className:'btn-gold', style:{width:'100%', marginTop:'16px'}, onclick:() => {
    const goals = tmpl.goals.map((tg) => {
      const def = DEFAULT_GOALS.find((dg) => dg.id === tg.id);
      return def ? {...def, ...tg} : {id:'cg_'+Date.now()+Math.random(), icon:'⭐', color:'#c9a84c', tier:'core', ...tg};
    });
    setCustomGoals(goals);
    idbSet('p26_goals', goals);
    document.getElementById('goal-edit-modal').style.display = 'none';
    render(); showToast(`${tmpl.label} template loaded!`);
  } }, ['Load Template']));
  document.getElementById('goal-edit-modal').style.display = 'flex';
}

// ─── HISTORY TAB (HEATMAP) ────────────────────────────────
function renderHistory() {
  const d = document.createElement('div');
  d.appendChild(h('div', { className:'label', style:{marginBottom:'12px'} }, ['📅 Activity History — Tap any day to explore']));

  const now = today();
  const weeks = 52;
  const grid = h('div', { style:{display:'grid', gridTemplateColumns:`repeat(${weeks}, 1fr)`, gap:'2px', marginBottom:'16px', overflowX:'auto'} });

  for (let c = 0; c < weeks; c++) {
    for (let r = 0; r < 7; r++) {
      const dayOffset = (weeks - 1 - c) * 7 + (6 - r);
      const d2 = new Date(now); d2.setDate(d2.getDate() - dayOffset);
      const k = d2.toISOString().slice(0, 10);
      const count = (streaks && streaks[k]) || 0;
      const isFuture = d2 > now;
      const isToday = k === todayKey();

      let bg = 'var(--border3)';
      if (!isFuture) {
        if (count > 0) bg = count >= 10 ? '#c9a84c' : count >= 5 ? '#c9a84c88' : '#c9a84c44';
      }

      const cell = h('div', {
        style:{
          aspectRatio:'1', borderRadius:'2px', background:isFuture ? 'transparent' : bg,
          cursor:!isFuture ? 'pointer' : 'default',
          border:isToday ? '1px solid var(--gold)' : 'none',
          opacity:isFuture ? 0.2 : 1,
        },
        title: k,
      });

      if (!isFuture) {
        cell.onclick = () => openDayDetail(k, d2);
      }
      grid.appendChild(cell);
    }
  }
  d.appendChild(grid);

  // Legend
  d.appendChild(h('div', { style:{display:'flex', gap:'8px', alignItems:'center', marginBottom:'20px', fontSize:'10px', color:'var(--text-dim)', fontFamily:'monospace'} }, [
    h('span', { style:{width:'10px', height:'10px', borderRadius:'2px', background:'var(--border3)', display:'inline-block'} }),
    h('span', {}, ['None']),
    h('span', { style:{width:'10px', height:'10px', borderRadius:'2px', background:'#c9a84c44', display:'inline-block', marginLeft:'6px'} }),
    h('span', {}, ['Light']),
    h('span', { style:{width:'10px', height:'10px', borderRadius:'2px', background:'#c9a84c88', display:'inline-block', marginLeft:'6px'} }),
    h('span', {}, ['Good']),
    h('span', { style:{width:'10px', height:'10px', borderRadius:'2px', background:'#c9a84c', display:'inline-block', marginLeft:'6px'} }),
    h('span', {}, ['Strong']),
  ]));

  // Recent week review list
  const revEntries = Object.entries(weekRevs || {}).filter(([, v]) => v && (v.wins || v.reflect)).slice(-4).reverse();
  if (revEntries.length > 0) {
    d.appendChild(h('div', { className:'label', style:{marginBottom:'8px'} }, ['Recent Weekly Reviews']));
    revEntries.forEach(([k, v]) => {
      d.appendChild(h('div', { className:'card', style:{marginBottom:'8px'} }, [
        h('div', { style:{display:'flex', justifyContent:'space-between', marginBottom:'6px'} }, [
          h('div', { style:{fontFamily:'monospace', fontSize:'11px', color:'var(--text-muted)'} }, [k.replace('week_', 'Week ')]),
          v.rating ? h('div', { style:{color:'var(--gold)', fontFamily:'monospace', fontSize:'11px', fontWeight:'700'} }, [v.rating + '/10']) : null,
        ]),
        v.wins ? h('div', { style:{fontSize:'11px', color:'var(--text-sub)', lineHeight:'1.5', marginBottom:'4px'} }, ['✅ ' + v.wins]) : null,
        v.reflect ? h('div', { className:'italic', style:{fontSize:'11px', color:'var(--text-muted)', lineHeight:'1.5'} }, ['💭 ' + v.reflect]) : null,
      ]));
    });
  } else {
    d.appendChild(h('div', { style:{textAlign:'center', padding:'20px', color:'var(--text-dim)', fontSize:'11px', fontFamily:'monospace'} }, [
      'No weekly reviews yet — complete one after a week of tracking.'
    ]));
  }

  return d;
}

function openDayDetail(dateKey, dateObj) {
  if (!dateKey || !dateObj) return;
  const count = (streaks && streaks[dateKey]) || 0;
  const box = document.getElementById('goal-edit-box');
  if (!box) return;
  box.innerHTML = '';
  const dateLabel = dateObj instanceof Date ? dateObj.toDateString() : String(dateObj);
  box.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'} }, [
    h('div', { style:{fontSize:'14px', fontWeight:'700', fontFamily:'Georgia,serif'} }, [dateLabel]),
    h('button', { style:{color:'var(--text-dim)', fontSize:'24px', cursor:'pointer'}, onclick:() => document.getElementById('goal-edit-modal').style.display = 'none' }, ['×']),
  ]));
  box.appendChild(h('div', { style:{textAlign:'center', padding:'20px'} }, [
    h('div', { style:{fontSize:'40px', fontWeight:'900', fontFamily:'monospace', color:'var(--gold)', marginBottom:'8px'} }, [count > 0 ? '🔥 ' + count : '—']),
    h('div', { style:{fontSize:'12px', color:'var(--text-muted)'} }, [count > 0 ? 'Activity count recorded for this day' : 'No activity recorded for this day']),
  ]));
  document.getElementById('goal-edit-modal').style.display = 'flex';
}

// ─── PROGRESS TAB ────────────────────────────────────────
function renderProgress() {
  const d = document.createElement('div');
  const streak = calcStreak();

  const searchInp = h('input', { type:'text', placeholder:'🔍 Search tasks…', style:{marginBottom:'12px'} });
  const searchRes = h('div', {});
  let st = null;
  searchInp.oninput = () => {
    clearTimeout(st);
    st = setTimeout(() => {
      const q = searchInp.value.trim();
      searchRes.innerHTML = '';
      if (q.length < 2) return;
      try {
        const results = searchGoals(q);
        results.forEach((r) => {
          const row = h('div', { className:'card', style:{padding:'8px 12px', marginBottom:'6px', cursor:'pointer', display:'flex', gap:'8px', alignItems:'center'} }, [
            h('div', { style:{fontSize:'14px'} }, [r.icon]),
            h('div', { style:{flex:'1', fontSize:'11px', color:'var(--text-sub)'} }, [r.label]),
            r.type === 'item' ? h('div', { style:{width:'14px', height:'14px', border:`2px solid ${r.done ? r.color : 'var(--border2)'}`, borderRadius:'3px', background:r.done ? r.color : 'transparent', flexShrink:'0'} }) : null,
          ]);
          row.onclick = () => openGoalModal(r.goalId);
          searchRes.appendChild(row);
        });
      } catch(e) {}
    }, 200);
  };
  d.appendChild(searchInp);
  d.appendChild(searchRes);

  d.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', flexWrap:'wrap', gap:'8px'} }, [
    h('div', {}, [
      h('div', { className:'label' }, ['Progress Tracker']),
      h('div', { style:{fontSize:'10px', color:'var(--text-dim)', marginTop:'2px'} }, ['Tap any tile to open its checklist']),
    ]),
    h('div', { style:{display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap'} }, [
      streak > 0 ? h('div', { style:{background:'#c9a84c12', border:'1px solid #c9a84c33', borderRadius:'10px', padding:'4px 10px', fontFamily:'monospace', fontSize:'12px', color:'var(--gold)', fontWeight:'800'} }, ['🔥' + streak]) : null,
      streakFreezes > 0 ? h('div', { style:{background:'#6b9fd412', border:'1px solid #6b9fd433', borderRadius:'10px', padding:'4px 10px', fontFamily:'monospace', fontSize:'11px', color:'#6b9fd4'} }, [`🛡️ ${streakFreezes} freeze${streakFreezes !== 1 ? 's' : ''}`]) : null,
      h('button', { className:'btn-ghost', style:{padding:'5px 10px', fontSize:'10px', fontFamily:'monospace'}, onclick:copyProgress }, ['📋 Copy']),
      h('button', { className:'btn-ghost', style:{padding:'5px 10px', fontSize:'10px', fontFamily:'monospace', color:'var(--text-dim)'}, onclick:() => document.getElementById('confirm-bg').style.display = 'flex' }, ['🗑 Clear']),
    ]),
  ]));

  const goals = getGoals();
  const totalPct = goals.length ? Math.round(goals.reduce((s, g) => s + getGoalPct(g.id), 0) / goals.length) : 0;
  const obFill = h('div', { className:'bar-fill', style:{width:totalPct+'%', background:'linear-gradient(90deg,var(--gold),var(--purple))'} });
  obFill.id = 'overall-bar-fill';
  const obLabel = h('span', { style:{color:'var(--gold)', fontSize:'10px', fontFamily:'monospace', fontWeight:'700'} }, [totalPct + '%']);
  obLabel.id = 'overall-bar-label';
  d.appendChild(h('div', { style:{marginBottom:'16px'} }, [
    h('div', { style:{display:'flex', justifyContent:'space-between', marginBottom:'4px'} }, [
      h('span', { style:{color:'var(--text-dim)', fontSize:'10px', fontFamily:'monospace'} }, ['Overall 2026 progress']), obLabel]),
    h('div', { className:'bar-track' }, [obFill]),
  ]));

  goals.forEach((g) => {
    const { done, total, pct } = getGoalProgress(g.id);
    const bf = h('div', { className:'bar-fill', style:{width:pct+'%', background:g.color} });
    const pt = h('div', { style:{fontSize:'10px', color:'var(--text-muted)', fontFamily:'monospace', marginTop:'4px'} }, [done > 0 ? `${done}/${total} · ${pct}%` : 'tap to start']);
    const pb = h('span', { style:{color:g.color, fontSize:'9px', fontFamily:'monospace', fontWeight:'700', display:pct>0?'':'none'} }, [pct + '%']);
    const pr = h('div', { style:{display:pct>0?'':'none'} }, [h('div', { style:{display:'flex', justifyContent:'space-between', marginBottom:'3px'} }, [h('span', {style:{color:'var(--text-dim)',fontSize:'9px',fontFamily:'monospace'}},['Progress']),pb]),h('div',{className:'bar-track'},[bf])]);
    pctRegistry[g.id] = { pctBadge:pb, barFill:bf, pctText:pt, pctRow:pr };

    const tile = h('div', { className:'card', style:{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', marginBottom:'8px', borderColor:`${g.color}22`} }, [
      h('div', { style:{fontSize:'20px', flexShrink:'0'} }, [g.icon]),
      h('div', { style:{flex:'1', minWidth:'0'} }, [
        h('div', { style:{color:g.color, fontSize:'12px', fontWeight:'700', marginBottom:'4px'} }, [g.title]),
        pr, pt,
      ]),
    ]);
    tile.onclick = () => openGoalModal(g.id);
    d.appendChild(tile);
  });

  d.appendChild(renderStreakChart());
  return d;
}

function copyProgress() {
  const lines = ['2026 Progress — ' + new Date().toDateString(), ''];
  getGoals().forEach((g) => { const p = getGoalPct(g.id); lines.push(g.title + ': ' + p + '%'); });
  try { navigator.clipboard.writeText(lines.join('\n')); showToast('Copied to clipboard!'); }
  catch { showToast('Copy failed', true); }
}

function renderStreakChart() {
  const card = h('div', { className:'card', style:{marginTop:'12px'} }, [
    h('div', { className:'label', style:{marginBottom:'10px'} }, ['Activity · Last 365 Days']),
  ]);
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%'; canvas.style.height = '80px';
  card.appendChild(canvas);
  setTimeout(() => {
    try {
      const W = canvas.offsetWidth || 300;
      const cols = 52, rows = 7;
      const cellW = Math.floor((W - 2) / cols), cellH = 10, gap = 2;
      canvas.width = W; canvas.height = rows * (cellH + gap);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme:dark)').matches);
      const EMPTY = isDark ? '#1e1e1e' : '#e8e8e0';
      const FILL = ['#c9a84c44', '#c9a84c88', '#c9a84c', '#e8c46c'];
      const now = today();
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const d2 = new Date(now); d2.setDate(d2.getDate() - ((cols - 1 - c) * 7 + (rows - 1 - r)));
          const count = (streaks && streaks[d2.toISOString().slice(0, 10)]) || 0;
          ctx.fillStyle = count > 0 ? FILL[Math.min(3, Math.floor(count / 5))] : EMPTY;
          // Use polyfilled roundRect (safe for all browsers)
          ctx.beginPath();
          ctx.roundRect(c * (cellW + gap), r * (cellH + gap), cellW, cellH, 2);
          ctx.fill();
        }
      }
    } catch(e) {
      console.warn('[ui.js] streak chart error:', e);
    }
  }, 50);
  return card;
}

// ─── GOAL MODAL ──────────────────────────────────────────
function openGoalModal(goalId) {
  if (!goalId) return;
  const g = getGoals().find((x) => x.id === goalId);
  if (!g) { showToast('Goal not found', true); return; }
  let items = [];
  try { items = getTrackerItems(goalId) || []; } catch(e) {}
  const { done, total, pct } = getGoalProgress(goalId);
  const box = document.getElementById('modal-box');
  if (!box) return;
  box.innerHTML = '';

  box.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px'} }, [
    h('div', {}, [
      h('div', { style:{color:g.color, fontSize:'16px', fontWeight:'700', fontFamily:'Georgia,serif', marginBottom:'2px'} }, [`${g.icon} ${g.title}`]),
      h('div', { style:{color:'var(--text-muted)', fontSize:'11px', marginBottom:'4px'} }, [g.sub]),
      h('div', { style:{fontSize:'11px', color:'var(--text-muted)', fontFamily:'monospace'} }, [`${done}/${total} · ${pct}%`]),
    ]),
    h('button', { style:{color:'var(--text-dim)', fontSize:'28px', lineHeight:'1', cursor:'pointer'}, onclick:() => document.getElementById('modal-bg').style.display = 'none' }, ['×']),
  ]));

  box.appendChild(h('div', { className:'bar-track', style:{marginBottom:'14px'} }, [h('div', { className:'bar-fill', style:{width:pct+'%', background:g.color} })]));

  if (g.detail) {
    box.appendChild(h('div', { style:{background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 12px', marginBottom:'14px', fontSize:'11px', color:'var(--text-muted)', lineHeight:'1.6'} }, [g.detail]));
  }

  if (items.length === 0) {
    box.appendChild(h('div', { style:{textAlign:'center', padding:'20px', color:'var(--text-dim)', fontSize:'11px', fontFamily:'monospace'} }, ['No checklist items for this goal.']));
  } else {
    const body = h('div', { style:{maxHeight:'50vh', overflowY:'auto'} });
    renderCheckItems(items, body, g.color);
    box.appendChild(body);
  }

  document.getElementById('modal-bg').style.display = 'flex';
}

function renderCheckItems(items, container, color, depth = 0) {
  if (!items || !items.length) return;
  items.forEach((item) => {
    if (!item) return;
    if (item.children && item.children.length) {
      let exp = false;
      const { done:cd, total:ct } = countChildren(item.children);
      const arrow = h('div', { style:{color:'var(--text-dim)', fontSize:'11px', transition:'transform .18s'} }, ['›']);
      const counter = h('span', { style:{color:'var(--text-muted)', fontSize:'9px', fontFamily:'monospace'} }, [cd + '/' + ct]);
      const hdr = h('div', { style:{display:'flex', alignItems:'center', gap:'6px', padding:'7px 10px', cursor:'pointer', borderRadius:'8px', background:'var(--surface2)', margin:'2px 0'} }, [
        h('div', { style:{flex:'1', fontSize:'11px', color:'var(--text-muted)', fontWeight:'600'} }, [item.label]),
        counter, arrow,
      ]);
      const body2 = h('div', { style:{display:'none', paddingLeft:'4px'} });
      hdr.onclick = () => { exp = !exp; body2.style.display = exp ? 'block' : 'none'; arrow.style.transform = exp ? 'rotate(90deg)' : ''; };
      renderCheckItems(item.children, body2, color, depth + 1);
      container.appendChild(hdr); container.appendChild(body2);
    } else {
      const isChecked = !!(checks && checks[item.id]);
      const box2 = h('div', { className:'check-box' + (isChecked ? ' checked' : '') }, isChecked ? [h('span', { style:{color:'#0a0a0a', fontSize:'10px', fontWeight:'800'} }, ['✓'])] : []);
      const lbl = h('div', { className:'check-label' + (isChecked ? ' done' : ''), style:{color:isChecked?'var(--check-done)':'var(--text-sub)'} }, [item.label]);
      const row = h('div', { className:'check-row', style:{paddingLeft:(depth*14+6)+'px'} }, [box2, lbl]);
      row.onclick = () => {
        if (!checks) return;
        checks[item.id] = !checks[item.id];
        saveState();
        if (checks[item.id]) recordToday();
        box2.className = 'check-box' + (checks[item.id] ? ' checked' : '');
        box2.innerHTML = checks[item.id] ? '<span style="color:#0a0a0a;font-size:10px;font-weight:800">✓</span>' : '';
        lbl.className = 'check-label' + (checks[item.id] ? ' done' : '');
        lbl.style.color = checks[item.id] ? 'var(--check-done)' : 'var(--text-sub)';
        try { updateGlobalPcts(); } catch(e) {}
        try { updateStreakBadge(); } catch(e) {}
      };
      container.appendChild(row);
    }
  });
}

function countChildren(items) {
  let done = 0, total = 0;
  (items || []).forEach((i) => {
    if (!i) return;
    if (i.children) { const r = countChildren(i.children); done += r.done; total += r.total; }
    else { total++; if (checks && checks[i.id]) done++; }
  });
  return { done, total };
}

// ─── ADD/EDIT GOAL MODALS ────────────────────────────────
function openAddGoalModal() {
  const box = document.getElementById('goal-edit-box');
  if (!box) return;
  box.innerHTML = '';
  const icons = ['☽','🕌','✦','📋','📖','💪','📊','🎤','ع','✍️','🌙','🔗','⭐','🎯','💡','🏃','🧠','✅'];
  let sel = { icon:'⭐', color:'#c9a84c' };
  box.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px'} }, [
    h('div', { style:{fontSize:'15px', fontWeight:'700', fontFamily:'Georgia,serif'} }, ['Add New Goal']),
    h('button', { style:{color:'var(--text-dim)', fontSize:'24px', cursor:'pointer'}, onclick:() => document.getElementById('goal-edit-modal').style.display = 'none' }, ['×']),
  ]));
  const iconRow = h('div', { style:{display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px'} });
  icons.forEach((ic) => {
    const btn = h('button', { style:{width:'32px', height:'32px', borderRadius:'8px', border:'1px solid var(--border)', fontSize:'16px', cursor:'pointer', background:'transparent'}, onclick:() => {
      sel.icon = ic;
      iconRow.querySelectorAll('button').forEach((b) => b.style.background = 'transparent');
      btn.style.background = 'var(--hover-bg)';
    } }, [ic]);
    iconRow.appendChild(btn);
  });
  box.appendChild(h('div', { className:'label', style:{marginBottom:'6px'} }, ['Icon']));
  box.appendChild(iconRow);
  const titleInput = h('input', { type:'text', placeholder:'Goal title…', style:{marginBottom:'8px'} });
  const subInput = h('input', { type:'text', placeholder:'Subtitle / daily target…', style:{marginBottom:'8px'} });
  const detailInput = h('textarea', { placeholder:'Details…', rows:'2', style:{marginBottom:'12px'} });
  const tierSel = document.createElement('select');
  tierSel.style.cssText = 'margin-bottom:16px;width:100%;background:var(--input-bg);border:1px solid var(--input-border);border-radius:10px;padding:10px 13px;color:var(--text);font-size:13px;font-family:inherit';
  tierSel.innerHTML = '<option value="core">⭐ Core Goal</option><option value="stretch">📈 Stretch Goal</option>';
  box.appendChild(titleInput); box.appendChild(subInput); box.appendChild(detailInput);
  box.appendChild(h('div', { className:'label', style:{marginBottom:'6px'} }, ['Tier']));
  box.appendChild(tierSel);
  box.appendChild(h('button', { className:'btn-gold', style:{width:'100%'}, onclick:() => {
    if (!titleInput.value.trim()) { showToast('Add a title first!', true); return; }
    const goals = customGoals ? [...customGoals] : [...DEFAULT_GOALS];
    goals.push({ id:'cg_'+Date.now(), icon:sel.icon, color:sel.color, title:titleInput.value.trim(), sub:subInput.value.trim(), detail:detailInput.value.trim(), tier:tierSel.value });
    setCustomGoals(goals); idbSet('p26_goals', goals);
    document.getElementById('goal-edit-modal').style.display = 'none';
    render(); showToast('Goal added! ⭐');
  } }, ['Add Goal']));
  document.getElementById('goal-edit-modal').style.display = 'flex';
}

function openEditGoalModal(goalId) {
  const g = getGoals().find((x) => x.id === goalId);
  if (!g) return;
  const box = document.getElementById('goal-edit-box');
  if (!box) return;
  box.innerHTML = '';
  box.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px'} }, [
    h('div', { style:{fontSize:'15px', fontWeight:'700', fontFamily:'Georgia,serif'} }, ['Edit Goal']),
    h('button', { style:{color:'var(--text-dim)', fontSize:'24px', cursor:'pointer'}, onclick:() => document.getElementById('goal-edit-modal').style.display = 'none' }, ['×']),
  ]));
  const titleInput = h('input', { type:'text', value:g.title, style:{marginBottom:'8px'} });
  const subInput = h('input', { type:'text', value:g.sub||'', style:{marginBottom:'8px'} });
  const detailInput = h('textarea', { rows:'2', style:{marginBottom:'8px'} }, [g.detail||'']);
  box.appendChild(titleInput); box.appendChild(subInput); box.appendChild(detailInput);
  box.appendChild(h('div', { style:{display:'flex', gap:'8px'} }, [
    h('button', { className:'btn-gold', style:{flex:'1'}, onclick:() => {
      const goals = (customGoals||DEFAULT_GOALS).map((x) => x.id === goalId ? {...x, title:titleInput.value, sub:subInput.value, detail:detailInput.value} : x);
      setCustomGoals(goals); idbSet('p26_goals', goals);
      document.getElementById('goal-edit-modal').style.display = 'none';
      render(); showToast('Goal updated ✓');
    } }, ['Save']),
    h('button', { style:{flex:'1', background:'#e03e3e18', border:'1px solid #e03e3e44', borderRadius:'10px', padding:'10px', color:'#e03e3e', fontSize:'12px', cursor:'pointer'}, onclick:() => {
      if (!confirm('Delete this goal?')) return;
      const goals = (customGoals||DEFAULT_GOALS).filter((x) => x.id !== goalId);
      setCustomGoals(goals); idbSet('p26_goals', goals);
      document.getElementById('goal-edit-modal').style.display = 'none';
      render(); showToast('Goal removed');
    } }, ['Delete']),
  ]));
  document.getElementById('goal-edit-modal').style.display = 'flex';
}

// ─── HIFZ TAB ────────────────────────────────────────────
function renderHifz() {
  const d = document.createElement('div');
  const memCount = JUZ_LIST.filter((j) => { const s = (hifzSt && hifzSt[j.num])||'none'; return s==='memorised'||s==='strong'; }).length;
  const pct = Math.round(memCount / 30 * 100);

  d.appendChild(h('div', { className:'label', style:{marginBottom:'6px'} }, ['🕌 Hifz Tracker — 30 Juz']));
  d.appendChild(h('div', { style:{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px'} }, [
    hifzStat(memCount + '/30', 'Memorised', '#7eb89a'),
    hifzStat(JUZ_LIST.filter((j) => ((hifzSt && hifzSt[j.num])||'none')==='memorising').length + '', 'In Progress', '#c9a84c'),
    hifzStat((30 - memCount) + '', 'Remaining', 'var(--text-muted)'),
  ]));
  d.appendChild(h('div', { style:{marginBottom:'16px'} }, [
    h('div', { style:{display:'flex', justifyContent:'space-between', marginBottom:'4px'} }, [
      h('span', { style:{color:'#d4a8f0', fontSize:'11px', fontFamily:'monospace'} }, [memCount + '/30 juz memorised']),
      h('span', { style:{color:'var(--text-muted)', fontSize:'11px', fontFamily:'monospace'} }, [pct + '%']),
    ]),
    h('div', { className:'bar-track' }, [h('div', { className:'bar-fill', style:{width:pct+'%', background:'linear-gradient(90deg,#a87fc9,#d4a8f0)'} })]),
  ]));

  const grid = h('div', { style:{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px', marginBottom:'16px'} });
  JUZ_LIST.forEach((juz) => {
    const st = (hifzSt && hifzSt[juz.num]) || 'none';
    const colors = { none:'var(--surface2)', memorising:'#c9a84c18', memorised:'#7eb89a18', strong:'#a87fc918' };
    const borders = { none:'var(--border)', memorising:'#c9a84c55', memorised:'#7eb89a55', strong:'#a87fc955' };
    const labels = { none:juz.num+'', memorising:'📖', memorised:'✓', strong:'⭐' };
    const card2 = h('div', { style:{border:`1px solid ${borders[st]}`, borderRadius:'8px', padding:'8px 4px', textAlign:'center', cursor:'pointer', background:colors[st]} }, [
      h('div', { style:{fontSize:'10px', fontFamily:'monospace', fontWeight:'700', color:st==='none'?'var(--text-dim)':st==='memorising'?'var(--gold)':st==='memorised'?'#7eb89a':'#d4a8f0'} }, [labels[st]]),
      h('div', { style:{fontSize:'9px', color:'var(--text-dim)', fontFamily:'monospace', marginTop:'2px'} }, ['Juz ' + juz.num]),
    ]);
    card2.onclick = () => openHifzJuzModal(juz);
    grid.appendChild(card2);
  });
  d.appendChild(grid);

  // Audio player
  let currentAudio = null;
  d.appendChild(h('div', { className:'card', style:{borderColor:'#a87fc933'} }, [
    h('div', { style:{color:'#d4a8f0', fontSize:'12px', fontWeight:'700', marginBottom:'10px'} }, ['🔊 Juz 30 — Sheikh Husary']),
    h('div', { style:{display:'flex', flexWrap:'wrap', gap:'5px'} }, JUZ30_SURAHS.map((s) => {
      const btn = h('button', { className:'audio-btn', onclick:() => {
        if (currentAudio) { try { currentAudio.pause(); } catch(e) {} document.querySelectorAll('.audio-btn').forEach((b) => b.classList.remove('playing')); }
        try {
          currentAudio = new Audio(husaryUrl(s.num));
          currentAudio.play()
            .then(() => btn.classList.add('playing'))
            .catch(() => { btn.classList.remove('playing'); showToast('🔇 Audio unavailable — connect to internet first.', true); });
          currentAudio.onended = () => btn.classList.remove('playing');
          currentAudio.onerror = () => { btn.classList.remove('playing'); showToast('🔇 Audio unavailable offline', true); };
        } catch(e) { showToast('🔇 Audio not supported', true); }
      } }, [s.name]);
      return btn;
    })),
  ]));

  return d;
}

function hifzStat(val, label, color) {
  return h('div', { style:{background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'8px', padding:'6px 12px'} }, [
    h('div', { className:'label', style:{marginBottom:'2px'} }, [label]),
    h('div', { style:{color, fontFamily:'monospace', fontSize:'16px', fontWeight:'800'} }, [val]),
  ]);
}

function openHifzJuzModal(juz) {
  if (!juz) return;
  const STATUSES = ['none', 'memorising', 'memorised', 'strong'];
  const STATUS_LABELS = { none:'Not Started', memorising:'📖 Memorising', memorised:'✅ Memorised', strong:'⭐ Strong' };
  const box = document.getElementById('goal-edit-box');
  if (!box) return;
  box.innerHTML = '';
  const cur = (hifzSt && hifzSt[juz.num]) || 'none';
  box.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', marginBottom:'14px'} }, [
    h('div', { style:{fontSize:'14px', fontWeight:'700', fontFamily:'Georgia,serif'} }, [`Juz ${juz.num}`]),
    h('button', { style:{color:'var(--text-dim)', fontSize:'24px', cursor:'pointer'}, onclick:() => document.getElementById('goal-edit-modal').style.display = 'none' }, ['×']),
  ]));
  box.appendChild(h('div', { style:{fontSize:'11px', color:'var(--text-muted)', marginBottom:'14px'} }, [juz.startSurah]));
  box.appendChild(h('div', { className:'label', style:{marginBottom:'8px'} }, ['Status']));
  box.appendChild(h('div', { style:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px'} }, STATUSES.map((st) =>
    h('button', {
      style:{padding:'10px', borderRadius:'10px', border:`1px solid ${st===cur?'#c9a84c88':'var(--border)'}`, background:st===cur?'#c9a84c18':'var(--surface2)', color:st===cur?'var(--gold)':'var(--text-muted)', fontSize:'11px', cursor:'pointer', fontFamily:'monospace'},
      onclick:() => {
        if (hifzSt) hifzSt[juz.num] = st;
        saveState();
        document.getElementById('goal-edit-modal').style.display = 'none';
        render(); showToast(`Juz ${juz.num}: ${STATUS_LABELS[st]}`);
      }
    }, [STATUS_LABELS[st]])
  )));
  document.getElementById('goal-edit-modal').style.display = 'flex';
}

// ─── HABITS TAB ──────────────────────────────────────────
function renderHabits() {
  const d = document.createElement('div');
  const dk = todayKey();
  d.appendChild(h('div', { className:'label', style:{marginBottom:'12px'} }, ['🚫 Bad Habits Tracker — Today']));

  (badHabits || []).forEach((habit) => {
    if (!habit) return;
    const done = (habitLog && habitLog[dk] && habitLog[dk][habit.id]) || false;
    const streak2 = getHabitStreak(habit.id);
    const row = h('div', { className:'card', style:{display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px', borderColor:habit.color+'22'} }, [
      h('div', { style:{width:'24px', height:'24px', borderRadius:'6px', border:`2px solid ${done?habit.color:'var(--border2)'}`, background:done?habit.color:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:'0', transition:'all .12s'} }, [done ? h('span', {style:{color:'#fff', fontSize:'14px'}}, ['✓']) : null]),
      h('div', { style:{flex:'1'} }, [
        h('div', { style:{fontSize:'13px', color:done?habit.color:'var(--text-sub)', fontWeight:'600', textDecoration:done?'line-through':'none'} }, [habit.name]),
        streak2 > 0 ? h('div', { style:{fontSize:'10px', color:habit.color, fontFamily:'monospace', marginTop:'2px'} }, [`✓ ${streak2} day clean streak`]) : null,
      ]),
    ]);
    row.onclick = () => { toggleHabit(habit.id, dk); render(); };
    d.appendChild(row);
  });

  d.appendChild(h('div', { style:{marginTop:'16px', display:'flex', gap:'8px'} }, [
    h('button', { className:'btn-gold', style:{flex:'1'}, onclick:openAddHabitModal }, ['+ Add Bad Habit']),
  ]));

  return d;
}

function openAddHabitModal() {
  const box = document.getElementById('goal-edit-box');
  if (!box) return;
  box.innerHTML = '';
  box.appendChild(h('div', { style:{display:'flex', justifyContent:'space-between', marginBottom:'14px'} }, [
    h('div', { style:{fontSize:'14px', fontWeight:'700'} }, ['Add Bad Habit to Track']),
    h('button', { style:{color:'var(--text-dim)', fontSize:'24px', cursor:'pointer'}, onclick:() => document.getElementById('goal-edit-modal').style.display = 'none' }, ['×']),
  ]));
  const inp = h('input', { type:'text', placeholder:'e.g. Doom-scrolling, Late night snacking…', style:{marginBottom:'12px'} });
  box.appendChild(inp);
  box.appendChild(h('button', { className:'btn-gold', style:{width:'100%'}, onclick:() => {
    if (!inp.value.trim()) return;
    const colors = ['#e03e3e','#d4844a','#c47fa4','#6b9fd4','#a87fc9','#7eb89a'];
    const newHabit = { id:'bh_'+Date.now(), name:inp.value.trim(), color:colors[(badHabits||[]).length % colors.length] };
    setBadHabits([...(badHabits||[]), newHabit]);
    saveState();
    document.getElementById('goal-edit-modal').style.display = 'none';
    render(); showToast('Habit tracker added!');
  } }, ['Add Habit']));
  document.getElementById('goal-edit-modal').style.display = 'flex';
}

// ─── SCHEDULE TAB ────────────────────────────────────────
function renderSchedule() {
  const d = document.createElement('div');
  d.appendChild(h('div', { className:'label', style:{marginBottom:'12px'} }, ['📅 Daily Schedule']));
  const slots = [
    { time:'4:30am', label:'Tahajjud + Fajr', icon:'🌙', color:'#a87fc9' },
    { time:'5:00am', label:'Hifz — 2 new pages', icon:'🕌', color:'#a87fc9' },
    { time:'6:00am', label:'Quran recitation — 2 Juz', icon:'☽', color:'#c9a84c' },
    { time:'7:30am', label:'Breakfast + commute', icon:'🍳', color:'#d4844a' },
    { time:'8:30am', label:'Work / ACCA study block', icon:'📋', color:'#6b9fd4' },
    { time:'12:00pm', label:'Dhuhr + lunch + 20-min walk', icon:'🌿', color:'#7eb89a' },
    { time:'1:00pm', label:'Arabic — 30min Duolingo', icon:'ع', color:'#9fd4b8' },
    { time:'2:00pm', label:'PER documentation', icon:'📊', color:'#d4844a' },
    { time:'4:00pm', label:'Asr + reading — 20 pages', icon:'📖', color:'#c47fa4' },
    { time:'5:30pm', label:'English recording + shadowing', icon:'🎤', color:'#8a9fd4' },
    { time:'6:30pm', label:'Gym / workout (PPL/cycling)', icon:'💪', color:'#d46b6b' },
    { time:'8:00pm', label:'Maghrib + dinner + family', icon:'🍽️', color:'#d4844a' },
    { time:'9:00pm', label:'LinkedIn post / reading', icon:'🔗', color:'#4a70a8' },
    { time:'9:30pm', label:'Journal — English + Arabic', icon:'✍️', color:'#d4c44a' },
    { time:'10:00pm', label:'Isha + Witr + plan tomorrow', icon:'🌙', color:'#4a8fa8' },
    { time:'10:15pm', label:'Phone off · sleep', icon:'😴', color:'var(--text-dim)' },
  ];
  slots.forEach((s) => {
    d.appendChild(h('div', { style:{display:'flex', gap:'12px', alignItems:'flex-start', marginBottom:'10px'} }, [
      h('div', { style:{minWidth:'52px', fontSize:'10px', color:'var(--text-dim)', fontFamily:'monospace', paddingTop:'2px', textAlign:'right'} }, [s.time]),
      h('div', { style:{width:'2px', background:`${s.color}66`, borderRadius:'1px', flexShrink:'0', margin:'2px 0'} }),
      h('div', { style:{flex:'1', background:'var(--surface)', border:`1px solid ${s.color}22`, borderRadius:'10px', padding:'8px 12px'} }, [
        h('div', { style:{fontSize:'13px'} }, [s.icon + ' ' + s.label]),
      ]),
    ]));
  });
  return d;
}

// ─── YEAR GRID TAB ───────────────────────────────────────
function renderYearGrid() {
  const d = document.createElement('div');
  d.appendChild(h('div', { className:'label', style:{marginBottom:'12px'} }, ['📍 Year Grid 2026 — 365 Days']));

  // First-activity hint — only shown while the user has zero recorded activity days
  const hasActivity = streaks && Object.values(streaks).some((v) => v > 0);
  if (!hasActivity) {
    d.appendChild(h('div', {
      style:{
        display:'flex', alignItems:'center', gap:'10px',
        background:'#c9a84c0a', border:'1px dashed #c9a84c44',
        borderRadius:'12px', padding:'11px 14px', marginBottom:'14px',
      }
    }, [
      h('div', { style:{fontSize:'20px', flexShrink:'0'} }, ['👆']),
      h('div', {}, [
        h('div', { style:{fontSize:'12px', color:'var(--gold)', fontWeight:'700', marginBottom:'2px'} }, ['Tap any past day for details']),
        h('div', { style:{fontSize:'11px', color:'var(--text-muted)', lineHeight:'1.4'} }, ['Check off tasks in Goals or Progress to start filling your grid. Each day you log activity lights up here.']),
      ]),
    ]));
  }
  const now = today();
  const yearStart = new Date(2026, 0, 1);
  const totalDays = 365;
  const grid = h('div', { style:{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(28px, 1fr))', gap:'3px'} });

  for (let i = 0; i < totalDays; i++) {
    const d2 = new Date(yearStart); d2.setDate(d2.getDate() + i);
    const k = d2.toISOString().slice(0, 10);
    const isPast = d2 < now;
    const isToday2 = k === todayKey();
    const isFuture = d2 > now;
    const count = (streaks && streaks[k]) || 0;
    const isFreezeDay = count === -1;
    const isRam = d2 >= new Date(2026,1,17) && d2 <= new Date(2026,2,18);

    let bg;
    if (isFuture) {
      bg = isRam ? '#a87fc918' : 'var(--surface2)';
    } else if (isFreezeDay) {
      bg = '#6b9fd433';
    } else if (count >= 10) {
      bg = '#c9a84c';
    } else if (count >= 5) {
      bg = '#c9a84c88';
    } else if (count > 0) {
      bg = '#c9a84c44';
    } else if (isPast) {
      bg = '#e03e3e18';
    } else {
      bg = 'var(--surface)';
    }

    const cell = h('div', {
      style:{
        height:'28px', borderRadius:'5px', background:bg,
        border:isToday2 ? '2px solid var(--gold)' : isRam ? '1px solid #a87fc944' : '1px solid var(--border3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'8px', color:'var(--text-dim)', fontFamily:'monospace',
        cursor:!isFuture ? 'pointer' : 'default', transition:'transform .12s',
      },
      title: `${d2.toDateString()}${isRam ? ' — Ramadan' : ''}${isFreezeDay ? ' — 🛡️ Freeze used' : ''}`,
    }, [isFreezeDay ? '🛡' : count > 0 && !isToday2 ? '✓' : isToday2 ? '★' : '']);
    cell.onclick = !isFuture ? () => openDayDetail(k, d2) : undefined;
    cell.onmouseenter = () => { if (!isFuture) cell.style.transform = 'scale(1.15)'; };
    cell.onmouseleave = () => { cell.style.transform = ''; };
    grid.appendChild(cell);
  }
  d.appendChild(grid);

  d.appendChild(h('div', { style:{display:'flex', gap:'10px', marginTop:'12px', fontSize:'10px', color:'var(--text-dim)', fontFamily:'monospace', flexWrap:'wrap'} }, [
    h('span', {}, ['🟨 Light activity']),
    h('span', {}, ['🟠 Good (5+)']),
    h('span', {}, ['⭐ Strong (10+)']),
    h('span', {}, ['🟥 Missed']),
    h('span', {}, ['🟪 Ramadan']),
    h('span', {}, ['🛡 Freeze']),
    h('span', {}, ['★ Today']),
  ]));

  return d;
}

// ─── WELCOME TOUR ────────────────────────────────────────
// Called once by app.js on first launch (p26_welcomed not set in IDB).
// Uses the existing goal-edit-modal so no new HTML is needed.
export function showWelcomeTour() {
  const box = document.getElementById('goal-edit-box');
  if (!box) return;
  box.innerHTML = '';

  const steps = [
    { icon:'🎯', title:'Goals & Progress',   body:'Tap Goals to see your 2026 targets. Open any goal to check off tasks — each tick records activity and builds your streak.' },
    { icon:'📍', title:'Year Grid',           body:'Every day you log activity lights up on the Year Grid. Tap any past day to review what you recorded.' },
    { icon:'🕌', title:'Hifz Tracker',        body:'Mark each Juz as Not Started, Memorising, Memorised, or Strong. Tap a Juz tile to update its status and listen to Sheikh Husary.' },
    { icon:'✦',  title:'Tasbeeh Counter',     body:'Tap the quick-add buttons after each prayer. Your lifetime total counts toward the 1,000,000 goal.' },
    { icon:'💾', title:'Back up your data',   body:'Use the 💾 button in the header to export a backup code. Import it on any other device to sync your progress.' },
  ];

  let currentStep = 0;

  const iconEl    = h('div', { style:{fontSize:'36px', textAlign:'center', marginBottom:'10px'} }, [steps[0].icon]);
  const titleEl   = h('div', { style:{fontSize:'15px', fontWeight:'700', fontFamily:'Georgia,serif', textAlign:'center', marginBottom:'8px', color:'var(--text-sub)'} }, [steps[0].title]);
  const bodyEl    = h('div', { style:{fontSize:'12px', color:'var(--text-muted)', lineHeight:'1.65', textAlign:'center', minHeight:'52px'} }, [steps[0].body]);
  const dotsEl    = h('div', { style:{display:'flex', gap:'6px', justifyContent:'center', margin:'16px 0 18px'} });
  const nextBtn   = h('button', { className:'btn-gold', style:{width:'100%'} }, ['Next →']);
  const skipBtn   = h('button', { style:{width:'100%', marginTop:'8px', background:'transparent', border:'none', color:'var(--text-dim)', fontSize:'11px', fontFamily:'monospace', cursor:'pointer', padding:'4px'} }, ['Skip tour']);

  function buildDots() {
    dotsEl.innerHTML = '';
    steps.forEach((_, i) => {
      dotsEl.appendChild(h('div', {
        style:{ width:'7px', height:'7px', borderRadius:'50%', background: i === currentStep ? 'var(--gold)' : 'var(--border2)', transition:'background .2s' }
      }, []));
    });
  }

  function goTo(idx) {
    currentStep = idx;
    iconEl.textContent  = steps[idx].icon;
    titleEl.textContent = steps[idx].title;
    bodyEl.textContent  = steps[idx].body;
    buildDots();
    nextBtn.textContent = idx === steps.length - 1 ? "Let's go! ✦" : 'Next →';
  }

  nextBtn.onclick = () => {
    if (currentStep < steps.length - 1) {
      goTo(currentStep + 1);
    } else {
      document.getElementById('goal-edit-modal').style.display = 'none';
    }
  };
  skipBtn.onclick = () => { document.getElementById('goal-edit-modal').style.display = 'none'; };

  buildDots();
  box.appendChild(h('div', { style:{padding:'6px 0 4px'} }, [iconEl, titleEl, bodyEl, dotsEl, nextBtn, skipBtn]));
  document.getElementById('goal-edit-modal').style.display = 'flex';
}
window.showWelcomeTour = showWelcomeTour;

// ─── SYNC & EXPORT MODALS ────────────────────────────────
window.showToast        = showToast;
window.openSyncModal    = () => document.getElementById('sync-modal').style.display = 'flex';
window.openExportModal  = () => document.getElementById('export-modal').style.display = 'flex';
window.doExport         = doExport;
window.copyExportCode   = copyExportCode;
window.doImport         = doImport;
window.exportJSON       = exportJSON;
window.exportCSV        = exportCSV;
window.exportNotionText = exportNotionText;
window.toggleTheme      = toggleTheme;
window.openAddHabitModal   = openAddHabitModal;
window.openAddGoalModal    = openAddGoalModal;
window.openEditGoalModal   = openEditGoalModal;
window.openGoalModal       = openGoalModal;
window.openDayDetail       = openDayDetail;
window.updateBanner        = updateBanner;
window.updateStreakBadge   = updateStreakBadge;

window.confirmClear = () => {
  setChecks({}); setHifzSt({}); setHifzPages({}); setHifzNotes({});
  setWeekRevs({}); setFavs([]); setStreaks({}); setBadHabits(getDefaultBadHabits());
  setHabitLog({}); setTasbeehCount(0); setKhatmCount(0); setStreakFreezes(0);
  saveState();
  document.getElementById('confirm-bg').style.display = 'none';
  render(); showToast('All progress cleared');
};
