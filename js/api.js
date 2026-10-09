// ============================================
// API — komunikasi dengan Google Apps Script
// ============================================
const API = { latency: 0, token: sessionStorage.getItem('bs_token') || '', onSessionExpired: null };

function apiReady() {
  return typeof GAS_URL === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(GAS_URL);
}

async function apiFetch(url, options) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  const t0 = performance.now();
  try {
    const res = await fetch(url, Object.assign({ signal: ctrl.signal, redirect: 'follow' }, options));
    const json = await res.json();
    API.latency = Math.round(performance.now() - t0);
    if (!json.success) {
      const err = new Error(json.message || 'Terjadi kesalahan pada server.');
      if (/^Sesi admin berakhir/.test(err.message) && API.onSessionExpired) API.onSessionExpired();
      throw err;
    }
    return json;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Server terlalu lama merespons. Coba lagi.');
    if (err instanceof TypeError) throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// GET → mengembalikan json.data
async function apiGet(action, params) {
  const q = new URLSearchParams(Object.assign({ action }, params || {}));
  const json = await apiFetch(`${GAS_URL}?${q.toString()}`);
  return json.data;
}

// POST → mengembalikan json penuh ({success, message, data})
async function apiPost(action, data) {
  return apiFetch(GAS_URL, {
    method: 'POST',
    // WAJIB text/plain agar tidak memicu CORS preflight yang ditolak GAS
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token: API.token || undefined, data: data || {} })
  });
}

function setToken(t) {
  API.token = t || '';
  if (t) sessionStorage.setItem('bs_token', t); else sessionStorage.removeItem('bs_token');
}
