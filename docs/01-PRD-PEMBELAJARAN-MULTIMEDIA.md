# PRODUCT REQUIREMENTS DOCUMENT (PRD) #01
## Modul Manajemen & Distribusi Materi Pembelajaran (3 Model Media)

- **Nama Proyek:** Sistem Manajemen Pembelajaran Digital (LMS Bu Yulia)
- **Klien / Pemilik Produk:** Dosen Pengampu (Ibu Yulia)
- **Tech Stack:** Laravel (Backend API) + React.js (Frontend SPA/Vite)
- **Tema Desain:** Clean Modern Academic (Biru & Putih), Font Poppins, Anti AI-Slop
- **Versi Dokumen:** 1.0.0
- **Status:** Siap Direview & Disetujui Klien

---

## 1. Ringkasan Eksekutif & Latar Belakang (Executive Summary)

Sistem ini dikembangkan khusus untuk memfasilitasi kebutuhan Dosen (Ibu Yulia) dalam mendistribusikan bahan ajar secara terstruktur kepada mahasiswa/murid tanpa kerumitan platform publik. Modul pertama ini berfokus pada **Pusat Pembelajaran Berbasis 3 Model Media**, di mana dosen dapat mengunggah dan mengorganisir materi dalam 3 format utama:
1. **Format Dokumen** (Modul bacaan, slide presentasi, panduan praktikum - PDF/DOC/DOCX).
2. **Format Rekaman Suara / Audio** (Penjelasan vokal dosen, ringkasan konsep, podcast materi - MP3/AAC).
3. **Format Video Pembelajaran** (Video tutorial, rekaman penjelasan visual - MP4/WebM atau embed player).

Tujuan utama modul ini adalah memastikan mahasiswa dapat belajar secara fleksibel sesuai gaya belajar masing-masing (visual, auditori, atau teks), dengan performa antarmuka yang gesit (*fast-loading*), responsif, dan bebas gangguan.

---

## 2. Definisi Aktor & Hak Akses (Role Matrix)

Sistem hanya memiliki **2 Role** yang terisolasi dengan ketat:

| Fitur / Tindakan | Guru / Dosen (Bu Yulia) | Murid / Mahasiswa |
| :--- | :---: | :---: |
| Buat Mata Kuliah / Topik Pertemuan | ✅ Ya (Penuh) | ❌ Tidak |
| Upload Materi Dokumen (PDF, DOC) | ✅ Ya (Penuh) | ❌ Tidak |
| Upload Materi Rekaman Suara (MP3) | ✅ Ya (Penuh) | ❌ Tidak |
| Upload Materi Video Pembelajaran | ✅ Ya (Penuh) | ❌ Tidak |
| Edit & Hapus Materi | ✅ Ya (Penuh) | ❌ Tidak |
| Baca Dokumen (In-App PDF Viewer) | ✅ Ya | ✅ Ya |
| Putar Audio (Custom Audio Player) | ✅ Ya | ✅ Ya |
| Tonton Video (Custom Video Player) | ✅ Ya | ✅ Ya |
| Menandai Materi Selesai Dipelajari | ❌ (Hanya monitor) | ✅ Ya (Track progress) |
| Melihat Progres Belajar Mahasiswa | ✅ Ya (Statistik per mahasiswa) | ✅ Ya (Progres diri sendiri) |

---

## 3. Rincian Kebutuhan Fungsional (3 Model Pembelajaran)

### 3.1. Manajemen Topik & Pertemuan (Course & Topic Structure)
- Guru dapat menyusun materi berdasarkan **Pertemuan / Bab** (contoh: Pertemuan 1: Pengantar Algoritma).
- Tiap pertemuan memiliki:
  - Judul Materi
  - Deskripsi singkat / Instruksi dosen
  - Estimasi waktu belajar (contoh: 15 menit)
  - Salah satu atau kombinasi dari 3 model media.

---

### 3.2. Model Pembelajaran 1: Dokumen (Doc / PDF / Slide)
- **Tujuan:** Mahasiswa dapat membaca teori, materi perkuliahan, atau panduan tugas langsung di browser tanpa harus selalu mendownload file besar.
- **Ketentuan File:**
  - Format yang didukung: `.pdf`, `.doc`, `.docx`.
  - Rekomendasi sistem: File `.doc/.docx` otomatis dapat diunduh, sedangkan `.pdf` langsung dirender menggunakan in-app PDF viewer modern.
  - Maksimum ukuran file: 25 MB per dokumen.
- **Pengalaman Guru (Dosen):**
  - Form upload drag-and-drop dengan *file preview*.
  - Indikator progres upload (0% - 100%) dengan status real-time.
- **Pengalaman Murid:**
  - Embedded viewer bersih dengan fitur zoom, navigasi halaman, dan tombol download dokumen resmi.

---

### 3.3. Model Pembelajaran 2: Rekaman Suara / Audio (MP3)
- **Tujuan:** Mahasiswa dapat mendengarkan rekaman suara penjelasan Bu Yulia sambil mencatat atau saat dalam perjalanan (auditory learning).
- **Ketentuan File:**
  - Format yang didukung: `.mp3`, `.m4a`, `.wav`.
  - Maksimum ukuran file: 50 MB per file audio.
- **Fitur Player Audio (Custom React Player - Anti AI-Slop):**
  - Bukan player bawaan browser yang kaku. Player dirancang estetik biru-putih dengan:
    - Tombol Play / Pause & Skip mundur/maju 10 detik.
    - Pengatur Kecepatan Suara (*Playback Speed*: 0.75x, 1x, 1.25x, 1.5x, 2x) agar mahasiswa bisa memutar penjelasan dosen lebih cepat/lambat.
    - Timeline scrubber dengan durasi berjalan dan sisa waktu.
    - Indikator waveform dinamis / audio visualizer minimalis.
    - Kontrol volume & mute.
  - State audio tetap tersimpan (resume posisi terakhir jika halaman tidak sengaja terefresh).

---

### 3.4. Model Pembelajaran 3: Video Pembelajaran
- **Tujuan:** Media visual untuk materi yang memerlukan simulasi, presentasi slide beranimasi, atau demonstrasi praktis.
- **Ketentuan File:**
  - Format yang didukung: `.mp4`, `.webm`.
  - Opsi alternatif: Input URL Video (YouTube Unlisted / Vimeo) untuk menghemat bandwidth server VPS jika diinginkan.
  - Maksimum ukuran file lokal: 100 MB per video (dioptimalkan kompresi H.264).
- **Fitur Player Video:**
  - Responsive 16:9 aspect ratio dengan cover thumbnail materi.
  - Kontrol standar modern: Play/Pause, Timeline, Kecepatan putar (0.5x - 2x), Volume, Fullscreen.
  - Anti-distraksi (mode teater / fokus materi tanpa elemen luar yang mengganggu).

---

### 3.5. Pelacakan Progres Belajar (Progress Tracking)
- Murid memiliki tombol **"Tandai Telah Dipelajari"** (*Mark as Completed*).
- Sistem mencatat timestamp kapan murid membuka dan menyelesaikan masing-masing model materi.
- Tampilan kartu materi pada dashboard murid menampilkan badge status:
  - `Belum Dimulai` (Abu-abu lembut)
  - `Sedang Dipelajari` (Biru muda)
  - `Selesai` (Biru pekat dengan centang hijau/putih)

---

## 4. UI/UX Design System & Standar Kualitas

### 4.1. Filosofi "Anti AI-Slop"
- **Tanpa Elemen Hiasan Tak Berguna:** Tidak ada ilustrasi robot 3D generik, gradient pelangi berlebihan, atau teks lorem-ipsum mengambang.
- **Hierarki Informasi Human-Centric:** Desain fokus pada keterbacaan materi, kemudahan membaca instruksi Bu Yulia, dan kontrol media yang intuitif.
- **Tipografi:** Google Font **Poppins** (400 Regular untuk teks isi, 500 Medium untuk label navigasi, 600 Semi-Bold untuk judul materi).

### 4.2. Palet Warna (Clean Blue & White)
| Kode Warna | Nama Token | Penggunaan |
| :--- | :--- | :--- |
| `#1E40AF` | `Primary Blue` | Header, tombol aksi utama, tab aktif |
| `#3B82F6` | `Accent Blue` | Hover state, progress bar, link interaktif |
| `#EFF6FF` | `Light Blue Surface` | Background kartu materi, badge informasi |
| `#FFFFFF` | `Pure White` | Background utama, modal, container |
| `#0F172A` | `Dark Slate Text` | Warna teks judul utama (kontras tinggi, ramah mata) |
| `#64748B` | `Muted Slate` | Keterangan durasi, tanggal upload, teks sekunder |
| `#E2E8F0` | `Soft Border` | Garis pemisah kartu materi dan tabel |

### 4.3. Skeleton Loaders (No Clunky Spinners)
- Saat data materi sedang di-fetch dari Laravel:
  - Kartu materi menampilkan skeleton bergelombang halus berbentuk judul, deskripsi, dan tombol.
  - Player video & audio menampilkan skeleton berdimensi persis sesuai ukuran media aslinya, mencegah terjadinya *Cumulative Layout Shift (CLS)*.

### 4.4. Toast Notifications
- Menggunakan library toast modern (desain floating rounded, transisi cepat 200ms):
  - **Sukses:** *"Materi audio berhasil dipublikasikan"* (Biru tua + icon centang).
  - **Gagal Upload:** *"Format file tidak didukung. Harap upload .mp3 atau .m4a"* (Merah lembut).
  - **Peringatan Batas:** *"Ukuran file melebihi 50 MB"* (Kuning amber).
  - **Progres:** *"Sedang mengunggah materi... (65%)"* (Toast dinamis dengan mini progress bar).

---

## 5. Arsitektur Teknis (Laravel + React.js)

### 5.1. Struktur Database (Schema Migrations)

#### Tabel `courses` (Mata Kuliah / Kelas)
- `id` (BIGINT, Primary Key)
- `title` (VARCHAR 255)
- `description` (TEXT)
- `instructor_id` (BIGINT, FK -> users.id)
- `created_at`, `updated_at`

#### Tabel `lessons` (Topik Pertemuan / Sesi)
- `id` (BIGINT, Primary Key)
- `course_id` (BIGINT, FK -> courses.id, On Delete Cascade)
- `title` (VARCHAR 255)
- `description` (TEXT, Nullable)
- `order_index` (INT, Urutan pertemuan)
- `created_at`, `updated_at`

#### Tabel `lesson_contents` (Media Pembelajaran 3 Model)
- `id` (BIGINT, Primary Key)
- `lesson_id` (BIGINT, FK -> lessons.id, On Delete Cascade)
- `content_type` (ENUM: `'document'`, `'audio'`, `'video'`)
- `title` (VARCHAR 255)
- `file_path` (VARCHAR 500, Path di storage Laravel)
- `file_name_original` (VARCHAR 255)
- `file_size_bytes` (BIGINT)
- `duration_seconds` (INT, Nullable - untuk audio/video)
- `external_url` (VARCHAR 500, Nullable - untuk embed video)
- `created_at`, `updated_at`

#### Tabel `student_lesson_progress` (Riwayat Belajar Murid)
- `id` (BIGINT, Primary Key)
- `user_id` (BIGINT, FK -> users.id)
- `lesson_id` (BIGINT, FK -> lessons.id)
- `is_completed` (BOOLEAN, Default: false)
- `completed_at` (TIMESTAMP, Nullable)
- `last_accessed_at` (TIMESTAMP)

---

### 5.2. Spesifikasi Endpoint REST API (Laravel)

| Metode | Endpoint | Role | Fungsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/lessons` | Guru & Murid | Mengambil daftar seluruh materi & topik |
| `GET` | `/api/v1/lessons/{id}` | Guru & Murid | Detail materi beserta link 3 model medianya |
| `POST` | `/api/v1/lessons` | Guru Saja | Membuat sesi pertemuan baru |
| `POST` | `/api/v1/lessons/{id}/contents` | Guru Saja | Upload media materi (multipart/form-data: doc/audio/video) |
| `DELETE` | `/api/v1/contents/{id}` | Guru Saja | Menghapus salah satu file materi |
| `POST` | `/api/v1/lessons/{id}/progress` | Murid Saja | Menandai materi selesai dipelajari |
| `GET` | `/api/v1/teacher/progress-report` | Guru Saja | Laporan progres ketercapaian seluruh murid |

---

## 6. Kriteria Keberhasilan (Acceptance Criteria)

1. **Uji Upload 3 Media:** Guru berhasil mengupload berturut-turut 1 file PDF, 1 file rekaman audio MP3, dan 1 file video MP4 tanpa error.
2. **Kesesuaian Player:**
   - Murid membuka file audio: Player custom React langsung memutar audio, speed control 1.5x berfungsi lancar.
   - Murid membuka video: Layar video responsif pada layar desktop maupun HP.
   - Murid membuka dokumen: Tampilan PDF dapat dibaca langsung tanpa memaksa download.
3. **Standar Kecepatan:** Halaman materi memuat kerangka skeleton dalam <300ms dan data siap <1 detik.
4. **Toast Feedback:** Setiap aksi penyimpanan dan penghapusan selalu memicu feedback toast yang jelas.
