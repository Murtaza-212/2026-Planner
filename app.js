// ═══════════════════════════════════════════════════════
// app.js — Core application logic for Planner 2026
// State management, persistence, business logic
// ═══════════════════════════════════════════════════════

import { DEFAULT_GOALS, JUZ_LIST, DAILY_QUOTES, getTrackerItems, getDefaultBadHabits, YEAR_END, RAM_START, RAM_END } from './data.js';

// ─── UI BRIDGE (avoids circular dep with ui.js) ──────────
// ui.js registers these on window after it loads.
function render()            { if (typeof window.render === 'function') window.render(); }
function showToast(m, e)     { if (typeof window.showToast === 'function') window.showToast(m, e); }
function updateBanner()      { if (typeof window.updateBanner === 'function') window.updateBanner(); }
function updateStreakBadge() { if (typeof window.updateStreakBadge === 'function') window.updateStreakBadge(); }

// ─── INDEXEDDB ─────────────────────────────────────────
const DB_NAME = 'planner2026', DB_VER = 2, STORE = 'kv';
let _db = null;

function openDB() {
  return new Promise((res, rej) => {
    if (_db) { res(_db); return; }
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = (e) => { _db = e.target.result; res(_db); };
    req.onerror = (e) => rej(e.target.error);
  });
}

export async function idbGet(key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => res(req.result ?? null);
    req.onerror = (e) => rej(e.target.error);
  });
}

export async function idbSet(key, val) {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(val, key);
      tx.oncomplete = () => res();
      tx.onerror = (e) => {
        const err = e.target.error;
        if (err && err.name === 'QuotaExceededError') {
          console.warn('Storage quota exceeded');
          if (typeof window.showToast === 'function') window.showToast('⚠️ Storage full! Export your data first.', true);
          res();
        } else { rej(err); }
      };
    });
  } catch (e) {
    if (e && e.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded');
      if (typeof window.showToast === 'function') window.showToast('⚠️ Storage full! Export your data first.', true);
      return;
    }
    throw e;
  }
}

// ─── STATE ──────────────────────────────────────────────
export let checks       = {};
export let hifzSt       = {};
export let hifzPages    = {};
export let hifzNotes    = {};
export let favs         = [];
export let streaks      = {};
export let weekRevs     = {};
export let customGoals  = null;
export let badHabits    = [];
export let habitLog     = {};
export let tasbeehCount = 0;
export let khatmCount   = 0;
export let streakFreezes = 0;  // NEW: streak freeze tokens
export let currentTab   = 'home';
export let pctRegistry  = {};
export let _themeManual = null;
export let _openJuz     = null;
export let _hifzView    = 'grid';

// State setters (needed for imports)
export function setChecks(v)       { checks = v; }
export function setHifzSt(v)       { hifzSt = v; }
export function setHifzPages(v)    { hifzPages = v; }
export function setHifzNotes(v)    { hifzNotes = v; }
export function setFavs(v)         { favs = v; }
export function setStreaks(v)      { streaks = v; }
export function setWeekRevs(v)     { weekRevs = v; }
export function setCustomGoals(v)  { customGoals = v; }
export function setBadHabits(v)    { badHabits = v; }
export function setHabitLog(v)     { habitLog = v; }
export function setTasbeehCount(v) { tasbeehCount = v; }
export function setKhatmCount(v)   { khatmCount = v; }
export function setCurrentTab(v)   { currentTab = v; }
export function setPctRegistry(v)  { pctRegistry = v; }
export function setThemeManual(v)  { _themeManual = v; }
export function setOpenJuz(v)      { _openJuz = v; }
export function setHifzView(v)     { _hifzView = v; }
export function setStreakFreezes(v){ streakFreezes = v; }

// ─── SAVE ────────────────────────────────────────────────
export function saveState() {
  return Promise.all([
    idbSet('p26_checks',       checks),
    idbSet('p26_hifz',         hifzSt),
    idbSet('p26_hifzPages',    hifzPages),
    idbSet('p26_hifzNotes',    hifzNotes),
    idbSet('p26_week',         weekRevs),
    idbSet('p26_favs',         favs),
    idbSet('p26_streak',       streaks),
    idbSet('p26_goals',        customGoals),
    idbSet('p26_habits',       badHabits),
    idbSet('p26_habitLog',     habitLog),
    idbSet('p26_tasbeeh',      tasbeehCount),
    idbSet('p26_khatms',       khatmCount),
    idbSet('p26_freezes',      streakFreezes),
  ]);
}

// ─── DATE HELPERS ────────────────────────────────────────
export function today()    { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
export function todayKey() { return today().toISOString().slice(0, 10); }
export function dayOfYear(d) { return Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 864e5) + 1; }
export function daysLeft() { return Math.max(0, Math.ceil((YEAR_END - today()) / 864e5)); }
export function isRamadan(){ const t = today(); return t >= RAM_START && t <= RAM_END; }
export function weekNum()  { return Math.max(0, Math.min(51, Math.floor((today() - new Date(2026, 2, 4)) / (7 * 864e5)))); }

// ─── GOALS ───────────────────────────────────────────────
export function getGoals() { return customGoals || DEFAULT_GOALS; }

export function getGoalProgress(goalId) {
  const items = getTrackerItems(goalId);
  let done = 0, total = 0;
  function countLeaves(list) {
    list.forEach((item) => {
      if (item.children && item.children.length) countLeaves(item.children);
      else { total++; if (checks[item.id]) done++; }
    });
  }
  countLeaves(items);
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

export function getGoalPct(goalId) { return getGoalProgress(goalId).pct; }

export function getDailyQuote(goalId) {
  const pool = DAILY_QUOTES[goalId] || [];
  if (!pool.length) return null;
  return pool[dayOfYear(new Date()) % pool.length];
}
export function getGeneralQuote() {
  const all = Object.values(DAILY_QUOTES).flat();
  return all[dayOfYear(new Date()) % all.length];
}

// ─── STREAK ──────────────────────────────────────────────
export function calcStreak() {
  const t = today(); let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(t); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    if (streaks[k]) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function recordToday() {
  streaks[todayKey()] = (streaks[todayKey()] || 0) + 1;
}

// NEW: Use a streak freeze to protect broken streak
export function useStreakFreeze() {
  if (streakFreezes <= 0) return false;
  // Fill yesterday with a freeze marker
  const yesterday = new Date(today()); yesterday.setDate(yesterday.getDate() - 1);
  const key = yesterday.toISOString().slice(0, 10);
  if (!streaks[key]) {
    streaks[key] = -1; // -1 = freeze marker
    streakFreezes--;
    saveState();
    return true;
  }
  return false;
}

// NEW: Adaptive daily targets based on pace
export function getAdaptiveTarget(goalId) {
  const g = getGoals().find((x) => x.id === goalId);
  if (!g) return null;
  const { done, total } = getGoalProgress(goalId);
  const remaining = total - done;
  const dLeft = daysLeft();
  if (dLeft <= 0 || remaining <= 0) return null;
  const dailyNeeded = Math.ceil(remaining / dLeft);
  // Check last 7 days pace
  const recentDone = Object.entries(checks)
    .filter(([k, v]) => v && k.startsWith(goalId.slice(0, 2)))
    .length; // rough
  return { dailyNeeded, remaining, dLeft };
}

// NEW: Smart suggestion engine
export function getSmartSuggestion() {
  const goals = getGoals();
  const suggestions = [];
  const dLeft = daysLeft();

  goals.forEach((g) => {
    const { done, total, pct } = getGoalProgress(g.id);
    const remaining = total - done;
    const dailyNeeded = Math.ceil(remaining / Math.max(dLeft, 1));
    const daysPassed = 365 - dLeft;
    const expectedPct = daysPassed > 0 ? Math.round(daysPassed / 365 * 100) : 0;
    const gap = expectedPct - pct;

    if (gap >= 20) {
      suggestions.push({
        goalId: g.id,
        goalTitle: g.title,
        color: g.color,
        icon: g.icon,
        message: `You're ${gap}% behind schedule — ${dailyNeeded} items/day needed to catch up`,
        urgency: 'high',
      });
    } else if (gap >= 10) {
      suggestions.push({
        goalId: g.id,
        goalTitle: g.title,
        color: g.color,
        icon: g.icon,
        message: `Slightly behind on ${g.title.split('—')[0].trim()} — a small push today helps`,
        urgency: 'medium',
      });
    }
  });

  return suggestions.sort((a, b) => (b.urgency === 'high' ? 1 : 0) - (a.urgency === 'high' ? 1 : 0)).slice(0, 3);
}

// ─── SEARCH ──────────────────────────────────────────────
export function searchGoals(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase();
  const results = [];

  getGoals().forEach((g) => {
    // Match goal itself
    if (g.title.toLowerCase().includes(q) || g.sub.toLowerCase().includes(q)) {
      results.push({ type: 'goal', goalId: g.id, goalTitle: g.title, icon: g.icon, color: g.color, label: g.title, sub: g.sub });
    }
    // Match tracker items
    const items = getTrackerItems(g.id);
    function searchItems(list, depth = 0) {
      list.forEach((item) => {
        if (item.label.toLowerCase().includes(q)) {
          results.push({
            type: 'item', goalId: g.id, goalTitle: g.title, icon: g.icon, color: g.color,
            label: item.label, id: item.id, done: !!checks[item.id], depth,
          });
        }
        if (item.children) searchItems(item.children, depth + 1);
      });
    }
    searchItems(items);
  });

  return results.slice(0, 30);
}

// ─── TASBEEH ─────────────────────────────────────────────
export function addTasbeeh(amount) {
  tasbeehCount += amount;
  idbSet('p26_tasbeeh', tasbeehCount);
  recordToday();
}

export function resetTasbeehDaily() {
  // tasbeehCount is cumulative, not daily — this is intentional
}

// ─── HABITS ──────────────────────────────────────────────
export function toggleHabit(habitId, dateKey) {
  if (!habitLog[dateKey]) habitLog[dateKey] = {};
  habitLog[dateKey][habitId] = !habitLog[dateKey][habitId];
  saveState();
}

export function getHabitStreak(habitId) {
  const t = today(); let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(t); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const log = habitLog[k] || {};
    if (!log[habitId]) break;
    streak++;
  }
  return streak;
}

// ─── UPDATE GLOBAL PCTS ──────────────────────────────────
export function updateGlobalPcts() {
  getGoals().forEach((g) => {
    const pct = getGoalPct(g.id);
    ['g_' + g.id, g.id].forEach((key) => {
      const reg = pctRegistry[key]; if (!reg) return;
      if (reg.pctBadge) { reg.pctBadge.textContent = pct + '%'; reg.pctBadge.style.display = pct > 0 ? '' : 'none'; }
      if (reg.barFill) reg.barFill.style.width = pct + '%';
      if (reg.pctText) { const { done: d, total: tt } = getGoalProgress(g.id); reg.pctText.textContent = d > 0 ? d + '/' + tt + ' · ' + pct + '%' : 'tap to start'; }
      if (reg.pctRow) reg.pctRow.style.display = pct > 0 ? '' : 'none';
    });
  });
  const ob = document.getElementById('overall-bar-fill');
  const ol = document.getElementById('overall-bar-label');
  if (ob) {
    const t = Math.round(getGoals().reduce((s, g) => s + getGoalPct(g.id), 0) / getGoals().length);
    ob.style.width = t + '%';
    if (ol) ol.textContent = t + '%';
  }
}

// ─── THEME ───────────────────────────────────────────────
export function applyTheme() {
  if (_themeManual) {
    document.documentElement.setAttribute('data-theme', _themeManual);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const isDark = (_themeManual === 'dark') || (!_themeManual && window.matchMedia('(prefers-color-scheme:dark)').matches);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

export function toggleTheme() {
  const cur = _themeManual || (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  _themeManual = cur === 'dark' ? 'light' : 'dark';
  idbSet('p26_theme', _themeManual);
  applyTheme();
}

// ─── NOTIFICATIONS ───────────────────────────────────────
export async function scheduleNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') return;
  }
  if (Notification.permission !== 'granted') return;

  if (window._alarmInterval) clearInterval(window._alarmInterval);
  window._alarmInterval = setInterval(() => {
    const now = new Date();
    const hh = now.getHours(), mm = now.getMinutes();
    const key = todayKey() + '_notif';
    const sent = sessionStorage.getItem(key) || '';
    if (hh === 21 && mm === 0 && !sent.includes('night')) {
      new Notification('🌙 Night Routine Time', { body: 'Time to wind down — Witr, journal, plan tomorrow.' });
      sessionStorage.setItem(key, sent + 'night');
    }
    if (hh === 5 && mm === 0 && !sent.includes('fajr')) {
      new Notification('🌅 Fajr Hifz Reminder', { body: '2 new pages of Hifz after Fajr — small steps to 30 Juz!' });
      sessionStorage.setItem(key, sent + 'fajr');
    }
  }, 30000);
}

// ─── EXPORT / IMPORT ─────────────────────────────────────
export function buildPayload() {
  return { v:3, ts:new Date().toISOString(), checks, hifzSt, hifzPages, hifzNotes, weekRevs, favs, streaks, customGoals, badHabits, habitLog, tasbeehCount, khatmCount, streakFreezes };
}

export function doExport() {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(buildPayload()))));
  document.getElementById('export-out').value = code;
  idbSet('p26_last_export', Date.now());
  showToast('Export code generated ✓');
}

export function copyExportCode() {
  const el = document.getElementById('export-out');
  if (!el.value) { showToast('Generate code first!', true); return; }
  navigator.clipboard.writeText(el.value).then(() => showToast('Copied to clipboard!')).catch(() => { el.select(); document.execCommand('copy'); showToast('Copied!'); });
}

export function doImport() {
  const code = document.getElementById('import-in').value.trim();
  const status = document.getElementById('import-status');
  if (!code) { status.textContent = '⚠️ Paste a code first.'; status.style.color = '#e03e3e'; return; }
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(code))));
    if (!data.checks) throw new Error('Invalid format');
    checks = data.checks || {}; hifzSt = data.hifzSt || {}; hifzPages = data.hifzPages || {};
    hifzNotes = data.hifzNotes || {}; weekRevs = data.weekRevs || {}; favs = data.favs || [];
    streaks = data.streaks || {}; customGoals = data.customGoals || null;
    badHabits = data.badHabits || getDefaultBadHabits(); habitLog = data.habitLog || {};
    tasbeehCount = data.tasbeehCount || 0; khatmCount = data.khatmCount || 0;
    streakFreezes = data.streakFreezes || 0;
    saveState();
    const dt = new Date(data.ts);
    status.textContent = '✅ Imported from ' + dt.toLocaleDateString();
    status.style.color = '#7eb89a';
    render(); showToast('Progress imported ✓');
  } catch (e) {
    status.textContent = '❌ Invalid code — copy it fully.';
    status.style.color = '#e03e3e';
  }
}

export function exportJSON() {
  const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], { type:'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'planner-2026-' + todayKey() + '.json'; a.click();
  idbSet('p26_last_export', Date.now());
  showToast('JSON downloaded ✓');
  document.getElementById('export-modal').style.display = 'none';
}

export function exportCSV() {
  const rows = [['Goal','Progress %','Done','Total']];
  getGoals().forEach((g) => { const { done, total, pct } = getGoalProgress(g.id); rows.push([g.title, pct, done, total]); });
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'planner-2026-' + todayKey() + '.csv'; a.click();
  showToast('CSV downloaded ✓');
  document.getElementById('export-modal').style.display = 'none';
}

export function exportNotionText() {
  const lines = ['# 2026 Progress Report', `*${new Date().toDateString()}*`, '', '## Goals', ''];
  getGoals().forEach((g) => {
    const { done, total, pct } = getGoalProgress(g.id);
    const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
    lines.push(`**${g.icon} ${g.title}** — ${pct}% (${done}/${total})`);
    lines.push(`\`${bar}\``);
    lines.push('');
  });
  const text = lines.join('\n');
  navigator.clipboard.writeText(text).then(() => showToast('Notion text copied!')).catch(() => showToast('Copy failed', true));
  document.getElementById('export-modal').style.display = 'none';
}

// ─── INIT ────────────────────────────────────────────────
let _initDone = false;
export async function initApp() {
  if (_initDone) return; // guard against double-init
  _initDone = true;
  try {
    checks        = (await idbGet('p26_checks'))    || {};
    hifzSt        = (await idbGet('p26_hifz'))      || {};
    hifzPages     = (await idbGet('p26_hifzPages')) || {};
    hifzNotes     = (await idbGet('p26_hifzNotes')) || {};
    weekRevs      = (await idbGet('p26_week'))       || {};
    favs          = (await idbGet('p26_favs'))       || [];
    streaks       = (await idbGet('p26_streak'))     || {};
    customGoals   = (await idbGet('p26_goals'))      || null;
    badHabits     = (await idbGet('p26_habits'))     || getDefaultBadHabits();
    habitLog      = (await idbGet('p26_habitLog'))   || {};
    tasbeehCount  = (await idbGet('p26_tasbeeh'))    || 0;
    khatmCount    = (await idbGet('p26_khatms'))     || 0;
    streakFreezes = (await idbGet('p26_freezes'))    || 0;
    _themeManual  = (await idbGet('p26_theme'))      || null;
  } catch (e) { console.warn('IDB load error', e); }

  applyTheme();
  // updateBanner and render are called by _markAppReady after ui.js registers them
  scheduleNotifications();

  // First-launch welcome tour — fires once, after the first render settles
  try {
    const welcomed = await idbGet('p26_welcomed');
    if (!welcomed) {
      await idbSet('p26_welcomed', 1);
      // Small delay so render() completes and the modal DOM is ready
      setTimeout(() => {
        if (typeof window.showWelcomeTour === 'function') window.showWelcomeTour();
      }, 600);
    }
  } catch (e) {}

  // Monthly backup nudge
  try {
    const lastExp = await idbGet('p26_last_export');
    if (!lastExp || (Date.now() - lastExp) > 30 * 24 * 60 * 60 * 1000) {
      if (Object.keys(checks).length > 10) {
        setTimeout(() => showToast('💾 Monthly tip: export your data via 💾'), 3500);
      }
    }
  } catch (e) {}

  // Auto midnight re-render
  (function schedMidnight() {
    const n = new Date();
    const ms = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
    setTimeout(() => { updateBanner(); render(); schedMidnight(); }, ms);
  })();

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
