import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "../../ui/button";

/** Tombol ekspor Excel dan PDF untuk daftar yang sedang tampil. */
export function ExportButtons({ onExport, disabled, busyFormat }) {
  return (
    <>
      <Button variant="ghost" size="sm" className="text-slate-700" onClick={() => onExport("xlsx")} disabled={disabled} isLoading={busyFormat === "xlsx"}>
        <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        Export Excel
      </Button>
      <Button variant="ghost" size="sm" className="text-slate-700" onClick={() => onExport("pdf")} disabled={disabled} isLoading={busyFormat === "pdf"}>
        <FileText className="h-4 w-4 text-red-600" aria-hidden="true" />
        Export PDF
      </Button>
    </>
  );
}
