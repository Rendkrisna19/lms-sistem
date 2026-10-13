import { useParams } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { ROLES } from "../../lib/navigation";
import { TeacherAssignmentDetail } from "../../components/assignments/TeacherAssignmentDetail";
import { StudentAssignmentDetail } from "../../components/assignments/StudentAssignmentDetail";

/** Detail penugasan sesuai role: guru melihat pengumpulan, siswa mengumpulkan jawaban. */
export function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const { role } = useAuth();

  return role === ROLES.TEACHER ? (
    <TeacherAssignmentDetail assignmentId={assignmentId} />
  ) : (
    <StudentAssignmentDetail assignmentId={assignmentId} />
  );
}
