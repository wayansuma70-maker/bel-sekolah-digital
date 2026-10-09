# 📋 Panduan Instalasi — Bel Sekolah Digital

Arsitektur: **Frontend** (HTML/CSS/JS) di **GitHub Pages** + **Backend** Google Apps Script sebagai REST API (data di Google Sheets, berkas di Drive, email lewat Gmail).

```
Browser guru ──► GitHub Pages (index.html, css/, js/)
                      │  fetch()
                      ▼
              Google Apps Script (/exec)  ──► Sheets • Drive • Gmail
```

Urutan pengerjaan: **A. Backend → B. Isi config.js → C. GitHub Pages → D. Pakai di sekolah**.

---

## A. Backend (Google Apps Script)

1. Buka <https://script.google.com> → **Proyek baru**.
2. Ganti nama berkas `Code.gs` menjadi `Kode`, lalu **hapus isinya** dan tempel seluruh isi berkas `Kode.gs`.
3. Tampilkan manifest: ⚙️ **Project Settings** → centang **Show "appsscript.json" manifest file in editor**. Buka `appsscript.json`, ganti isinya dengan berkas `appsscript.json` yang diberikan, lalu simpan.
4. Jalankan setup **SATU KALI**: dropdown fungsi → pilih `setupAppEnvironment` → ▶ **Run**.
   - Klik **Review permissions** → pilih akun Google Anda → **Advanced** → **Go to … (unsafe)** → **Allow**.
   - Buka **Execution log**. Catat baris **🔑 PIN ADMIN AWAL: xxxxxx**.
   - Cek Google Drive: folder 📁 *Bel Sekolah Digital* dan spreadsheet 🗃️ *Database* sudah terbuat.
   - ⚠️ Jangan menjalankan setup dua kali (kedua kalinya otomatis dibatalkan agar tidak ada data ganda).
5. **Deploy → New deployment → ⚙️ Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Klik **Deploy**, lalu **salin URL** yang berakhiran `/exec`.
6. Setiap kali Anda mengubah kode backend: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.

> Lupa PIN? Jalankan fungsi `resetPinAdmin` di editor, PIN baru muncul di Execution log.

---

## B. Isi alamat backend di frontend

Buka `js/config.js` dan ganti:

```js
const GAS_URL = 'PASTE_URL_EXEC_DI_SINI';
```

dengan URL `/exec` dari langkah A5 (tetap di dalam tanda kutip). **Lakukan ini sebelum push pertama ke GitHub.**

---

## C. Deploy ke GitHub Pages

> **Folder kerja = folder hasil ekstrak ZIP ini (`bel-sekolah-digital`).** Di dalamnya langsung terlihat `index.html`, `css/`, `js/`. Di folder inilah semua perintah `git` dijalankan — jangan masuk lebih dalam dan jangan naik satu tingkat.

1. **Install Git**: <https://git-scm.com/download/win> (Windows, pengaturan default) · Mac: ketik `git --version` di Terminal. Cek: `git --version`.
2. **Buat akun** di <https://github.com> (username menjadi bagian alamat situs: `username.github.io`).
3. **Identitas Git** (sekali saja):
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email-akun-github@contoh.com"
   ```
4. **Buat repository**: github.com → tombol **+** → **New repository** → nama `bel-sekolah-digital` → pilih **Public** → **jangan** centang README/.gitignore/license → **Create repository**.
5. **Buka terminal di folder kerja** (Windows: buka folder di File Explorer → klik address bar → ketik `powershell` → Enter). Pastikan benar:
   ```bash
   dir        # Windows   (Mac/Linux: ls -la)
   ```
   Yang harus tampak: `index.html`, `css`, `js`. Kalau yang tampak hanya folder `bel-sekolah-digital`, masuk dulu dengan `cd bel-sekolah-digital`.
6. **Push pertama** (satu per satu):
   ```bash
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/bel-sekolah-digital.git
   git push -u origin main
   ```
   Saat diminta *password*, tempel **Personal Access Token** (bukan password akun). Cara membuat: <https://github.com/settings/tokens> → **Generate new token (classic)** → centang **repo** → **Generate** → salin token (hanya tampil sekali). Saat menempel token, layar tampak kosong — itu normal.
   *Alternatif tanpa terminal:* **GitHub Desktop** (<https://desktop.github.com>) → Add Local Repository → Publish.
7. **Aktifkan Pages**: repo → **Settings → Pages** → *Source*: **Deploy from a branch** → *Branch*: **main** / **(root)** → **Save**. Tunggu 1–2 menit; alamat situs muncul: `https://USERNAME.github.io/bel-sekolah-digital/`.
8. **Update di kemudian hari** (dari folder kerja yang sama):
   ```bash
   git add .
   git commit -m "Deskripsi perubahan"
   git push
   ```
   Bila tampilan masih lama: **Ctrl+Shift+R**.

> ❗ Jangan upload lewat tombol *Upload files* di web GitHub — struktur folder `css/` dan `js/` akan rusak.

---

## D. Pemakaian di sekolah

**Admin (pegawai ditunjuk)**
1. Buka situs → menu **Kelola** → masuk dengan PIN awal → **Pengaturan**: isi nama sekolah, tahun ajaran, **zona waktu**, lalu **ganti PIN**.
2. **Suara Bel**: unggah file MP3/WAV (maks. 2 MB). Tanpa file, aplikasi memakai nada bawaan.
3. **Jadwal**: ubah/hapus contoh jadwal yang sudah terisi, tambahkan jadwal sendiri. **Hari Libur**: daftarkan libur nasional dan libur sekolah.
4. **Penerima Email**: tambahkan email guru/staf. Setiap perubahan jadwal dikumpulkan lalu dikirim 1 email setelah 5 menit.

**Perangkat bel (satu komputer/laptop di sekolah)**
1. Sambungkan ke speaker/amplifier sekolah dan ke listrik; matikan mode *sleep*.
2. Buka situs → menu **Mode Bel** → klik **Aktifkan Audio Bel** (wajib sekali setiap halaman dibuka — aturan browser).
3. Biarkan jendela terbuka sepanjang jam sekolah (boleh di balik jendela lain, jangan ditutup). Gunakan **Tes Bunyi Bel** untuk mengecek volume.

**Guru**: cukup buka alamat situs untuk melihat jadwal hari ini, riwayat bel, dan mencetak PDF.

---

## E. Pengecekan & masalah umum

| Gejala | Penyebab / solusi |
|---|---|
| Situs menampilkan "Backend belum dihubungkan" | `GAS_URL` di `js/config.js` belum diisi → isi, lalu `git add . && git commit -m "isi config" && git push` |
| "Data belum dapat dimuat" | URL salah, atau deploy belum *Anyone*, atau belum deploy versi terbaru |
| Halaman 404 di GitHub Pages | `index.html` tidak di root repo → push dari folder yang benar (langkah C5) |
| Halaman tanpa warna/gaya | Folder `css/` & `js/` tidak ikut ter-push → ulangi push dari terminal |
| Bel tidak berbunyi | Klik **Aktifkan Audio Bel**; cek volume perangkat & speaker; pastikan hari ini bukan hari libur dan bel berstatus aktif |
| Jam bel meleset | Cek **Pengaturan → Zona waktu** sudah sesuai lokasi sekolah |
| Email tidak terkirim | Belum ada penerima aktif; atau kuota harian Gmail habis (±100 penerima/hari untuk akun Gmail biasa) |
| "Sesi admin berakhir" | Masuk lagi dengan PIN (sesi habis setelah 2 jam tanpa aktivitas) |
| Setelah mengubah `Kode.gs` tidak ada efek | Deploy **New version** (langkah A6) |

**Cadangan data**: sistem membuat salinan spreadsheet otomatis tiap Senin dini hari ke folder 📂 *Cadangan* di Drive (8 salinan terakhir disimpan).
