import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { adminApi } from "../../../features/admin/adminApi";
import { getErrorMessage } from "../../../lib/api";
import { cn } from "../../../lib/utils";

const ACCEPT = ".xlsx,.xls,.csv";

function SummaryTile({ label, value, tone }) {
  return (
    <div className={cn("rounded-xl border px-4 py-3", tone)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Impor data guru atau siswa dari Excel.
 * Langkah: unduh template -> pilih berkas -> periksa (belum menyimpan) -> impor bila semua baris valid.
 */
export function ImportDialog({ open, onClose, resource, label, params, onImported }) {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const reset = () => {
    setFile(null);
    setReport(null);
  };

  const handleClose = () => {
    if (isChecking || isImporting) return;
    reset();
    onClose();
  };

  const check = async () => {
    setIsChecking(true);
    try {
      const res = await adminApi.importFile(resource, file, { dryRun: true }, params);
      setReport(res.data);
    } catch (err) {
      const data = err.response?.data?.data;
      if (data) setReport(data);
      else toast.error(getErrorMessage(err, "Berkas tidak dapat diperiksa."));
    } finally {
      setIsChecking(false);
    }
  };

  const importNow = async () => {
    setIsImporting(true);
    try {
      const res = await adminApi.importFile(resource, file, { dryRun: false }, params);
      toast.success(res.message);
      reset();
      onImported?.();
      onClose();
    } catch (err) {
      const data = err.response?.data?.data;
      if (data) setReport(data);
      toast.error(getErrorMessage(err, "Impor dibatalkan. Perbaiki baris yang bermasalah."));
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await adminApi.downloadTemplate(resource, params);
    } catch (err) {
      toast.error(getErrorMessage(err, "Template tidak dapat diunduh."));
    } finally {
      setIsDownloading(false);
    }
  };

  const canImport = Boolean(report?.can_import);
  const hasErrors = report && report.errors?.length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      dismissible={!isChecking && !isImporting}
      size="lg"
      title={`Impor data ${label} dari Excel`}
      description="Periksa berkas dahulu. Data baru disimpan hanya jika semua baris valid."
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isChecking || isImporting}>
            Tutup
          </Button>
          {!report ? (
            <Button onClick={check} disabled={!file} isLoading={isChecking}>
              Periksa berkas
            </Button>
          ) : (
            <Button variant="success" onClick={importNow} disabled={!canImport} isLoading={isImporting}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {canImport ? `Impor ${report.valid} data` : "Perbaiki baris dahulu"}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
            <div className="text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Gunakan template resmi</p>
              <p className="text-xs text-slate-600">Kolom sudah rapi dan diberi dropdown kelas. Maksimal 500 baris per berkas.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} isLoading={isDownloading} className="shrink-0">
            <Download className="h-4 w-4" aria-hidden="true" />
            Unduh template
          </Button>
        </div>

        {!report && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40">
            <Upload className="h-6 w-6 text-brand-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-800">{file ? file.name : "Pilih berkas Excel"}</span>
            <span className="text-xs text-slate-500">.xlsx, .xls, atau .csv · maksimal 5 MB</span>
            <input type="file" accept={ACCEPT} className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={isChecking} />
          </label>
        )}

        {report && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <SummaryTile label="Baris dibaca" value={report.total} tone="border-slate-200 bg-slate-50 text-slate-900" />
              <SummaryTile label="Siap diimpor" value={report.valid} tone="border-emerald-200 bg-emerald-50 text-emerald-800" />
              <SummaryTile label="Perlu diperbaiki" value={report.error_rows} tone={report.error_rows ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-500"} />
            </div>

            <p className={cn("flex items-center gap-2 text-sm font-semibold", hasErrors ? "text-red-700" : "text-emerald-700")}>
              {hasErrors ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              {hasErrors
                ? "Ada data yang perlu diperbaiki. Perbaiki di berkas Excel, lalu unggah ulang."
                : `Semua baris valid. ${report.valid} ${label.toLowerCase()} siap ditambahkan.`}
            </p>

            {hasErrors && (
              <div className="max-h-64 overflow-auto rounded-xl border border-red-200">
                <Table>
                  <TableHeader className="sticky top-0 bg-red-600">
                    <TableRow className="hover:bg-red-600">
                      <TableHead className="h-9 px-3 text-white">Baris</TableHead>
                      <TableHead className="h-9 px-3 text-white">Kolom</TableHead>
                      <TableHead className="h-9 px-3 text-white">Masalah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-red-100">
                    {report.errors.map((error, index) => (
                      <TableRow key={`${error.row}-${index}`}>
                        <TableCell className="px-3 py-2 font-mono text-xs tabular-nums">{error.row}</TableCell>
                        <TableCell className="px-3 py-2 text-xs font-semibold text-slate-700">{error.column}</TableCell>
                        <TableCell className="px-3 py-2 text-xs text-red-700">{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {report.preview?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pratinjau baris valid</p>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <Table>
                    <TableHeader className="bg-brand-600">
                      <TableRow className="hover:bg-brand-600">
                        <TableHead className="h-9 px-3 text-white">Nama</TableHead>
                        <TableHead className="h-9 px-3 text-white">{resource === "teachers" ? "NIP" : "NIS"}</TableHead>
                        <TableHead className="h-9 px-3 text-white">Email</TableHead>
                        <TableHead className="h-9 px-3 text-white">Kelas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {report.preview.map((row) => (
                        <TableRow key={row.row}>
                          <TableCell className="px-3 py-2 text-xs font-semibold text-slate-900">{row.name}</TableCell>
                          <TableCell className="px-3 py-2 font-mono text-xs">{row.nomor_induk}</TableCell>
                          <TableCell className="px-3 py-2 text-xs">{row.email}</TableCell>
                          <TableCell className="px-3 py-2 text-xs">{row.classroom_code ?? "–"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                reset();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Pilih berkas lain
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
