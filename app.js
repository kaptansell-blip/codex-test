/* Demir Defteri — salonda kullanmak için antrenman defteri.
   Bağımlılık yok. Veriler tarayıcıda (localStorage) tutulur; sayfa bir Claude
   Artifact'i olarak açıldıysa kullanıcıya özel bulut deposuyla da eşitlenir. */
(() => {
  'use strict';

  /* ================= yardımcılar ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clone = o => JSON.parse(JSON.stringify(o));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const round1 = n => Math.round(n * 10) / 10;

  const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
  const fmt = n => nf.format(Math.round(n * 100) / 100);
  const fmtIn = n => String(Math.round(n * 100) / 100).replace('.', ',');
  const parseNum = v => {
    const s = String(v ?? '').trim().replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 9999) : null;
  };
  const fold = s => String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

  const dShort = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
  const dLong = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dMonth = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' });
  const dWeekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });
  const dTime = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
  const weekStart = t => { const d = new Date(dayStart(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const ago = t => {
    const days = Math.round((dayStart(Date.now()) - dayStart(t)) / 864e5);
    return days <= 0 ? 'bugün' : days === 1 ? 'dün' : days < 7 ? days + ' gün önce' : days < 30 ? Math.floor(days / 7) + ' hafta önce' : dShort.format(t);
  };
  const fmtDur = ms => { const m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? m + ' dk' : Math.floor(m / 60) + ' sa ' + (m % 60) + ' dk'; };
  const fmtClock = sec => {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  };
  const fmtVol = kg => kg >= 10000 ? fmt(round1(kg / 1000)) + ' t' : fmt(Math.round(kg)) + ' kg';
  const e1rm = (w, r) => r <= 0 ? 0 : r === 1 ? w : w * (1 + r / 30); // Epley

  /* ================= egzersiz kütüphanesi ================= */
  const GROUPS = { gogus: 'Göğüs', sirt: 'Sırt', omuz: 'Omuz', biceps: 'Biceps', triceps: 'Triceps', bacak: 'Bacak', karin: 'Karın', kardiyo: 'Kardiyo' };
  // Kayıt türü: iki sayı alanının ne anlama geldiği.
  const TYPES = {
    wr: { w: 'kg', r: 'tekrar', name: 'Kilo × tekrar' },
    bw: { w: '+kg', r: 'tekrar', name: 'Vücut ağırlığı (tekrar)' },
    sn: { w: '+kg', r: 'sn', name: 'Süre (saniye)' },
    sure: { w: 'km', r: 'dk', name: 'Kardiyo (dakika / km)' },
  };
  const LIB = [
    ['bench', 'Bench Press', 'gogus', 'wr'], ['incline-bench', 'Incline Bench Press', 'gogus', 'wr'],
    ['db-press', 'Dumbbell Press', 'gogus', 'wr'], ['incline-db-press', 'Incline Dumbbell Press', 'gogus', 'wr'],
    ['chest-press', 'Göğüs Presi (Makine)', 'gogus', 'wr'], ['db-fly', 'Dumbbell Fly', 'gogus', 'wr'],
    ['cable-cross', 'Cable Crossover', 'gogus', 'wr'], ['pec-deck', 'Pec Deck', 'gogus', 'wr'],
    ['pushup', 'Şınav', 'gogus', 'bw'], ['dips', 'Dips (Paralel Bar)', 'gogus', 'bw'],
    ['pullup', 'Barfiks', 'sirt', 'bw'], ['lat-pulldown', 'Lat Pulldown', 'sirt', 'wr'],
    ['bb-row', 'Barbell Row', 'sirt', 'wr'], ['db-row', 'Dumbbell Row', 'sirt', 'wr'],
    ['cable-row', 'Seated Cable Row', 'sirt', 'wr'], ['tbar-row', 'T-Bar Row', 'sirt', 'wr'],
    ['deadlift', 'Deadlift', 'sirt', 'wr'], ['face-pull', 'Face Pull', 'sirt', 'wr'], ['hyperext', 'Hyperextension', 'sirt', 'bw'],
    ['ohp', 'Overhead Press', 'omuz', 'wr'], ['db-shoulder', 'Dumbbell Shoulder Press', 'omuz', 'wr'],
    ['arnold', 'Arnold Press', 'omuz', 'wr'], ['lat-raise', 'Lateral Raise', 'omuz', 'wr'],
    ['front-raise', 'Front Raise', 'omuz', 'wr'], ['rear-fly', 'Reverse Fly', 'omuz', 'wr'], ['shrug', 'Shrug', 'omuz', 'wr'],
    ['bb-curl', 'Barbell Curl', 'biceps', 'wr'], ['db-curl', 'Dumbbell Curl', 'biceps', 'wr'],
    ['hammer-curl', 'Hammer Curl', 'biceps', 'wr'], ['preacher-curl', 'Preacher Curl', 'biceps', 'wr'], ['cable-curl', 'Cable Curl', 'biceps', 'wr'],
    ['pushdown', 'Triceps Pushdown', 'triceps', 'wr'], ['skull', 'Skull Crusher', 'triceps', 'wr'],
    ['oh-ext', 'Overhead Triceps Extension', 'triceps', 'wr'], ['cg-bench', 'Close-Grip Bench Press', 'triceps', 'wr'], ['kickback', 'Triceps Kickback', 'triceps', 'wr'],
    ['squat', 'Squat', 'bacak', 'wr'], ['front-squat', 'Front Squat', 'bacak', 'wr'], ['hack-squat', 'Hack Squat', 'bacak', 'wr'],
    ['leg-press', 'Leg Press', 'bacak', 'wr'], ['leg-ext', 'Leg Extension', 'bacak', 'wr'], ['leg-curl', 'Leg Curl', 'bacak', 'wr'],
    ['rdl', 'Romanian Deadlift', 'bacak', 'wr'], ['lunge', 'Lunge', 'bacak', 'wr'], ['bulgarian', 'Bulgarian Split Squat', 'bacak', 'wr'],
    ['hip-thrust', 'Hip Thrust', 'bacak', 'wr'], ['calf-raise', 'Calf Raise', 'bacak', 'wr'],
    ['plank', 'Plank', 'karin', 'sn'], ['crunch', 'Mekik (Crunch)', 'karin', 'bw'], ['leg-raise', 'Leg Raise', 'karin', 'bw'],
    ['russian-twist', 'Russian Twist', 'karin', 'bw'], ['cable-crunch', 'Cable Crunch', 'karin', 'wr'], ['ab-wheel', 'Ab Wheel', 'karin', 'bw'],
    ['treadmill', 'Koşu Bandı', 'kardiyo', 'sure'], ['bike', 'Bisiklet', 'kardiyo', 'sure'], ['elliptical', 'Eliptik', 'kardiyo', 'sure'],
    ['rower', 'Kürek Makinesi', 'kardiyo', 'sure'], ['stairs', 'Merdiven Makinesi', 'kardiyo', 'sure'], ['jump-rope', 'İp Atlama', 'kardiyo', 'sure'],
  ].map(([id, name, g, t]) => ({ id, name, g, t }));
  const LIB_BY_ID = new Map(LIB.map(x => [x.id, x]));
  // İlk açılışta eklenen, düzenlenebilir başlangıç programları.
  const STARTERS = [
    ['p-push', 'İtiş (Push)', [['bench', 4, 8], ['incline-db-press', 3, 10], ['ohp', 3, 8], ['lat-raise', 3, 12], ['pushdown', 3, 12], ['oh-ext', 3, 12]]],
    ['p-pull', 'Çekiş (Pull)', [['deadlift', 3, 5], ['lat-pulldown', 4, 10], ['bb-row', 3, 8], ['face-pull', 3, 15], ['bb-curl', 3, 10], ['hammer-curl', 3, 12]]],
    ['p-legs', 'Bacak', [['squat', 4, 8], ['rdl', 3, 10], ['leg-press', 3, 12], ['leg-curl', 3, 12], ['calf-raise', 4, 15], ['plank', 3, 45]]],
    ['p-full', 'Tüm Vücut', [['squat', 3, 8], ['bench', 3, 8], ['bb-row', 3, 8], ['ohp', 3, 10], ['lat-pulldown', 3, 10], ['plank', 3, 45]]],
  ];
  const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

  /* ================= durum ve kalıcılık ================= */
  const LS = 'demir-defteri.v1';
  const blank = () => ({
    meta: { settings: { rest: 90, bar: 20, sound: true, vib: true }, custom: [], programs: [], seeded: false, updatedAt: 0 },
    active: null, activeAt: 0, workouts: [],
    dirty: { meta: 0, active: 0, w: {}, del: {} },
    lastSync: 0, rest: null,
  });
  let S = blank();
  const ui = { progEx: null, draft: null, plateKg: '100', rmKg: '80', rmReps: '5' };
  const byStart = (a, b) => b.start - a.start;

  const num = (v, d, min, max) => { const n = Number(v); return v === null || v === '' || !Number.isFinite(n) ? d : clamp(n, min, max); };
  const str = (v, max = 80) => String(v ?? '').slice(0, max);
  const safeId = v => String(v ?? '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || uid();
  const blankSet = () => ({ w: null, r: null, done: false });

  function normWorkout(w, active) {
    if (!w || typeof w !== 'object') return null;
    const start = num(w.start, Date.now(), 0, 4e12);
    const o = {
      id: safeId(w.id), name: str(w.name || 'Antrenman', 60), programId: w.programId ? safeId(w.programId) : null, start,
      entries: (Array.isArray(w.entries) ? w.entries : []).slice(0, 60).filter(en => en && en.exId).map(en => {
        const e = { exId: safeId(en.exId) };
        if (active) e.target = num(en.target, null, 1, 999);
        e.sets = (Array.isArray(en.sets) ? en.sets : []).slice(0, 40).map(s => {
          const x = { w: num(s && s.w, null, 0, 9999), r: num(s && s.r, null, 0, 9999) };
          if (active) x.done = !!(s && s.done);
          return x;
        });
        return e;
      }),
      updatedAt: num(w.updatedAt, start, 0, 4e12),
    };
    if (!active) o.end = num(w.end, start, start, 4e12);
    return o;
  }
  function normMeta(m) {
    m = m && typeof m === 'object' ? m : {};
    const s = m.settings && typeof m.settings === 'object' ? m.settings : {};
    return {
      settings: { rest: num(s.rest, 90, 10, 900), bar: num(s.bar, 20, 0, 50), sound: s.sound !== false, vib: s.vib !== false },
      custom: (Array.isArray(m.custom) ? m.custom : []).slice(0, 300).filter(c => c && c.name)
        .map(c => ({ id: safeId(c.id), name: str(c.name, 60), g: GROUPS[c.g] ? c.g : 'gogus', t: TYPES[c.t] ? c.t : 'wr' })),
      programs: (Array.isArray(m.programs) ? m.programs : []).slice(0, 100).filter(Boolean).map(p => ({
        id: safeId(p.id), name: str(p.name || 'Program', 60),
        items: (Array.isArray(p.items) ? p.items : []).slice(0, 40).filter(it => it && it.exId)
          .map(it => ({ exId: safeId(it.exId), sets: Math.round(num(it.sets, 3, 1, 20)), reps: Math.round(num(it.reps, 10, 1, 999)) })),
      })),
      seeded: !!m.seeded,
      updatedAt: num(m.updatedAt, 0, 0, 4e12),
    };
  }
  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS);
      if (!raw) return;
      const o = JSON.parse(raw);
      S.meta = normMeta(o.meta);
      S.active = o.active ? normWorkout(o.active, true) : null;
      S.activeAt = num(o.activeAt, 0, 0, 4e12);
      S.workouts = (Array.isArray(o.workouts) ? o.workouts : []).map(w => normWorkout(w)).filter(Boolean).sort(byStart);
      const d = o.dirty || {};
      S.dirty = { meta: num(d.meta, 0, 0, 1e9), active: num(d.active, 0, 0, 1e9), w: { ...(d.w || {}) }, del: { ...(d.del || {}) } };
      S.lastSync = num(o.lastSync, 0, 0, 4e12);
      S.rest = o.rest && o.rest.end > Date.now() ? { end: +o.rest.end, total: +o.rest.total || 90000 } : null;
    } catch (e) { /* depolama yoksa boş başla */ }
  }
  let saveT = 0;
  function saveLocal(now) {
    const run = () => { clearTimeout(saveT); saveT = 0; try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { /* yok say */ } };
    if (now) run(); else if (!saveT) saveT = setTimeout(run, 250);
  }
  const commit = () => { saveLocal(); scheduleFlush(); };
  function touchMeta() { S.meta.updatedAt = Date.now(); S.dirty.meta++; commit(); }
  function touchActive() { S.activeAt = Date.now(); if (S.active) S.active.updatedAt = S.activeAt; S.dirty.active++; commit(); }
  function touchWorkout(id) { S.dirty.w[id] = (S.dirty.w[id] || 0) + 1; delete S.dirty.del[id]; commit(); }
  function dropWorkout(id) { S.workouts = S.workouts.filter(w => w.id !== id); delete S.dirty.w[id]; S.dirty.del[id] = 1; commit(); }
  function seed() {
    S.meta.programs = STARTERS.map(([id, name, items]) => ({ id, name, items: items.map(([exId, sets, reps]) => ({ exId, sets, reps })) }));
    S.meta.seeded = true;
    S.meta.updatedAt = Date.now();
    if (cloud) { S.dirty.meta++; scheduleFlush(); }
    saveLocal();
  }

  /* ================= bulut eşitleme (yalnızca Artifact içinde) ================= */
  let cloud = null, cloudState = 'none', cloudP = null, flushT = 0, flushing = false, again = false;
  const hasClaude = () => !!(window.claude && typeof window.claude.use === 'function');
  const isDirty = () => !!(S.dirty.meta || S.dirty.active || Object.keys(S.dirty.w).length || Object.keys(S.dirty.del).length);

  function initCloud() {
    if (cloudP) return cloudP;
    cloudP = (async () => {
      if (!hasClaude()) return false;
      cloudState = 'pending';
      try {
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        const id = db && user ? await user.id() : null;
        if (!id) { cloudState = 'off'; return false; }
        const base = db.doc('data/users/' + id + '/meta');
        cloud = { meta: base, active: db.doc('data/users/' + id + '/active'), wcol: base.collection('workouts') };
        const changed = await pull();
        cloudState = 'on';
        saveLocal();
        scheduleFlush(200);
        return changed;
      } catch (e) {
        cloud = null; cloudState = 'error';
        return false;
      } finally { updateSyncNote(); }
    })();
    return cloudP;
  }
  async function pull() {
    const before = JSON.stringify([S.meta, S.active, S.workouts]);
    const [m, a] = await Promise.all([cloud.meta.get(), cloud.active.get()]);
    const list = [];
    let cursor = null;
    for (let page = 0; page < 40; page++) {
      const q = (cursor == null ? cloud.wcol : cloud.wcol.where('start', '<', cursor)).orderBy('start', 'desc').limit(500);
      const snap = await q.get();
      snap.docs.forEach(d => { const w = normWorkout(clone(d.data() || {})); if (w) { w.id = d.id; list.push(w); } });
      if (snap.size < 500 || !list.length) break;
      cursor = list[list.length - 1].start;
    }
    // Bu cihaz daha önce hiç eşitlenmediyse yereldeki kayıtlar da buluta gitsin.
    if (!S.lastSync) S.workouts.forEach(w => { if (!S.dirty.w[w.id]) S.dirty.w[w.id] = 1; });
    if (m.exists) {
      const cm = normMeta(clone(m.data()));
      if (!S.dirty.meta || cm.updatedAt > S.meta.updatedAt) { S.meta = cm; S.dirty.meta = 0; }
    } else if (S.meta.seeded) S.dirty.meta = S.dirty.meta || 1;
    if (a.exists) {
      const ca = a.data(), at = num(ca.updatedAt, 0, 0, 4e12);
      if (!S.dirty.active || at > S.activeAt) {
        S.active = ca.workout ? normWorkout(clone(ca.workout), true) : null;
        S.activeAt = at; S.dirty.active = 0;
        if (!S.active) S.rest = null;
      }
    } else if (S.active) S.dirty.active = S.dirty.active || 1;
    const map = new Map(list.map(w => [w.id, w]));
    Object.keys(S.dirty.del).forEach(id => map.delete(id));
    Object.keys(S.dirty.w).forEach(id => { const w = S.workouts.find(x => x.id === id); if (w) map.set(id, w); else delete S.dirty.w[id]; });
    S.workouts = [...map.values()].sort(byStart);
    S.lastSync = Date.now();
    return JSON.stringify([S.meta, S.active, S.workouts]) !== before;
  }
  function scheduleFlush(delay = 2000) {
    if (!cloud) return;
    clearTimeout(flushT);
    flushT = setTimeout(flush, delay);
  }
  async function flush() {
    if (!cloud || !isDirty()) return;
    if (flushing) { again = true; return; }
    flushing = true; again = false;
    let ok = true;
    try {
      if (S.dirty.meta) { const n = S.dirty.meta; await cloud.meta.set(clone(S.meta)); if (S.dirty.meta === n) S.dirty.meta = 0; }
      if (S.dirty.active) {
        const n = S.dirty.active;
        await cloud.active.set({ workout: S.active ? clone(S.active) : null, updatedAt: S.activeAt || Date.now() });
        if (S.dirty.active === n) S.dirty.active = 0;
      }
      for (const id of Object.keys(S.dirty.w)) {
        const n = S.dirty.w[id], w = S.workouts.find(x => x.id === id);
        if (w) await cloud.wcol.doc(id).set(clone(w));
        if (S.dirty.w[id] === n) delete S.dirty.w[id];
      }
      for (const id of Object.keys(S.dirty.del)) { await cloud.wcol.doc(id).delete(); delete S.dirty.del[id]; }
      S.lastSync = Date.now();
      cloudState = 'on';
    } catch (e) {
      ok = false;
      const code = e && e.code;
      if (code === 'revoked' || code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') { cloud = null; cloudState = 'off'; }
      else cloudState = 'error';
    }
    flushing = false;
    saveLocal();
    updateSyncNote();
    if (cloud && isDirty()) scheduleFlush(ok ? 1500 : 30000);
  }
  function syncText() {
    if (cloudState === 'on') return isDirty() ? 'Değişiklikler kaydediliyor…' : 'Kayıtların sana özel bulut deposunda saklanıyor; bu sayfayı açtığın her cihazda aynı defteri görürsün.';
    if (cloudState === 'pending') return 'Bulut deposuna bağlanılıyor…';
    if (cloudState === 'error') return 'Bulut deposuna şu an ulaşılamıyor. Kayıtların bu cihazda duruyor, bağlantı gelince gönderilecek.';
    return 'Kayıtların bu cihazın tarayıcısında saklanıyor. Tarayıcı verilerini silersen kaybolur; ara sıra yedek al.';
  }
  function updateSyncNote() { const el = $('#sync-note'); if (el) el.textContent = syncText(); }

  /* ================= türetilmiş veriler ================= */
  const exById = id => LIB_BY_ID.get(id) || S.meta.custom.find(c => c.id === id) || { id, name: 'Silinmiş egzersiz', g: 'gogus', t: 'wr' };
  const allExercises = () => [...S.meta.custom, ...LIB];
  const hasVol = ex => ex.t === 'wr' || ex.t === 'bw';
  function setText(ex, s) {
    if (ex.t === 'wr') return fmt(s.w || 0) + ' kg × ' + (s.r || 0);
    if (ex.t === 'bw') return (s.w ? '+' + fmt(s.w) + ' kg × ' : '') + (s.r || 0) + ' tekrar';
    if (ex.t === 'sn') return (s.w ? '+' + fmt(s.w) + ' kg · ' : '') + (s.r || 0) + ' sn';
    return (s.r || 0) + ' dk' + (s.w ? ' · ' + fmt(s.w) + ' km' : '');
  }
  const setShort = (ex, s) => ex.t === 'wr' ? fmt(s.w || 0) + '×' + (s.r || 0) : setText(ex, s);
  function wStats(w) {
    let sets = 0, vol = 0;
    w.entries.forEach(en => { const ex = exById(en.exId); en.sets.forEach(s => { sets++; if (hasVol(ex)) vol += (s.w || 0) * (s.r || 0); }); });
    return { sets, vol, dur: (w.end || Date.now()) - w.start };
  }
  const wLine = w => { const st = wStats(w); return fmtDur(st.dur) + ' · ' + st.sets + ' set' + (st.vol ? ' · ' + fmtVol(st.vol) : ''); };
  function lastSets(exId) {
    for (const w of S.workouts) { const en = w.entries.find(e => e.exId === exId && e.sets.length); if (en) return en.sets; }
    return [];
  }
  function bestE1rm(exId) {
    let best = 0;
    S.workouts.forEach(w => w.entries.forEach(en => { if (en.exId === exId) en.sets.forEach(s => { best = Math.max(best, e1rm(s.w || 0, s.r || 0)); }); }));
    return best;
  }
  const lastDone = pid => { const w = S.workouts.find(x => x.programId === pid); return w ? w.start : 0; };
  function weekStreak() {
    const weeks = new Set(S.workouts.map(w => weekStart(w.start)));
    let ws = weekStart(Date.now()), n = 0;
    if (!weeks.has(ws)) ws = addDays(ws, -7);
    while (weeks.has(ws)) { n++; ws = addDays(ws, -7); }
    return n;
  }
  function exHistory(exId) { // eskiden yeniye
    const out = [];
    for (let i = S.workouts.length - 1; i >= 0; i--) {
      const w = S.workouts[i], sets = [];
      w.entries.forEach(en => { if (en.exId === exId) sets.push(...en.sets); });
      if (sets.length) out.push({ t: w.start, sets });
    }
    return out;
  }
  const METRIC = {
    wr: { label: 'Tahmini 1TM', unit: 'kg', of: sets => round1(Math.max(...sets.map(s => e1rm(s.w || 0, s.r || 0)))) },
    bw: { label: 'En çok tekrar', unit: 'tekrar', of: sets => Math.max(...sets.map(s => s.r || 0)) },
    sn: { label: 'En uzun süre', unit: 'sn', of: sets => Math.max(...sets.map(s => s.r || 0)) },
    sure: { label: 'Toplam süre', unit: 'dk', of: sets => sets.reduce((a, s) => a + (s.r || 0), 0) },
  };
  function plateCalc(target, bar) {
    let side = (target - bar) / 2;
    const out = [];
    for (const p of PLATES) while (side >= p - 1e-9) { out.push(p); side -= p; }
    const total = bar + 2 * out.reduce((a, b) => a + b, 0);
    return { out, total, exact: Math.abs(total - target) < 1e-6 };
  }

  /* ================= ses, titreşim, ekranı açık tutma ================= */
  let actx = null, wake = null;
  function primeAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = actx || new AC();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { /* ses yoksa sessiz devam */ }
  }
  function beep() {
    if (!S.meta.settings.sound || !actx) return;
    try {
      const t = actx.currentTime;
      [[0, 880], [0.22, 880], [0.44, 1320]].forEach(([d, f]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(0.35, t + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
        o.connect(g); g.connect(actx.destination);
        o.start(t + d); o.stop(t + d + 0.2);
      });
    } catch (e) { /* yok say */ }
  }
  function buzz(p) { if (!S.meta.settings.vib) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* yok say */ } }
  async function keepAwake() {
    try {
      if (!S.active || wake || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => { wake = null; });
    } catch (e) { wake = null; }
  }
  function releaseWake() { try { if (wake) wake.release(); } catch (e) { /* yok say */ } wake = null; }

  /* ================= kabuk: sekmeler, sheet, bildirim ================= */
  const IC = {
    antrenman: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5v5M6.5 6.5v11M17.5 6.5v11M21 9.5v5M6.5 12h11"/></svg>',
    gecmis: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/></svg>',
    ilerleme: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M5 15.5l4.5-5 4 3L19 6.5"/></svg>',
    programlar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6h10.5M9.5 12h10.5M9.5 18h10.5M4 6h1.5M4 12h1.5M4 18h1.5"/></svg>',
    araclar: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="f" cx="5" cy="12" r="1.7"/><circle class="f" cx="12" cy="12" r="1.7"/><circle class="f" cx="19" cy="12" r="1.7"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  };
  const TABS = [['antrenman', 'Antrenman'], ['gecmis', 'Geçmiş'], ['ilerleme', 'İlerleme'], ['programlar', 'Programlar'], ['araclar', 'Araçlar']];
  const currentTab = () => { const h = location.hash.slice(1); return TABS.some(t => t[0] === h) ? h : 'antrenman'; };
  const go = tab => { if (currentTab() === tab) { render(); window.scrollTo(0, 0); } else location.hash = '#' + tab; };

  function shellHtml() {
    return `<header class="bar" id="bar"></header>
<main class="wrap" id="view"></main>
<div class="rest" id="rest" hidden>
  <div class="rest-in wrap">
    <div class="rest-read"><span class="eyebrow" id="rest-label">Dinlenme</span><span class="rest-t" id="rest-t" role="timer">0:00</span></div>
    <div class="rest-ctl">
      <button class="btn ghost sm" data-act="rest-adj" data-d="-15" aria-label="15 saniye azalt">−15</button>
      <button class="btn ghost sm" data-act="rest-adj" data-d="15" aria-label="15 saniye ekle">+15</button>
      <button class="btn ghost sm" data-act="rest-skip">Geç</button>
    </div>
  </div>
  <div class="rest-track"><i id="rest-fill"></i></div>
</div>
<nav class="tabs" aria-label="Bölümler"><div class="tabs-in wrap" id="tabs">${TABS.map(([k, n]) => `<a href="#${k}" data-tab="${k}">${IC[k]}<span>${n}</span></a>`).join('')}</div></nav>
<div class="scrim" id="scrim" data-act="sheet-close" hidden></div>
<section class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h" hidden></section>
<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>`;
  }

  let sheetBack = null, lastFocus = null, stale = false, toastT = 0;
  function openSheet(html, back) {
    const sh = $('#sheet');
    if (sh.hidden) lastFocus = document.activeElement;
    sheetBack = back || null;
    sh.innerHTML = `<div class="sheet-grab"><button class="icon-btn" data-act="sheet-close" aria-label="Kapat">${IC.close}</button></div><div class="sheet-body">${html}</div>`;
    sh.hidden = false;
    $('#scrim').hidden = false;
    document.body.classList.add('locked');
    $('#toast').hidden = true;
    const h = $('#sheet-h', sh);
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  function closeSheet(force) {
    const sh = $('#sheet');
    if (!sh || sh.hidden) return;
    if (!force && sheetBack) { const b = sheetBack; sheetBack = null; b(); return; }
    sheetBack = null;
    sh.hidden = true; sh.innerHTML = '';
    $('#scrim').hidden = true;
    document.body.classList.remove('locked');
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
    if (stale) { stale = false; render(); }
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 2800);
  }
  // Yıkıcı işlemler için ikinci dokunuşla onay (tarayıcı confirm() penceresi yok).
  function confirmTap(el, label) {
    if (el.dataset.armed) return true;
    el.dataset.armed = '1'; el.dataset.orig = el.textContent;
    el.textContent = label; el.classList.add('armed');
    setTimeout(() => { if (el.isConnected && el.dataset.armed) { delete el.dataset.armed; el.textContent = el.dataset.orig; el.classList.remove('armed'); } }, 4000);
    return false;
  }

  function render() {
    const tab = currentTab();
    $$('#tabs a').forEach(a => {
      const on = a.dataset.tab === tab;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const v = VIEWS[tab]();
    $('#bar').innerHTML = v.bar;
    $('#view').innerHTML = v.body;
    if (v.after) v.after();
    tick();
  }
  function softRender() {
    const a = document.activeElement;
    if (!$('#sheet').hidden || (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) { stale = true; return; }
    render();
  }
  const titleBar = t => `<div class="bar-in wrap"><h1 class="bar-h">${t}</h1></div>`;

  /* ================= görünüm: antrenman ================= */
  const VIEWS = {};
  VIEWS.antrenman = () => S.active ? viewActive() : viewStart();

  function viewStart() {
    const now = Date.now(), ws = weekStart(now), today = dayStart(now);
    const week = S.workouts.filter(w => w.start >= ws);
    const on = new Set(week.map(w => dayStart(w.start)));
    const days = DAYS.map((n, i) => {
      const t = addDays(ws, i);
      return `<li class="day${on.has(t) ? ' on' : ''}${t === today ? ' today' : ''}"><span class="day-n">${n}</span><span class="plate" aria-hidden="true"></span><span class="vh">${on.has(t) ? 'antrenman yapıldı' : 'antrenman yok'}${t === today ? ', bugün' : ''}</span></li>`;
    }).join('');
    const streak = weekStreak();
    const progs = S.meta.programs;
    const next = S.workouts.length && progs.length > 1 ? progs.slice().sort((a, b) => lastDone(a.id) - lastDone(b.id))[0].id : null;
    const rows = progs.map(p => {
      const ld = lastDone(p.id);
      return `<li class="row"><div class="row-main"><span><strong>${esc(p.name)}</strong>${p.id === next ? '<span class="tag">Sıradaki</span>' : ''}</span><span class="sub">${p.items.length} egzersiz${ld ? ' · son: ' + ago(ld) : ''}</span></div>
        <button class="btn ${p.id === next || (!next && p === progs[0]) ? 'primary' : 'ghost'} sm" data-act="start" data-id="${esc(p.id)}" aria-label="${esc(p.name)} programını başlat">Başlat</button></li>`;
    }).join('');
    const last = S.workouts[0];
    return {
      bar: `<div class="bar-in wrap"><h1 class="bar-h brand"><span class="brand-mark" aria-hidden="true"></span>Demir Defteri</h1></div>`,
      body: `<section>
  <h2 class="h-display">Bugün ne çalışıyoruz?</h2>
  <ol class="week" aria-label="Bu haftanın günleri">${days}</ol>
  <p class="note">Bu hafta <strong>${week.length}</strong> antrenman${streak > 1 ? ` · ${streak} haftadır aralıksız` : ''}</p>
</section>
<section>
  <h2 class="sec">Programların</h2>
  ${progs.length ? `<ul class="list">${rows}</ul>` : `<p class="empty">Henüz programın yok. <a href="#programlar">Programlar</a> sekmesinden kendi programını oluşturabilirsin.</p>`}
  <button class="btn ghost wide" data-act="start-empty">Boş antrenman başlat</button>
</section>
${last ? `<section><h2 class="sec">Son antrenman</h2><ul class="list"><li><button class="row" data-act="open-w" data-id="${esc(last.id)}"><span class="row-main"><strong>${esc(last.name)}</strong><span class="sub">${ago(last.start)} · ${wLine(last)}</span></span><span class="chev" aria-hidden="true">›</span></button></li></ul></section>` : ''}`,
    };
  }

  function hint(en, si, prev) {
    const before = si > 0 ? en.sets[si - 1] : null, p = prev[si] || prev[prev.length - 1] || null;
    return {
      w: before && before.w != null ? before.w : p ? p.w : null,
      r: p && p.r != null ? p.r : before && before.r != null ? before.r : en.target != null ? en.target : null,
    };
  }
  function exCard(en, ei) {
    const ex = exById(en.exId), T = TYPES[ex.t], prev = lastSets(en.exId);
    const rows = en.sets.map((s, si) => {
      const h = hint(en, si, prev);
      return `<div class="set${s.done ? ' done' : ''}" data-ei="${ei}" data-si="${si}">
  <span class="set-n">${si + 1}</span>
  <input id="w-${ei}-${si}" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" data-in="set" data-f="w" value="${s.w == null ? '' : fmtIn(s.w)}" placeholder="${h.w == null ? '–' : fmtIn(h.w)}" aria-label="${si + 1}. set ${T.w}">
  <input id="r-${ei}-${si}" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" data-in="set" data-f="r" value="${s.r == null ? '' : fmtIn(s.r)}" placeholder="${h.r == null ? '–' : fmtIn(h.r)}" aria-label="${si + 1}. set ${T.r}">
  <button class="check" data-act="toggle" aria-pressed="${s.done}" aria-label="${si + 1}. seti ${s.done ? 'geri al' : 'tamamla'}">${IC.check}</button>
</div>`;
    }).join('');
    const info = [en.target != null ? `Hedef ${en.sets.length}×${en.target}` : '', prev.length ? 'Geçen sefer: ' + prev.map(s => setShort(ex, s)).join(' · ') : 'İlk kez yapıyorsun'].filter(Boolean).join(' — ');
    return `<section class="ex" data-ex="${ei}">
  <div class="ex-head"><h2 class="ex-name">${esc(ex.name)}</h2><button class="icon-btn" data-act="ex-menu" data-ei="${ei}" aria-label="${esc(ex.name)} seçenekleri">${IC.more}</button></div>
  <p class="sub">${esc(info)}</p>
  <div class="sets"><div class="set-head" aria-hidden="true"><span>Set</span><span>${T.w}</span><span>${T.r}</span><span></span></div>${rows}</div>
  <div class="ex-foot"><button class="btn quiet sm" data-act="add-set" data-ei="${ei}">+ Set ekle</button>${en.sets.length > 1 ? `<button class="btn quiet sm" data-act="del-set" data-ei="${ei}">Son seti sil</button>` : ''}</div>
</section>`;
  }
  function viewActive() {
    const a = S.active;
    return {
      bar: `<div class="bar-in wrap"><div class="bar-title"><span class="eyebrow">Antrenman</span><strong class="ell">${esc(a.name)}</strong></div>
  <span class="clock" id="clock" role="timer" aria-label="Geçen süre">${fmtClock((Date.now() - a.start) / 1000)}</span>
  <button class="btn primary sm" data-act="finish">Bitir</button></div>
<div class="prog" aria-hidden="true"><i id="prog"></i></div>`,
      body: `<div class="stack" id="exs">${a.entries.map(exCard).join('')}</div>
${a.entries.length ? '' : '<p class="empty"><strong>Defter boş</strong>İlk hareketini ekleyerek başla.</p>'}
<div class="stack"><button class="btn ghost wide" data-act="add-ex">+ Egzersiz ekle</button>
<button class="btn quiet danger wide" data-act="cancel">Antrenmanı iptal et</button></div>`,
      after: updateProg,
    };
  }
  function updateProg() {
    const el = $('#prog');
    if (!el || !S.active) return;
    let done = 0, total = 0;
    S.active.entries.forEach(en => en.sets.forEach(s => { total++; if (s.done) done++; }));
    el.style.width = (total ? done / total * 100 : 0) + '%';
  }
  function replaceCard(ei) {
    const el = $('[data-ex="' + ei + '"]');
    if (el && S.active.entries[ei]) el.outerHTML = exCard(S.active.entries[ei], ei);
  }
  function refreshHints(ei) {
    const en = S.active.entries[ei], prev = lastSets(en.exId);
    en.sets.forEach((s, si) => {
      const h = hint(en, si, prev), w = $('#w-' + ei + '-' + si), r = $('#r-' + ei + '-' + si);
      if (w) w.placeholder = h.w == null ? '–' : fmtIn(h.w);
      if (r) r.placeholder = h.r == null ? '–' : fmtIn(h.r);
    });
  }
  function startWorkout(name, programId, entries) {
    if (S.active) { toast('Devam eden bir antrenman var'); go('antrenman'); return; }
    primeAudio();
    S.active = { id: uid(), name, programId, start: Date.now(), entries, updatedAt: Date.now() };
    S.rest = null; restFlash = 0;
    touchActive(); saveLocal(true); keepAwake();
    go('antrenman');
  }

  /* ---- dinlenme sayacı ve saat ---- */
  let restFlash = 0;
  function startRest() {
    const ms = S.meta.settings.rest * 1000;
    S.rest = { end: Date.now() + ms, total: ms };
    restFlash = 0;
    saveLocal(); tick();
  }
  function tick() {
    const now = Date.now(), c = $('#clock'), box = $('#rest');
    if (c && S.active) c.textContent = fmtClock((now - S.active.start) / 1000);
    if (!box) return;
    if (S.rest && S.rest.end <= now) {
      S.rest = null; restFlash = now + 6000;
      beep(); buzz([200, 100, 200]); saveLocal();
    }
    if (S.rest) {
      const left = S.rest.end - now;
      box.hidden = false; box.classList.remove('go');
      $('#rest-label').textContent = 'Dinlenme';
      $('#rest-t').textContent = fmtClock(Math.ceil(left / 1000));
      $('#rest-fill').style.width = clamp(100 - left / S.rest.total * 100, 0, 100) + '%';
    } else if (restFlash > now && S.active) {
      box.hidden = false; box.classList.add('go');
      $('#rest-label').textContent = 'Süre doldu';
      $('#rest-t').textContent = 'Sıradaki set';
      $('#rest-fill').style.width = '100%';
    } else box.hidden = true;
  }

  /* ================= eylemler ================= */
  const ACT = {}, INP = {}, FORMS = {};
  ACT['sheet-close'] = () => closeSheet();

  ACT.start = el => {
    const p = S.meta.programs.find(x => x.id === el.dataset.id);
    if (!p) return;
    startWorkout(p.name, p.id, p.items.map(it => ({ exId: it.exId, target: it.reps, sets: Array.from({ length: it.sets }, blankSet) })));
  };
  ACT['start-empty'] = () => startWorkout('Serbest antrenman', null, []);

  INP.set = el => {
    const row = el.closest('.set'), ei = +row.dataset.ei, si = +row.dataset.si;
    const en = S.active && S.active.entries[ei];
    if (!en || !en.sets[si]) return;
    en.sets[si][el.dataset.f] = parseNum(el.value);
    touchActive(); refreshHints(ei);
  };
  ACT.toggle = el => {
    primeAudio();
    const row = el.closest('.set'), ei = +row.dataset.ei, si = +row.dataset.si;
    const en = S.active && S.active.entries[ei], s = en && en.sets[si];
    if (!s) return;
    const ex = exById(en.exId);
    if (s.done) s.done = false;
    else {
      const h = hint(en, si, lastSets(en.exId)), needW = ex.t === 'wr';
      if (s.w == null && h.w != null) s.w = h.w;
      if (s.r == null && h.r != null) s.r = h.r;
      if (!s.r || (needW && s.w == null)) {
        touchActive(); replaceCard(ei);
        toast(needW ? 'Önce kilo ve tekrar gir' : 'Önce ' + TYPES[ex.t].r + ' değerini gir');
        const f = $((needW && s.w == null ? '#w-' : '#r-') + ei + '-' + si);
        if (f) f.focus();
        return;
      }
      s.done = true;
      buzz(15);
      const left = S.active.entries.reduce((n, e) => n + e.sets.filter(x => !x.done).length, 0);
      if (left) startRest(); else { S.rest = null; toast('Tüm setler tamam — Bitir’e dokun'); }
    }
    touchActive(); replaceCard(ei); updateProg(); tick();
  };
  ACT['add-set'] = el => { const ei = +el.dataset.ei; S.active.entries[ei].sets.push(blankSet()); touchActive(); replaceCard(ei); updateProg(); };
  ACT['del-set'] = el => { const ei = +el.dataset.ei, en = S.active.entries[ei]; if (en.sets.length > 1) en.sets.pop(); touchActive(); replaceCard(ei); updateProg(); };
  ACT['add-ex'] = () => openPicker(id => {
    S.active.entries.push({ exId: id, target: null, sets: [blankSet(), blankSet(), blankSet()] });
    touchActive(); closeSheet(true); render();
    const card = $('[data-ex="' + (S.active.entries.length - 1) + '"]');
    if (card) card.scrollIntoView({ block: 'center' });
  });
  ACT['ex-menu'] = el => {
    const ei = +el.dataset.ei, en = S.active.entries[ei], n = S.active.entries.length;
    openSheet(`<h2 id="sheet-h">${esc(exById(en.exId).name)}</h2>
<div class="sheet-actions">
  ${ei > 0 ? `<button class="btn ghost" data-act="ex-move" data-ei="${ei}" data-d="-1">Yukarı taşı</button>` : ''}
  ${ei < n - 1 ? `<button class="btn ghost" data-act="ex-move" data-ei="${ei}" data-d="1">Aşağı taşı</button>` : ''}
  <button class="btn ghost danger" data-act="ex-remove" data-ei="${ei}">Antrenmandan çıkar</button>
</div>`);
  };
  ACT['ex-move'] = el => {
    const ei = +el.dataset.ei, to = ei + +el.dataset.d, es = S.active.entries;
    if (to < 0 || to >= es.length) return;
    [es[ei], es[to]] = [es[to], es[ei]];
    touchActive(); closeSheet(true); render();
  };
  ACT['ex-remove'] = el => {
    if (!confirmTap(el, 'Çıkarmak için tekrar dokun')) return;
    S.active.entries.splice(+el.dataset.ei, 1);
    touchActive(); closeSheet(true); render();
  };
  ACT['rest-adj'] = el => {
    if (!S.rest) return;
    const d = +el.dataset.d * 1000;
    S.rest.end += d; S.rest.total = Math.max(1000, S.rest.total + d);
    saveLocal(); tick();
  };
  ACT['rest-skip'] = () => { S.rest = null; restFlash = 0; saveLocal(); tick(); };

  ACT.finish = () => {
    const a = S.active;
    if (!a) return;
    let done = 0, left = 0, vol = 0;
    const prs = [];
    a.entries.forEach(en => {
      const ex = exById(en.exId);
      let best = null;
      en.sets.forEach(s => {
        if (!s.done) { left++; return; }
        done++;
        if (hasVol(ex)) vol += (s.w || 0) * (s.r || 0);
        if (ex.t === 'wr') { const v = e1rm(s.w || 0, s.r || 0); if (!best || v > best.v) best = { v, s }; }
      });
      if (best) {
        const old = bestE1rm(en.exId);
        if (old > 0 && best.v > old + 0.01) prs.push(`<li><strong>${esc(ex.name)}</strong> ${fmt(best.s.w)} kg × ${best.s.r} <span class="sub">tahmini 1TM ${fmt(round1(best.v))} kg</span></li>`);
      }
    });
    if (!done) {
      openSheet(`<h2 id="sheet-h">Hiç set tamamlanmadı</h2>
<p>Kaydedilecek bir set yok. Devam edebilir ya da bu antrenmanı silebilirsin.</p>
<div class="sheet-actions"><button class="btn primary" data-act="sheet-close">Devam et</button><button class="btn ghost danger" data-act="discard">Antrenmanı sil</button></div>`);
      return;
    }
    openSheet(`<h2 id="sheet-h">Antrenmanı bitir</h2>
<dl class="stats">
  <div><dt>Süre</dt><dd>${fmtDur(Date.now() - a.start)}</dd></div>
  <div><dt>Tamamlanan set</dt><dd>${done}</dd></div>
  <div><dt>Toplam hacim</dt><dd>${vol ? fmtVol(vol) : '–'}</dd></div>
</dl>
${prs.length ? `<h3>Yeni rekorlar</h3><ul class="plain">${prs.join('')}</ul>` : ''}
${left ? `<p class="sub">Tamamlanmamış ${left} set kaydedilmeyecek.</p>` : ''}
<div class="sheet-actions"><button class="btn primary" data-act="save-w">Kaydet ve bitir</button><button class="btn ghost" data-act="sheet-close">Devam et</button></div>`);
  };
  ACT['save-w'] = () => {
    const a = S.active, now = Date.now();
    if (!a) return;
    const w = {
      id: a.id, name: a.name, programId: a.programId, start: a.start, end: now, updatedAt: now,
      entries: a.entries.map(en => ({ exId: en.exId, sets: en.sets.filter(s => s.done).map(s => ({ w: s.w, r: s.r })) })).filter(en => en.sets.length),
    };
    S.workouts.push(w); S.workouts.sort(byStart);
    S.active = null; S.rest = null; restFlash = 0;
    touchWorkout(w.id); touchActive(); saveLocal(true); scheduleFlush(100); releaseWake();
    closeSheet(true); go('antrenman');
    const st = wStats(w);
    toast('Kaydedildi: ' + st.sets + ' set · ' + fmtDur(st.dur));
  };
  function discard() {
    S.active = null; S.rest = null; restFlash = 0;
    touchActive(); saveLocal(true); releaseWake(); closeSheet(true); go('antrenman');
    toast('Antrenman silindi');
  }
  ACT.discard = discard;
  ACT.cancel = el => { if (confirmTap(el, 'Silmek için tekrar dokun — setler kaydedilmez')) discard(); };

  /* ================= egzersiz seçici ================= */
  let pick = null;
  function openPicker(cb, back) {
    pick = { q: '', g: '', form: false, cb };
    openSheet(`<h2 id="sheet-h">Egzersiz seç</h2>
<input id="pick-q" class="field" type="search" data-in="pick-q" placeholder="Ara: bench, squat, barfiks…" autocomplete="off" aria-label="Egzersiz ara">
<div class="chips" role="group" aria-label="Kas grubu">${[['', 'Tümü'], ...Object.entries(GROUPS)].map(([k, n]) => `<button class="chip" data-act="pick-g" data-g="${k}" aria-pressed="${k === ''}">${n}</button>`).join('')}</div>
<ul class="list" id="pick-list">${pickList()}</ul>
<div id="pick-new">${pickNew()}</div>`, back);
  }
  function pickList() {
    const q = fold(pick.q);
    const xs = allExercises().filter(x => (!pick.g || x.g === pick.g) && (!q || fold(x.name).includes(q)));
    return xs.length
      ? xs.map(x => `<li><button class="row" data-act="pick" data-id="${esc(x.id)}"><span class="row-main"><strong>${esc(x.name)}</strong></span><span class="sub">${GROUPS[x.g]}</span></button></li>`).join('')
      : '<li class="row"><span class="sub">Eşleşen egzersiz yok. Aşağıdan kendi egzersizini ekleyebilirsin.</span></li>';
  }
  function pickNew() {
    if (!pick.form) return '<button class="btn ghost wide" data-act="pick-form">+ Kendi egzersizini ekle</button>';
    return `<form class="form panel" data-form="new-ex" novalidate>
  <h3>Yeni egzersiz</h3>
  <label for="nx-name">Ad</label><input id="nx-name" class="field" maxlength="60" value="${esc(pick.q)}" autocomplete="off">
  <label for="nx-g">Kas grubu</label><select id="nx-g" class="field">${Object.entries(GROUPS).map(([k, n]) => `<option value="${k}"${k === pick.g ? ' selected' : ''}>${n}</option>`).join('')}</select>
  <label for="nx-t">Kayıt türü</label><select id="nx-t" class="field">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join('')}</select>
  <button class="btn primary" type="submit">Ekle ve seç</button>
</form>`;
  }
  INP['pick-q'] = el => { pick.q = el.value; $('#pick-list').innerHTML = pickList(); };
  ACT['pick-g'] = el => {
    pick.g = el.dataset.g;
    $$('[data-act="pick-g"]').forEach(b => b.setAttribute('aria-pressed', String(b === el)));
    $('#pick-list').innerHTML = pickList();
  };
  ACT.pick = el => { const cb = pick.cb; cb(el.dataset.id); };
  ACT['pick-form'] = () => { pick.form = true; $('#pick-new').innerHTML = pickNew(); const n = $('#nx-name'); n.focus(); n.scrollIntoView({ block: 'center' }); };
  FORMS['new-ex'] = () => {
    const name = $('#nx-name').value.trim();
    if (!name) { toast('Egzersize bir ad ver'); $('#nx-name').focus(); return; }
    const c = { id: 'c-' + uid(), name: str(name, 60), g: $('#nx-g').value, t: $('#nx-t').value };
    S.meta.custom.unshift(c); touchMeta();
    pick.cb(c.id);
  };

  /* ================= görünüm: geçmiş ================= */
  VIEWS.gecmis = () => {
    if (!S.workouts.length) {
      return { bar: titleBar('Geçmiş'), body: `<p class="empty"><strong>Henüz kayıt yok</strong>Bitirdiğin her antrenman tarihiyle, setleriyle ve toplam hacmiyle burada listelenir.<br><a class="btn primary" href="#antrenman">Antrenmana başla</a></p>` };
    }
    const groups = [];
    S.workouts.forEach(w => {
      const k = dMonth.format(w.start);
      let g = groups[groups.length - 1];
      if (!g || g.k !== k) groups.push(g = { k, ws: [] });
      g.ws.push(w);
    });
    return {
      bar: titleBar('Geçmiş'),
      body: groups.map(g => `<section><h2 class="sec">${esc(g.k)}<span class="count">${g.ws.length} antrenman</span></h2><ul class="list">${g.ws.map(w =>
        `<li><button class="row" data-act="open-w" data-id="${esc(w.id)}"><span class="date"><b>${new Date(w.start).getDate()}</b><i>${dWeekday.format(w.start)}</i></span><span class="row-main"><strong>${esc(w.name)}</strong><span class="sub">${wLine(w)}</span></span><span class="chev" aria-hidden="true">›</span></button></li>`).join('')}</ul></section>`).join(''),
    };
  };
  ACT['open-w'] = el => {
    const w = S.workouts.find(x => x.id === el.dataset.id);
    if (!w) return;
    const st = wStats(w);
    openSheet(`<h2 id="sheet-h">${esc(w.name)}</h2>
<p class="sub">${dLong.format(w.start)} · ${dTime.format(w.start)}</p>
<dl class="stats">
  <div><dt>Süre</dt><dd>${fmtDur(st.dur)}</dd></div>
  <div><dt>Set</dt><dd>${st.sets}</dd></div>
  <div><dt>Toplam hacim</dt><dd>${st.vol ? fmtVol(st.vol) : '–'}</dd></div>
</dl>
${w.entries.map(en => { const ex = exById(en.exId); return `<div class="stack"><h3>${esc(ex.name)}</h3><ol class="setlist">${en.sets.map(s => `<li>${esc(setText(ex, s))}</li>`).join('')}</ol></div>`; }).join('')}
<div class="sheet-actions"><button class="btn primary" data-act="repeat-w" data-id="${esc(w.id)}">Bu antrenmanı tekrarla</button><button class="btn ghost danger" data-act="del-w" data-id="${esc(w.id)}">Kaydı sil</button></div>`);
  };
  ACT['repeat-w'] = el => {
    const w = S.workouts.find(x => x.id === el.dataset.id);
    if (!w) return;
    closeSheet(true);
    startWorkout(w.name, w.programId, w.entries.map(en => ({ exId: en.exId, target: null, sets: en.sets.map(blankSet) })));
  };
  ACT['del-w'] = el => {
    if (!confirmTap(el, 'Silmek için tekrar dokun')) return;
    dropWorkout(el.dataset.id);
    closeSheet(true); render(); toast('Kayıt silindi');
  };

  /* ================= görünüm: ilerleme ================= */
  function niceTicks(min, max, count) {
    const span = (max - min) || Math.abs(max) || 1, raw = span / count;
    const p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
    let lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    if (lo === hi) { hi += step; lo = Math.max(0, lo - step); }
    const out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 1000) / 1000);
    return out;
  }
  function tipAt(box, x, y, strong, text) {
    let t = $('.tip', box);
    if (!t) { t = document.createElement('div'); t.className = 'tip'; t.appendChild(document.createElement('b')); t.appendChild(document.createElement('span')); box.appendChild(t); }
    t.firstChild.textContent = strong; t.lastChild.textContent = text;
    t.hidden = false;
    const half = t.offsetWidth / 2, W = box.clientWidth;
    t.style.left = clamp(x, half, Math.max(half, W - half)) + 'px';
    t.style.top = Math.max(y, t.offsetHeight + 10) + 'px';
  }
  const tipHide = box => { const t = $('.tip', box); if (t) t.hidden = true; };

  function drawBars(box, data) { // data: [{label, v, strong, text}]
    const W = Math.max(260, box.clientWidth), H = 176, L = 40, R = 6, T = 20, B = 24;
    const ticks = niceTicks(0, Math.max(1, ...data.map(d => d.v)), 3), top = ticks[ticks.length - 1], tons = top >= 10000;
    const band = (W - L - R) / data.length, bw = Math.min(24, band - 2);
    const y = v => T + (H - T - B) * (1 - v / top), y0 = y(0);
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Haftalık hacim sütun grafiği">`;
    ticks.forEach(t => { s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${tons ? fmt(t / 1000) + ' t' : fmt(t)}</text>`; });
    data.forEach((d, i) => {
      const x = L + band * i + (band - bw) / 2, yy = y(d.v), r = Math.min(4, y0 - yy);
      s += `<rect class="hit" data-i="${i}" tabindex="0" role="img" aria-label="${esc(d.text + ': ' + d.strong)}" x="${L + band * i}" y="${T}" width="${band}" height="${H - T - B}"/>`;
      if (d.v > 0) s += `<path class="bar" d="M${x},${y0}V${yy + r}Q${x},${yy} ${x + r},${yy}H${x + bw - r}Q${x + bw},${yy} ${x + bw},${yy + r}V${y0}Z"/>`;
      if ((data.length - 1 - i) % 2 === 0) s += `<text class="tick" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(d.label)}</text>`;
    });
    const last = data[data.length - 1];
    if (last.v > 0) s += `<text class="val" x="${L + band * (data.length - 1) + band / 2}" y="${y(last.v) - 6}" text-anchor="middle">${esc(last.short)}</text>`;
    box.innerHTML = s + '</svg>';
    const show = el => { const d = data[+el.dataset.i]; $$('.hit', box).forEach(h => h.classList.toggle('on', h === el)); tipAt(box, +el.getAttribute('x') + band / 2, y(d.v), d.strong, d.text); };
    const hide = () => { $$('.hit', box).forEach(h => h.classList.remove('on')); tipHide(box); };
    $$('.hit', box).forEach(el => {
      el.addEventListener('pointerenter', () => show(el));
      el.addEventListener('focus', () => show(el));
      el.addEventListener('click', () => show(el));
      el.addEventListener('pointerleave', hide);
      el.addEventListener('blur', hide);
    });
  }

  function drawLine(box, pts, unit) { // pts: [{t, v}] eskiden yeniye
    const W = Math.max(260, box.clientWidth), H = 196, L = 40, R = 46, T = 16, B = 24;
    const vs = pts.map(p => p.v), ticks = niceTicks(Math.min(...vs), Math.max(...vs), 3), lo = ticks[0], hi = ticks[ticks.length - 1];
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const x = t => t1 === t0 ? L + (W - L - R) / 2 : L + (W - L - R) * (t - t0) / (t1 - t0);
    const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const P = pts.map(p => ({ x: x(p.t), y: y(p.v), p }));
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
    ticks.forEach(t => { s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${fmt(t)}</text>`; });
    if (P.length > 1) {
      const d = P.map((q, i) => (i ? 'L' : 'M') + q.x.toFixed(1) + ',' + q.y.toFixed(1)).join('');
      s += `<path class="area" d="${d}L${P[P.length - 1].x.toFixed(1)},${y(lo)}L${P[0].x.toFixed(1)},${y(lo)}Z"/><path class="line" d="${d}"/>`;
    }
    s += `<line class="cross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>`;
    (P.length <= 14 ? P : [P[P.length - 1]]).forEach(q => { s += `<circle class="dot" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="4"/>`; });
    s += `<circle class="dot hot" r="5" cx="0" cy="0" visibility="hidden"/>`;
    const end = P[P.length - 1];
    s += `<text class="val" x="${end.x + 9}" y="${end.y + 4}">${fmt(end.p.v)}</text>`;
    if (P.length > 1) s += `<text class="tick" x="${L}" y="${H - 6}">${dShort.format(t0)}</text><text class="tick" x="${W - R}" y="${H - 6}" text-anchor="end">${dShort.format(t1)}</text>`;
    else s += `<text class="tick" x="${end.x}" y="${H - 6}" text-anchor="middle">${dShort.format(t0)}</text>`;
    box.innerHTML = s + '</svg>';
    const cross = $('.cross', box), hot = $('.hot', box);
    let cur = -1;
    const show = i => {
      cur = clamp(i, 0, P.length - 1);
      const q = P[cur];
      cross.setAttribute('x1', q.x); cross.setAttribute('x2', q.x); cross.setAttribute('visibility', 'visible');
      hot.setAttribute('cx', q.x); hot.setAttribute('cy', q.y); hot.setAttribute('visibility', 'visible');
      tipAt(box, q.x, q.y, fmt(q.p.v) + ' ' + unit, dShort.format(q.p.t));
    };
    const hide = () => { cur = -1; cross.setAttribute('visibility', 'hidden'); hot.setAttribute('visibility', 'hidden'); tipHide(box); };
    const near = e => {
      const px = e.clientX - box.getBoundingClientRect().left;
      let bi = 0;
      P.forEach((q, i) => { if (Math.abs(q.x - px) < Math.abs(P[bi].x - px)) bi = i; });
      show(bi);
    };
    box.addEventListener('pointermove', near);
    box.addEventListener('pointerdown', near);
    box.addEventListener('pointerleave', hide);
    box.addEventListener('blur', hide);
    box.addEventListener('focus', () => { if (cur < 0) show(P.length - 1); });
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show((cur < 0 ? P.length : cur) - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    });
  }

  function exPanel() {
    const ex = exById(ui.progEx), M = METRIC[ex.t], hist = exHistory(ui.progEx);
    const pts = hist.map(h => ({ t: h.t, v: M.of(h.sets) }));
    let recs = '';
    if (ex.t === 'wr') {
      let heavy = null, best = null, vol = null;
      hist.forEach(h => {
        let v = 0;
        h.sets.forEach(s => {
          const w = s.w || 0, r = s.r || 0, e = e1rm(w, r);
          v += w * r;
          if (!heavy || w > heavy.w || (w === heavy.w && r > heavy.r)) heavy = { w, r, t: h.t };
          if (!best || e > best.e) best = { e, w, r, t: h.t };
        });
        if (!vol || v > vol.v) vol = { v, t: h.t };
      });
      recs = `<dt>En ağır set</dt><dd>${fmt(heavy.w)} kg × ${heavy.r} <span class="sub">${dShort.format(heavy.t)}</span></dd>
<dt>En iyi tahmini 1TM</dt><dd>${fmt(round1(best.e))} kg <span class="sub">${fmt(best.w)}×${best.r} · ${dShort.format(best.t)}</span></dd>
<dt>En yüksek seans hacmi</dt><dd>${fmtVol(vol.v)} <span class="sub">${dShort.format(vol.t)}</span></dd>`;
    } else {
      const top = pts.reduce((a, p) => p.v > a.v ? p : a, pts[0]);
      recs = `<dt>${M.label}</dt><dd>${fmt(top.v)} ${M.unit} <span class="sub">${dShort.format(top.t)}</span></dd>`;
    }
    const rows = hist.slice().reverse().map(h => `<tr><td>${dShort.format(h.t)}</td><td>${esc(h.sets.map(s => setShort(ex, s)).join(' · '))}</td><td>${fmt(M.of(h.sets))}</td></tr>`).join('');
    return `<p class="sub">${M.label} (${M.unit}), seans başına${ex.t === 'wr' ? ' — Epley formülü: kilo × (1 + tekrar ÷ 30)' : ''}</p>
<div class="chart" id="ch-ex" tabindex="0" role="img" aria-label="${esc(ex.name)}: ${pts.length} seans, son değer ${fmt(pts[pts.length - 1].v)} ${M.unit}. Ok tuşlarıyla seanslar arasında gez."></div>
<dl class="recs">${recs}</dl>
<details><summary>Seansları tablo olarak gör</summary><div class="tbl-scroll"><table class="tbl"><thead><tr><th>Tarih</th><th>Setler</th><th>${M.label}</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }
  function drawExChart() {
    const box = $('#ch-ex');
    if (!box) return;
    const ex = exById(ui.progEx), M = METRIC[ex.t];
    drawLine(box, exHistory(ui.progEx).map(h => ({ t: h.t, v: M.of(h.sets) })), M.unit);
  }
  VIEWS.ilerleme = () => {
    if (!S.workouts.length) {
      return { bar: titleBar('İlerleme'), body: `<p class="empty"><strong>Grafikler ilk antrenmandan sonra</strong>Haftalık toplam hacmin, her hareketteki tahmini tek tekrar maksimumun (1TM) ve kişisel rekorların burada görünecek.<br><a class="btn primary" href="#antrenman">Antrenmana başla</a></p>` };
    }
    const now = Date.now(), ws = weekStart(now), ms = new Date(now); ms.setDate(1); ms.setHours(0, 0, 0, 0);
    const streak = weekStreak();
    const byWeek = new Map();
    S.workouts.forEach(w => { const k = weekStart(w.start), o = byWeek.get(k) || { v: 0, n: 0 }; o.v += wStats(w).vol; o.n++; byWeek.set(k, o); });
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const t = addDays(ws, -7 * (7 - i)), o = byWeek.get(t) || { v: 0, n: 0 };
      return { label: dShort.format(t), v: o.v, n: o.n, short: fmtVol(o.v), strong: fmtVol(o.v), text: (t === ws ? 'Bu hafta' : dShort.format(t) + ' haftası') + ' · ' + o.n + ' antrenman' };
    });
    const counts = new Map();
    S.workouts.forEach(w => new Set(w.entries.map(e => e.exId)).forEach(id => counts.set(id, (counts.get(id) || 0) + 1)));
    const exs = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    if (!exs.includes(ui.progEx)) ui.progEx = exs[0] || null;
    return {
      bar: titleBar('İlerleme'),
      body: `<dl class="stats">
  <div><dt>Toplam antrenman</dt><dd>${S.workouts.length}</dd></div>
  <div><dt>Bu ay</dt><dd>${S.workouts.filter(w => w.start >= ms.getTime()).length}</dd></div>
  <div><dt>Aralıksız seri</dt><dd>${streak} <small>hafta</small></dd></div>
</dl>
<section class="panel">
  <h2 class="sec">Haftalık hacim</h2>
  <p class="sub">Kaldırılan toplam yük (kilo × tekrar), son 8 hafta</p>
  ${weeks.some(w => w.v > 0) ? '<div class="chart" id="ch-week"></div>' : '<p class="sub">Bu dönemde ağırlıklı set kaydı yok.</p>'}
  <details><summary>Tablo olarak gör</summary><div class="tbl-scroll"><table class="tbl"><thead><tr><th>Hafta başı</th><th>Antrenman</th><th>Hacim</th></tr></thead><tbody>${weeks.slice().reverse().map(w => `<tr><td>${esc(w.label)}</td><td>${w.n}</td><td>${esc(w.strong)}</td></tr>`).join('')}</tbody></table></div></details>
</section>
${ui.progEx ? `<section class="panel">
  <h2 class="sec"><label for="prog-ex">Hareket bazında</label></h2>
  <select id="prog-ex" class="field" data-in="prog-ex">${exs.map(id => `<option value="${esc(id)}"${id === ui.progEx ? ' selected' : ''}>${esc(exById(id).name)} (${counts.get(id)} seans)</option>`).join('')}</select>
  <div class="stack" id="ex-panel">${exPanel()}</div>
</section>` : ''}`,
      after: () => { const b = $('#ch-week'); if (b) drawBars(b, weeks); drawExChart(); },
    };
  };
  INP['prog-ex'] = el => { ui.progEx = el.value; $('#ex-panel').innerHTML = exPanel(); drawExChart(); };

  /* ================= görünüm: programlar ================= */
  VIEWS.programlar = () => {
    const ps = S.meta.programs;
    return {
      bar: titleBar('Programlar'),
      body: `<section>
  ${ps.length ? `<ul class="list">${ps.map(p => `<li class="row"><div class="row-main"><strong>${esc(p.name)}</strong><span class="sub">${p.items.length ? esc(p.items.map(it => exById(it.exId).name).join(', ')) : 'Henüz egzersiz eklenmedi'}</span></div>
    <button class="btn ghost sm" data-act="pg-edit" data-id="${esc(p.id)}" aria-label="${esc(p.name)} programını düzenle">Düzenle</button></li>`).join('')}</ul>`
        : '<p class="empty"><strong>Program yok</strong>Sık yaptığın antrenmanı bir kez kur; her seferinde tek dokunuşla başlat.</p>'}
  <button class="btn primary wide" data-act="pg-new">+ Yeni program</button>
</section>
<p class="sub">Programı başlatmak için Antrenman sekmesine git. Hareketleri ve set sayılarını antrenman sırasında da değiştirebilirsin; program şablonu aynı kalır.</p>`,
    };
  };
  function openEditor() {
    const d = ui.draft;
    openSheet(`<h2 id="sheet-h">${d.isNew ? 'Yeni program' : 'Programı düzenle'}</h2>
<div class="form"><label for="pg-name">Program adı</label><input id="pg-name" class="field" data-in="pg-name" maxlength="60" value="${esc(d.name)}" placeholder="Örn. Üst vücut" autocomplete="off"></div>
${d.items.length ? `<ul class="items">${d.items.map((it, i) => { const ex = exById(it.exId); return `<li class="item">
  <div class="item-top"><strong>${esc(ex.name)}</strong>
    ${i > 0 ? `<button class="icon-btn" data-act="pg-up" data-i="${i}" aria-label="${esc(ex.name)} yukarı taşı">${IC.up}</button>` : ''}
    <button class="icon-btn" data-act="pg-rm" data-i="${i}" aria-label="${esc(ex.name)} programdan çıkar">${IC.close}</button></div>
  <div class="item-ctl"><label for="pg-s-${i}">Set <input id="pg-s-${i}" type="text" inputmode="numeric" data-in="pg-num" data-k="sets" data-i="${i}" value="${it.sets}"></label><span aria-hidden="true">×</span>
    <label for="pg-r-${i}"><input id="pg-r-${i}" type="text" inputmode="numeric" data-in="pg-num" data-k="reps" data-i="${i}" value="${it.reps}"> ${TYPES[ex.t].r}</label></div>
</li>`; }).join('')}</ul>` : '<p class="empty">Bu programda henüz egzersiz yok.</p>'}
<button class="btn ghost wide" data-act="pg-add">+ Egzersiz ekle</button>
<div class="sheet-actions"><button class="btn primary" data-act="pg-save">Kaydet</button>${d.isNew ? '' : '<button class="btn ghost danger" data-act="pg-del">Programı sil</button>'}</div>`);
  }
  ACT['pg-new'] = () => { ui.draft = { id: 'p-' + uid(), name: '', items: [], isNew: true }; openEditor(); };
  ACT['pg-edit'] = el => { const p = S.meta.programs.find(x => x.id === el.dataset.id); if (!p) return; ui.draft = clone(p); openEditor(); };
  INP['pg-name'] = el => { ui.draft.name = el.value; };
  INP['pg-num'] = el => { const n = parseNum(el.value); if (n != null && n >= 1) ui.draft.items[+el.dataset.i][el.dataset.k] = Math.round(clamp(n, 1, el.dataset.k === 'sets' ? 20 : 999)); };
  ACT['pg-up'] = el => { const i = +el.dataset.i, a = ui.draft.items; [a[i - 1], a[i]] = [a[i], a[i - 1]]; openEditor(); };
  ACT['pg-rm'] = el => { ui.draft.items.splice(+el.dataset.i, 1); openEditor(); };
  ACT['pg-add'] = () => openPicker(id => {
    const ex = exById(id);
    ui.draft.items.push({ exId: id, sets: ex.t === 'sure' ? 1 : 3, reps: ex.t === 'sure' ? 20 : ex.t === 'sn' ? 45 : 10 });
    openEditor();
  }, openEditor);
  ACT['pg-save'] = () => {
    const d = ui.draft, name = d.name.trim();
    if (!name) { toast('Programa bir ad ver'); $('#pg-name').focus(); return; }
    const p = { id: d.id, name: str(name, 60), items: d.items };
    const i = S.meta.programs.findIndex(x => x.id === d.id);
    if (i >= 0) S.meta.programs[i] = p; else S.meta.programs.push(p);
    touchMeta(); closeSheet(true); render(); toast('Program kaydedildi');
  };
  ACT['pg-del'] = el => {
    if (!confirmTap(el, 'Silmek için tekrar dokun')) return;
    S.meta.programs = S.meta.programs.filter(x => x.id !== ui.draft.id);
    touchMeta(); closeSheet(true); render(); toast('Program silindi');
  };

  /* ================= görünüm: araçlar ================= */
  function plateOut() {
    const target = parseNum(ui.plateKg), bar = S.meta.settings.bar;
    if (target == null) return '<p class="sub">Bara yüklemek istediğin toplam ağırlığı yaz.</p>';
    if (target < bar) return `<p class="sub">Hedef, barın kendi ağırlığından (${fmt(bar)} kg) az olamaz.</p>`;
    const p = plateCalc(target, bar);
    return `<div class="barbell" role="img" aria-label="Barın bir ucu: ${p.out.length ? p.out.map(fmt).join(', ') + ' kiloluk plakalar' : 'plaka yok'}"><span class="shaft"></span><span class="collar"></span>${p.out.map(k => `<span class="pl pl-${String(k).replace('.', '_')}"><b>${fmt(k)}</b></span>`).join('')}<span class="sleeve"></span></div>
<p class="pl-text">${p.out.length ? 'Her tarafa: <strong>' + p.out.map(fmt).join(' + ') + '</strong>' : 'Sadece bar; plaka gerekmiyor.'}</p>
${p.exact ? '' : `<p class="sub">Tam ${fmt(target)} kg yüklenemiyor (en küçük plaka 1,25 kg). En yakın alt ağırlık: <strong>${fmt(p.total)} kg</strong>.</p>`}`;
  }
  function rmOut() {
    const w = parseNum(ui.rmKg), r = parseNum(ui.rmReps);
    if (w == null || !r) return '<p class="sub">Kaldırdığın kiloyu ve tekrar sayısını yaz.</p>';
    const m = e1rm(w, r);
    return `<p class="big"><strong>${fmt(round1(m))} kg</strong> <span class="sub">tahmini tek tekrar maksimum</span></p>
${r > 12 ? '<p class="sub">12 tekrarın üstünde tahmin güvenilirliği düşer.</p>' : ''}
<div class="tbl-scroll"><table class="tbl"><thead><tr><th>Yoğunluk</th><th>Ağırlık</th><th>Yaklaşık tekrar</th></tr></thead><tbody>${[[95, 2], [90, 4], [85, 6], [80, 8], [75, 10], [70, 12]].map(([p, n]) => `<tr><td>%${p}</td><td>${fmt(Math.round(m * p / 100 / 2.5) * 2.5)} kg</td><td>${n}</td></tr>`).join('')}</tbody></table></div>`;
  }
  VIEWS.araclar = () => {
    const st = S.meta.settings;
    return {
      bar: titleBar('Araçlar'),
      body: `<section class="panel">
  <h2 class="sec"><label for="pl-kg">Plaka hesaplayıcı</label></h2>
  <input id="pl-kg" class="field num" type="text" inputmode="decimal" data-in="plate" value="${esc(ui.plateKg)}" autocomplete="off" aria-describedby="pl-help">
  <p class="sub" id="pl-help">Bar dahil toplam ağırlık, kg</p>
  <div class="chips" role="group" aria-label="Bar ağırlığı">${[20, 15, 10].map(b => `<button class="chip" data-act="bar" data-kg="${b}" aria-pressed="${st.bar === b}">${b} kg bar</button>`).join('')}</div>
  <div class="stack" id="pl-out">${plateOut()}</div>
</section>
<section class="panel">
  <h2 class="sec">1TM hesaplayıcı</h2>
  <div class="pair"><div><label class="lbl" for="rm-kg">Kilo (kg)</label><input id="rm-kg" class="field num" type="text" inputmode="decimal" data-in="rm" data-k="rmKg" value="${esc(ui.rmKg)}" autocomplete="off"></div>
  <div><label class="lbl" for="rm-reps">Tekrar</label><input id="rm-reps" class="field num" type="text" inputmode="numeric" data-in="rm" data-k="rmReps" value="${esc(ui.rmReps)}" autocomplete="off"></div></div>
  <div class="stack" id="rm-out">${rmOut()}</div>
</section>
<section class="panel">
  <h2 class="sec">Dinlenme sayacı</h2>
  <p class="sub">Bir seti işaretlediğinde bu süre kadar geri sayım başlar.</p>
  <div class="chips" role="group" aria-label="Dinlenme süresi">${[60, 90, 120, 150, 180].map(n => `<button class="chip" data-act="rest-set" data-s="${n}" aria-pressed="${st.rest === n}">${fmtClock(n)}</button>`).join('')}</div>
  <label class="switch" for="opt-sound"><input type="checkbox" id="opt-sound" data-in="opt" data-k="sound"${st.sound ? ' checked' : ''}>Süre dolunca sesli uyarı</label>
  <label class="switch" for="opt-vib"><input type="checkbox" id="opt-vib" data-in="opt" data-k="vib"${st.vib ? ' checked' : ''}>Titreşim (destekleyen telefonlarda)</label>
</section>
<section class="panel">
  <h2 class="sec">Kayıtların</h2>
  <p class="sub" id="sync-note">${esc(syncText())}</p>
  <div class="stack"><button class="btn ghost" data-act="backup">Yedek al</button><button class="btn ghost" data-act="restore">Yedekten geri yükle</button><button class="btn quiet danger" data-act="wipe">Tüm kayıtları sil ve sıfırla</button></div>
</section>`,
    };
  };
  INP.plate = el => { ui.plateKg = el.value; $('#pl-out').innerHTML = plateOut(); };
  INP.rm = el => { ui[el.dataset.k] = el.value; $('#rm-out').innerHTML = rmOut(); };
  INP.opt = el => { S.meta.settings[el.dataset.k] = el.checked; touchMeta(); if (el.checked && el.dataset.k === 'sound') { primeAudio(); beep(); } };
  ACT.bar = el => { S.meta.settings.bar = +el.dataset.kg; touchMeta(); $$('[data-act="bar"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); $('#pl-out').innerHTML = plateOut(); };
  ACT['rest-set'] = el => { S.meta.settings.rest = +el.dataset.s; touchMeta(); $$('[data-act="rest-set"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); };

  ACT.backup = () => {
    const json = JSON.stringify({ app: 'demir-defteri', v: 1, exportedAt: new Date().toISOString(), meta: S.meta, workouts: S.workouts });
    openSheet(`<h2 id="sheet-h">Yedek al</h2>
<p class="sub">Aşağıdaki metin tüm programlarını ve ${S.workouts.length} antrenman kaydını içerir. Kopyalayıp notlarına ya da kendine göndereceğin bir mesaja yapıştır.</p>
<textarea id="bk-text" class="field" readonly aria-label="Yedek metni">${esc(json)}</textarea>
<div class="sheet-actions"><button class="btn primary" data-act="bk-copy">Panoya kopyala</button></div>`);
  };
  ACT['bk-copy'] = () => {
    const ta = $('#bk-text');
    const fallback = () => { ta.focus(); ta.select(); toast('Metin seçildi; kopyala komutunu kullan'); };
    try { navigator.clipboard.writeText(ta.value).then(() => toast('Yedek panoya kopyalandı'), fallback); } catch (e) { fallback(); }
  };
  ACT.restore = () => openSheet(`<h2 id="sheet-h">Yedekten geri yükle</h2>
<p class="sub">Daha önce aldığın yedek metnini yapıştır. Şu anki programların ve kayıtların yedektekilerle değiştirilir.</p>
<textarea id="rs-text" class="field" placeholder='{"app":"demir-defteri", …}' aria-label="Yedek metni"></textarea>
<div class="sheet-actions"><button class="btn primary" data-act="rs-go">Geri yükle</button></div>`);
  function replaceAll(meta, workouts) {
    const keep = new Set(workouts.map(w => w.id));
    S.workouts.forEach(w => { if (!keep.has(w.id)) S.dirty.del[w.id] = 1; });
    S.dirty.w = {};
    S.meta = meta; S.workouts = workouts.sort(byStart);
    S.active = null; S.rest = null; restFlash = 0;
    S.workouts.forEach(w => { S.dirty.w[w.id] = 1; delete S.dirty.del[w.id]; });
    releaseWake(); touchMeta(); touchActive(); saveLocal(true);
  }
  ACT['rs-go'] = el => {
    let o = null;
    try { o = JSON.parse($('#rs-text').value); } catch (e) { o = null; }
    if (!o || typeof o !== 'object' || !o.meta || !Array.isArray(o.workouts)) { toast('Bu metin geçerli bir yedek değil'); return; }
    if (!confirmTap(el, 'Mevcut kayıtların üzerine yaz — tekrar dokun')) return;
    const meta = normMeta(o.meta);
    meta.seeded = true;
    replaceAll(meta, o.workouts.map(w => normWorkout(w)).filter(Boolean));
    closeSheet(true); go('antrenman'); toast(S.workouts.length + ' antrenman geri yüklendi');
  };
  ACT.wipe = el => {
    if (!confirmTap(el, 'Her şey silinecek — onaylamak için tekrar dokun')) return;
    replaceAll(blank().meta, []);
    seed(); touchMeta();
    go('antrenman'); toast('Tüm kayıtlar silindi');
  };

  /* ================= olaylar ve başlangıç ================= */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const f = ACT[el.dataset.act];
    if (f) { e.preventDefault(); f(el, e); }
  });
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-in]');
    if (el && INP[el.dataset.in]) INP[el.dataset.in](el);
  });
  document.addEventListener('submit', e => {
    e.preventDefault();
    const f = FORMS[e.target.dataset.form];
    if (f) f(e.target);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSheet();
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-in="set"]')) {
      e.preventDefault();
      const row = e.target.closest('.set');
      if (e.target.dataset.f === 'w') $('[data-f="r"]', row).focus();
      else { e.target.blur(); const b = $('.check', row); if (b.getAttribute('aria-pressed') !== 'true') ACT.toggle(b); }
    }
  });
  const isTyping = el => el && el.matches && el.matches('input:not([type="checkbox"]), textarea');
  document.addEventListener('focusin', e => {
    if (!isTyping(e.target)) return;
    document.body.classList.add('typing');
    if (e.target.matches('[data-in="set"], .num, .item-ctl input')) { try { e.target.select(); } catch (err) { /* yok say */ } }
  });
  document.addEventListener('focusout', () => setTimeout(() => { if (!isTyping(document.activeElement)) document.body.classList.remove('typing'); }, 60));
  window.addEventListener('hashchange', () => { closeSheet(true); render(); window.scrollTo(0, 0); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { keepAwake(); tick(); if (cloud && isDirty()) scheduleFlush(300); }
    else { saveLocal(true); if (cloud && isDirty()) { clearTimeout(flushT); flush(); } }
  });
  window.addEventListener('pagehide', () => saveLocal(true));
  window.addEventListener('online', () => { if (cloud && isDirty()) scheduleFlush(300); });
  let lastW = window.innerWidth, rzT = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rzT);
    rzT = setTimeout(() => { if (currentTab() === 'ilerleme') softRender(); }, 200);
  });

  function start() {
    if (!S.meta.seeded) seed();
    render();
    setInterval(tick, 500);
    keepAwake();
  }
  function boot() {
    document.documentElement.lang = 'tr';
    const root = $('#app');
    if (!root) return;
    loadLocal();
    root.innerHTML = shellHtml();
    if (hasClaude() && !S.lastSync) {
      // İlk açılış: başka cihazdaki kayıtların üzerine yazmamak için önce bulutu bekle.
      $('#bar').innerHTML = titleBar('Demir Defteri');
      $('#view').innerHTML = '<p class="empty" role="status">Defterin açılıyor…</p>';
      let started = false;
      const begin = () => { if (!started) { started = true; start(); } };
      initCloud().then(changed => { if (started) { if (changed) softRender(); } else begin(); });
      wait(9000).then(begin);
    } else {
      start();
      initCloud().then(changed => { if (changed) softRender(); });
    }
  }
  boot();
})();
