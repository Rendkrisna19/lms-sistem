import { HelpCircle } from "lucide-react";
import { PageHeader } from "../components/ui/page-header";
import { useAuth } from "../lib/auth";

const FAQ = {
  guru: [
    ["Bagaimana membuat ujian baru?", "Buka menu Ujian & Kuis lalu klik \"Buat Ujian Baru\". Pilih kelas & mata pelajaran sesuai plotting Anda, susun butir soal, tentukan kunci jawaban, lalu simpan."],
    ["Mengapa kelas saya tidak muncul saat membuat ujian?", "Pilihan kelas berasal dari plotting mengajar yang diatur admin sekolah. Hubungi admin sekolah bila plotting Anda belum ada."],
    ["Bisakah soal dan jawaban berupa gambar?", "Bisa. Gunakan tombol gambar pada editor soal, atau tombol \"Gambar\" pada setiap pilihan jawaban. Format JPG, PNG, GIF, atau WEBP, maksimal 5 MB."],
    ["Apakah mengedit soal menghapus jawaban siswa?", "Tidak. Soal yang tidak dihapus tetap menyimpan jawaban siswa. Nilai yang sudah dikumpulkan tidak dihitung ulang otomatis."],
  ],
  murid: [
    ["Apakah jawaban saya tersimpan jika koneksi terputus?", "Ya. Setiap jawaban disimpan otomatis ke server. Jika koneksi terputus, jawaban disimpan sementara di perangkat dan dikirim ulang saat koneksi kembali."],
    ["Apa yang terjadi saat waktu habis?", "Ujian dikumpulkan otomatis oleh sistem. Jawaban yang sudah tersimpan sebelum waktu habis tetap dinilai."],
    ["Bisakah saya mengulang ujian?", "Setiap ujian hanya dapat dikerjakan satu kali. Hubungi guru Anda bila memerlukan remedial."],
  ],
  admin: [
    ["Bagaimana menambahkan guru ke kelas?", "Buka Data Kelas, pilih kelas, lalu tambahkan plotting mata pelajaran beserta guru pengampunya."],
    ["Bagaimana mengatur ulang kata sandi pengguna?", "Buka Data Guru atau Data Siswa, pilih Edit, lalu isi kata sandi baru (minimal 8 karakter)."],
  ],
};

export function HelpPage() {
  const { role } = useAuth();
  const items = FAQ[role] ?? FAQ.admin;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Pusat Bantuan" description="Jawaban atas pertanyaan yang paling sering diajukan." />
      <div className="space-y-3">
        {items.map(([question, answer]) => (
          <details key={question} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs open:ring-1 open:ring-brand-200">
            <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold text-slate-900">
              <HelpCircle className="h-4 w-4 text-brand-600 shrink-0" aria-hidden="true" />
              {question}
            </summary>
            <p className="mt-3 pl-7 text-sm text-slate-600 leading-relaxed">{answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
