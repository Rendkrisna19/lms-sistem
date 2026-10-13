import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FileText,
  MapPin,
  RefreshCw,
  Timer,
  Video,
  Volume2,
} from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert } from "../ui/alert";
import { StatCard } from "../ui/stat-card";
import { Skeleton } from "../ui/skeleton";
import { Progress } from "../ui/progress";
import { EmptyState } from "../ui/empty-state";
import { formatDate, formatDateTime, formatMinutes } from "../../lib/datetime";
import { timeUntil } from "../../features/assignments/deadline";
import { useNow } from "../../features/assignments/useNow";

const MEDIA = {
  document: { label: "Dokumen PDF", icon: FileText, className: "bg-red-50 text-red-600" },
  audio: { label: "Audio Suara", icon: Volume2, className: "bg-indigo-50 text-indigo-600" },
  video: { label: "Video", icon: Video, className: "bg-blue-50 text-blue-600" },
};

const USAGE_ROWS = [
  { key: "pdf", label: "Dokumen PDF", bar: "bg-red-500" },
  { key: "audio", label: "Audio Suara", bar: "bg-indigo-500" },
  { key: "video", label: "Video", bar: "bg-blue-500" },
];

function Panel({ title, description, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col">
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </header>
      <div className="px-5 pb-5 flex-1">{children}</div>
    </section>
  );
}

function PanelLink({ to, children }) {
  const navigate = useNavigate();
  return (
    <Button variant="ghost" size="sm" onClick={() => navigate(to)} className="text-xs text-brand-600 shrink-0">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Button>
  );
}

function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Gaya belajar dominan dari jumlah akses per media (sama dengan logika analitik server). */
function dominantMedia(usage) {
  if (!usage?.total) return null;
  const sorted = USAGE_ROWS.map((row) => ({ ...row, value: usage[row.key] ?? 0 })).sort((a, b) => b.value - a.value);
  return sorted[0].value === sorted[1].value ? "Multimodal (seimbang)" : sorted[0].label;
}

export function StudentDashboard({ currentUser }) {
  const navigate = useNavigate();
  const { data, error, isLoading, reload } = useApiQuery("/student/overview");
  const now = useNow();

  const student = data?.student;
  const summary = data?.summary;
  const usage = data?.media_usage;
  const schoolName = student?.school_name || currentUser?.school?.name;
  const className = student?.classroom_name || currentUser?.classroom?.name;
  const hasClassroom = isLoading || Boolean(student?.classroom);
  const dominant = dominantMedia(usage);

  return (
    <div className="space-y-6 w-full">
      {/* Banner */}
      <div className="bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <Badge className="bg-white/20 text-white border-white/20 mb-3 text-xs font-semibold px-3 py-1">
            Portal Siswa{schoolName ? ` • ${schoolName}` : ""}{className ? ` (${className})` : ""}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Semangat Belajar, {currentUser?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            Pelajari materi dalam 3 model (Dokumen PDF, Audio Suara, Video), lalu kerjakan ujian online sesuai jadwal kelas Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => navigate("/ruang-belajar")}
            className="rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs h-10 px-4 shadow-md"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Buka Ruang Belajar
          </Button>
          <Button
            onClick={reload}
            disabled={isLoading}
            variant="outline"
            className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-3"
            title="Muat ulang data"
            aria-label="Muat ulang data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Gagal memuat dashboard" action={<Button size="sm" variant="outline" onClick={reload}>Coba lagi</Button>}>
          {error}
        </Alert>
      )}

      {!hasClassroom && (
        <Alert variant="warning" title="Anda belum terdaftar di kelas">
          Hubungi admin sekolah agar akun Anda dimasukkan ke rombongan belajar. Materi, ujian, dan jadwal akan muncul setelah itu.
        </Alert>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Progres Belajar"
          value={summary?.learning_progress_pct}
          suffix="%"
          icon={CheckCircle2}
          isLoading={isLoading}
          hint={summary ? `${summary.materials_accessed} dari ${summary.materials_available} materi dibuka` : undefined}
        />
        <StatCard
          label="Ujian Menunggu"
          value={summary?.quizzes_pending}
          icon={ClipboardList}
          tone="amber"
          isLoading={isLoading}
          hint={summary ? `${summary.quizzes_completed} dari ${summary.quizzes_available} ujian selesai` : undefined}
        />
        <StatCard label="Rata-rata Nilai" value={summary?.average_score} icon={Award} tone="indigo" isLoading={isLoading} />
        <StatCard
          label="Nilai Terakhir"
          value={summary?.latest_score}
          icon={FileCheck}
          tone={summary?.latest_is_passed === false ? "red" : "emerald"}
          isLoading={isLoading}
          hint={
            summary?.latest_score === null || summary?.latest_score === undefined
              ? "Belum ada nilai"
              : summary.latest_is_passed
              ? "Lulus KKM"
              : "Perlu remedial"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Jadwal hari ini */}
        <Panel
          title={`Jadwal Hari Ini${data?.today ? ` (${data.today})` : ""}`}
          description="Mata pelajaran kelas Anda sesuai plotting admin sekolah."
          action={<PanelLink to="/agenda">Semua jadwal</PanelLink>}
        >
          {isLoading ? (
            <ListSkeleton />
          ) : !data?.today_schedule?.length ? (
            <EmptyState className="py-8" icon={Calendar} title="Tidak ada pelajaran hari ini" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.today_schedule.map((item) => (
                <li key={item.id} className="py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 rounded-lg px-2 py-1 tabular-nums whitespace-nowrap">
                    {item.schedule_time || "-"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.course_title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      {item.teacher_name}
                      {item.room && (
                        <>
                          <MapPin className="h-3 w-3 ml-1" aria-hidden="true" /> {item.room}
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Ujian aktif & mendatang */}
        <Panel
          title="Ujian Aktif & Mendatang"
          description="Ujian yang belum Anda kerjakan."
          action={<PanelLink to="/ujian">Ujian Online</PanelLink>}
        >
          {isLoading ? (
            <ListSkeleton />
          ) : !data?.upcoming_quizzes?.length ? (
            <EmptyState className="py-8" icon={ClipboardList} title="Tidak ada ujian yang menunggu" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcoming_quizzes.slice(0, 5).map((quiz) => {
                const isOpen = !quiz.starts_at || new Date(quiz.starts_at) <= new Date();
                return (
                  <li key={quiz.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{quiz.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Timer className="h-3 w-3" aria-hidden="true" />
                        {formatMinutes(quiz.duration_minutes)} • {quiz.course_title || "-"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isOpen
                          ? quiz.ends_at
                            ? `Ditutup ${formatDateTime(quiz.ends_at)}`
                            : "Dapat dikerjakan kapan saja"
                          : `Dibuka ${formatDateTime(quiz.starts_at)}`}
                      </p>
                    </div>
                    {isOpen ? (
                      <Button size="sm" onClick={() => navigate(`/ujian/${quiz.id}/kerjakan`)} className="shrink-0">
                        Kerjakan
                      </Button>
                    ) : (
                      <Badge variant="muted" className="shrink-0">Belum dibuka</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Tugas Mendatang"
        description="Tugas dari guru yang belum lewat tenggat."
        action={<PanelLink to="/tugas">Semua tugas</PanelLink>}
      >
        {isLoading ? (
          <ListSkeleton />
        ) : !data?.upcoming_assignments?.length ? (
          <EmptyState className="py-8" icon={ClipboardList} title="Tidak ada tugas yang menunggu" />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.upcoming_assignments.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/tugas/${task.id}`)}
                  className="flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-left transition-colors hover:border-brand-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{task.title}</p>
                    {task.submitted ? <Badge variant="success" className="shrink-0">Terkumpul</Badge> : <Badge variant="warning" className="shrink-0">Belum</Badge>}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">{task.course_title}</p>
                  <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-semibold text-slate-700">
                    <CalendarClock className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                    {formatDateTime(task.due_at)}
                  </p>
                  {!task.submitted && timeUntil(task.due_at, now) && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">Sisa {timeUntil(task.due_at, now)}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Materi terbaru */}
        <div className="lg:col-span-2">
          <Panel
            title="Materi Terbaru di Kelas Anda"
            description="Materi yang sudah dibuka tercatat sebagai progres belajar Anda."
            action={<PanelLink to="/ruang-belajar">Ruang Belajar</PanelLink>}
          >
            {isLoading ? (
              <ListSkeleton rows={4} />
            ) : !data?.recent_materials?.length ? (
              <EmptyState className="py-8" icon={BookOpen} title="Belum ada materi" description="Guru belum mengunggah materi untuk kelas Anda." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent_materials.map((material) => {
                  const media = MEDIA[material.content_type] ?? MEDIA.document;
                  const Icon = media.icon;
                  return (
                    <li key={material.id} className="py-3 flex items-center gap-3">
                      <span className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${media.className}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{material.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {media.label} • {material.course_title || "-"} • {formatDate(material.created_at)}
                        </p>
                      </div>
                      {material.is_accessed ? (
                        <Badge variant="success" className="shrink-0">Sudah dipelajari</Badge>
                      ) : (
                        <Badge variant="warning" className="shrink-0">Baru</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Gaya belajar */}
        <Panel title="Gaya Belajar Saya" description="Berdasarkan media yang paling sering Anda buka.">
          {isLoading ? (
            <ListSkeleton />
          ) : !usage?.total ? (
            <EmptyState className="py-8" icon={BookOpen} title="Belum ada aktivitas" description="Buka materi di Ruang Belajar untuk mulai mencatat aktivitas." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-50 px-3 py-2">
                <p className="text-[11px] text-brand-700">Media dominan</p>
                <p className="text-sm font-bold text-brand-900">{dominant}</p>
              </div>
              {USAGE_ROWS.map((row) => {
                const value = usage[row.key] ?? 0;
                const pct = Math.round((value / usage.total) * 100);
                return (
                  <div key={row.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {value}× ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${row.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-slate-400">Total {usage.total} kali akses materi.</p>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Nilai terbaru */}
        <div className="lg:col-span-2">
          <Panel title="Nilai Ujian Terbaru" action={<PanelLink to="/nilai">Semua nilai</PanelLink>}>
            {isLoading ? (
              <ListSkeleton />
            ) : !data?.recent_attempts?.length ? (
              <EmptyState className="py-8" icon={FileCheck} title="Belum ada nilai" description="Nilai muncul setelah Anda menyelesaikan ujian." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recent_attempts.map((attempt) => (
                  <li key={attempt.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{attempt.quiz_title}</p>
                      <p className="text-xs text-slate-500">
                        {attempt.course_title || "-"} • {formatDateTime(attempt.submitted_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base font-bold text-slate-900 tabular-nums">{attempt.score ?? "–"}</span>
                      {attempt.score === null || attempt.score === undefined ? (
                        <Badge variant="muted">Menunggu nilai</Badge>
                      ) : attempt.is_passed ? (
                        <Badge variant="success">Lulus</Badge>
                      ) : (
                        <Badge variant="warning">Remedial</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Mata pelajaran */}
        <Panel title="Mata Pelajaran Saya" description={summary ? `${summary.total_courses_enrolled} mapel di kelas Anda` : undefined}>
          {isLoading ? (
            <ListSkeleton />
          ) : !data?.enrolled_courses?.length ? (
            <EmptyState className="py-8" icon={BookOpen} title="Belum ada mapel" />
          ) : (
            <ul className="space-y-2">
              {data.enrolled_courses.map((course) => (
                <li key={course.id} className="rounded-xl border border-slate-100 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.teacher_name || "Guru belum ditentukan"}</p>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && summary && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Progres materi</span>
                <span className="font-semibold text-slate-900">{summary.learning_progress_pct}%</span>
              </div>
              <Progress value={summary.learning_progress_pct} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
