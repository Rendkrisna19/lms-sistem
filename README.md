# SISTEM MANAJEMEN PEMBELAJARAN & EVALUASI DIGITAL (LMS BU YULIA)

Dokumen Spesifikasi Kebutuhan Produk (*Product Requirements Document* / PRD) resmi untuk sistem pembelajaran dan evaluasi ujian berbasis web.

---

## 📌 Ringkasan Proyek

- **Klien / Pemilik Sistem:** Ibu Dosen (Ibu Yulia)
- **Role Pengguna:** 
  1. **Guru / Dosen** (Manajemen materi & pembuat ujian)
  2. **Murid / Mahasiswa** (Pengakses materi & peserta ujian)
- **Tech Stack:**
  - **Backend:** Laravel (RESTful API + Sanctum + File Storage Service)
  - **Frontend:** React.js (Vite + Font Poppins + TanStack Query)
- **Aksen Desain & UX:**
  - Palet Warna: **Biru & Putih** (*Clean Academic Theme*)
  - Tipografi: **Poppins** (Google Fonts)
  - Performa: *Fast-loading*, transisi mulus
  - Visual Feedback: **Skeleton Loaders** (bebas spinner kasar) & **Toast Notifications** responsif
  - Pendekatan Desain: **Anti AI-Slop** (ergonomis, fungsional, tanpa elemen hiasan generik)

---

## 📚 Dokumen PRD Resmi

Berikut adalah 2 dokumen PRD inti beserta dokumen panduan arsitektur sistem yang siap dipresentasikan kepada Ibu Yulia:

1. 📄 **[PRD #01: Modul Manajemen & Distribusi Materi Pembelajaran (3 Model Media)](./docs/01-PRD-PEMBELAJARAN-MULTIMEDIA.md)**
   - Model 1: Dokumen (PDF in-app viewer & modul bacaan)
   - Model 2: Rekaman Suara / Audio MP3 (Custom audio player dengan speed control 1x, 1.25x, 1.5x)
   - Model 3: Video Pembelajaran (Responsive player 16:9 anti-distraksi)
   - Tracking progres belajar mahasiswa (*Mark as Completed*)

2. 📄 **[PRD #02: Modul Ujian Pilihan Ganda & Sistem Penilaian Otomatis](./docs/02-PRD-UJIAN-PILIHAN-GANDA-SKORING.md)**
   - Manajemen bank soal pilihan ganda (Opsi A-E, kunci jawaban, pembahasan)
   - Ruang ujian mahasiswa (Floating countdown timer, navigasi nomor soal, auto-save jawaban)
   - Mesin penilaian otomatis instan (*Instant Auto-Grading Engine*)
   - Dashboard rekap nilai kelas untuk Dosen & 1-Klik Ekspor ke Excel (.xlsx)

3. 🛠️ **[Panduan Arsitektur Teknologi & Sistem Desain](./docs/03-DESAIN-SISTEM-DAN-TEKNOLOGI.md)**
   - Arsitektur Laravel API + React.js (Decoupled SPA)
   - Detail sistem token warna biru-putih & tipografi Poppins
   - Spesifikasi komponen Skeleton & aturan Toast Notifications
   - Rencana jadwal pengerjaan proyek (4 minggu milestone)
