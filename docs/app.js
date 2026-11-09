/* Neva & Kremlin Rehberi — tek dosyalık uygulama mantığı (çerçevesiz, çevrimdışı çalışır). */
(function () {
  'use strict';
  const T = window.TRIP;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- Depolama ---------------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('nk.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('nk.' + k, JSON.stringify(v)); } catch (e) { /* depolama kapalı */ } },
    del(k) { try { localStorage.removeItem('nk.' + k); } catch (e) { /* */ } }
  };

  const state = {
    tab: 'bugun',
    progDay: null,
    city: null,
    exploreCat: 'hepsi',
    exploreQuery: '',
    me: null,
    extras: store.get('extras', {}),
    checklist: store.get('checklist', {}),
    favs: store.get('favs', {}),
    hotels: store.get('hotels', {}),
    rates: store.get('rates', { EUR: 1, USD: 1.16, TRY: 50, RUB: 95, updated: null }),
    docs: null,
    wiki: store.get('wiki', {})
  };

  /* ---------------- İkonlar ---------------- */
  const P = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.5 4.5-4.5 2.5 2.5-4.5z"/>',
    ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M15 7v10" stroke-dasharray="2 2"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    train: '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14M9 13h.01M15 13h.01M8 20l1.5-4M16 20l-1.5-4M7 20h10"/>',
    land: '<path d="M2 20h20"/><path d="M3.8 15.5 6 9l2.2.6.6 4.2 4.6 1.2.9-7.5 2.5.7 1.4 8.5 2.9.8c.8.2 1.2 1 1 1.8l-.1.2-17.2-4.6z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
    locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
    bed: '<path d="M3 18V6M3 13h18v5M21 18v-3a3 3 0 0 0-3-3h-7v1"/><circle cx="7" cy="10" r="2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/>',
    share: '<path d="M12 3v13M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    speaker: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    coins: '<circle cx="9" cy="9" r="6"/><path d="M15.5 9.2a6 6 0 1 1-6.3 6.3"/><path d="M9 6.5v5M7 8h3.5"/>',
    lang: '<path d="M4 5h9M8.5 3v2M6 5c.8 3 3 6 6 7.5M11 5c-.7 3.3-3 6.5-7 8"/><path d="m13 21 4-9 4 9M14.5 18h5"/>',
    sos: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    thermo: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>',
    sunset: '<path d="M17 18a5 5 0 0 0-10 0M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="m9 20 3-6 3 3v4M7 11l3-3 3 1 2 3 3 1M10 8l-1 5"/>',
    coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z M6 2v2M10 2v2M14 2v2"/>',
    // Kategoriler
    palace: '<path d="M3 21h18M4 21V11l8-5 8 5v10M9 21v-5h6v5M12 6V3M7 13h.01M17 13h.01"/>',
    museum: '<path d="M3 21h18M5 18h14M12 3 3 8h18zM6 10v7M10 10v7M14 10v7M18 10v7"/>',
    dome: '<path d="M12 2v2M12 4c-1 2-4 3.5-4 6.5h8C16 7.5 13 6 12 4z"/><path d="M8.5 10.5h7V21h-7zM6 21h12M12 15v3"/>',
    mosque: '<path d="M7 21v-6c0-3 5-4 5-7 0 3 5 4 5 7v6M4 21V9M20 21V9M3 21h18M4 9l-1-2h2zM20 9l-1-2h2zM12 3.5a1 1 0 1 1 0-.01"/>',
    square: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 7v10M9 17h6"/>',
    monument: '<path d="M10 21h4M8 21l1-4h6l1 4M10 17l1-12 1-2 1 2 1 12"/>',
    street: '<path d="M7 21 10 3M17 21 14 3M12 6v2M12 11v2M12 16v2"/>',
    tree: '<path d="M12 21v-5M12 3l-6 8h3l-3 5h12l-3-5h3z"/>',
    view: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 6s1 4 3 4v8"/>',
    bag: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
    theatre: '<path d="M3 4h10v6a5 5 0 0 1-10 0z"/><path d="M11 12.5a5 5 0 0 0 10-1.5V6h-6"/><path d="M6 8h.01M10 8h.01M6.5 11.5a2 2 0 0 0 3 0"/>',
    metro: '<circle cx="12" cy="12" r="9"/><path d="M7 16V8l5 6 5-6v8"/>',
    check: '<path d="m5 12 5 5L20 7"/>'
  };
  const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.info}</svg>`;
  const catIcon = (c) => icon((T.categories[c] || {}).icon || 'pin');

  /* ---------------- Siluet çizimleri ---------------- */
  function onion(cx, base, w, h) {
    return `M${cx - w * 0.36} ${base} C${cx - w * 0.78} ${base - h * 0.38} ${cx - w * 0.12} ${base - h * 0.62} ${cx} ${base - h} C${cx + w * 0.12} ${base - h * 0.62} ${cx + w * 0.78} ${base - h * 0.38} ${cx + w * 0.36} ${base} Z`;
  }
  function skyline(city) {
    const ink = 'currentColor', gold = '#d9b56a';
    if (city === 'msk') {
      let wall = '';
      for (let x = 0; x < 400; x += 14) wall += `<path d="M${x + 2} 84 v-7 l2.5 3 2.5-3 v7z" fill="${ink}" opacity=".55"/>`;
      const domes = [
        [182, 64, 18, 22, '#e5807a'], [204, 56, 22, 26, '#74bba7'], [252, 62, 18, 22, '#7aa7d9'], [232, 58, 20, 24, '#d9b56a'], [270, 70, 16, 18, '#e5807a']
      ].map(([cx, b, w, h, c]) => `<rect x="${cx - w * 0.32}" y="${b}" width="${w * 0.64}" height="${92 - b}" fill="${ink}" opacity=".9"/><path d="${onion(cx, b, w, h)}" fill="${c}"/><path d="M${cx} ${b - h} v-6 M${cx - 2.5} ${b - h - 3} h5" stroke="${gold}" stroke-width="1.2"/>`).join('');
      return `<svg class="skyline" viewBox="0 0 400 110" role="img" aria-label="Moskova silueti: Spasskaya Kulesi ve Aziz Vasil Katedrali">
        <rect x="0" y="84" width="400" height="26" fill="${ink}" opacity=".12"/>
        ${wall}
        <rect x="0" y="84" width="400" height="8" fill="${ink}" opacity=".55"/>
        <g fill="${ink}" opacity=".95">
          <rect x="58" y="52" width="34" height="40"/><rect x="62" y="38" width="26" height="15"/><rect x="66" y="28" width="18" height="11"/>
          <path d="M66 28 L75 6 L84 28 Z"/>
        </g>
        <circle cx="75" cy="43" r="5" fill="${gold}"/>
        <path d="M75 1 l1.6 3.3 3.6.4-2.7 2.4.8 3.5L75 8.9l-3.3 1.7.8-3.5-2.7-2.4 3.6-.4z" fill="#e5807a"/>
        <rect x="216" y="40" width="12" height="52" fill="${ink}" opacity=".95"/>
        <path d="M216 40 L222 14 L228 40 Z" fill="${ink}"/>
        <path d="${onion(222, 16, 9, 10)}" fill="${gold}"/>
        ${domes}
        <g fill="${ink}" opacity=".8"><rect x="330" y="58" width="22" height="34"/><path d="M330 58 L341 30 L352 58 Z"/></g>
        <path d="M341 25 l1.2 2.4 2.6.3-2 1.8.6 2.6-2.4-1.3-2.4 1.3.6-2.6-2-1.8 2.6-.3z" fill="#e5807a"/>
      </svg>`;
    }
    return `<svg class="skyline" viewBox="0 0 400 110" role="img" aria-label="St. Petersburg silueti: Peter ve Paul Katedrali kulesi, Neva köprüsü ve Amirallik">
      <rect x="0" y="92" width="400" height="18" fill="${ink}" opacity=".1"/>
      <path d="M0 100 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="${gold}" stroke-width="1" fill="none" opacity=".45"/>
      <g fill="${ink}" opacity=".92">
        <rect x="28" y="72" width="70" height="20"/><rect x="58" y="50" width="16" height="22"/><rect x="61" y="40" width="10" height="10"/>
      </g>
      <path d="M62.5 40 L66 2 L69.5 40 Z" fill="${gold}"/>
      <path d="M66 0 l-3 2 h6 z" fill="${gold}"/>
      <path d="M100 92 Q125 76 150 92 Q175 76 200 92 Q225 76 250 92" stroke="${ink}" stroke-width="3" fill="none" opacity=".6"/>
      <path d="M100 84 H250" stroke="${ink}" stroke-width="2" opacity=".6"/>
      <g fill="${ink}" opacity=".92">
        <rect x="255" y="70" width="112" height="22"/><rect x="301" y="52" width="20" height="18"/>
        <rect x="262" y="64" width="12" height="6"/><rect x="348" y="64" width="12" height="6"/>
      </g>
      <path d="M306 52 C306 44 316 44 316 52 Z" fill="${gold}"/>
      <path d="M309.5 46 L311 14 L312.5 46 Z" fill="${gold}"/>
      <path d="M307 13 h8 l-2 2.5 h-4 z" fill="${gold}"/>
      <g fill="${ink}" opacity=".7"><rect x="372" y="62" width="24" height="30"/></g>
      <path d="M372 62 C372 44 396 44 396 62 Z" fill="${gold}" opacity=".9"/>
    </svg>`;
  }
  const brandMark = `<svg viewBox="0 0 26 30" aria-hidden="true"><path d="${onion(13, 20, 18, 18)}" fill="currentColor"/><rect x="7" y="20" width="12" height="9" fill="currentColor" opacity=".55"/><path d="M13 2V0M11 1h4" stroke="currentColor" stroke-width="1.2"/></svg>`;

  /* ---------------- Zaman ---------------- */
  const qs = new URLSearchParams(location.search);
  const simNow = qs.get('now');
  function now() { return simNow ? new Date(simNow + (simNow.length <= 16 ? ':00+03:00' : '')) : new Date(); }
  function at(dateStr, hhmm) { return new Date(`${dateStr}T${hhmm}:00+03:00`); }
  function msk(d) { const x = new Date(d.getTime() + 3 * 3600e3); return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate(), h: x.getUTCHours(), mi: x.getUTCMinutes(), wd: x.getUTCDay(), iso: x.toISOString().slice(0, 10) }; }
  const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const TR_MON = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function fmtDate(iso, withDay = true) { const d = new Date(iso + 'T12:00:00+03:00'); const p = msk(d); return `${p.d} ${TR_MON[p.m]}${withDay ? ' ' + TR_DAYS[p.wd] : ''}`; }
  function weekday(iso) { return msk(new Date(iso + 'T12:00:00+03:00')).wd; }
  function dur(ms) {
    const m = Math.max(0, Math.round(ms / 60000));
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    if (d >= 2) return `${d} gün`;
    if (d === 1) return `1 gün ${h} sa`;
    if (h) return `${h} sa ${mm} dk`;
    return `${mm} dk`;
  }

  /* Gün ve olay listesi */
  function dayEvents(day) {
    let prev = '00:00', offset = 0;
    return day.events.map((e) => {
      if (e.t < prev) offset = 1;
      prev = e.t;
      const date = new Date(at(day.date, e.t).getTime() + offset * 864e5);
      return Object.assign({}, e, { date, day });
    });
  }
  const isExtraOn = (id) => !!state.extras[id];
  function allEvents() { return T.days.flatMap(dayEvents).filter((e) => e.kind !== 'extra' || isExtraOn(e.extra)); }
  function tripPhase() {
    const n = now(), first = at(T.days[0].date, T.days[0].events[0].t), lastDay = T.days[T.days.length - 1];
    const end = new Date(at(lastDay.date, '23:59').getTime() + 3 * 3600e3);
    if (n < first) return 'before';
    if (n > end) return 'after';
    return 'during';
  }
  function currentDay() {
    const iso = msk(now()).iso;
    return T.days.find((d) => d.date === iso) || null;
  }
  function activeCity() {
    const d = currentDay();
    if (d) return d.city;
    return tripPhase() === 'after' ? 'msk' : 'spb';
  }

  /* ---------------- Coğrafya ---------------- */
  function hotel(city) {
    const base = T.hotels[city], o = state.hotels[city] || {};
    return Object.assign({}, base, o);
  }
  function distKm(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return null;
    const R = 6371, toR = Math.PI / 180;
    const dLa = (b.lat - a.lat) * toR, dLo = (b.lon - a.lon) * toR;
    const s = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function bearing(a, b) {
    const toR = Math.PI / 180, y = Math.sin((b.lon - a.lon) * toR) * Math.cos(b.lat * toR);
    const x = Math.cos(a.lat * toR) * Math.sin(b.lat * toR) - Math.sin(a.lat * toR) * Math.cos(b.lat * toR) * Math.cos((b.lon - a.lon) * toR);
    const deg = (Math.atan2(y, x) / toR + 360) % 360;
    return ['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı'][Math.round(deg / 45) % 8];
  }
  const fmtKm = (k) => k == null ? '' : k < 1 ? `${Math.round(k * 1000 / 10) * 10} m` : `${k.toFixed(k < 10 ? 1 : 0).replace('.', ',')} km`;
  function distLabel(p) {
    if (state.me) { const k = distKm(state.me, p); if (k != null && k < 80) return `${fmtKm(k)} · ${bearing(state.me, p)}`; }
    const h = hotel(p.city); const k = distKm(h, p);
    return k != null ? `otele ${fmtKm(k)}` : '';
  }
  const placeById = (id) => T.places.find((p) => p.id === id);
  function closedOn(p, iso) { return p.closed ? p.closed.includes(weekday(iso)) : false; }

  function locateMe(cb) {
    if (!navigator.geolocation) { toast('Bu cihaz konum vermiyor'); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      state.me = { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy };
      cb && cb(state.me);
    }, () => toast('Konum alınamadı. Ayarlar > Gizlilik > Konum’dan izin verin.'), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  /* ---------------- Wikipedia fotoğrafları (çevrimiçiyken alınır, sonra önbellekte) ---------------- */
  async function wikiInfo(title) {
    if (!title) return null;
    if (state.wiki[title] !== undefined) return state.wiki[title];
    if (!navigator.onLine) return null;
    try {
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      let src = null;
      if (j.thumbnail && j.thumbnail.source) {
        src = j.thumbnail.source;
        if (j.originalimage && j.originalimage.width > 500) src = src.replace(/\/\d+px-/, '/500px-');
      }
      state.wiki[title] = src ? { src } : null;
    } catch (e) { return null; }
    store.set('wiki', state.wiki);
    return state.wiki[title];
  }
  function hydratePhotos(root = document) {
    $$('[data-wiki]', root).forEach(async (el) => {
      const info = await wikiInfo(el.dataset.wiki);
      if (!info || !info.src || el.querySelector('img')) return;
      const img = new Image();
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = () => img.remove();
      img.src = info.src;
      el.appendChild(img);
      if (el.dataset.credit) { const c = document.createElement('span'); c.className = 'pd-credit'; c.textContent = 'Foto: Wikipedia'; el.appendChild(c); }
    });
  }

  /* ---------------- Ortak UI ---------------- */
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2600);
  }
  function openSheet(html, onMount) {
    $('#sheetBody').innerHTML = html;
    $('#sheetWrap').hidden = false;
    $('#sheetBody').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    onMount && onMount($('#sheetBody'));
  }
  function closeSheet() { $('#sheetWrap').hidden = true; document.body.style.overflow = ''; if (window.speechSynthesis) speechSynthesis.cancel(); }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Kopyalandı'); } catch (e) { toast(text); }
  }
  function setCityClass(city) { document.body.classList.toggle('city-msk', city === 'msk'); document.body.classList.toggle('city-spb', city !== 'msk'); }

  function placeCard(p, extra = '') {
    const closed = closedOn(p, msk(now()).iso) && tripPhase() === 'during';
    return `<button class="place" data-place="${p.id}">
      <div class="place-img" ${p.wiki ? `data-wiki="${esc(p.wiki)}"` : ''}>${catIcon(p.cat)}</div>
      <div class="place-info">
        <div class="place-name">${state.favs[p.id] ? '★ ' : ''}${esc(p.name)}</div>
        <div class="place-ru ru">${esc(p.ru)}</div>
        <div class="place-sub">
          <span>${esc((T.categories[p.cat] || {}).label || '')}</span>
          ${p.dur ? `<span>${icon('clock')} ${esc(p.dur)}</span>`.replace('<svg class=""', '<svg style="width:13px;height:13px;vertical-align:-2px"') : ''}
          ${closed ? '<span class="closed">Bugün kapalı</span>' : ''}
          <span>${esc(distLabel(p))}</span>
          ${extra}
        </div>
      </div>
    </button>`;
  }

  function mapsLinks(p) {
    const q = encodeURIComponent(p.ru || p.name);
    return `<div class="btn-row">
      <a class="btn" href="https://yandex.com.tr/maps/?pt=${p.lon},${p.lat}&z=17&l=map&text=${q}" target="_blank" rel="noopener">${icon('ext')} Yandex</a>
      <a class="btn" href="https://2gis.ru/geo/${p.lon},${p.lat}" target="_blank" rel="noopener">${icon('ext')} 2GIS</a>
      <a class="btn" href="https://maps.apple.com/?ll=${p.lat},${p.lon}&q=${encodeURIComponent(p.name)}" target="_blank" rel="noopener">${icon('ext')} Apple</a>
    </div>`;
  }

  function openPlace(id) {
    const p = placeById(id); if (!p) return;
    setCityClass(p.city);
    const iso = msk(now()).iso;
    const closedToday = closedOn(p, iso);
    const days = T.days.filter((d) => d.city === p.city && (d.free.picks.includes(p.id) || d.events.some((e) => (e.places || []).includes(p.id))));
    const extra = Object.entries(T.extras).find(([, x]) => x.place === p.id);
    openSheet(`
      <div class="pd-photo" ${p.wiki ? `data-wiki="${esc(p.wiki)}" data-credit="1"` : ''}>${icon((T.categories[p.cat] || {}).icon || 'pin', 'ill')}</div>
      <div class="badge">${esc(T.cities[p.city].name)} · ${esc((T.categories[p.cat] || {}).label || '')}</div>
      <h2 class="pd-title" style="margin-top:8px">${esc(p.name)}</h2>
      <div class="pd-ru ru">${esc(p.ru)}</div>
      <p style="margin-top:12px">${esc(p.desc)}</p>
      ${p.tip ? `<div class="pd-tip"><b>İpucu:</b> ${esc(p.tip)}</div>` : ''}
      <div class="pd-facts">
        ${p.hours ? `<div>${icon('clock')}<span>${esc(p.hours)}${closedToday && tripPhase() === 'during' ? ' · <b style="color:var(--msk)">Bugün kapalı</b>' : ''}</span></div>` : ''}
        ${p.dur ? `<div>${icon('walk')}<span>Ayırın: ${esc(p.dur)}</span></div>` : ''}
        ${p.price ? `<div>${icon('coins')}<span>${esc(p.price)}</span></div>` : ''}
        ${distLabel(p) ? `<div>${icon('pin')}<span>${esc(distLabel(p))}</span></div>` : ''}
        ${extra ? `<div>${icon('ticket')}<span>Ekstra tur: ${esc(extra[1].name)}${extra[1].price ? ` (${extra[1].price} €)` : ''}</span></div>` : ''}
        ${days.length ? `<div>${icon('calendar')}<span>Programda: ${days.map((d) => `${d.n}. gün`).join(', ')}</span></div>` : ''}
      </div>
      <div class="btn-row" style="margin-bottom:8px">
        <button class="btn primary" data-act="showmap">${icon('map')} Haritada göster</button>
        <button class="btn" data-act="fav">${icon('star')} ${state.favs[p.id] ? 'Favoriden çıkar' : 'Favorilere ekle'}</button>
      </div>
      <button class="btn block" data-act="taxi" style="margin-bottom:8px">${icon('bulb')} Taksiciye göster (Rusça)</button>
      <div class="section-title">Navigasyon uygulamasında aç</div>
      ${mapsLinks(p)}
      <p class="muted" style="font-size:.78rem;margin-top:10px">Saatler yaklaşıktır. Gitmeden 2GIS veya Yandex’ten güncel saati kontrol edin.</p>
    `, (root) => {
      hydratePhotos(root);
      root.querySelector('[data-act=showmap]').onclick = () => { closeSheet(); state.mapFocus = p.id; go('harita'); };
      root.querySelector('[data-act=fav]').onclick = () => { state.favs[p.id] = !state.favs[p.id]; if (!state.favs[p.id]) delete state.favs[p.id]; store.set('favs', state.favs); openPlace(id); render(); };
      root.querySelector('[data-act=taxi]').onclick = () => showBig(p.ru, p.name);
    });
  }
  function showBig(ru, sub) {
    openSheet(`<div class="badge gold">Bu ekranı gösterin</div><div class="show-big ru" lang="ru">${esc(ru)}</div><p class="muted" style="text-align:center">${esc(sub || '')}</p>
      <div class="btn-row" style="margin-top:12px"><button class="btn" data-say>${icon('speaker')} Sesli oku</button><button class="btn" data-copy>Kopyala</button></div>`, (root) => {
      root.querySelector('[data-say]').onclick = () => speak(ru);
      root.querySelector('[data-copy]').onclick = () => copyText(ru);
    });
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) { toast('Bu cihazda sesli okuma yok'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'ru-RU'; u.rate = 0.85;
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.startsWith('ru'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  /* ---------------- Öneri motoru: "Şimdi ne yapsam?" ---------------- */
  function suggestions(limit = 4) {
    const n = now(), p = msk(n), day = currentDay();
    const city = day ? day.city : activeCity();
    const h = p.h, iso = p.iso;
    const dark = h >= 17 || h < 9;
    const picks = day ? day.free.picks : [];
    const scored = T.places.filter((x) => x.city === city && x.cat !== 'ulasim').map((x) => {
      let s = 0; const why = [];
      if (picks.includes(x.id)) { s += 3; why.push('bugünkü serbest zamana uygun'); }
      if (closedOn(x, iso)) s -= 100;
      if (x.indoor) { s += 1; if (dark) { s += 1.5; } }
      if (!x.indoor && dark && !['sokak', 'meydan'].includes(x.cat)) s -= 1.5;
      if (h >= 18 && ['yemek', 'sahne', 'sokak'].includes(x.cat)) { s += 2; why.push('akşam için ideal'); }
      if (h < 13 && ['muze', 'saray', 'kilise'].includes(x.cat)) { s += 1.5; why.push('sabah kalabalığı az'); }
      if (h >= 12 && h < 15 && x.cat === 'yemek') { s += 2; why.push('öğle yemeği'); }
      if (x.late && x.late.includes(p.wd) && h >= 15) { s += 2; why.push('bugün akşam geç saate kadar açık'); }
      if (state.favs[x.id]) { s += 1.5; why.push('favorin'); }
      const ref = state.me || hotel(city);
      const k = distKm(ref, x);
      if (k != null) { s -= Math.min(k, 30) * 0.25; if (k < 1.2) why.push('çok yakın'); }
      if (x.id === 'peterhof' || x.id === 'catherine' || x.id === 'lakhta') s -= 2;
      return { x, s, why };
    }).sort((a, b) => b.s - a.s);
    return scored.slice(0, limit);
  }

  /* ---------------- Görünüm: BUGÜN ---------------- */
  function heroHTML(eyebrow, title, lead, city, meta = '') {
    return `<section class="hero">
      <div class="hero-eyebrow">${eyebrow}</div>
      <h1>${title}</h1>
      ${lead ? `<p class="hero-lead">${lead}</p>` : ''}
      ${meta ? `<div class="hero-meta">${meta}</div>` : ''}
      ${skyline(city)}
    </section>`;
  }
  function nextEvent() { const n = now(); return allEvents().find((e) => e.date > n) || null; }
  function nextCard() {
    const e = nextEvent(); if (!e) return '';
    const n = now(), p = msk(e.date);
    const label = e.kind === 'flight' ? 'Sıradaki uçuş' : e.kind === 'train' ? 'Sıradaki tren' : 'Sırada';
    return `<div class="card next">
      <div class="next-label">${label}</div>
      <div>
        <div class="next-title">${esc(e.title)}</div>
        <div class="next-when">${p.d} ${TR_MON[p.m]} · ${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}</div>
      </div>
      <div class="next-count" data-count="${e.date.getTime()}">${dur(e.date - n)}<small>kaldı</small></div>
    </div>`;
  }
  function timelineHTML(day, opts = {}) {
    const n = now();
    const evs = dayEvents(day);
    let nowMarked = false;
    return `<ol class="timeline">${evs.map((e, i) => {
      const nextE = evs[i + 1];
      const isPast = e.date < n && (!nextE || nextE.date < n);
      let cls = e.kind;
      if (e.kind === 'extra') cls += isExtraOn(e.extra) ? ' on' : '';
      if (opts.live) {
        if (isPast) cls += ' past';
        else if (!nowMarked && e.date <= n) { cls += ' now'; nowMarked = true; }
      }
      const ex = e.extra ? T.extras[e.extra] : null;
      const places = (e.places || []).map((id) => placeById(id)).filter(Boolean);
      const firstOfExtra = ex && evs.findIndex((x) => x.extra === e.extra) === i;
      return `<li class="tl ${cls}">
        <div class="tl-time">${e.t}</div><div class="tl-dot"></div>
        <div class="tl-body">
          <div class="tl-title">${esc(e.title)} ${ex ? `<span class="badge ${isExtraOn(e.extra) ? '' : 'off'}">${isExtraOn(e.extra) ? 'Aldım' : 'İsteğe bağlı'}${ex.price ? ` · ${ex.price} €` : ''}</span>` : ''}</div>
          <div class="tl-text">${esc(e.text)}</div>
          ${ex && firstOfExtra && opts.toggles ? `<button class="toggle-extra" data-extra="${e.extra}" aria-pressed="${isExtraOn(e.extra)}"><span class="box">${isExtraOn(e.extra) ? '✓' : ''}</span>Bu turu aldım</button>` : ''}
          ${places.length ? `<div class="tl-places">${places.map((p) => `<button data-place="${p.id}">${esc(p.name)}</button>`).join('')}</div>` : ''}
        </div>
      </li>`;
    }).join('')}</ol>`;
  }
  function toolsGrid() {
    return `<div class="tool-grid">
      <button class="tool" data-tool="doviz">${icon('coins')}Döviz</button>
      <button class="tool" data-tool="rusca">${icon('lang')}Rusça</button>
      <button class="tool" data-tool="acil">${icon('sos')}Acil</button>
      <button class="tool" data-tool="valiz">${icon('case')}Valiz</button>
    </div>`;
  }
  function suggestHTML() {
    const s = suggestions(4);
    return `<div class="place-list">${s.map(({ x, why }) => placeCard(x, why[0] ? `<span style="color:var(--accent)">${esc(why[0])}</span>` : '')).join('')}</div>`;
  }
  function warningsHTML() {
    const w = state.docs && state.docs.info && state.docs.info.warnings;
    if (!w || !w.length) return '';
    return w.map((t) => `<div class="alert">${icon('warn')}<div>${esc(t)}</div></div>`).join('');
  }

  function viewToday() {
    const phase = tripPhase();
    const n = now();
    if (phase === 'before') {
      const first = T.days[0];
      const daysLeft = Math.ceil((at(first.date, '00:00') - at(msk(n).iso, '00:00')) / 864e5);
      const done = T.checklist.reduce((a, g) => a + g.items.filter((it) => state.checklist[it]).length, 0);
      const total = T.checklist.reduce((a, g) => a + g.items.length, 0);
      setCityClass('spb');
      return heroHTML('Yolculuğa hazırlık', daysLeft <= 1 ? 'Yarın yola çıkıyorsunuz' : `${daysLeft} gün kaldı`, '6 gün, 2 başkent: Neva kıyısındaki saraylardan Kızıl Meydan’a. 10 Kasım sabahı 05:30’da İstanbul Havalimanı’nda buluşma.', 'spb',
        `<span>${icon('plane')} TK 401 · 09:00</span><span>${icon('thermo')} −3 / +3 °C</span><span>${icon('sunset')} Gün batımı ~16:40</span>`)
        + nextCard()
        + `<div class="section-title">Hazırlık listesi <button data-tool="valiz">Listeyi aç</button></div>
           <div class="card"><div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:8px"><b>${done} / ${total} tamam</b><span class="muted">Valiz ve belgeler</span></div><div class="progress"><i style="width:${Math.round(done / total * 100)}%"></i></div></div>`
        + (warningsHTML() ? `<div class="section-title">Dikkat</div><div class="stack">${warningsHTML()}</div>` : '')
        + offlineCard()
        + `<div class="section-title">Araçlar</div>${toolsGrid()}`
        + `<div class="section-title">Bilmeniz gerekenler</div><div class="stack">${T.tips.slice(0, 4).map((t) => `<div class="card"><b>${esc(t.t)}</b><p class="muted" style="margin-top:4px">${esc(t.d)}</p></div>`).join('')}</div>`
        + `<p class="foot">Tur: ${esc(T.agency)} · Kolay e-vize ile St. Petersburg & Moskova</p>`;
    }
    if (phase === 'after') {
      setCityClass('msk');
      return heroHTML('Tur tamamlandı', 'Hoş geldiniz', 'Umarız Neva’nın ve Kremlin’in anıları uzun süre sizinle kalır. Belgeleriniz ve notlarınız burada durmaya devam edecek.', 'msk') + `<div class="section-title">Araçlar</div>${toolsGrid()}`;
    }
    const day = currentDay() || T.days[0];
    setCityClass(day.city);
    const h = hotel(day.city);
    return heroHTML(`Gün ${day.n} / 6 · ${fmtDate(day.date)}`, esc(day.title), esc(day.lead), day.city,
      `<span>${icon('pin')} ${esc(T.cities[day.city].name)}</span><span>${icon('thermo')} ${day.temp[0]} / +${day.temp[1]} °C</span><span>${icon('sun')} ${day.sun[0]}</span><span>${icon('sunset')} ${day.sun[1]}</span>`)
      + nextCard()
      + (warningsHTML() && day.n <= 4 ? `<div class="stack" style="margin-top:14px">${warningsHTML()}</div>` : '')
      + `<div class="section-title">Bugünün akışı <button data-goday="${day.n}">Ayrıntılar</button></div>
         <div class="card">${timelineHTML(day, { live: true, toggles: true })}</div>`
      + `<div class="section-title">Şimdi ne yapsam? <button data-act="relocate">${state.me ? 'Konumu yenile' : 'Konumuma göre'}</button></div>
         <p class="muted" style="font-size:.88rem;margin:-2px 0 10px">${esc(day.free.when)}: ${esc(day.free.text)}</p>
         ${suggestHTML()}`
      + `<div class="section-title">Günün ipuçları</div><div class="stack">${day.tips.map((t) => `<div class="card card-row" style="align-items:flex-start">${icon('bulb').replace('<svg class=""', '<svg style="width:22px;height:22px;flex:none;color:var(--gold)"')}<p>${esc(t)}</p></div>`).join('')}</div>`
      + `<div class="section-title">Otel</div>
         <button class="card card-row" data-tool="otel" style="width:100%;text-align:left">${icon('bed').replace('<svg class=""', '<svg style="width:26px;height:26px;flex:none;color:var(--accent)"')}<div style="min-width:0"><b>${esc(h.name)}</b><div class="muted" style="font-size:.85rem">${esc(h.address)}</div></div></button>`
      + `<div class="section-title">Araçlar</div>${toolsGrid()}`;
  }

  /* ---------------- Görünüm: PROGRAM ---------------- */
  function viewProgram() {
    const cur = currentDay();
    if (!state.progDay) state.progDay = cur ? cur.n : 1;
    const day = T.days[state.progDay - 1];
    setCityClass(day.city);
    const spent = Object.keys(state.extras).filter((k) => state.extras[k]).reduce((a, k) => a + (T.extras[k].price || 0), 0);
    const fl = day.events.filter((e) => e.ref).map((e) => T.transport.find((t) => t.id === e.ref));
    return `<div class="days" role="tablist">${T.days.map((d) => `<button class="day-btn ${d.city} ${cur && cur.n === d.n ? 'today' : ''}" data-day="${d.n}" aria-current="${d.n === day.n}"><b>${d.n}</b><small>${fmtDate(d.date, false).replace(' Kasım', ' Kas')}</small></button>`).join('')}</div>`
      + `<section class="hero" style="margin-top:10px">
          <div class="hero-eyebrow">${day.n}. gün · ${fmtDate(day.date)} · ${esc(T.cities[day.city].name)}</div>
          <h1>${esc(day.title)}</h1><p class="hero-lead">${esc(day.lead)}</p>
          <div class="hero-meta"><span>${icon('thermo')} ${day.temp[0]} / +${day.temp[1]} °C</span><span>${icon('sun')} ${day.sun[0]}</span><span>${icon('sunset')} ${day.sun[1]}</span></div>
          ${skyline(day.city)}
        </section>`
      + `<div class="card" style="margin-top:14px">${timelineHTML(day, { toggles: true, live: !!cur && cur.n === day.n })}</div>`
      + (fl.length ? `<div class="section-title">Bu günün bileti</div><div class="stack">${fl.map(passHTML).join('')}</div>` : '')
      + `<div class="section-title">Serbest zaman önerileri · ${esc(day.free.when)}</div>
         <p class="muted" style="font-size:.92rem;margin-bottom:10px">${esc(day.free.text)}</p>
         <div class="place-list">${day.free.picks.map(placeById).filter(Boolean).map((p) => placeCard(p)).join('')}</div>`
      + `<div class="section-title">İpuçları</div><div class="stack">${day.tips.map((t) => `<div class="card">${esc(t)}</div>`).join('')}</div>`
      + `<div class="section-title">Ekstra turlar bütçesi</div>
         <div class="card"><div class="stat-row">
           <div class="stat"><small>Seçili</small><b>${Object.values(state.extras).filter(Boolean).length} tur</b></div>
           <div class="stat"><small>Toplam</small><b>${spent} €</b></div>
           <div class="stat"><small>Hepsi</small><b>${Object.values(T.extras).reduce((a, x) => a + (x.price || 0), 0)} €</b></div>
         </div><p class="muted" style="font-size:.82rem;margin-top:10px">Aldığınız turları “Bu turu aldım” ile işaretleyin; Bugün ekranı ve geri sayım buna göre değişir. Ekstra turlar ve müze girişleri tur fiyatına dahil değildir.</p></div>`
      + `<div class="section-title">Fiyata dahil</div>
         <div class="card"><ul style="margin:0;padding-left:18px;display:grid;gap:4px;font-size:.92rem">
           <li>THY ekonomi uçuşlar, havalimanı vergileri</li><li>St. Petersburg’da 3, Moskova’da 2 gece 4* otel + kahvaltı</li><li>Program kapsamındaki transferler ve St. Petersburg – Moskova tren bileti</li><li>İki şehirde panoramik şehir turları (araçtan, 2–3 saat)</li><li>Türkçe tur liderliği ve zorunlu seyahat sigortası</li>
         </ul><p class="muted" style="font-size:.82rem;margin-top:8px">Dahil değil: öğle ve akşam yemekleri, müze girişleri, şehir vergileri, kişisel harcamalar, yurt dışı çıkış harcı.</p></div>`;
  }

  function passHTML(t) {
    const info = state.docs && state.docs.info;
    const dp = msk(new Date(t.dep + ':00+03:00')), ap = msk(new Date(t.arr + ':00+03:00'));
    const hh = (p) => `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`;
    const codes = { tk401: ['IST', 'LED'], tk416: ['VKO', 'IST'], tren: ['СПб', 'МСК'] }[t.id];
    let fields;
    if (t.kind === 'train') {
      fields = [['Tren', '741 Aurora'], ['Vagon', info ? info.trainCar : '••'], ['Koltuk', info ? info.trainSeat : '•••']];
    } else {
      fields = [['Uçuş', t.code], ['PNR', info ? info.pnr : '••••••'], ['Bagaj', '23 kg']];
    }
    return `<article class="pass ${t.kind}">
      <div class="pass-top"><span>${t.kind === 'train' ? 'RZD · Ekspres tren' : 'Türk Hava Yolları'}</span><b>${esc(t.code)}</b></div>
      <div class="pass-route">
        <div><div class="pass-code">${codes[0]}</div><div class="pass-place">${esc(t.from)}</div></div>
        ${icon(t.kind === 'train' ? 'train' : 'plane', 'pass-plane')}
        <div class="r"><div class="pass-code">${codes[1]}</div><div class="pass-place">${esc(t.to)}</div></div>
      </div>
      <div class="pass-times"><div><b>${hh(dp)}</b><span>${dp.d} ${TR_MON[dp.m]} ${TR_DAYS[dp.wd]}</span></div><div><b>${hh(ap)}</b><span>${ap.d} ${TR_MON[ap.m]} ${TR_DAYS[ap.wd]}</span></div></div>
      <div class="pass-perf"></div>
      <div class="pass-fields">${fields.map(([k, v]) => `<div><small>${k}</small><b class="${info || !/•/.test(v) ? '' : 'locked'}">${esc(v)}</b></div>`).join('')}</div>
      ${t.kind === 'train' && info ? `<div class="pass-note">${esc(info.trainSeatNote)}</div>` : ''}
      <div class="pass-note">${esc(t.note)}</div>
    </article>`;
  }

  /* ---------------- Görünüm: KEŞFET ---------------- */
  function viewExplore() {
    if (!state.city) state.city = activeCity();
    setCityClass(state.city);
    const cats = Object.keys(T.categories).filter((c) => T.places.some((p) => p.city === state.city && p.cat === c));
    const q = state.exploreQuery.trim().toLocaleLowerCase('tr');
    let list = T.places.filter((p) => p.city === state.city);
    if (state.exploreCat === 'fav') list = list.filter((p) => state.favs[p.id]);
    else if (state.exploreCat !== 'hepsi') list = list.filter((p) => p.cat === state.exploreCat);
    if (q) list = list.filter((p) => (p.name + ' ' + p.ru + ' ' + p.desc).toLocaleLowerCase('tr').includes(q));
    const ref = state.me || hotel(state.city);
    if (ref && ref.lat != null) list = list.slice().sort((a, b) => distKm(ref, a) - distKm(ref, b));
    return `<div class="seg" role="group" aria-label="Şehir">
        <button data-city="spb" aria-pressed="${state.city === 'spb'}">St. Petersburg</button>
        <button data-city="msk" aria-pressed="${state.city === 'msk'}">Moskova</button>
      </div>
      <div class="search">${icon('search')}<input class="input" id="exploreSearch" type="search" placeholder="Ara: müze, borş, metro…" value="${esc(state.exploreQuery)}" autocomplete="off"></div>
      <div class="chips" style="margin-top:12px">
        <button class="chip" data-cat="hepsi" aria-pressed="${state.exploreCat === 'hepsi'}">Hepsi</button>
        <button class="chip" data-cat="fav" aria-pressed="${state.exploreCat === 'fav'}">★ Favoriler</button>
        ${cats.map((c) => `<button class="chip" data-cat="${c}" aria-pressed="${state.exploreCat === c}">${esc(T.categories[c].label)}</button>`).join('')}
      </div>
      <div class="section-title">${list.length} yer · ${state.me ? 'size en yakından' : 'otele en yakından'} <button data-act="relocate">${icon('locate').replace('<svg class=""', '<svg style="width:15px;height:15px;vertical-align:-3px"')} Konumum</button></div>
      <div class="place-list" id="exploreList">${list.map((p) => placeCard(p)).join('') || '<p class="empty">Bu filtrede yer yok.</p>'}</div>
      <div class="section-title">Pratik bilgiler</div>
      <div class="stack">${T.tips.map((t) => `<div class="card"><b>${esc(t.t)}</b><p class="muted" style="margin-top:4px">${esc(t.d)}</p></div>`).join('')}</div>`;
  }

  /* ---------------- Görünüm: BELGELER ---------------- */
  function viewDocs() {
    setCityClass(activeCity());
    const unlocked = !!state.docs;
    const info = unlocked ? state.docs.info : null;
    let html = `<div class="section-title" style="margin-top:18px">Biletler</div><div class="stack">${T.transport.map(passHTML).join('')}</div>`;
    if (!unlocked) {
      html += `<div class="section-title">Kişisel belgeler</div>
        <form class="card unlock" id="unlockForm">
          <div class="card-row">${icon('lock').replace('<svg class=""', '<svg style="width:28px;height:28px;flex:none;color:var(--gold)"')}<p style="font-size:.92rem">Bilet, vize ve sigorta belgeleriniz şifreli olarak telefonda duruyor. Açmak için size verilen parolayı girin. İnternet gerekmez.</p></div>
          <div class="field"><label for="pass">Parola</label><input class="input" id="pass" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" required></div>
          <label class="check" for="remember"><input type="checkbox" id="remember" checked> Bu cihazda hatırla</label>
          <button class="btn primary block" type="submit" id="unlockBtn">${icon('unlock')} Belgeleri aç</button>
          <p class="muted" id="unlockMsg" style="font-size:.85rem" role="alert"></p>
        </form>`;
      return html;
    }
    html += `<div class="stack" style="margin-top:14px">${warningsHTML()}</div>`;
    html += `<div class="section-title">Belgeler <button data-act="lock">Kilitle</button></div>
      <div class="doc-list">${state.docs.docs.map((d, i) => `<button class="doc" data-doc="${i}"><div class="doc-thumb"><img src="${d.images[0]}" alt=""></div><div class="doc-meta"><b>${esc(d.title)}</b><small>${esc(d.subtitle)}</small></div></button>`).join('')}</div>
      <div class="section-title">Hızlı bilgiler</div>
      <div class="card"><dl class="kv">
        <dt>Yolcu</dt><dd>${esc(info.name)}</dd>
        <dt>Pasaport</dt><dd>${esc(info.passport)} <button class="copy" data-copy="${esc(info.passport)}">Kopyala</button></dd>
        <dt>PNR</dt><dd>${esc(info.pnr)} <button class="copy" data-copy="${esc(info.pnr)}">Kopyala</button></dd>
        <dt>E-bilet</dt><dd>${esc(info.ticketNo)}</dd>
        <dt>Tren sipariş</dt><dd>${esc(info.trainOrder)}</dd>
        <dt>Vagon / koltuk</dt><dd>${esc(info.trainCar)} / ${esc(info.trainSeat)}</dd>
        <dt>E-vize no</dt><dd>${esc(info.visaId)}</dd>
        <dt>Vize başvuru</dt><dd>${esc(info.visaApp)}</dd>
        <dt>Vize geçerlilik</dt><dd>${esc(info.visaValid)}</dd>
        <dt>Sigorta poliçe</dt><dd>${esc(info.insuranceNo)}</dd>
        <dt>Sigorta süresi</dt><dd>${esc(info.insuranceValid)}</dd>
      </dl></div>
      <p class="muted" style="font-size:.82rem;margin-top:12px">Sınırda ve havayolunda basılı e-vize bildirimi istenebilir; telefondaki kopya yedek içindir.</p>`;
    return html;
  }
  function b64d(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  async function decryptDocs(pass) {
    const enc = await (await fetch('data/belgeler.enc.json')).json();
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64d(enc.salt), iterations: enc.iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(enc.iv) }, key, b64d(enc.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  function openDoc(i) {
    const d = state.docs.docs[i];
    openSheet(`<h2>${esc(d.title)}</h2><p class="muted" style="margin:4px 0 12px">${esc(d.subtitle)}</p>
      <div class="btn-row" style="margin-bottom:12px">
        <button class="btn primary" data-act="pdf">${icon('ext')} PDF’i aç</button>
        <button class="btn" data-act="share">${icon('share')} Paylaş / Kaydet</button>
        <button class="btn" data-act="zoom">${icon('search')} Yakınlaştır</button>
      </div>
      <div class="viewer-pages">${d.images.map((src) => `<div class="page"><img src="${src}" alt="${esc(d.title)} sayfası"></div>`).join('')}</div>
      ${d.images.length === 2 && d.id === 'sigorta' ? '<p class="muted" style="font-size:.82rem;margin-top:8px">Poliçenin ilk 2 sayfası gösteriliyor; 13 sayfanın tamamı PDF’te.</p>' : ''}`, (root) => {
      const blob = () => new Blob([b64d(d.pdf)], { type: 'application/pdf' });
      root.querySelector('[data-act=pdf]').onclick = () => {
        const url = URL.createObjectURL(blob());
        const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      };
      root.querySelector('[data-act=share]').onclick = async () => {
        const file = new File([blob()], d.pdfName || 'belge.pdf', { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: d.title }); } catch (e) { /* vazgeçildi */ }
        } else toast('Paylaşım desteklenmiyor; “PDF’i aç” deneyin');
      };
      root.querySelector('[data-act=zoom]').onclick = () => root.querySelector('.viewer-pages').classList.toggle('zoom');
    });
  }

  /* ---------------- Görünüm: HARİTA ---------------- */
  let map = null, layers = null, meMarker = null;
  const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
  const gridTile = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e9eeec"/><path d="M0 0H256M0 0V256" stroke="#d2dbd8" stroke-width="2"/></svg>');
  function viewMap() {
    if (!state.city) state.city = activeCity();
    setCityClass(state.city);
    return `<div class="map-wrap">
      <div id="map" role="application" aria-label="Harita"></div>
      <div class="map-tools">
        <div class="seg" role="group" aria-label="Şehir"><button data-city="spb" aria-pressed="${state.city === 'spb'}">St. Petersburg</button><button data-city="msk" aria-pressed="${state.city === 'msk'}">Moskova</button></div>
      </div>
      <div class="map-fab">
        <button class="fab" data-act="offline" aria-label="Çevrimdışı harita">${icon('download')}</button>
        <button class="fab" data-act="hotel" aria-label="Otelim">${icon('bed')}</button>
        <button class="fab" data-act="me" aria-label="Konumum">${icon('locate')}</button>
      </div>
      <div class="map-status" id="mapStatus">${navigator.onLine ? 'Harita çevrimiçi' : 'Çevrimdışı: indirilen kareler gösteriliyor'}</div>
    </div>`;
  }
  function pinIcon(p, kind) {
    const cls = kind === 'hotel' ? 'hotel' : p.city;
    const ic = kind === 'hotel' ? 'bed' : (T.categories[p.cat] || {}).icon || 'pin';
    return L.divIcon({ className: '', html: `<div class="pin ${cls} ${state.favs[p.id] ? 'fav' : ''}">${icon(ic)}</div>`, iconSize: [32, 32], iconAnchor: [16, 32] });
  }
  function mountMap() {
    if (typeof L === 'undefined') { $('#mapStatus').textContent = 'Harita kütüphanesi yüklenemedi'; return; }
    const c = T.cities[state.city];
    map = L.map('map', { zoomControl: false, attributionControl: true, tap: true }).setView(c.center, c.zoom);
    L.tileLayer(TILE_URL, { maxZoom: 19, minZoom: 9, tileSize: 256, errorTileUrl: gridTile, crossOrigin: true,
      attribution: 'Harita © Esri, HERE, Garmin, © OpenStreetMap katkıcıları', className: 'tiles' }).addTo(map);
    layers = L.layerGroup().addTo(map);
    T.places.filter((p) => p.city === state.city).forEach((p) => {
      L.marker([p.lat, p.lon], { icon: pinIcon(p), title: p.name }).addTo(layers).on('click', () => openPlace(p.id));
    });
    const h = hotel(state.city);
    if (h.lat != null) L.marker([h.lat, h.lon], { icon: pinIcon({ city: state.city, id: 'hotel' }, 'hotel'), title: 'Otel', zIndexOffset: 500 }).addTo(layers).on('click', () => openTool('otel'));
    if (state.me) drawMe();
    if (state.mapFocus) { const p = placeById(state.mapFocus); if (p) map.setView([p.lat, p.lon], 16); state.mapFocus = null; }
    setTimeout(() => map && map.invalidateSize(), 60);
  }
  function drawMe() {
    if (!map || !state.me) return;
    if (meMarker) meMarker.remove();
    meMarker = L.marker([state.me.lat, state.me.lon], { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 1000 }).addTo(map);
  }
  const html = document.documentElement;
  function applyTheme() {
    const t = store.get('theme', 'auto');
    if (t === 'auto') html.removeAttribute('data-theme'); else html.setAttribute('data-theme', t);
    const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    let s = document.getElementById('tileFilter');
    if (!s) { s = document.createElement('style'); s.id = 'tileFilter'; document.head.appendChild(s); }
    s.textContent = dark ? '.tiles{filter:invert(1) hue-rotate(180deg) brightness(.92) contrast(.9) saturate(.6)}' : '';
  }

  /* Çevrimdışı harita indirme: seçili bölgeler, sınırlı yakınlaştırma seviyeleri */
  const AREAS = {
    spb: [
      { n: 'Şehir geneli', b: [59.80, 30.15, 60.00, 30.50], z: [10, 13] },
      { n: 'Tarihi merkez', b: [59.915, 30.275, 59.962, 30.375], z: [14, 16] },
      { n: 'Otel çevresi', b: [59.826, 30.305, 59.858, 30.338], z: [14, 16] },
      { n: 'Peterhof', b: [59.877, 29.895, 59.892, 29.925], z: [14, 16] },
      { n: 'Puşkin', b: [59.708, 30.380, 59.724, 30.410], z: [14, 16] }
    ],
    msk: [
      { n: 'Şehir geneli', b: [55.58, 37.25, 55.86, 37.80], z: [10, 12] },
      { n: 'Merkez', b: [55.725, 37.570, 55.782, 37.665], z: [13, 16] },
      { n: 'Serçe Tepeleri – Novodeviçi', b: [55.698, 37.525, 55.733, 37.565], z: [14, 15] },
      { n: 'Moscow City', b: [55.744, 37.527, 55.753, 37.547], z: [14, 15] },
      { n: 'İzmailovo', b: [55.787, 37.738, 55.800, 37.760], z: [14, 16] },
      { n: 'VDNH', b: [55.818, 37.618, 55.836, 37.648], z: [14, 15] }
    ]
  };
  function tileXY(lat, lon, z) {
    const n = 2 ** z, x = Math.floor((lon + 180) / 360 * n);
    const r = lat * Math.PI / 180, y = Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n);
    return [x, y];
  }
  function tileList(city) {
    const out = new Set();
    AREAS[city].forEach((a) => {
      for (let z = a.z[0]; z <= a.z[1]; z++) {
        const [x0, y0] = tileXY(a.b[2], a.b[1], z), [x1, y1] = tileXY(a.b[0], a.b[3], z);
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.add(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`);
      }
    });
    return Array.from(out);
  }
  async function runPool(urls, worker, onProgress, conc = 6) {
    let i = 0, done = 0, fail = 0;
    const next = async () => {
      while (i < urls.length) {
        const u = urls[i++];
        try { await worker(u); } catch (e) { fail++; }
        done++; onProgress(done, fail);
      }
    };
    await Promise.all(Array.from({ length: conc }, next));
    return { done, fail };
  }
  async function cacheUrl(cacheName, url, opts) {
    const c = await caches.open(cacheName);
    if (await c.match(url)) return;
    const r = await fetch(url, opts);
    if (!r.ok && r.type !== 'opaque') throw new Error(r.status);
    await c.put(url, r);
  }
  function offlineCard() {
    const st = store.get('offline2', {});
    const ok = st.spb && st.msk && st.photos;
    return `<div class="section-title">Çevrimdışı kullanım</div>
      <div class="card"><div class="card-row" style="align-items:flex-start">${icon(ok ? 'check' : 'download').replace('<svg class=""', `<svg style="width:26px;height:26px;flex:none;color:${ok ? 'var(--ok)' : 'var(--gold)'}"`)}
        <div style="min-width:0"><b>${ok ? 'Haritalar ve fotoğraflar telefonda' : 'Wi-Fi’dayken çevrimdışı hazırlayın'}</b>
        <p class="muted" style="font-size:.88rem;margin-top:2px">${ok ? 'İnternet olmadan da harita, fotoğraf ve belgeler açılır.' : 'Rusya’da mobil internet kesilebilir. Haritaları (≈15–25 MB) ve fotoğrafları şimdi indirin.'}</p></div></div>
        <button class="btn ${ok ? '' : 'gold'} block" data-tool="offline" style="margin-top:12px">${icon('download')} ${ok ? 'Durumu gör / güncelle' : 'Çevrimdışı hazırla'}</button></div>`;
  }
  function openOffline() {
    const st = store.get('offline2', {});
    const counts = { spb: tileList('spb').length, msk: tileList('msk').length };
    const photoTitles = Array.from(new Set(T.places.map((p) => p.wiki).filter(Boolean)));
    openSheet(`<h2>Çevrimdışı hazırla</h2>
      <p class="muted" style="margin:6px 0 14px">Uygulamanın kendisi, programınız, Rusça ifadeler ve şifreli belgeleriniz zaten telefonda. Buradan harita karelerini ve yer fotoğraflarını da indirin. Wi-Fi’dayken yapın.</p>
      <div class="stack">
        ${['spb', 'msk'].map((c) => `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><b>${T.cities[c].name} haritası</b><span class="badge ${st[c] ? '' : 'off'}">${st[c] ? 'İndirildi' : `${counts[c]} kare`}</span></div>
          <p class="muted" style="font-size:.85rem;margin:4px 0 10px">${AREAS[c].map((a) => a.n).join(' · ')}</p>
          <div class="progress"><i id="prog-${c}" style="width:${st[c] ? 100 : 0}%"></i></div><p class="muted" id="msg-${c}" style="font-size:.8rem;margin-top:6px"></p>
          <button class="btn block" data-dl="${c}" style="margin-top:8px">${icon('download')} ${st[c] ? 'Yeniden indir' : 'İndir'}</button></div>`).join('')}
        <div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><b>Yer fotoğrafları</b><span class="badge ${st.photos ? '' : 'off'}">${st.photos ? 'İndirildi' : `${photoTitles.length} fotoğraf`}</span></div>
          <p class="muted" style="font-size:.85rem;margin:4px 0 10px">Wikipedia’dan, yaklaşık 3–5 MB.</p>
          <div class="progress"><i id="prog-photos" style="width:${st.photos ? 100 : 0}%"></i></div><p class="muted" id="msg-photos" style="font-size:.8rem;margin-top:6px"></p>
          <button class="btn block" data-dl="photos" style="margin-top:8px">${icon('download')} ${st.photos ? 'Yeniden indir' : 'İndir'}</button></div>
        <button class="btn gold block" data-dl="all">${icon('download')} Hepsini indir</button>
        <p class="muted" style="font-size:.8rem">Harita © Esri, HERE, Garmin ve OpenStreetMap katkıcıları. iPhone’da uygulamayı Ana Ekran’a ekleyip oradan açarsanız indirilenler kalıcı olur.</p>
      </div>`, (root) => {
      const dl = async (what) => {
        if (!('caches' in window)) { toast('Bu tarayıcı çevrimdışı önbelleği desteklemiyor'); return; }
        if (!navigator.onLine) { toast('İnternet bağlantısı gerekli'); return; }
        const bar = root.querySelector('#prog-' + what), msg = root.querySelector('#msg-' + what);
        if (what === 'photos') {
          let n = 0;
          const res = await runPool(photoTitles, async (t) => {
            const info = await wikiInfo(t);
            if (info && info.src) await cacheUrl('nk-photos', info.src, { mode: 'cors' });
          }, (d, f) => { n = d; bar.style.width = `${d / photoTitles.length * 100}%`; msg.textContent = `${d} / ${photoTitles.length}${f ? ` · ${f} alınamadı` : ''}`; }, 4);
          void n;
          st.photos = res.fail < photoTitles.length / 2; store.set('offline2', st);
          msg.textContent = st.photos ? `Tamam · ${res.done - res.fail} fotoğraf kaydedildi` : 'Fotoğraflar indirilemedi. Bağlantıyı kontrol edin.';
          return;
        }
        const urls = tileList(what);
        const res = await runPool(urls, (u) => cacheUrl('nk-tiles', u, { mode: 'cors' }), (d, f) => { bar.style.width = `${d / urls.length * 100}%`; msg.textContent = `${d} / ${urls.length}${f ? ` · ${f} hata` : ''}`; });
        st[what] = res.fail < urls.length * 0.05; store.set('offline2', st);
        msg.textContent = st[what] ? 'Tamam · harita telefonda' : `${res.fail} kare indirilemedi; tekrar deneyin.`;
      };
      $$('[data-dl]', root).forEach((b) => b.onclick = async () => {
        b.disabled = true;
        if (b.dataset.dl === 'all') { await dl('spb'); await dl('msk'); await dl('photos'); } else await dl(b.dataset.dl);
        b.disabled = false; render();
      });
    });
  }

  /* ---------------- Araçlar ---------------- */
  function openTool(name) {
    if (name === 'offline') return openOffline();
    if (name === 'menu') {
      const th = store.get('theme', 'auto');
      return openSheet(`<h2>Araçlar</h2>
        <div class="tool-grid" style="margin-top:14px">
          <button class="tool" data-tool="doviz">${icon('coins')}Döviz</button>
          <button class="tool" data-tool="rusca">${icon('lang')}Rusça</button>
          <button class="tool" data-tool="acil">${icon('sos')}Acil</button>
          <button class="tool" data-tool="valiz">${icon('case')}Valiz</button>
          <button class="tool" data-tool="otel">${icon('bed')}Oteller</button>
          <button class="tool" data-tool="ipucu">${icon('bulb')}İpuçları</button>
          <button class="tool" data-tool="offline">${icon('download')}Çevrimdışı</button>
          <button class="tool" data-tool="kur">${icon('phone')}Kurulum</button>
        </div>
        <div class="section-title">Görünüm</div>
        <div class="chips">${[['auto', 'Otomatik'], ['light', 'Açık'], ['dark', 'Koyu']].map(([k, l]) => `<button class="chip" data-theme-set="${k}" aria-pressed="${th === k}">${l}</button>`).join('')}</div>
        <div class="section-title">Hakkında</div>
        <p class="muted" style="font-size:.88rem">Program, saatler ve belgeler 9 Kasım 2026’da size iletilen belgelerden hazırlanmıştır. Uçuş ve tren saatleri biletlerden alınmıştır. Mekan saatleri yaklaşıktır.</p>`, (root) => {
        $$('[data-theme-set]', root).forEach((b) => b.onclick = () => { store.set('theme', b.dataset.themeSet); applyTheme(); openTool('menu'); render(); });
      });
    }
    if (name === 'doviz') {
      const r = state.rates;
      const cur = ['RUB', 'TRY', 'EUR', 'USD'];
      return openSheet(`<h2>Döviz çevirici</h2>
        <p class="muted" style="margin:6px 0 14px">Bir kutuya yazın, diğerleri hesaplanır. Kurları bozdurduğunuz yerdeki değere göre güncelleyin.</p>
        <div class="card fx">${cur.map((c) => `<div class="fx-row"><label for="fx-${c}">${c}</label><input class="input" id="fx-${c}" inputmode="decimal" data-cur="${c}"></div>`).join('')}</div>
        <div class="section-title">Kurlar (1 EUR =)</div>
        <div class="rates">${['RUB', 'TRY', 'USD'].map((c) => `<div class="field"><label for="rate-${c}">${c}</label><input class="input mono" id="rate-${c}" inputmode="decimal" data-rate="${c}" value="${r[c]}"></div>`).join('')}</div>
        <p class="muted" style="font-size:.8rem;margin-top:8px">${r.updated ? `Son güncelleme: ${esc(r.updated)}` : 'Varsayılan tahmini kurlar. Lütfen güncelleyin.'}</p>
        <div class="section-title">Hızlı fiyat rehberi</div>
        <div class="list" style="font-size:.92rem">${[100, 500, 1000, 2500, 5000].map((v) => `<div style="display:flex;justify-content:space-between"><span class="mono">${v.toLocaleString('tr-TR')} ₽</span><span class="mono">≈ ${(v / r.RUB * r.TRY).toFixed(0)} ₺ · ${(v / r.RUB).toFixed(1).replace('.', ',')} €</span></div>`).join('')}</div>`, (root) => {
        const parse = (v) => parseFloat(String(v).replace(',', '.'));
        const fmt = (v, c) => isFinite(v) ? (c === 'RUB' || c === 'TRY' ? Math.round(v).toString() : v.toFixed(2)) : '';
        const fill = (from, val) => { const eur = val / state.rates[from]; cur.forEach((c) => { if (c !== from) root.querySelector('#fx-' + c).value = fmt(eur * state.rates[c], c); }); };
        $$('[data-cur]', root).forEach((i) => i.oninput = () => { const v = parse(i.value); if (isFinite(v)) fill(i.dataset.cur, v); });
        $$('[data-rate]', root).forEach((i) => i.onchange = () => { const v = parse(i.value); if (isFinite(v) && v > 0) { state.rates[i.dataset.rate] = v; state.rates.updated = new Date().toLocaleDateString('tr-TR'); store.set('rates', state.rates); openTool('doviz'); } });
        root.querySelector('#fx-RUB').value = '1000'; fill('RUB', 1000);
      });
    }
    if (name === 'rusca') {
      const groups = Array.from(new Set(T.phrases.map((p) => p.g)));
      return openSheet(`<h2>Rusça cep rehberi</h2>
        <p class="muted" style="margin:6px 0 4px">Bir ifadeye dokunun: büyük harflerle gösterilir ve sesli okunabilir.</p>
        ${groups.map((g) => `<div class="section-title">${esc(g)}</div><div class="list">${T.phrases.filter((p) => p.g === g).map((p) => `<button class="phrase" data-ru="${esc(p.ru)}" data-tr="${esc(p.tr)}"><span class="tr">${esc(p.tr)}</span><span class="ruw ru" lang="ru">${esc(p.ru)}</span><span class="say">${esc(p.say)}</span><span class="spk" data-speak="${esc(p.ru)}">${icon('speaker')}</span></button>`).join('')}</div>`).join('')}
        <div class="section-title">Tabelalar</div>
        <div class="list">${T.signs.map(([ru, tr]) => `<div style="display:flex;justify-content:space-between;gap:10px"><b class="ru" lang="ru">${esc(ru)}</b><span class="muted">${esc(tr)}</span></div>`).join('')}</div>
        <div class="section-title">Kiril alfabesi</div>
        <div class="alpha">${T.alphabet.map(([a, b]) => `<div><b class="ru">${a}</b><span>${b}</span></div>`).join('')}</div>`, (root) => {
        $$('.phrase', root).forEach((b) => b.onclick = (ev) => { if (ev.target.closest('[data-speak]')) { speak(b.dataset.ru); return; } showBig(b.dataset.ru, b.dataset.tr); });
      });
    }
    if (name === 'acil') {
      const hs = hotel('spb'), hm = hotel('msk');
      return openSheet(`<h2>Acil durum</h2>
        <div class="list" style="margin-top:14px">${T.emergency.map((e) => `<div><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div style="min-width:0"><b>${esc(e.label)}</b>${e.note ? `<div class="muted" style="font-size:.82rem">${esc(e.note)}</div>` : ''}</div><a class="btn" href="tel:${e.num.replace(/\s/g, '')}" style="flex:none">${icon('phone')} <span class="mono">${esc(e.num)}</span></a></div></div>`).join('')}</div>
        <p class="muted" style="font-size:.85rem;margin-top:10px">${esc(T.embassy)}</p>
        <div class="section-title">Otel adresleri (taksi için)</div>
        <div class="stack">${[hs, hm].map((h) => `<button class="card" data-big="${esc(h.ru)}" style="text-align:left;width:100%"><b>${esc(h.name)}</b><div class="ru" lang="ru" style="font-size:1.05rem;margin-top:4px">${esc(h.ru)}</div><div class="muted" style="font-size:.8rem;margin-top:4px">Dokunun: büyük yazı</div></button>`).join('')}</div>
        <div class="section-title">Pasaportu kaybederseniz</div>
        <ol style="margin:0;padding-left:20px;display:grid;gap:6px;font-size:.92rem"><li>Rehberinize haber verin.</li><li>En yakın polise kayıp tutanağı tutturun (Полиция).</li><li>Konsolosluk Çağrı Merkezi’ni arayın; Moskova Büyükelçiliği’nden Pasaport Yerine Geçen Belge alınır.</li><li>Belgeler sekmesindeki pasaport ve vize bilgileri işlemi hızlandırır.</li></ol>`, (root) => {
        $$('[data-big]', root).forEach((b) => b.onclick = () => showBig(b.dataset.big, 'Otel adresi'));
      });
    }
    if (name === 'valiz') {
      const render2 = () => openTool('valiz');
      return openSheet(`<h2>Valiz ve hazırlık</h2>
        ${T.checklist.map((g) => `<div class="section-title">${esc(g.g)}</div><div class="list">${g.items.map((it) => `<label class="cl-item ${state.checklist[it] ? 'done' : ''}"><input type="checkbox" data-item="${esc(it)}" ${state.checklist[it] ? 'checked' : ''}><span>${esc(it)}</span></label>`).join('')}</div>`).join('')}
        <button class="btn block" data-reset style="margin-top:16px">Listeyi sıfırla</button>`, (root) => {
        $$('[data-item]', root).forEach((c) => c.onchange = () => { state.checklist[c.dataset.item] = c.checked; store.set('checklist', state.checklist); c.closest('.cl-item').classList.toggle('done', c.checked); render(); });
        root.querySelector('[data-reset]').onclick = () => { state.checklist = {}; store.set('checklist', {}); render2(); render(); };
      });
    }
    if (name === 'ipucu') {
      return openSheet(`<h2>Pratik bilgiler</h2><div class="stack" style="margin-top:14px">${T.tips.map((t) => `<div class="card"><b>${esc(t.t)}</b><p class="muted" style="margin-top:4px">${esc(t.d)}</p></div>`).join('')}</div>`);
    }
    if (name === 'kur') {
      return openSheet(`<h2>iPhone’a kurulum</h2>
        <ol style="margin:14px 0 0;padding-left:20px;display:grid;gap:10px">
          <li>Bu sayfayı <b>Safari</b> ile açın.</li>
          <li>Alttaki <b>Paylaş</b> düğmesine ${icon('share').replace('<svg class=""', '<svg style="width:16px;height:16px;vertical-align:-3px"')} dokunun.</li>
          <li><b>Ana Ekrana Ekle</b>’yi seçin, sonra <b>Ekle</b>.</li>
          <li>Ana ekrandaki <b>Neva&amp;Kremlin</b> simgesinden açın.</li>
          <li>Wi-Fi’dayken Araçlar → <b>Çevrimdışı</b> → <b>Hepsini indir</b>.</li>
          <li>Belgeler sekmesinde parolanızı girip <b>Bu cihazda hatırla</b>’yı işaretleyin.</li>
        </ol>
        <p class="muted" style="font-size:.85rem;margin-top:14px">Bundan sonra uygulama internet olmadan da açılır. Güncelleme yayınlanırsa internete bağlıyken uygulamayı açmanız yeterli.</p>`);
    }
    if (name === 'otel') {
      const form = (c) => { const h = hotel(c); return `<div class="card stack" style="gap:10px">
        <b>${T.cities[c].name} · ${esc(h.nights)}</b>
        <div class="field"><label for="hn-${c}">Otel adı</label><input class="input" id="hn-${c}" data-h="${c}" data-k="name" value="${esc(h.name)}"></div>
        <div class="field"><label for="ha-${c}">Adres</label><input class="input" id="ha-${c}" data-h="${c}" data-k="address" value="${esc(h.address)}"></div>
        <div class="field"><label for="hr-${c}">Rusça adres (taksi için)</label><input class="input ru" id="hr-${c}" data-h="${c}" data-k="ru" value="${esc(h.ru)}"></div>
        <p class="muted" style="font-size:.82rem">${h.lat != null ? `Haritadaki konum: ${h.lat.toFixed(4)}, ${h.lon.toFixed(4)}` : 'Konum henüz kayıtlı değil.'} ${h.metro ? '· ' + esc(h.metro) : ''}</p>
        <div class="btn-row"><button class="btn" data-here="${c}">${icon('locate')} Otelde konumumu kaydet</button><button class="btn" data-big="${esc(h.ru)}">Taksiciye göster</button></div>
      </div>`; };
      return openSheet(`<h2>Oteller</h2><p class="muted" style="margin:6px 0 14px">Acente kesin otelleri hareketten 48 saat önce bildirir. Farklıysa buradan güncelleyin. Otele vardığınızda “konumumu kaydet”e dokunun; öneriler ve mesafeler buna göre hesaplanır.</p>
        <div class="stack">${form('spb')}${form('msk')}</div>`, (root) => {
        $$('[data-h]', root).forEach((i) => i.onchange = () => { const c = i.dataset.h; state.hotels[c] = Object.assign({}, state.hotels[c], { [i.dataset.k]: i.value }); store.set('hotels', state.hotels); toast('Kaydedildi'); render(); });
        $$('[data-here]', root).forEach((b) => b.onclick = () => locateMe((me) => { const c = b.dataset.here; state.hotels[c] = Object.assign({}, state.hotels[c], { lat: me.lat, lon: me.lon }); store.set('hotels', state.hotels); toast('Otel konumu kaydedildi'); openTool('otel'); render(); }));
        $$('[data-big]', root).forEach((b) => b.onclick = () => showBig(b.dataset.big, 'Otel adresi'));
      });
    }
  }

  /* ---------------- Yönlendirme ve olaylar ---------------- */
  const VIEWS = { bugun: viewToday, program: viewProgram, harita: viewMap, kesfet: viewExplore, belgeler: viewDocs };
  function go(tab) { if (location.hash !== '#' + tab) location.hash = tab; else render(); }
  function render() {
    const tab = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'bugun';
    state.tab = tab;
    if (map) { map.remove(); map = null; meMarker = null; }
    const v = $('#view');
    v.classList.toggle('full', tab === 'harita');
    v.innerHTML = VIEWS[tab]();
    $$('#tabbar button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
    const d = currentDay();
    $('#brandSub').textContent = d ? `${d.n}. gün · ${fmtDate(d.date)} · ${T.cities[d.city].name}` : 'St. Petersburg · Moskova · 10–15 Kasım';
    if (tab === 'harita') mountMap();
    hydratePhotos(v);
    if (tab === 'belgeler' && !state.docs) bindUnlock();
  }
  function bindUnlock() {
    const f = $('#unlockForm'); if (!f) return;
    f.onsubmit = async (ev) => {
      ev.preventDefault();
      const pass = $('#pass').value.trim(), msg = $('#unlockMsg'), btn = $('#unlockBtn');
      btn.disabled = true; msg.textContent = 'Açılıyor…';
      try {
        state.docs = await decryptDocs(pass);
        if ($('#remember').checked) store.set('pass', pass);
        toast('Belgeler açıldı'); render();
      } catch (e) {
        msg.textContent = 'Parola hatalı. Büyük-küçük harf ve tireleri kontrol edin.';
        btn.disabled = false;
      }
    };
  }

  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('button, a'); if (!t) return;
    if (t.closest('[data-close]') && t.matches('[data-close]')) return;
    if (t.dataset.tab) { go(t.dataset.tab); return; }
    if (t.dataset.place) { openPlace(t.dataset.place); return; }
    if (t.dataset.tool) { openTool(t.dataset.tool); return; }
    if (t.dataset.day) { state.progDay = +t.dataset.day; render(); window.scrollTo(0, 0); return; }
    if (t.dataset.goday) { state.progDay = +t.dataset.goday; go('program'); return; }
    if (t.dataset.extra) { const id = t.dataset.extra; state.extras[id] = !state.extras[id]; if (!state.extras[id]) delete state.extras[id]; store.set('extras', state.extras); render(); return; }
    if (t.dataset.doc) { openDoc(+t.dataset.doc); return; }
    if (t.dataset.copy) { copyText(t.dataset.copy); return; }
    if (t.dataset.cat) { state.exploreCat = t.dataset.cat; render(); return; }
    if (t.dataset.city && !t.closest('.sheet')) { state.city = t.dataset.city; render(); return; }
    const act = t.dataset.act;
    if (act === 'relocate') { locateMe(() => { toast('Konum alındı'); render(); }); return; }
    if (act === 'lock') { state.docs = null; store.del('pass'); render(); return; }
    if (act === 'offline') { openOffline(); return; }
    if (act === 'hotel' && map) { const h = hotel(state.city); if (h.lat != null) map.setView([h.lat, h.lon], 16); else openTool('otel'); return; }
    if (act === 'me' && map) { locateMe((me) => { drawMe(); map.setView([me.lat, me.lon], 16); }); return; }
  });
  $$('#sheetWrap [data-close]').forEach((el) => el.addEventListener('click', closeSheet));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'exploreSearch') {
      state.exploreQuery = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const i = $('#exploreSearch'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) { /* */ } }
    }
  });
  window.addEventListener('hashchange', () => { closeSheet(); render(); window.scrollTo(0, 0); });
  const updateNet = () => { $('#netPill').hidden = navigator.onLine; };
  window.addEventListener('online', updateNet); window.addEventListener('offline', updateNet);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  // Geri sayımı dakikada bir güncelle
  setInterval(() => {
    $$('[data-count]').forEach((el) => { const ms = +el.dataset.count - now(); el.firstChild.textContent = dur(ms); });
  }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.tab !== 'harita') render(); });

  /* ---------------- Başlangıç ---------------- */
  $('.brand-mark').innerHTML = brandMark;
  $('#btnTools').innerHTML = icon('grid');
  $('#btnTools').onclick = () => openTool('menu');
  $$('#tabbar [data-icon]').forEach((s) => { s.innerHTML = icon(s.dataset.icon); });
  applyTheme(); updateNet();
  render();

  const saved = store.get('pass', null);
  if (saved) decryptDocs(saved).then((d) => { state.docs = d; render(); }).catch(() => store.del('pass'));

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
    navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => { /* çevrimdışı önbellek kullanılamıyor */ });
  }
})();
