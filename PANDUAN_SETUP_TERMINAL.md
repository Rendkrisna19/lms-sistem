# PANDUAN LENGKAP SETUP & PERINTAH TERMINAL
## Cendekia - Platform Belajar & Evaluasi Digital

Dokumen ini memuat seluruh data akun, skema login menggunakan Nomor Induk (NIP & NIS), struktur komponen modular Sidebar dan Header, serta perintah terminal resmi (*CLI commands*) yang telah dijalankan.

---

## 1. Konvensi Nomor Induk Akademik (Bukan Email untuk Login)

- **Untuk Siswa / Murid:** Menggunakan **NIS (Nomor Induk Siswa)**.
- **Untuk Guru / Tenaga Pendidik:** Menggunakan **NIP (Nomor Induk Pegawai)**.

> **Ketentuan Otentikasi:** Form login merupakan form tunggal (*single unified form*) tanpa tab pemisah. Guru maupun Siswa cukup memasukkan Nomor Induk dan Kata Sandi ke dalam form yang sama, dan sistem secara otomatis mengenali perannya.

---

## 2. Akun Resmi di Database (`lms_buk_yulia`)

| Peran (Role) | Nomor Induk (**Input Login**) | Kata Sandi (**Input Login**) | Email Terdaftar (Profil) |
| :--- | :--- | :--- | :--- |
| **Guru / Dosen** | **`198507152010122001`** *(NIP)* | **`password123`** | `admin@gmail.com` |
| **Murid / Siswa** | **`20241001`** *(NIS)* | **`password123`** | `siswa@gmail.com` |

---

## 3. Komponen Modular Sidebar & Header (Inspirasi Mockup Dashboard)

Komponen layout modular ditempatkan di: `frontend/src/components/layout/`
1. **[Sidebar.jsx](file:///d:/FILE%20CLIENT/project-buk%20yulia/frontend/src/components/layout/Sidebar.jsx):**
   - Base Color: Deep Royal Blue (`from-brand-900 via-brand-800 to-brand-950`).
   - Fitur Buka/Tutup (*Collapsible*):
     - **Mode Ringkas (Collapsed):** Hanya menampilkan ikon (`w-20`) dengan tombol aktif berlatar putih bulat.
     - **Mode Lengkap (Expanded):** Menampilkan ikon + teks nama menu + badge keterangan (`w-64`).
   - Ikon Eksternal: 100% menggunakan **Lucide React** (tanpa emoji).
   - Menu dinamis menyesuaikan peran (*Guru* memiliki menu tambahan Rekap Nilai Siswa).
   - Profil mini dan tombol Keluar (*Logout*) di bagian bawah.
2. **[Header.jsx](file:///d:/FILE%20CLIENT/project-buk%20yulia/frontend/src/components/layout/Header.jsx):**
   - Kolom pencarian materi & kuis (`Search` input).
   - Badge informasi Semester Akademik & Penanda Peran (*Guru Pengampu* / *Siswa*).
   - Lonceng notifikasi dengan *pulse indicator*.
   - Avatar mini pengguna.
   - Tombol hamburger untuk tampilan layar ponsel (*mobile drawer*).
3. **Penyatuan Konten Utama (*Seamless Content Attachment*):**
   - Konten dashboard utama menempel langsung ke sisi kanan sidebar (`lg:pl-64` / `lg:pl-20`) tanpa celah kosong mengambang yang canggung, menghadirkan estetika SaaS modern.

---

## 4. Perintah Terminal Menjalankan Server

```bash
# Backend Laravel (Port 8000):
cd backend
php artisan serve --port=8000

# Frontend React Vite (Port 5173):
cd frontend
npm run dev
```
