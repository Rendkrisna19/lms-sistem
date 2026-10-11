# DOKUMEN ARSITEKTUR TEKNOLOGI & SISTEM DESAIN
## Panduan Implementasi: Laravel + React.js, Tema Biru-Putih, Font Poppins, Performa Cepat & Anti AI-Slop

- **Nama Proyek:** Sistem Manajemen Pembelajaran Digital (LMS Bu Yulia)
- **Klien:** Ibu Dosen (Ibu Yulia)
- **Tujuan Dokumen:** Standar teknis arsitektur, panduan antarmuka, dan rencana implementasi pengembangan

---

## 1. Arsitektur Teknologi (Fullstack Decoupled)

Sistem menggunakan pola arsitektur **Modern Decoupled**:
- **Backend:** Laravel 11 / 10 (RESTful API Service)
  - Otentikasi & Autorisasi: Laravel Sanctum (Token-based SPA Authentication).
  - Storage Management: Laravel Disk Local / Public Storage (`storage:link`) untuk file dokumen, rekaman MP3, dan video.
  - Validation: Laravel Form Request Classes untuk validasi tipe file mime-types dan ukuran upload.
  - Export Engine: `maatwebsite/excel` atau native stream CSV generator untuk rekap nilai Bu Yulia.
- **Frontend:** React.js (Vite + React 18)
  - Router: React Router v6.
  - State & Server Cache: TanStack Query (React Query) untuk auto-caching, deduplikasi request, dan performa super cepat.
  - Styling: CSS Modules / Tailwind CSS terkonfigurasi warna kustom (Biru-Putih) + Google Font Poppins.
  - Notifikasi Toast: `sonner` atau `react-hot-toast` (ringan, < 5kB, animasi halus).
  - Icons: `lucide-react` (icon modern, konsisten, tidak berlebihan).

```
   ┌────────────────────────────────────────────────────────┐
   │                  REACT.JS FRONTEND (Vite)              │
   │  • Font Poppins  • Palet Biru-Putih  • Fast Navigation │
   │  • Skeleton Screens  • Toast Floating Notifications    │
   └───────────────────────────┬────────────────────────────┘
                               │ JSON REST API (Sanctum Auth)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  LARAVEL BACKEND API                   │
   │  • Controllers  • Form Requests  • Resource Collections│
   │  • Storage Engine (Doc / Audio / Video)                │
   │  • Auto-Scoring Quiz Engine  • Excel Export Generator  │
   └───────────────────────────┬────────────────────────────┘
                               │ PDO / Eloquent ORM
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  DATABASE (MySQL / PostgreSQL)         │
   │  users | lessons | lesson_contents | quizzes | attempts│
   └────────────────────────────────────────────────────────┘
```

---

## 2. Standar Desain "Anti AI-Slop"

### Apa itu "Anti AI-Slop"?
Sering kali sistem yang di-generate otomatis terkesan murah karena dipenuhi:
- Gradient pelangi acak yang melelahkan mata.
- Kartu-kartu mengambang dengan bayangan berlebihan (*drop shadow*) yang tidak natural.
- Istilah bahasa asing yang tidak konsisten dan tidak sesuai budaya akademik Indonesia.
- Ilustrasi 3D generic kartun yang tidak relevan dengan materi kuliah.

### Prinsip Desain yang Diterapkan:
1. **Academic Clarity:** Ruang baca bersih, kontras teks tinggi, batas visual antar materi tegas dan tertib.
2. **Purposeful Interactions:** Setiap tombol memiliki fungsi nyata. Tidak ada badge atau animasi putar yang hanya sekadar hiasan.
3. **Ergonomi Pengajar & Mahasiswa:** Dosen Bu Yulia dapat mengupload materi hanya dalam 3 langkah mudah. Mahasiswa dapat fokus belajar tanpa distraksi pop-up.

---

## 3. Sistem Desain: Warna & Tipografi

### 3.1. Google Font Poppins
Diintegrasikan langsung pada file index HTML dan konfigurasi CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Poppins', sans-serif;
  color: #0F172A;
  background-color: #F8FAFC;
}
```

### 3.2. Token Palet Warna
- **Warna Utama (Primary Blue):** `#1E40AF` (Navy Royal Blue - memberikan wibawa akademik, formal, dan terpercaya).
- **Warna Aksen (Brand Blue):** `#2563EB` (Bright Blue - untuk tombol aksi utama, link aktif, dan progress bar).
- **Warna Lembut (Surface Light):** `#EFF6FF` (Ice Blue Tint - untuk latar modul audio, badge status, kartu aktif).
- **Latar Belakang (Canvas):** `#FFFFFF` (Pure White) & `#F8FAFC` (Slate Tint).
- **Warna Teks (Typography):**
  - Judul: `#0F172A` (Deep Slate - kontras tajam).
  - Deskripsi/Body: `#334155` (Slate).
  - Teks Sekunder/Waktu: `#64748B` (Muted Slate).
- **Status Notifikasi:**
  - Sukses: `#059669` (Emerald Green)
  - Peringatan: `#D97706` (Amber Warm)
  - Error: `#DC2626` (Crimson Red)

---

## 4. Pola Loading Cepat & Skeleton Screens

Sistem **tidak menggunakan layar putih kosong (blank screen)** ataupun **spinner kaku di tengah layar**. Sebagai gantinya, sistem mengimplementasikan **Skeleton Loader Berbasis Komponen**:

### 4.1. Skeleton Modul Materi
- Kartu materi berbentuk placeholder abu-abu berdenyut halus (`animate-pulse`).
- Tinggi placeholder video dibuat persis rasio 16:9 sehingga ketika data selesai dimuat, tata letak halaman tidak melompat (*zero Cumulative Layout Shift*).

### 4.2. Skeleton Lembar Ujian
- Placeholder soal berupa 3 baris teks skeleton.
- Placeholder 4 kotak radio pilihan jawaban A, B, C, D.
- Sidebar skeleton berupa 10 kotak nomor soal.

### 4.3. Skeleton Tabel Rekap Nilai Dosen
- Header tabel tetap tampil statis.
- Baris tabel menampilkan 5 baris shimmer abu-abu yang berganti mulus menjadi data nilai mahasiswa begitu API selesai merespons.

---

## 5. Standar Toast Notifications

Semua interaksi penting harus memberikan kepastian instan (*feedback loops*):

| Skenario | Tipe Toast | Bunyi Pesan Toast |
| :--- | :--- | :--- |
| Dosen berhasil upload materi audio/doc/video | `success` | "Materi [Nama Materi] berhasil dipublikasikan!" |
| Format file tidak sesuai | `error` | "Format tidak didukung. Harap unggah file .mp3 / .pdf / .mp4" |
| Ukuran file melebihi batas | `warning` | "Ukuran file melebihi kapasitas maksimum (50 MB)." |
| Mahasiswa memilih jawaban kuis | `info (silent)` | "Jawaban nomor [X] tersimpan." |
| Sisa waktu ujian < 5 menit | `warning` | "Perhatian: Waktu pengerjaan tersisa 5 menit lagi!" |
| Ujian berhasil dikumpulkan | `success` | "Ujian berhasil dikumpulkan! Nilai Anda: [Skor]/100" |
| Dosen mengunduh file rekap nilai | `success` | "File rekap nilai ujian berhasil diunduh (.xlsx)." |

---

## 6. Rencana Tahapan Pengembangan (Milestone Timeline)

Untuk diajukan kepada Ibu Yulia sebagai komitmen jadwal pengerjaan:

- **Minggu 1: Fondasi & Backend API**
  - Setup Laravel & Skema Database (Users, Lessons, Lesson Contents, Quizzes, Attempts).
  - Otentikasi Sanctum (Role Dosen vs Murid).
  - Service Upload File Dokumen, Audio MP3, dan Video.
- **Minggu 2: Antarmuka Materi Belajar (React.js)**
  - Setup Vite + React + Font Poppins + Design System Biru-Putih.
  - Implementasi In-App PDF Reader.
  - Implementasi Custom Audio Player (Speed control 1x, 1.25x, 1.5x + Waveform).
  - Implementasi Video Player Responsif.
  - Skeleton screens & integrasi Toast notifications.
- **Minggu 3: Modul Ujian & Auto-Scoring Engine**
  - Form Pembuatan Soal & Kunci Jawaban untuk Dosen.
  - Antarmuka Ujian Mahasiswa (Countdown Timer, Navigasi Nomor Soal, Auto-Submit).
  - Mesin Kalkulasi Skor Otomatis di Backend Laravel.
  - Halaman Hasil Nilai Mahasiswa.
- **Minggu 4: Rekapitulasi Nilai, Ekspor Excel & Finishing**
  - Halaman Dashboard Rekap Nilai Kelas untuk Bu Yulia.
  - Fitur 1-Klik Ekspor Excel (.xlsx).
  - Pengujian performa (Fast loading audit, responsive mobile testing).
  - Serah terima sistem & panduan penggunaan untuk Bu Yulia.
