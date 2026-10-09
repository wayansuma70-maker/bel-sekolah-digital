'use strict';
// ============================================
// BEL SEKOLAH DIGITAL — Frontend (vanilla JS)
// ============================================

// ---------- Utilitas ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const EN_ID = { Sunday: 'Minggu', Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu' };
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const KAT_LABEL = { akademik: 'Akademik', istirahat: 'Istirahat', ekskul: 'Ekstrakurikuler' };
const ZONA_LABEL = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' };

const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', print: '<path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 17H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/>',
  play: '<path d="M6 4l14 8-14 8z"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>', download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>', mute: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17h.01"/>', power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
  note: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>'
};
const ico = (n, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

// ---------- State ----------
const S = {
  page: 'jadwal', pub: null, offset: 0, tz: 'Asia/Jakarta', liveKey: '', live: null, clockDiff: 0,
  audio: { armed: false, muted: false, volume: Number(localStorage.getItem('bs_vol') || 100) / 100, ctx: null, urls: {}, wake: null, keep: null },
  fired: {}, ringing: null, todayLog: [], sig: '',
  riwayat: { rows: null, logEmail: [], jumlah: 0, q: '', status: 'Semua', dari: '', sampai: '', asc: false, limit: 50 },
  berkas: null,
  admin: { tab: 'jadwal', hari: 'Semua', edit: null, editLibur: null, data: null }
};

// ---------- Waktu (zona waktu sekolah) ----------
let _fmt = { tz: null, f: null };
function nowParts() {
  const t = new Date(Date.now() + S.offset);
  if (_fmt.tz !== S.tz) {
    _fmt = { tz: S.tz, f: new Intl.DateTimeFormat('en-GB', { timeZone: S.tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'long', hourCycle: 'h23' }) };
  }
  const p = {};
  _fmt.f.formatToParts(t).forEach(x => { p[x.type] = x.value; });
  return { tanggal: `${p.year}-${p.month}-${p.day}`, hari: EN_ID[p.weekday], detik: (+p.hour) * 3600 + (+p.minute) * 60 + (+p.second), jam: `${p.hour}:${p.minute}`, jam_s: `${p.hour}:${p.minute}:${p.second}` };
}
const tzLabel = () => ZONA_LABEL[S.tz] || '';
const toSec = jam => (+jam.slice(0, 2)) * 3600 + (+jam.slice(3, 5)) * 60;
const pad = n => String(n).padStart(2, '0');
const fmtHMS = s => `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
function tglIndo(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${+m[3]} ${BULAN[+m[2] - 1]} ${m[1]}` : (iso || ''); }
function tglPendek(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${+m[3]} ${BULAN_S[+m[2] - 1]} ${m[1]}` : (iso || ''); }
function tambahHari(iso, n) { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d + n)); return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`; }

// ---------- Akses data ----------
const jadwalHari = h => ((S.pub && S.pub.jadwal) || []).filter(j => j.hari === h).sort((a, b) => a.jam < b.jam ? -1 : a.jam > b.jam ? 1 : 0);
const liburOn = t => ((S.pub && S.pub.libur) || []).find(l => l.tanggal_mulai <= t && t <= l.tanggal_selesai);
function suaraNama(id) {
  const list = (S.pub && S.pub.suara) || [];
  const s = list.find(x => x.id === id) || list.find(x => x.default === 'ya');
  return s ? s.nama : 'Nada bawaan';
}
const nextBell = (bells, np, libur) => libur ? null : (bells.find(b => b.aktif !== 'tidak' && toSec(b.jam) > np.detik) || null);

// ---------- UI umum ----------
let _toastT;
function toast(msg, type) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast show ' + (type || '');
  clearTimeout(_toastT); _toastT = setTimeout(() => t.classList.remove('show'), 3800);
}
async function withBusy(btn, fn) {
  if (!btn) return fn();
  if (btn.classList.contains('icon-btn')) { btn.disabled = true; try { return await fn(); } finally { btn.disabled = false; } }
  const old = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Memproses…';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = old; }
}
function setGas(ok, label) {
  const b = $('#gasBadge');
  b.className = 'pill ' + (ok ? 'pill-ok' : 'pill-bad');
  b.textContent = label || (ok ? 'GAS ONLINE' : 'GAS OFFLINE');
}
const loader = t => `<div class="loader"><span class="spin"></span><span>${esc(t || 'Memuat…')}</span></div>`;
function badge(st) {
  const m = {
    selesai: ['pill-mute', ico('check', 12) + ' Selesai'], berikutnya: ['pill-warn', '<span class="dot pulse"></span> Bel Berikutnya'],
    terjadwal: ['pill-ok', ico('check', 12) + ' Terjadwal'], nonaktif: ['pill-mute', 'Dinonaktifkan'], libur: ['pill-bad', 'Dilewati Libur'],
    Berbunyi: ['pill-ok', '<span class="dot"></span> Berbunyi'], 'Dilewati Libur': ['pill-warn', 'Dilewati Libur'], Gagal: ['pill-bad', 'Gagal']
  }[st] || ['pill-mute', esc(st)];
  return `<span class="pill ${m[0]}">${m[1]}</span>`;
}

// ---------- Memuat data ----------
async function loadPub() {
  try {
    const t0 = Date.now();
    const d = await apiGet('getPublic');
    const t1 = Date.now();
    S.pub = d; S.tz = (d.settings && d.settings.zona_waktu) || S.tz;
    // Koreksi hanya jika jam perangkat melenceng jauh (>30 detik) dari server
    const diff = d.now.epoch - (t0 + t1) / 2;
    S.clockDiff = diff; S.offset = Math.abs(diff) > 30000 ? diff : 0;
    try { localStorage.setItem('bs_pub', JSON.stringify(d)); } catch (e) {}
    const sig = JSON.stringify((d.suara || []).map(s => s.id + s.default));
    if (sig !== S.sig) { clearAudioCache(); S.sig = sig; }
    $('#schoolName').textContent = d.settings.nama_sekolah || '';
    document.title = 'Bel ' + (d.settings.nama_sekolah || 'Sekolah');
    setGas(true); flushOutbox();
    return true;
  } catch (err) {
    if (!S.pub) {
      try { const c = localStorage.getItem('bs_pub'); if (c) { S.pub = JSON.parse(c); S.tz = S.pub.settings.zona_waktu || S.tz; $('#schoolName').textContent = S.pub.settings.nama_sekolah || ''; } } catch (e) {}
    }
    setGas(false, S.pub ? 'OFFLINE · DATA TERSIMPAN' : 'GAS OFFLINE');
    return false;
  }
}
async function loadRiwayat() {
  const d = await apiGet('getRiwayat');
  S.riwayat.rows = d.riwayat; S.riwayat.logEmail = d.logEmail; S.riwayat.jumlah = d.jumlahPenerima;
}
async function loadBerkas() { S.berkas = await apiGet('getBerkas'); }

// ============================================
// MESIN BEL (audio)
// ============================================
function clearAudioCache() { Object.values(S.audio.urls).forEach(u => { if (u) URL.revokeObjectURL(u); }); S.audio.urls = {}; }
function b64ToBlob(b64, mime) { const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Blob([u8], { type: mime }); }
async function getAudioUrl(id) {
  const key = id || 'default';
  if (key in S.audio.urls) return S.audio.urls[key];
  const d = await apiGet('getAudio', id ? { id } : {});
  const url = d ? URL.createObjectURL(b64ToBlob(d.base64, d.mime)) : null;
  S.audio.urls[key] = url;
  return url;
}
async function preloadAudio() {
  const np = nowParts(); const ids = new Set(['']);
  jadwalHari(np.hari).forEach(b => ids.add(b.id_suara || ''));
  await Promise.all([...ids].map(i => getAudioUrl(i).catch(() => {})));
}
function ensureCtx() {
  if (!S.audio.ctx) { const AC = window.AudioContext || window.webkitAudioContext; S.audio.ctx = new AC(); }
  return S.audio.ctx;
}
function synthBell() { // nada bawaan bila belum ada file suara
  const ctx = ensureCtx(); if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime + 0.02;
  [659.25, 523.25, 587.33, 392.0].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + i * 0.7;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.6 * S.audio.volume), t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.7);
  });
}
async function playBell(id) {
  let url = null;
  try { url = await getAudioUrl(id); } catch (e) {}
  if (url) { const a = new Audio(url); a.volume = S.audio.volume; await a.play(); return; }
  synthBell();
}
function silentWavUrl() {
  const n = 8000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  new Uint8Array(buf, 44).fill(128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
async function requestWake() {
  try {
    if ('wakeLock' in navigator && !S.audio.wake) {
      S.audio.wake = await navigator.wakeLock.request('screen');
      S.audio.wake.addEventListener('release', () => { S.audio.wake = null; });
    }
  } catch (e) {}
}
async function arm() {
  const ctx = ensureCtx(); await ctx.resume();
  // Audio senyap berulang agar browser tidak "menidurkan" tab saat di latar belakang
  if (!S.audio.keep) { const a = new Audio(silentWavUrl()); a.loop = true; S.audio.keep = a; }
  try { await S.audio.keep.play(); } catch (e) {}
  S.audio.armed = true; await requestWake();
  toast('Audio bel aktif. Biarkan halaman ini terbuka.', 'ok');
  render(); preloadAudio().catch(() => {});
}
function disarm() {
  S.audio.armed = false;
  if (S.audio.keep) S.audio.keep.pause();
  if (S.audio.wake) { S.audio.wake.release(); S.audio.wake = null; }
  render();
}

// Riwayat & antrean kirim
function catat(b, np, status) {
  const rec = { tanggal: np.tanggal, hari: np.hari, jam: b.jam, keterangan: b.keterangan, suara: suaraNama(b.id_suara), status };
  S.todayLog.unshift(Object.assign({ waktu: np.tanggal + ' ' + np.jam_s }, rec));
  sendCatat(rec);
}
async function sendCatat(rec) {
  try { await apiPost('catatBel', rec); }
  catch (e) {
    const q = JSON.parse(localStorage.getItem('bs_outbox') || '[]'); q.push(rec);
    localStorage.setItem('bs_outbox', JSON.stringify(q.slice(-50)));
  }
}
async function flushOutbox() {
  const q = JSON.parse(localStorage.getItem('bs_outbox') || '[]');
  if (!q.length) return;
  localStorage.setItem('bs_outbox', '[]');
  for (const r of q) await sendCatat(r);
}
function loadFired() {
  try { const f = JSON.parse(localStorage.getItem('bs_fired') || '{}'); if (f.tanggal === nowParts().tanggal) S.fired = f.keys || {}; } catch (e) {}
}
const saveFired = t => { try { localStorage.setItem('bs_fired', JSON.stringify({ tanggal: t, keys: S.fired })); } catch (e) {} };

function ringCheck(np) {
  if (!S.audio.armed || !S.pub) return;
  const libur = liburOn(np.tanggal);
  for (const b of jadwalHari(np.hari)) {
    if (b.aktif === 'tidak') continue;
    const diff = np.detik - toSec(b.jam);
    if (diff < 0 || diff > 45) continue;
    const key = np.tanggal + '|' + b.id;
    if (S.fired[key]) continue;
    S.fired[key] = 1; saveFired(np.tanggal);
    if (libur) { catat(b, np, 'Dilewati Libur'); continue; }
    if (S.audio.muted) continue;
    fireBell(b, np);
  }
}
async function fireBell(b, np) {
  S.ringing = { nama: b.keterangan, jam: b.jam, until: Date.now() + 12000 };
  try { await playBell(b.id_suara); catat(b, np, 'Berbunyi'); }
  catch (e) { catat(b, np, 'Gagal'); toast('Bel gagal berbunyi: ' + e.message, 'error'); }
}

// ============================================
// HALAMAN: JADWAL HARI INI
// ============================================
function heroCard(np, libur, bells) {
  const st = (S.pub.settings) || {};
  const [y, m, d] = np.tanggal.split('-').map(Number);
  return `<section class="card hl">
    <div class="row between">
      <span class="pill ${libur ? 'pill-bad' : bells.length ? 'pill-ok' : 'pill-mute'}"><span class="dot"></span>${libur ? 'HARI LIBUR' : bells.length ? 'HARI SEKOLAH AKTIF' : 'TIDAK ADA JADWAL'}</span>
      <span class="small muted">${esc(st.semester || '')} · TA ${esc(st.tahun_ajaran || '')}</span>
    </div>
    <h1 style="margin-top:14px;font-size:22px;line-height:28px">${np.hari}, ${d} ${BULAN[m - 1]} ${y}</h1>
    ${libur ? `<p class="small" style="color:var(--rose-fg);margin-top:4px">${esc(libur.keterangan)}</p>` : ''}
    <div class="clock-big num" style="margin-top:6px"><span id="clk">${np.jam_s}</span><small>${tzLabel()}</small></div>
  </section>`;
}
function nextCard(nb, libur, bells) {
  if (libur) return `<section class="banner rose">${ico('cal', 22)}<div><strong>Bel tidak berbunyi hari ini.</strong><div class="small">${esc(libur.keterangan)}</div></div></section>`;
  if (!nb) return `<section class="card"><div class="empty">${bells.length ? 'Semua bel hari ini sudah selesai.' : 'Belum ada jadwal bel untuk hari ini.'}</div></section>`;
  return `<section class="card bell-card" id="nextCard">
    <span class="pill pill-warn"><span class="dot pulse"></span>BEL BERIKUTNYA</span>
    <div class="row" style="margin-top:10px;align-items:baseline"><span class="countdown num" id="cd">--:--:--</span><span class="small muted">menuju bel</span></div>
    <h2 style="margin-top:4px;font-size:22px;line-height:28px">${esc(nb.keterangan)}</h2>
    <div class="row" style="margin-top:8px"><span class="pill pill-info num">${esc(nb.jam)} ${tzLabel()}</span><span class="small muted">${KAT_LABEL[nb.kategori] || ''}</span></div>
    <div class="tl-sound">${ico('note', 14)}<span>${esc(suaraNama(nb.id_suara))}</span></div>
  </section>`;
}
function timeline(bells, np, libur, nb) {
  if (!bells.length) return `<div class="card"><div class="empty">Belum ada jadwal bel untuk hari ${np.hari}.</div></div>`;
  return `<div class="tl">${bells.map(b => {
    let st = 'terjadwal';
    if (b.aktif === 'tidak') st = 'nonaktif'; else if (libur) st = 'libur'; else if (toSec(b.jam) <= np.detik) st = 'selesai'; else if (nb && nb.id === b.id) st = 'berikutnya';
    const struck = st === 'libur' || st === 'nonaktif';
    return `<article class="tl-item cat-${esc(b.kategori)} ${st === 'berikutnya' ? 'next' : ''} ${st === 'selesai' ? 'done' : ''}">
      <div class="tl-time num ${st === 'berikutnya' ? 'next' : ''} ${struck ? 'struck' : ''}">${esc(b.jam)}</div>
      <div><div class="tl-head"><div class="tl-name ${struck ? 'struck' : ''}">${esc(b.keterangan)}</div>${badge(st)}</div>
      <div class="small muted" style="margin-top:2px">${KAT_LABEL[b.kategori] || ''}</div>
      <div class="tl-sound">${ico('note', 14)}<span>${esc(suaraNama(b.id_suara))}</span></div></div></article>`;
  }).join('')}</div>`;
}
function pageJadwal() {
  const np = nowParts(), libur = liburOn(np.tanggal), bells = jadwalHari(np.hari), nb = nextBell(bells, np, libur);
  S.liveKey = np.tanggal + '|' + (nb ? nb.id : '-') + '|' + (libur ? 1 : 0) + '|' + bells.length;
  S.live = nb ? { sec: toSec(nb.jam) } : null;
  return `<div class="cols">
    <div class="stack stack-l">${heroCard(np, libur, bells)}${nextCard(nb, libur, bells)}
      <button class="btn btn-primary btn-block" data-act="pdf-jadwal">${ico('print')} Unduh Jadwal (PDF)</button></div>
    <div class="stack">
      <div class="row between"><h2 class="card-title">Linimasa Jadwal Bel</h2><span class="pill pill-mute">${bells.length} sesi</span></div>
      ${timeline(bells, np, libur, nb)}
      <section class="banner">${ico('mail', 22)}<div class="small">Perubahan jadwal akan dikirim otomatis lewat email kepada guru dan staf yang terdaftar.</div></section>
      <section class="card"><div class="row between"><div class="grow"><strong style="color:var(--ink)">Panel Konfigurasi Pengawas</strong><div class="small muted">Ubah jadwal, hari libur, suara bel, dan berkas.</div></div>
        <button class="btn btn-ghost" data-page="kelola">${API.token ? 'Buka' : 'Masuk (PIN)'}</button></div></section>
    </div></div>`;
}

// ============================================
// HALAMAN: MODE BEL
// ============================================
function logHariIni(tgl) {
  const out = [], seen = new Set();
  const add = r => { const k = [r.tanggal, r.jam, r.keterangan, r.status].join('|'); if (!seen.has(k)) { seen.add(k); out.push(r); } };
  S.todayLog.forEach(add);
  ((S.riwayat.rows) || []).filter(r => r.tanggal === tgl).forEach(add);
  return out.sort((a, b) => (a.waktu || a.jam) < (b.waktu || b.jam) ? 1 : -1);
}
function pageModeBel() {
  const np = nowParts(), libur = liburOn(np.tanggal), bells = jadwalHari(np.hari), nb = nextBell(bells, np, libur), a = S.audio;
  S.liveKey = np.tanggal + '|' + (nb ? nb.id : '-') + '|' + (libur ? 1 : 0) + '|' + bells.length;
  S.live = nb ? { sec: toSec(nb.jam) } : null;
  const logs = logHariIni(np.tanggal).slice(0, 8);
  const sync = Math.abs(S.clockDiff) > 30000
    ? `Jam perangkat berbeda ${Math.round(Math.abs(S.clockDiff) / 1000)} detik dari server — jam dikoreksi otomatis.`
    : 'Jam perangkat sinkron dengan server.';
  return `<div class="cols">
    <div class="stack stack-l">
      <section class="banner">${ico('volume', 22)}<div><strong style="color:var(--ink)">Perangkat Pemutar Audio Bel</strong><div class="small">Hubungkan kabel jack 3.5mm atau Bluetooth perangkat ini ke input amplifier/mixer sekolah.</div></div></section>
      ${a.armed
        ? `<section class="banner green">${ico('check', 22)}<div class="grow"><strong>Audio bel aktif${a.muted ? ' (mode senyap)' : ''}</strong><div class="small">Bel berbunyi otomatis sesuai jadwal selama halaman ini terbuka. Layar ${a.wake ? 'dijaga tetap menyala.' : 'perlu dijaga tetap menyala.'}</div></div><button class="btn btn-ghost btn-sm" data-act="disarm">Nonaktifkan</button></section>`
        : `<section class="banner amber">${ico('alert', 24)}<div class="grow"><strong style="color:var(--ink)">Browser meminta izin sebelum memutar suara</strong><div class="small" style="margin:4px 0 12px">Klik tombol di bawah sekali setiap kali halaman dibuka agar bel dapat berbunyi otomatis di latar belakang.</div>
          <button class="btn btn-primary btn-block" data-act="arm">${ico('power')} Aktifkan Audio Bel</button></div></section>`}
      <div id="ringBox"></div>
      <section class="card">
        <div class="row between"><span class="label-sm">Jam Digital Operasional</span><span class="pill pill-ok">${a.armed ? 'SIAGA' : 'BELUM AKTIF'}</span></div>
        <div class="kiosk" style="margin-top:12px"><div class="clock-big num"><span id="clk">${np.jam_s}</span><small>${tzLabel()}</small></div><div class="small" style="margin-top:6px;color:#CBD5E1">${esc(np.hari)}, ${tglIndo(np.tanggal)}</div></div>
        <p class="small muted" style="margin-top:10px">${ico('info', 14)} ${sync}</p>
      </section>
    </div>
    <div class="stack">
      ${nextCard(nb, libur, bells)}
      <section class="card">
        <div class="row between"><strong style="color:var(--ink)">Kontrol &amp; Uji Suara</strong><span class="small muted num" id="volLbl">Volume ${Math.round(a.volume * 100)}%</span></div>
        <input type="range" id="vol" min="0" max="100" value="${Math.round(a.volume * 100)}" style="margin:14px 0" aria-label="Volume bel">
        <div class="grid2"><button class="btn btn-primary" data-act="test">${ico('play', 16)} Tes Bunyi Bel</button>
          <button class="btn btn-ghost" data-act="mute">${ico(a.muted ? 'volume' : 'mute', 16)} ${a.muted ? 'Matikan Mode Senyap' : 'Mode Senyap'}</button></div>
      </section>
      <section class="card">
        <div class="row between"><h2 class="card-title" style="font-size:16px">Catatan Bunyi Hari Ini</h2><span class="pill pill-ok">LIVE LOG</span></div>
        <div style="margin-top:12px">${S.riwayat.rows === null && !logs.length ? loader('Memuat catatan…') : logs.length ? logs.map(r => `<div class="list-row"><div class="grow"><div class="num" style="font-weight:700;color:var(--navy)">${esc(r.jam)} ${tzLabel()}</div><div class="small">${esc(r.keterangan)}</div></div>${badge(r.status)}</div>`).join('') : '<div class="empty">Belum ada bel berbunyi hari ini.</div>'}</div>
      </section>
      <section class="banner">${ico('power', 22)}<div class="small"><strong style="color:var(--ink)">Tips pengoperasian:</strong> pastikan mode hemat daya dan layar mati (<em>sleep</em>) dinonaktifkan, perangkat tersambung listrik, dan jangan menutup atau meminimalkan jendela ini.</div></section>
    </div></div>`;
}

// ============================================
// HALAMAN: KELOLA (ADMIN)
// ============================================
function pageKelola() {
  if (!API.token) {
    return `<div class="stack" style="max-width:420px;margin:24px auto 0"><section class="card hl">
      <div class="brand-mark" style="margin-bottom:14px">${ico('lock', 22)}</div>
      <h1 style="font-size:22px;line-height:28px">Masuk Admin</h1>
      <p class="muted" style="margin:4px 0 18px">Masukkan PIN untuk mengubah jadwal, hari libur, suara bel, dan berkas.</p>
      <form data-form="login" autocomplete="off"><div class="field"><label class="f" for="pin">PIN / Kata sandi</label><input class="inp" id="pin" name="pin" type="password" required autocomplete="current-password"></div>
      <button class="btn btn-primary btn-block" style="margin-top:16px" type="submit">Masuk</button></form>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" data-page="jadwal">Kembali ke jadwal</button></section></div>`;
  }
  const tabs = [['jadwal', 'Jadwal'], ['libur', 'Hari Libur'], ['suara', 'Suara Bel'], ['berkas', 'Berkas'], ['penerima', 'Penerima Email'], ['pengaturan', 'Pengaturan']];
  return `<div class="stack">
    <section class="banner"><div class="grow"><strong style="color:var(--ink)">Mode Admin Aktif</strong><div class="small">Sesi berakhir otomatis bila tidak ada aktivitas.</div></div><button class="btn btn-ghost btn-sm" data-act="logout">${ico('lock', 14)} Kunci Sesi</button></section>
    <div class="tabs" role="tablist">${tabs.map(t => `<button class="tab ${S.admin.tab === t[0] ? 'on' : ''}" role="tab" data-act="tab" data-id="${t[0]}">${t[1]}</button>`).join('')}</div>
    <div id="adminBody">${adminBody()}</div></div>`;
}
const renderAdminBody = () => { const el = $('#adminBody'); if (el) el.innerHTML = adminBody(); };
function adminBody() {
  switch (S.admin.tab) {
    case 'libur': return tabLibur();
    case 'suara': return tabSuara();
    case 'berkas': return tabBerkas();
    case 'penerima': return tabPenerima();
    case 'pengaturan': return tabPengaturan();
    default: return tabJadwal();
  }
}
const suaraOptions = sel => `<option value="">Suara default (${esc(suaraNama(''))})</option>` + ((S.pub.suara) || []).map(s => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${esc(s.nama)}</option>`).join('');

function tabJadwal() {
  const all = S.pub.jadwal || [], f = S.admin.hari, ed = S.admin.edit;
  const rows = all.filter(j => f === 'Semua' || j.hari === f).sort((a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari) || (a.jam < b.jam ? -1 : 1));
  const preset = f !== 'Semua' ? f : '';
  return `<section class="card" id="formJadwalCard"><div class="card-title">${ico('bell')} ${ed ? 'Ubah Jadwal Bel' : 'Tambah Jadwal Bel'}</div>
    <form data-form="jadwal" style="margin-top:14px" autocomplete="off">
      <div class="field"><label class="f">${ed ? 'Hari' : 'Pilih hari aktif'}</label>
        ${ed ? `<select class="inp" name="hari">${HARI_ORDER.map(h => `<option ${h === ed.hari ? 'selected' : ''}>${h}</option>`).join('')}</select>`
      : `<div class="chips">${HARI_ORDER.slice(0, 6).map(h => `<label class="daychk"><input type="checkbox" name="hari" value="${h}" ${h === preset ? 'checked' : ''}><span>${h.slice(0, 3)}</span></label>`).join('')}</div>`}</div>
      <div class="grid2" style="margin-top:14px">
        <div class="field"><label class="f" for="jam">Jam (24 jam, HH:MM)</label><input class="inp num" id="jam" name="jam" inputmode="numeric" placeholder="07:30" maxlength="5" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" required value="${esc(ed ? ed.jam : '')}"></div>
        <div class="field"><label class="f" for="ket">Keterangan acara / sesi</label><input class="inp" id="ket" name="keterangan" maxlength="80" placeholder="Pelajaran Ke-1" required value="${esc(ed ? ed.keterangan : '')}"></div>
        <div class="field"><label class="f" for="kat">Kategori</label><select class="inp" id="kat" name="kategori">${Object.keys(KAT_LABEL).map(k => `<option value="${k}" ${ed && ed.kategori === k ? 'selected' : ''}>${KAT_LABEL[k]}</option>`).join('')}</select></div>
        <div class="field"><label class="f" for="sn">Suara bel</label><div class="row" style="flex-wrap:nowrap"><select class="inp" id="sn" name="id_suara">${suaraOptions(ed ? ed.id_suara : '')}</select><button type="button" class="btn btn-ghost btn-sm" data-act="uji-form" style="flex:none">${ico('play', 14)} Uji</button></div></div>
      </div>
      <div class="row between" style="margin-top:16px"><label class="row" style="gap:10px"><span class="switch"><input type="checkbox" name="aktif" ${!ed || ed.aktif !== 'tidak' ? 'checked' : ''}><i></i></span> Aktifkan jadwal</label>
        <div class="row">${ed ? '<button type="button" class="btn btn-ghost" data-act="batal-edit">Batal</button>' : ''}<button class="btn btn-primary" type="submit">Simpan</button></div></div>
    </form></section>
    <section><div class="row between" style="margin-bottom:10px"><h2 class="card-title">Daftar Jadwal</h2><span class="pill pill-mute">${rows.length} bel</span></div>
      <div class="chips" style="margin-bottom:14px">${['Semua'].concat(HARI_ORDER).map(h => `<button class="chip ${f === h ? 'on' : ''}" data-act="filter-hari" data-id="${h}">${h}${h === 'Semua' ? '' : ' (' + all.filter(j => j.hari === h).length + ')'}</button>`).join('')}</div>
      ${rows.length ? rows.map(j => `<div class="list-row ${j.aktif === 'tidak' ? 'off' : ''}">
        <div class="time-badge num ${esc(j.kategori)}">${esc(j.jam)}</div>
        <div class="grow"><div class="tl-name ${j.aktif === 'tidak' ? 'struck' : ''}">${esc(j.keterangan)}</div><div class="small muted">${esc(j.hari)} · ${esc(suaraNama(j.id_suara))}</div></div>
        <label class="switch" title="Aktif / nonaktif"><input type="checkbox" data-toggle-jadwal="${esc(j.id)}" ${j.aktif !== 'tidak' ? 'checked' : ''} aria-label="Aktifkan ${esc(j.keterangan)}"><i></i></label>
        <button class="icon-btn" data-act="edit-jadwal" data-id="${esc(j.id)}" aria-label="Ubah ${esc(j.keterangan)}">${ico('edit')}</button>
        <button class="icon-btn danger" data-act="del-jadwal" data-id="${esc(j.id)}" aria-label="Hapus ${esc(j.keterangan)}">${ico('trash')}</button></div>`).join('') : '<div class="card"><div class="empty">Belum ada jadwal untuk pilihan ini.</div></div>'}</section>`;
}
function tabLibur() {
  const ed = S.admin.editLibur, list = (S.pub.libur || []).slice().sort((a, b) => a.tanggal_mulai < b.tanggal_mulai ? -1 : 1);
  return `<section class="card"><div class="card-title">${ico('cal')} ${ed ? 'Ubah Hari Libur' : 'Tambah Hari Libur'}</div>
    <form data-form="libur" style="margin-top:14px"><div class="grid2">
      <div class="field"><label class="f" for="lm">Tanggal mulai</label><input class="inp" id="lm" name="tanggal_mulai" type="date" required value="${esc(ed ? ed.tanggal_mulai : '')}"></div>
      <div class="field"><label class="f" for="ls">Tanggal selesai (kosongkan bila sehari)</label><input class="inp" id="ls" name="tanggal_selesai" type="date" value="${esc(ed && ed.tanggal_selesai !== ed.tanggal_mulai ? ed.tanggal_selesai : '')}"></div></div>
      <div class="field"><label class="f" for="lk">Keterangan</label><input class="inp" id="lk" name="keterangan" maxlength="100" placeholder="Libur Nasional — Hari Suci Nyepi" required value="${esc(ed ? ed.keterangan : '')}"></div>
      <div class="row" style="margin-top:16px;justify-content:flex-end">${ed ? '<button type="button" class="btn btn-ghost" data-act="batal-libur">Batal</button>' : ''}<button class="btn btn-primary" type="submit">Simpan</button></div></form></section>
    <section><h2 class="card-title" style="margin-bottom:10px">Daftar Hari Libur</h2>${list.length ? list.map(l => {
      const [, m, d] = l.tanggal_mulai.split('-').map(Number);
      const rentang = l.tanggal_mulai === l.tanggal_selesai ? tglIndo(l.tanggal_mulai) : `${tglPendek(l.tanggal_mulai)} – ${tglPendek(l.tanggal_selesai)}`;
      return `<div class="list-row"><div class="date-badge num">${d}<small>${BULAN_S[m - 1].toUpperCase()}</small></div><div class="grow"><div class="tl-name">${esc(l.keterangan)}</div><div class="small muted">${esc(rentang)} · bel ditangguhkan otomatis</div></div>
        <button class="icon-btn" data-act="edit-libur" data-id="${esc(l.id)}" aria-label="Ubah">${ico('edit')}</button><button class="icon-btn danger" data-act="del-libur" data-id="${esc(l.id)}" aria-label="Hapus">${ico('trash')}</button></div>`;
    }).join('') : '<div class="card"><div class="empty">Belum ada hari libur terdaftar.</div></div>'}</section>`;
}
function tabSuara() {
  const list = S.pub.suara || [];
  return `<section class="card"><div class="card-title">${ico('note')} Unggah Suara Bel</div>
    <form data-form="suara" style="margin-top:14px"><div class="grid2">
      <div class="field"><label class="f" for="sf">File audio (MP3/WAV/OGG, maks. 2 MB)</label><input class="inp" id="sf" name="file" type="file" accept="audio/*" required></div>
      <div class="field"><label class="f" for="sj">Nama suara</label><input class="inp" id="sj" name="nama" maxlength="60" placeholder="Nada Masuk Kelas"></div></div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn btn-primary" type="submit">${ico('plus', 16)} Unggah</button></div></form></section>
    <section><h2 class="card-title" style="margin-bottom:10px">Daftar Suara</h2>
      <div class="list-row"><div class="grow"><div class="tl-name">Nada bawaan (dibuat browser)</div><div class="small muted">Dipakai bila belum ada suara yang diunggah.</div></div><button class="icon-btn" data-act="play-suara" data-id="__synth" aria-label="Putar nada bawaan">${ico('play')}</button></div>
      ${list.map(s => `<div class="list-row"><div class="grow"><div class="tl-name">${esc(s.nama)}</div><div class="small muted">${s.default === 'ya' ? '<span class="pill pill-ok">DEFAULT</span>' : `<button class="btn btn-ghost btn-sm" data-act="def-suara" data-id="${esc(s.id)}">Jadikan default</button>`}</div></div>
        <button class="icon-btn" data-act="play-suara" data-id="${esc(s.id)}" aria-label="Putar ${esc(s.nama)}">${ico('play')}</button>
        <button class="icon-btn" data-act="ren-suara" data-id="${esc(s.id)}" aria-label="Ubah nama">${ico('edit')}</button>
        <button class="icon-btn danger" data-act="del-suara" data-id="${esc(s.id)}" aria-label="Hapus ${esc(s.nama)}">${ico('trash')}</button></div>`).join('')}</section>`;
}
function berkasList(admin) {
  if (S.berkas === null) return loader('Memuat berkas…');
  if (!S.berkas.length) return '<div class="card"><div class="empty">Belum ada berkas.</div></div>';
  return S.berkas.map(b => `<div class="list-row"><div class="time-badge" style="min-width:44px">${ico('file')}</div>
    <div class="grow"><div class="tl-name">${esc(b.nama)}</div><div class="small muted">${esc(b.jenis)} · ${esc(tglPendek((b.diunggah || '').slice(0, 10)))}</div></div>
    <a class="btn btn-ghost btn-sm" href="${esc(b.url_lihat)}" target="_blank" rel="noopener">Lihat</a>
    <a class="btn btn-primary btn-sm" href="${esc(b.url_unduh)}" target="_blank" rel="noopener">${ico('download', 14)} Unduh</a>
    ${admin ? `<button class="icon-btn danger" data-act="del-berkas" data-id="${esc(b.id)}" aria-label="Hapus ${esc(b.nama)}">${ico('trash')}</button>` : ''}</div>`).join('');
}
function tabBerkas() {
  return `<section class="card"><div class="card-title">${ico('file')} Unggah Foto / PDF Jadwal</div>
    <form data-form="berkas" style="margin-top:14px"><div class="grid2">
      <div class="field"><label class="f" for="bj">Jenis</label><select class="inp" id="bj" name="jenis"><option>PDF</option><option>Foto</option></select></div>
      <div class="field"><label class="f" for="bn">Nama berkas</label><input class="inp" id="bn" name="nama" maxlength="80" placeholder="Jadwal Pelajaran Semester Ganjil"></div></div>
      <div class="field" style="margin-top:14px"><label class="f" for="bf">File (PDF atau gambar, maks. 5 MB)</label><input class="inp" id="bf" name="file" type="file" accept="application/pdf,image/*" required></div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn btn-primary" type="submit">${ico('plus', 16)} Unggah</button></div></form></section>
    <section><h2 class="card-title" style="margin-bottom:10px">Berkas Tersimpan</h2>${berkasList(true)}</section>`;
}
function tabPenerima() {
  const d = S.admin.data;
  if (!d) return loader('Memuat penerima…');
  return `<section class="card"><div class="card-title">${ico('mail')} Tambah Penerima Notifikasi</div>
    <p class="small muted" style="margin-top:4px">Daftar email ini hanya terlihat oleh Admin.</p>
    <form data-form="penerima" style="margin-top:14px"><div class="grid2">
      <div class="field"><label class="f" for="pn">Nama</label><input class="inp" id="pn" name="nama" required maxlength="60"></div>
      <div class="field"><label class="f" for="pe">Email</label><input class="inp" id="pe" name="email" type="email" required></div></div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn btn-primary" type="submit">${ico('plus', 16)} Tambah</button></div></form></section>
    <section class="card"><div class="row between"><div class="grow"><strong style="color:var(--ink)">Notifikasi menunggu: ${d.menunggu} perubahan</strong><div class="small muted">Perubahan dikumpulkan dan dikirim satu email setelah 5 menit.</div></div>
      <button class="btn btn-amber btn-sm" data-act="kirim-notif">${ico('mail', 14)} Kirim sekarang</button></div></section>
    <section><h2 class="card-title" style="margin-bottom:10px">Penerima (${d.penerima.length})</h2>${d.penerima.length ? d.penerima.map(p => `<div class="list-row ${p.aktif === 'tidak' ? 'off' : ''}"><div class="grow"><div class="tl-name">${esc(p.nama)}</div><div class="small muted">${esc(p.email)}</div></div>
      <label class="switch"><input type="checkbox" data-toggle-penerima="${esc(p.id)}" ${p.aktif !== 'tidak' ? 'checked' : ''} aria-label="Aktifkan ${esc(p.nama)}"><i></i></label>
      <button class="icon-btn danger" data-act="del-penerima" data-id="${esc(p.id)}" aria-label="Hapus ${esc(p.nama)}">${ico('trash')}</button></div>`).join('') : '<div class="card"><div class="empty">Belum ada penerima.</div></div>'}</section>`;
}
function tabPengaturan() {
  const s = S.pub.settings || {};
  return `<section class="card"><div class="card-title">Pengaturan Sekolah</div>
    <form data-form="pengaturan" style="margin-top:14px"><div class="field"><label class="f" for="ns">Nama sekolah</label><input class="inp" id="ns" name="nama_sekolah" required value="${esc(s.nama_sekolah)}"></div>
      <div class="grid2" style="margin-top:14px"><div class="field"><label class="f" for="ta">Tahun ajaran</label><input class="inp" id="ta" name="tahun_ajaran" value="${esc(s.tahun_ajaran)}"></div>
      <div class="field"><label class="f" for="sm">Semester</label><input class="inp" id="sm" name="semester" value="${esc(s.semester)}"></div></div>
      <div class="field" style="margin-top:14px"><label class="f" for="zw">Zona waktu sekolah</label><select class="inp" id="zw" name="zona_waktu">${Object.keys(ZONA_LABEL).map(z => `<option value="${z}" ${s.zona_waktu === z ? 'selected' : ''}>${ZONA_LABEL[z]} (${z})</option>`).join('')}</select></div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn btn-primary" type="submit">Simpan</button></div></form></section>
    <section class="card"><div class="card-title">${ico('lock')} Ganti PIN Admin</div>
    <form data-form="pin" style="margin-top:14px" autocomplete="off"><div class="grid2"><div class="field"><label class="f" for="p1">PIN lama</label><input class="inp" id="p1" name="pin_lama" type="password" required></div>
      <div class="field"><label class="f" for="p2">PIN baru (6–20 karakter)</label><input class="inp" id="p2" name="pin_baru" type="password" minlength="6" maxlength="20" required></div></div>
      <div class="field" style="margin-top:14px"><label class="f" for="p3">Ulangi PIN baru</label><input class="inp" id="p3" name="pin_ulang" type="password" required></div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn btn-primary" type="submit">Ganti PIN</button></div></form></section>`;
}

// ============================================
// HALAMAN: RIWAYAT & BERKAS
// ============================================
function filteredRiwayat() {
  const r = S.riwayat, q = r.q.trim().toLowerCase();
  let rows = (r.rows || []).filter(x =>
    (!q || [x.keterangan, x.suara, x.hari, x.status, x.tanggal].join(' ').toLowerCase().includes(q)) &&
    (!r.dari || x.tanggal >= r.dari) && (!r.sampai || x.tanggal <= r.sampai));
  const counts = { Semua: rows.length, Berbunyi: 0, 'Dilewati Libur': 0, Gagal: 0 };
  rows.forEach(x => { if (counts[x.status] !== undefined) counts[x.status]++; });
  if (r.status !== 'Semua') rows = rows.filter(x => x.status === r.status);
  rows.sort((a, b) => { const ka = a.tanggal + a.jam, kb = b.tanggal + b.jam; return r.asc ? (ka < kb ? -1 : 1) : (ka < kb ? 1 : -1); });
  return { rows, counts };
}
function riwayatTable() {
  const { rows, counts } = filteredRiwayat(), r = S.riwayat, shown = rows.slice(0, r.limit);
  const chips = ['Semua', 'Berbunyi', 'Dilewati Libur', 'Gagal'].map(s => `<button class="chip ${r.status === s ? 'on' : ''}" data-act="rw-status" data-id="${s}">${s} (${counts[s]})</button>`).join('');
  const body = shown.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th><button data-act="rw-sort" aria-label="Urutkan waktu">Waktu ${r.asc ? '▲' : '▼'}</button></th><th>Hari</th><th>Keterangan Bel</th><th>Nada</th><th>Status</th></tr></thead><tbody>${shown.map(x =>
    `<tr class="${x.status === 'Dilewati Libur' ? 'st-lib' : x.status === 'Gagal' ? 'st-gagal' : ''}"><td data-label="Waktu" class="num"><strong style="color:var(--ink)">${esc(tglPendek(x.tanggal))}</strong> ${esc(x.jam)}</td><td data-label="Hari">${esc(x.hari)}</td><td data-label="Keterangan">${esc(x.keterangan)}</td><td data-label="Nada">${esc(x.suara)}</td><td data-label="Status">${badge(x.status)}</td></tr>`).join('')}</tbody></table></div>
    ${rows.length > shown.length ? `<button class="btn btn-ghost btn-block" style="margin-top:12px" data-act="rw-more">Tampilkan lebih banyak (${rows.length - shown.length} lagi)</button>` : ''}`
    : '<div class="card"><div class="empty">Tidak ada catatan yang cocok dengan filter.</div></div>';
  return `<div class="chips" style="margin:12px 0">${chips}</div>${body}`;
}
function pageRiwayat() {
  const r = S.riwayat;
  if (r.rows === null) return loader('Memuat riwayat…');
  const np = nowParts(), minggu = tambahHari(np.tanggal, -6);
  if (!r.pdfDari) { r.pdfDari = minggu; r.pdfSampai = np.tanggal; }
  const tujuh = r.rows.filter(x => x.tanggal >= minggu);
  const jml = s => tujuh.filter(x => x.status === s).length;
  return `<div class="stack">
    <section class="card hl"><div class="row"><div class="brand-mark">${ico('file', 22)}</div><div class="grow"><h1 style="font-size:20px;line-height:26px">Riwayat &amp; Berkas Sekolah</h1><div class="small muted">Arsip bel yang berbunyi, dokumen jadwal, dan pemberitahuan email.</div></div></div>
      <div class="grid2" style="margin-top:16px;align-items:end">
        <div class="field"><label class="f" for="pd">Laporan dari tanggal</label><input class="inp" id="pd" type="date" value="${esc(r.pdfDari)}"></div>
        <div class="field"><label class="f" for="ps">Sampai tanggal</label><input class="inp" id="ps" type="date" value="${esc(r.pdfSampai)}"></div></div>
      <div class="grid2" style="margin-top:12px"><button class="btn btn-primary" data-act="pdf-riwayat">${ico('print')} Cetak Laporan Riwayat (PDF)</button><button class="btn btn-ghost" data-act="pdf-jadwal">${ico('print')} Cetak Jadwal (PDF)</button></div></section>
    <div class="stats">
      <div class="stat"><div class="label-sm">Total bunyi</div><div class="v num">${jml('Berbunyi')}</div><div class="small muted">7 hari terakhir</div></div>
      <div class="stat"><div class="label-sm">Dilewati</div><div class="v num" style="color:var(--amber-fg)">${jml('Dilewati Libur')}</div><div class="small muted">karena libur</div></div>
      <div class="stat"><div class="label-sm">Status server</div><div class="v" style="font-size:22px;color:var(--green-fg)">${S.pub ? 'Aktif' : '—'}</div><div class="small muted">Latensi ${API.latency} ms</div></div>
      <div class="stat"><div class="label-sm">Email notif</div><div class="v num">${r.jumlah}</div><div class="small muted">guru &amp; staf terdaftar</div></div></div>
    <section><h2 class="card-title">Log Riwayat Bunyi Bel</h2>
      <div class="grid2" style="margin-top:12px"><div class="field"><label class="f" for="rwQ">Cari</label><input class="inp" id="rwQ" type="search" placeholder="Nama bel, nada, atau tanggal…" value="${esc(r.q)}"></div>
        <div class="grid2"><div class="field"><label class="f" for="rwD">Dari</label><input class="inp" id="rwD" type="date" value="${esc(r.dari)}"></div><div class="field"><label class="f" for="rwS">Sampai</label><input class="inp" id="rwS" type="date" value="${esc(r.sampai)}"></div></div></div>
      <div id="rwTable">${riwayatTable()}</div></section>
    <section><h2 class="card-title" style="margin-bottom:10px">Berkas Resmi &amp; Dokumen Jadwal</h2>${berkasList(false)}</section>
    <section><h2 class="card-title" style="margin-bottom:10px">Log Pengiriman Notifikasi Email</h2>${r.logEmail.length ? r.logEmail.map(l => `<div class="list-row"><div class="grow"><div class="tl-name">${esc(l.ringkasan)}</div><div class="small muted num">${esc(l.waktu)} · ${esc(l.jumlah)} penerima</div></div><span class="pill ${/^Terkirim/.test(l.status) ? 'pill-ok' : 'pill-warn'}">${esc(l.status)}</span></div>`).join('') : '<div class="card"><div class="empty">Belum ada email terkirim.</div></div>'}</section></div>`;
}

// ============================================
// ROUTER & RENDER
// ============================================
const PAGES = { jadwal: pageJadwal, modebel: pageModeBel, kelola: pageKelola, riwayat: pageRiwayat };
function render() {
  $$('.nav-btn').forEach(b => { const on = b.dataset.page === S.page; b.classList.toggle('active', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
  const v = $('#view');
  if (!S.pub) {
    v.innerHTML = `<div class="card" style="max-width:480px;margin:40px auto;text-align:center"><h2 class="card-title" style="justify-content:center">Data belum dapat dimuat</h2><p class="muted" style="margin:8px 0 16px">Periksa koneksi internet, lalu coba lagi. Bila terus gagal, pastikan URL backend di <code>js/config.js</code> sudah benar dan Web App di-deploy dengan akses <em>Anyone</em>.</p><button class="btn btn-primary" data-act="retry">Coba lagi</button></div>`;
    return;
  }
  v.innerHTML = PAGES[S.page]();
}
async function go(page) {
  S.page = page; history.replaceState(null, '', '#' + page);
  render(); window.scrollTo(0, 0);
  try {
    if (page === 'riwayat') { await Promise.all([loadRiwayat(), loadBerkas()]); if (S.page === 'riwayat') render(); }
    if (page === 'modebel' && S.riwayat.rows === null) { await loadRiwayat(); if (S.page === 'modebel') render(); }
    if (page === 'kelola' && API.token) { await adminEnter(); }
  } catch (err) { toast(err.message, 'error'); }
}
async function adminEnter() {
  const t = S.admin.tab;
  if (t === 'penerima') { const r = await apiPost('adminData'); S.admin.data = r.data; renderAdminBody(); }
  if (t === 'berkas') { await loadBerkas(); renderAdminBody(); }
}

// ---------- Tick per detik ----------
function tick() {
  if (!S.pub) return;
  const np = nowParts();
  const clk = $('#clk'); if (clk) clk.textContent = np.jam_s;
  if (S.page === 'jadwal' || S.page === 'modebel') {
    const libur = liburOn(np.tanggal), bells = jadwalHari(np.hari), nb = nextBell(bells, np, libur);
    const key = np.tanggal + '|' + (nb ? nb.id : '-') + '|' + (libur ? 1 : 0) + '|' + bells.length;
    if (key !== S.liveKey) render();
    const cd = $('#cd');
    if (cd && S.live) {
      const diff = Math.max(0, S.live.sec - np.detik); cd.textContent = fmtHMS(diff);
      const soon = diff < 300; cd.classList.toggle('soon', soon); const nc = $('#nextCard'); if (nc) nc.classList.toggle('soon', soon);
    }
  }
  if (S.ringing) {
    const box = $('#ringBox');
    if (Date.now() > S.ringing.until) { S.ringing = null; if (box) box.innerHTML = ''; }
    else if (box && !box.firstChild) box.innerHTML = `<div class="ringing">${ico('bell', 26)}<div>Bel berbunyi: ${esc(S.ringing.nama)}<div class="small" style="font-weight:500">${esc(S.ringing.jam)} ${tzLabel()}</div></div></div>`;
  }
  ringCheck(np);
}
async function refreshAll() {
  const ok = await loadPub();
  if (ok && S.audio.armed) preloadAudio().catch(() => {});
  if (ok && (S.page === 'jadwal' || S.page === 'modebel')) render();
}

// ============================================
// AKSI (klik)
// ============================================
function downloadB64(name, mime, b64) {
  const url = URL.createObjectURL(b64ToBlob(b64, mime));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
async function cetak(btn, jenis, dari, sampai) {
  await withBusy(btn, async () => {
    const r = await apiPost('buatPdf', { jenis, dari, sampai });
    downloadB64(r.data.filename, r.data.mime, r.data.base64);
    toast('PDF berhasil dibuat.', 'ok');
  });
}
function readFile(file, max) {
  return new Promise((res, rej) => {
    if (!file) return rej(new Error('Pilih file terlebih dahulu.'));
    if (file.size > max) return rej(new Error('Ukuran file maksimal ' + Math.round(max / 1048576) + ' MB.'));
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1]);
    fr.onerror = () => rej(new Error('Gagal membaca file.'));
    fr.readAsDataURL(file);
  });
}
async function afterSave(msg, opts) {
  toast(msg, 'ok');
  if (opts && opts.pub) await loadPub();
  if (opts && opts.audio) clearAudioCache();
  renderAdminBody();
}
async function adminAction(el, fn) { return withBusy(el, async () => { try { await fn(); } catch (e) { toast(e.message, 'error'); } }); }

const actions = {
  retry: async () => { await refreshAll(); render(); },
  tab: async (el, id) => { S.admin.tab = id; S.admin.edit = null; S.admin.editLibur = null; render(); try { await adminEnter(); } catch (e) { toast(e.message, 'error'); } },
  'filter-hari': (el, id) => { S.admin.hari = id; renderAdminBody(); },
  logout: async () => { try { await apiPost('logout'); } catch (e) {} setToken(''); S.admin.data = null; toast('Sesi dikunci.'); render(); },
  arm, disarm,
  mute: () => { S.audio.muted = !S.audio.muted; render(); },
  test: async el => { try { await playBell(''); } catch (e) { toast('Tidak dapat memutar suara: ' + e.message, 'error'); } },
  'pdf-jadwal': (el) => cetak(el, 'jadwal'),
  'pdf-riwayat': (el) => cetak(el, 'riwayat', $('#pd').value, $('#ps').value),
  'edit-jadwal': (el, id) => { S.admin.edit = S.pub.jadwal.find(j => j.id === id) || null; renderAdminBody(); $('#formJadwalCard').scrollIntoView({ behavior: 'smooth' }); },
  'batal-edit': () => { S.admin.edit = null; renderAdminBody(); },
  'del-jadwal': (el, id) => { const j = S.pub.jadwal.find(x => x.id === id); if (!confirm(`Hapus jadwal "${j.keterangan}" (${j.hari} ${j.jam})?`)) return; return adminAction(el, async () => { const r = await apiPost('hapusJadwal', { id }); await afterSave(r.message, { pub: true }); }); },
  'uji-form': async () => { try { await playBell($('#sn').value); } catch (e) { toast('Tidak dapat memutar suara: ' + e.message, 'error'); } },
  'edit-libur': (el, id) => { S.admin.editLibur = S.pub.libur.find(l => l.id === id) || null; renderAdminBody(); },
  'batal-libur': () => { S.admin.editLibur = null; renderAdminBody(); },
  'del-libur': (el, id) => { if (!confirm('Hapus hari libur ini?')) return; return adminAction(el, async () => { const r = await apiPost('hapusLibur', { id }); await afterSave(r.message, { pub: true }); }); },
  'play-suara': async (el, id) => { try { if (id === '__synth') synthBell(); else await playBell(id); } catch (e) { toast('Tidak dapat memutar suara: ' + e.message, 'error'); } },
  'def-suara': (el, id) => adminAction(el, async () => { const r = await apiPost('setSuaraDefault', { id }); await afterSave(r.message, { pub: true, audio: true }); }),
  'ren-suara': (el, id) => { const s = S.pub.suara.find(x => x.id === id); const n = prompt('Nama suara baru:', s.nama); if (!n) return; return adminAction(el, async () => { const r = await apiPost('ubahNamaSuara', { id, nama: n }); await afterSave(r.message, { pub: true }); }); },
  'del-suara': (el, id) => { const s = S.pub.suara.find(x => x.id === id); if (!confirm(`Hapus suara "${s.nama}"? Jadwal yang memakainya akan kembali ke suara default.`)) return; return adminAction(el, async () => { const r = await apiPost('hapusSuara', { id }); await afterSave(r.message, { pub: true, audio: true }); }); },
  'del-berkas': (el, id) => { if (!confirm('Hapus berkas ini?')) return; return adminAction(el, async () => { const r = await apiPost('hapusBerkas', { id }); await loadBerkas(); await afterSave(r.message); }); },
  'del-penerima': (el, id) => { if (!confirm('Hapus penerima ini?')) return; return adminAction(el, async () => { const r = await apiPost('hapusPenerima', { id }); const a = await apiPost('adminData'); S.admin.data = a.data; await afterSave(r.message); }); },
  'kirim-notif': el => adminAction(el, async () => { const r = await apiPost('kirimNotifikasi'); const a = await apiPost('adminData'); S.admin.data = a.data; await afterSave(r.message); }),
  'rw-status': (el, id) => { S.riwayat.status = id; S.riwayat.limit = 50; $('#rwTable').innerHTML = riwayatTable(); },
  'rw-sort': () => { S.riwayat.asc = !S.riwayat.asc; $('#rwTable').innerHTML = riwayatTable(); },
  'rw-more': () => { S.riwayat.limit += 50; $('#rwTable').innerHTML = riwayatTable(); }
};
document.addEventListener('click', async e => {
  const nav = e.target.closest('[data-page]');
  if (nav) { go(nav.dataset.page); return; }
  const el = e.target.closest('[data-act]');
  if (!el || !actions[el.dataset.act]) return;
  try { await actions[el.dataset.act](el, el.dataset.id, e); } catch (err) { toast(err.message, 'error'); }
});

// ---------- Formulir ----------
const forms = {
  login: async f => {
    const r = await apiPost('login', { pin: f.pin.value });
    setToken(r.data.token); toast(r.message, 'ok'); render(); await adminEnter();
  },
  jadwal: async f => {
    const fd = new FormData(f), ed = S.admin.edit;
    const data = { jam: String(fd.get('jam')).trim(), keterangan: String(fd.get('keterangan')).trim(), kategori: fd.get('kategori'), id_suara: fd.get('id_suara') || '', aktif: f.elements.aktif.checked };
    if (ed) { data.id = ed.id; data.hari = fd.get('hari'); } else { data.hari = fd.getAll('hari'); if (!data.hari.length) throw new Error('Pilih minimal satu hari.'); }
    const r = await apiPost('simpanJadwal', data);
    S.admin.edit = null; await afterSave(r.message, { pub: true });
  },
  libur: async f => {
    const fd = new FormData(f), ed = S.admin.editLibur;
    const data = { tanggal_mulai: fd.get('tanggal_mulai'), tanggal_selesai: fd.get('tanggal_selesai') || fd.get('tanggal_mulai'), keterangan: String(fd.get('keterangan')).trim() };
    if (ed) data.id = ed.id;
    const r = await apiPost('simpanLibur', data);
    S.admin.editLibur = null; await afterSave(r.message, { pub: true });
  },
  suara: async f => {
    const file = f.elements.file.files[0];
    const base64 = await readFile(file, 2 * 1024 * 1024);
    const r = await apiPost('unggahSuara', { nama: f.elements.nama.value, filename: file.name, mime: file.type, base64 });
    await afterSave(r.message, { pub: true, audio: true });
  },
  berkas: async f => {
    const file = f.elements.file.files[0];
    const base64 = await readFile(file, 5 * 1024 * 1024);
    const r = await apiPost('unggahBerkas', { jenis: f.elements.jenis.value, nama: f.elements.nama.value, filename: file.name, mime: file.type, base64 });
    await loadBerkas(); await afterSave(r.message);
  },
  penerima: async f => {
    const r = await apiPost('simpanPenerima', { nama: f.elements.nama.value, email: f.elements.email.value });
    const a = await apiPost('adminData'); S.admin.data = a.data; await afterSave(r.message);
  },
  pengaturan: async f => {
    const fd = new FormData(f);
    const r = await apiPost('simpanPengaturan', Object.fromEntries(fd.entries()));
    await loadPub(); await afterSave(r.message, {});
  },
  pin: async f => {
    if (f.elements.pin_baru.value !== f.elements.pin_ulang.value) throw new Error('PIN baru dan pengulangannya tidak sama.');
    const r = await apiPost('ubahPin', { pin_lama: f.elements.pin_lama.value, pin_baru: f.elements.pin_baru.value });
    f.reset(); toast(r.message, 'ok');
  }
};
document.addEventListener('submit', async e => {
  const f = e.target, h = forms[f.dataset.form];
  if (!h) return;
  e.preventDefault();
  await withBusy(e.submitter, async () => { try { await h(f); } catch (err) { toast(err.message, 'error'); } });
});

// ---------- Input & perubahan ----------
let _rwT;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('input[name=jam]')) { let v = t.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + ':' + v.slice(2); t.value = v; }
  if (t.id === 'vol') { S.audio.volume = t.value / 100; localStorage.setItem('bs_vol', t.value); const l = $('#volLbl'); if (l) l.textContent = 'Volume ' + t.value + '%'; }
  if (t.id === 'rwQ') { clearTimeout(_rwT); _rwT = setTimeout(() => { S.riwayat.q = t.value; S.riwayat.limit = 50; $('#rwTable').innerHTML = riwayatTable(); }, 200); }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'rwD') { S.riwayat.dari = t.value; $('#rwTable').innerHTML = riwayatTable(); }
  if (t.id === 'rwS') { S.riwayat.sampai = t.value; $('#rwTable').innerHTML = riwayatTable(); }
  if (t.id === 'pd') S.riwayat.pdfDari = t.value;
  if (t.id === 'ps') S.riwayat.pdfSampai = t.value;
  if (t.dataset.toggleJadwal) {
    try { const r = await apiPost('toggleJadwal', { id: t.dataset.toggleJadwal, aktif: t.checked }); await loadPub(); toast(r.message, 'ok'); }
    catch (err) { toast(err.message, 'error'); }
    renderAdminBody();
  }
  if (t.dataset.togglePenerima) {
    try {
      const p = S.admin.data.penerima.find(x => x.id === t.dataset.togglePenerima);
      await apiPost('simpanPenerima', { id: p.id, nama: p.nama, email: p.email, aktif: t.checked });
      const a = await apiPost('adminData'); S.admin.data = a.data;
    } catch (err) { toast(err.message, 'error'); }
    renderAdminBody();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { if (S.audio.armed) requestWake(); tick(); }
});

// ============================================
// BOOT
// ============================================
async function boot() {
  const v = $('#view');
  if (!apiReady()) {
    v.innerHTML = `<div class="card" style="max-width:520px;margin:40px auto"><h2 class="card-title">${ico('alert')} Backend belum dihubungkan</h2><p class="muted" style="margin-top:8px">Buka berkas <code>js/config.js</code>, lalu ganti <code>PASTE_URL_EXEC_DI_SINI</code> dengan URL Web App Google Apps Script (berakhiran <code>/exec</code>). Setelah itu simpan dan unggah ulang ke GitHub.</p></div>`;
    setGas(false, 'BELUM TERHUBUNG');
    return;
  }
  API.onSessionExpired = () => { setToken(''); S.admin.data = null; toast('Sesi admin berakhir. Silakan masuk lagi.', 'error'); if (S.page === 'kelola') render(); };
  v.innerHTML = loader('Memuat jadwal…');
  const h = location.hash.replace('#', '');
  if (PAGES[h]) S.page = h;
  await loadPub();
  loadFired();
  render();
  if (S.page === 'riwayat' || S.page === 'modebel' || (S.page === 'kelola' && API.token)) go(S.page);
  setInterval(tick, 500);
  setInterval(refreshAll, 5 * 60 * 1000);
}
boot();
