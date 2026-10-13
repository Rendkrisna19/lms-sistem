import { useAuth } from "../../lib/auth";
import { ROLES } from "../../lib/navigation";
import { PageHeader } from "../../components/ui/page-header";
import { TeacherAssignmentList } from "../../components/assignments/TeacherAssignmentList";
import { StudentAssignmentList } from "../../components/assignments/StudentAssignmentList";

/** Penugasan: guru mengelola tugas, siswa mengerjakannya. */
export function AssignmentsPage() {
  const { role } = useAuth();
  const isTeacher = role === ROLES.TEACHER;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penugasan"
        description={
          isTeacher
            ? "Berikan tugas dengan batas waktu, lalu pantau dan nilai pengumpulan siswa."
            : "Tugas dari guru beserta tenggat pengumpulannya."
        }
      />
      {isTeacher ? <TeacherAssignmentList /> : <StudentAssignmentList />}
    </div>
  );
}
