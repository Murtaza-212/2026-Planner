// ═══════════════════════════════════════════════════════
// SERVICE WORKER — Planner 2026
// Handles: offline caching, background sync, push notifications
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'planner2026-v5';
const AUDIO_CACHE = 'planner2026-audio-v1';

// Core shell files to cache on install
const SHELL_URLS = [
  './index.html',
  './app.js',
  './data.js',
  './ui.js',
  './manifest.json',
];

// ─── INSTALL ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== AUDIO_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH — Network-first for HTML, Cache-first for audio ─────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Audio/MP3 files: Cache-first (offline Hifz playback)
  if (url.pathname.endsWith('.mp3') || url.hostname === 'server8.mp3quran.net') {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          // Offline and not cached — return a silent MP3 placeholder so the UI doesn't break
          return new Response('', {
            status: 503,
            statusText: 'Audio unavailable offline',
            headers: { 'Content-Type': 'audio/mpeg', 'X-Offline': '1' }
          });
        }
      })
    );
    return;
  }

  // Shell files: Network-first, fallback to cache
  if (SHELL_URLS.some((u) => event.request.url.includes(u.replace('./', '')))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: Network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ─── PUSH NOTIFICATIONS ────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '2026 Planner';
  const options = {
    body: data.body || 'Time to check in with your goals.',
    icon: data.icon || './icon-192.png',
    badge: './icon-192.png',
    tag: data.tag || 'planner-notification',
    renotify: true,
    data: { url: data.url || './' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── NOTIFICATION CLICK ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
          return;
        }
        return clients.openWindow('./');
      })
  );
});

// ─── BACKGROUND SYNC (streak safety) ─────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-streaks') {
    // Background sync placeholder — app handles data via IndexedDB
    event.waitUntil(Promise.resolve());
  }
});

// ─── PERIODIC BACKGROUND SYNC (for reminders) ────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(
      sendDailyReminder().catch((err) => {
        // Swallow errors so the browser doesn't penalise the registration
        console.warn('[sw] periodicsync sendDailyReminder failed:', err);
      })
    );
  }
});

async function sendDailyReminder() {
  // Guard: notification permission may have been revoked since registration
  if (Notification.permission !== 'granted') return;

  // Guard: avoid firing if a client window is already visible and active
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const hasVisibleClient = clientList.some((c) => c.visibilityState === 'visible');
  if (hasVisibleClient) return;

  const hour = new Date().getHours();
  let title = '', body = '';
  if (hour >= 4 && hour <= 6) {
    title = '🌅 Fajr Hifz Reminder';
    body = '2 new pages of Hifz after Fajr — small steps to 30 Juz!';
  } else if (hour >= 20 && hour <= 22) {
    title = '🌙 Night Routine Time';
    body = 'Time to wind down — Witr, journal, plan tomorrow.';
  } else {
    title = '📋 Daily Check-in';
    body = 'How are your goals going today?';
  }

  await self.registration.showNotification(title, {
    body,
    tag: 'daily-reminder',
    renotify: true,
  });
}
