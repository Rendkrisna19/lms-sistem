import { RotateCcw, Undo2 } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

/**
 * Kendali ujian ulang untuk satu siswa:
 * - remedial yang belum dibuka aksesnya: tombol "Buka ulang",
 * - akses sudah dibuka tetapi belum dipakai: status + tombol "Cabut",
 * - selain itu: tampilkan nomor percobaan saja.
 */
export function RetakeControl({ row, busy, onGrant, onRevoke }) {
  if (row.retake_granted) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <Badge variant="indigo" className="gap-1">
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Akses dibuka
        </Badge>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500" onClick={onRevoke} isLoading={busy} disabled={busy}>
          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
          Cabut akses
        </Button>
      </div>
    );
  }

  if (row.can_grant_retake) {
    return (
      <Button size="sm" variant="secondary" onClick={onGrant} isLoading={busy} disabled={busy} className="h-8 text-xs">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Buka ujian ulang
      </Button>
    );
  }

  if (row.attempt_no > 1) {
    return <span className="text-xs text-slate-500">Percobaan ke-{row.attempt_no}</span>;
  }

  return <span className="text-slate-300">–</span>;
}
