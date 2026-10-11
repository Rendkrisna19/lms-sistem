# PRODUCT REQUIREMENTS DOCUMENT (PRD) #02
## Modul Ujian Pilihan Ganda & Sistem Penilaian Otomatis (Quiz & Auto-Scoring Engine)

- **Nama Proyek:** Sistem Manajemen Pembelajaran Digital (LMS Bu Yulia)
- **Klien / Pemilik Produk:** Dosen Pengampu (Ibu Yulia)
- **Tech Stack:** Laravel (Backend API) + React.js (Frontend SPA/Vite)
- **Tema Desain:** Clean Modern Academic (Biru & Putih), Font Poppins, Anti AI-Slop
- **Versi Dokumen:** 1.0.0
- **Status:** Siap Direview & Disetujui Klien

---

## 1. Ringkasan Eksekutif & Latar Belakang (Executive Summary)

Setelah mahasiswa menyelesaikan sesi materi pembelajaran (dokumen, audio, atau video), dosen memerlukan alat evaluasi yang efisien, transparan, dan tidak membebani waktu dosen untuk mengoreksi ratusan lembar ujian secara manual.

Modul kedua ini adalah **Sistem Ujian Pilihan Ganda & Mesin Penilaian Otomatis (*Auto-Grading Engine*)**. Sistem ini memungkinkan Bu Yulia merancang kuis/ujian pilihan ganda dengan cepat, mengatur batas waktu pengerjaan, dan secara otomatis menghitung skor nilai mahasiswa seketika setelah ujian dikumpulkan. Dosen dapat langsung melihat rekapitulasi nilai kelas dan mengekspor hasilnya ke format lembar kerja Excel/CSV untuk arsip nilai perkuliahan.

---

## 2. Definisi Aktor & Hak Akses (Role Matrix)

| Fitur / Tindakan | Guru / Dosen (Bu Yulia) | Murid / Mahasiswa |
| :--- | :---: | :---: |
| Buat Kuis / Ujian Terkait Topik Materi | ✅ Ya (Penuh) | ❌ Tidak |
| Kelola Butir Soal & Pilihan Jawaban (A-E) | ✅ Ya (Penuh) | ❌ Tidak |
| Tentukan Kunci Jawaban & Bobot Nilai | ✅ Ya (Penuh) | ❌ Tidak |
| Konfigurasi Durasi Waktu (Menit) & Status Ujian | ✅ Ya (Penuh) | ❌ Tidak |
| Mengerjakan Ujian (Student Exam Room) | ❌ Tidak (Hanya preview) | ✅ Ya (Sesuai jadwal) |
| Melihat Countdown Timer & Status Nomor Soal | ❌ Tidak | ✅ Ya |
| Auto-Submit Jawaban saat Waktu Habis | N/A | ✅ Ya (Sistem Otomatis) |
| Menerima Skor Instan setelah Ujian Selesai | ✅ Ya (Rekap semua murid) | ✅ Ya (Skor miliknya) |
| Melihat Analisis Butir Soal (Tingkat Kesulitan) | ✅ Ya | ❌ Tidak |
| Ekspor Nilai ke File Excel (.xlsx / .csv) | ✅ Ya (1-Klik Download) | ❌ Tidak |

---

## 3. Rincian Kebutuhan Fungsional (Ujian & Skoring)

### 3.1. Manajemen Ujian oleh Dosen (Teacher Exam Builder)
- **Keterikatan Modul:** Ujian dapat dikaitkan dengan sesi materi tertentu (Post-Test per bab) atau sebagai Ujian Tengah/Akhir Semester.
- **Pengaturan Umum Ujian:**
  - Judul Ujian (contoh: *Kuis Pemahaman Pertemuan 2 - Teori Komunikasi*)
  - Petunjuk Pengerjaan
  - Durasi Ujian (contoh: 30 menit, 45 menit, 60 menit)
  - Batas Percobaan: Default 1x pengerjaan per murid (bisa disetel ulang oleh Bu Yulia jika ada mahasiswa izin/susulan)
  - Pengacakan Urutan Soal (*Shuffle Questions* - opsional toggle On/Off)
  - Waktu Mulai & Waktu Selesai Akses (*Available Window*)
  - Toggle Tampilkan Skor Langsung (*Show instant score to student upon submit*)

---

### 3.2. Manajemen Butir Soal Pilihan Ganda (Question Bank)
- Dosen dapat menambah soal satu per satu dengan antarmuka yang sangat ringkas dan bebas error:
  - **Teks Pertanyaan:** Mendukung teks kaya (*bold, italic, list*) dan penyisipan gambar jika soal membutuhkan diagram kasus.
  - **Opsi Jawaban:** Fleksibel 4 opsi (A, B, C, D) atau 5 opsi (A, B, C, D, E).
  - **Kunci Jawaban:** Dosen cukup mencentang radio button opsi yang benar.
  - **Poin / Bobot Soal:** Default 10 poin per soal (total kalkulasi persentase otomatis disesuaikan ke skala 100).
  - **Penjelasan / Pembahasan (Opsional):** Teks keterangan kenapa opsi tersebut benar, yang dapat dibaca mahasiswa setelah ujian selesai.

---

### 3.3. Ruang Ujian Mahasiswa (Student Exam Workspace)
Dirancang dengan antarmuka fokus tinggi, bebas stres, dan anti-distraksi (*distraction-free UI*):
1. **Layar Konfirmasi Pra-Ujian:**
   - Menampilkan ringkasan: Jumlah soal, durasi waktu, aturan pengerjaan.
   - Tombol tegas: *"Mulai Kerjakan Ujian"* (disertai konfirmasi popup agar tidak terpencet tidak sengaja).
2. **Navigasi Lembar Ujian:**
   - **Sticky Top Bar:** Nama ujian + **Floating Countdown Timer** (menit:detik) yang menyala merah jika sisa waktu < 5 menit.
   - **Area Soal:** Teks pertanyaan jelas, ukuran font nyaman (16px Poppins), opsi jawaban berupa kartu radio yang berubah warna biru saat dipilih.
   - **Tombol Navigasi:** *"Sebelumnya"*, *"Selanjutnya"*, dan tombol *"Ragu-ragu"* (opsional).
   - **Palet Nomor Soal (Sidebar / Drawer Mobile):**
     - Indikator warna kotak nomor:
       - **Abu-abu muda:** Belum dijawab
       - **Biru pekat:** Sudah dijawab
       - **Kuning hangat:** Ditandai ragu-ragu
3. **Mekanisme Ketahanan Jaringan (Network Resiliency):**
   - Setiap murid memilih jawaban, state langsung tersimpan ke *Local Storage* browser dan dikirim secara asinkron (*auto-save background*) ke server Laravel. Jika koneksi wifi terputus sesaat, jawaban tidak hilang.
4. **Auto-Submit Timer Engine:**
   - Ketika countdown menyentuh `00:00`, form otomatis mengunci seluruh input dan langsung mengirimkan jawaban terakhir ke server (*Force Auto-Submit*).

---

### 3.4. Mesin Penilaian Otomatis (Auto-Grading Engine)
- **Kalkulasi Nilai Otomatis:**
  $$\text{Skor Akhir} = \left( \frac{\sum \text{Poin Jawaban Benar}}{\sum \text{Total Poin Semua Soal}} \right) \times 100$$
- **Hasil Instan Mahasiswa:**
  - Skor total angka (misal: **85 / 100**).
  - Statistik ringkas: Jumlah Benar, Jumlah Salah, Total Waktu yang Dihabiskan.
  - Grade otomatis:
    - $\ge 85$: Grade A (Sangat Memuaskan)
    - $75 - 84$: Grade B (Memuaskan)
    - $60 - 74$: Grade C (Cukup)
    - $< 60$: Grade D (Perlu Remidi)

---

### 3.5. Dashboard Rekapitulasi & Ekspor Nilai (Dosen)
- **Tabel Rekap Nilai Interaktif:**
  - Kolom: No, Nama Mahasiswa, NIM, Waktu Selesai, Jumlah Benar, Nilai Akhir, Status.
  - Fitur pencarian mahasiswa berdasarkan nama/NIM.
  - Pengurutan (*Sorting*) dari nilai tertinggi ke terendah.
- **Fitur 1-Klik Ekspor Nilai:**
  - Tombol download format **Excel (.xlsx)** dan **CSV**.
  - Format lembar kerja siap diserahkan ke bagian akademik kampus tanpa perlu diedit ulang.
- **Analisis Butir Soal Singkat (Item Analysis):**
  - Grafik mini menunjukkan soal mana yang persentase salahnya paling tinggi, sehingga Bu Yulia tahu materi mana yang belum dipahami mahasiswa pada pertemuan berikutnya.

---

## 4. UI/UX Design System & Standar Kualitas

### 4.1. Visual Style (Biru & Putih Elegan)
- **Palet Warna:**
  - Kartu Ujian: Putih bersih (`#FFFFFF`) dengan border halus (`#E2E8F0`).
  - Soal Terpilih: Outline biru tegas (`#2563EB`) dengan latar biru sangat muda (`#EFF6FF`).
  - Countdown Kritis: Merah koral elegan (`#EF4444`) dengan latar merah muda (`#FEF2F2`).
  - Skor Tinggi: Hijau emerald (`#10B981`) dan Biru tua (`#1E40AF`).
- **Tipografi:** Google Font **Poppins** (penataan jarak baris 1.6 untuk soal cerita agar tidak melelahkan mata mahasiswa).

### 4.2. Skeleton Loaders
- Saat memuat lembar ujian: Skeleton berupa skeleton card soal, 4 placeholder baris opsi jawaban, dan skeleton grid nomor soal di kanan.
- Saat memuat tabel nilai dosen: Skeleton baris tabel (5 baris berulang dengan shimmer halus) tanpa spinner layar penuh.

### 4.3. Toast Notifications
- *"Jawaban nomor 4 berhasil disimpan"* (micro-toast halus di sudut bawah).
- *"Peringatan: Waktu pengerjaan tersisa 5 menit!"* (Toast warning dengan aksen kuning/oranye).
- *"Ujian berhasil dikumpulkan. Skor Anda telah dihitung."* (Toast sukses warna biru/hijau).
- *"Gagal terhubung ke server. Jawaban Anda tetap aman di browser."* (Toast proteksi koneksi).

---

## 5. Arsitektur Teknis (Laravel + React.js)

### 5.1. Struktur Database (Schema Migrations)

#### Tabel `quizzes` (Data Induk Ujian)
- `id` (BIGINT, Primary Key)
- `lesson_id` (BIGINT, Nullable, FK -> lessons.id)
- `title` (VARCHAR 255)
- `instructions` (TEXT, Nullable)
- `duration_minutes` (INT, Default: 30)
- `passing_score` (INT, Default: 70)
- `is_published` (BOOLEAN, Default: false)
- `show_result_immediately` (BOOLEAN, Default: true)
- `created_at`, `updated_at`

#### Tabel `quiz_questions` (Butir Soal)
- `id` (BIGINT, Primary Key)
- `quiz_id` (BIGINT, FK -> quizzes.id, On Delete Cascade)
- `question_text` (TEXT)
- `image_url` (VARCHAR 500, Nullable)
- `points` (INT, Default: 10)
- `explanation` (TEXT, Nullable - Pembahasan)
- `order_index` (INT, Default: 1)
- `created_at`, `updated_at`

#### Tabel `quiz_options` (Pilihan Jawaban A, B, C, D, E)
- `id` (BIGINT, Primary Key)
- `question_id` (BIGINT, FK -> quiz_questions.id, On Delete Cascade)
- `option_label` (VARCHAR 5, contoh: 'A', 'B', 'C', 'D', 'E')
- `option_text` (TEXT)
- `is_correct` (BOOLEAN, Default: false - *Hanya dibaca oleh backend saat scoring, disembunyikan dari JSON response murid saat ujian*)
- `created_at`, `updated_at`

#### Tabel `quiz_attempts` (Sesi Pengerjaan Siswa)
- `id` (BIGINT, Primary Key)
- `quiz_id` (BIGINT, FK -> quizzes.id)
- `user_id` (BIGINT, FK -> users.id)
- `started_at` (TIMESTAMP)
- `submitted_at` (TIMESTAMP, Nullable)
- `score` (DECIMAL 5,2, Nullable - misal: 85.00)
- `total_correct` (INT, Default: 0)
- `total_questions` (INT)
- `status` (ENUM: `'in_progress'`, `'submitted'`, `'timed_out'`)
- `created_at`, `updated_at`

#### Tabel `quiz_answers` (Detail Pilihan Mahasiswa per Soal)
- `id` (BIGINT, Primary Key)
- `attempt_id` (BIGINT, FK -> quiz_attempts.id, On Delete Cascade)
- `question_id` (BIGINT, FK -> quiz_questions.id)
- `selected_option_id` (BIGINT, Nullable, FK -> quiz_options.id)
- `is_correct` (BOOLEAN, Default: false)
- `score_awarded` (INT, Default: 0)
- `created_at`, `updated_at`

---

### 5.2. Spesifikasi Endpoint REST API (Laravel)

| Metode | Endpoint | Role | Fungsi & Payload |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/quizzes` | Guru Saja | Buat paket ujian & pengaturan durasi |
| `POST` | `/api/v1/quizzes/{id}/questions` | Guru Saja | Tambah butir soal + opsi A-E + kunci jawaban |
| `GET` | `/api/v1/quizzes/{id}/preview` | Guru Saja | Tinjauan lengkap soal beserta kunci jawaban |
| `GET` | `/api/v1/quizzes/{id}/start` | Murid Saja | Mengambil soal (**Kunci jawaban `is_correct` di-strip dari JSON**) |
| `POST` | `/api/v1/attempts/{id}/save-answer` | Murid Saja | Auto-save jawaban per butir soal (background sync) |
| `POST` | `/api/v1/attempts/{id}/submit` | Murid Saja | Submit final ujian & memicu kalkulasi skor instan |
| `GET` | `/api/v1/attempts/{id}/result` | Murid & Guru | Mengambil rincian skor & feedback kelulusan |
| `GET` | `/api/v1/quizzes/{id}/grades` | Guru Saja | Tabel seluruh nilai mahasiswa di ujian tersebut |
| `GET` | `/api/v1/quizzes/{id}/export-excel` | Guru Saja | Download file `.xlsx` rekap nilai siap cetak |

---

## 6. Logika Keamanan & Validasi Khusus (Anti-Cheat & Keandalan)

1. **Pencegahan Kebocoran Kunci Jawaban:**
   - Resource collection Laravel untuk endpoint murid (`StudentQuizResource`) tidak menyertakan kolom `is_correct`. Jawaban benar tersimpan aman di database server.
2. **Validasi Waktu Server-Side:**
   - Perhitungan batas waktu tidak hanya bergantung pada jam HP/Laptop murid. Server mencatat `started_at` dan memverifikasi batas toleransi saat `submit`.
3. **Pencegahan Pengerjaan Ulang Ilegal:**
   - Jika status attempt sudah `'submitted'`, murid tidak dapat membuka kembali sesi ujian tanpa reset izin khusus dari Dosen.

---

## 7. Kriteria Keberhasilan (Acceptance Criteria)

1. **Uji Buat Soal:** Dosen dapat membuat 1 paket ujian berisi 10 soal pilihan ganda (A-E) lengkap dengan kunci jawaban dalam waktu < 10 menit.
2. **Uji Pengerjaan Mahasiswa:** Mahasiswa dapat mengerjakan ujian dengan hitung mundur timer yang akurat, navigasi nomor soal yang responsif, dan tombol submit yang memunculkan konfirmasi dialog.
3. **Uji Akurasi Skoring:** Sistem menghasilkan skor 100% akurat sesuai kunci jawaban yang telah disetel oleh dosen seketika saat tombol submit diklik.
4. **Uji Ekspor Excel:** Dosen berhasil mengunduh rekap nilai seluruh mahasiswa kelas dalam format `.xlsx` dengan format rapi (Nama, NIM, Nilai, Waktu).
