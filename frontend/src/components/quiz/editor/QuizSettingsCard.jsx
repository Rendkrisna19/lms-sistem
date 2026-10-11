import { Settings2 } from "lucide-react";
import { EditorSection } from "./EditorSection";
import { Switch } from "../../ui/switch";
import { Field } from "../../ui/field";
import { Input } from "../../ui/input";
import { cn } from "../../../lib/utils";

const timeZoneLabel = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "waktu perangkat";
  }
})();

export function QuizSettingsCard({ state, setField, errors }) {
  return (
    <EditorSection icon={Settings2} title="Pengaturan" bodyClassName="space-y-5">
      <Switch
        label="Aktifkan ujian"
        description={state.is_active ? "Siswa dapat melihat & mengerjakan sesuai jadwal." : "Disimpan sebagai draf, belum terlihat oleh siswa."}
        checked={state.is_active}
        onCheckedChange={(value) => setField("is_active", value)}
        tone="success"
      />

      <Switch
        label="Tampilkan nilai ke siswa"
        description="Nilai langsung terlihat setelah siswa mengumpulkan. Matikan untuk mengumumkan nanti."
        checked={state.show_result_immediately}
        onCheckedChange={(value) => setField("show_result_immediately", value)}
      />

      <div className="border-t border-slate-100 pt-5 space-y-4">
        <Switch
          label="Jadwal buka & tutup"
          description="Batasi rentang waktu ujian dapat dimulai."
          checked={state.hasSchedule}
          onCheckedChange={(value) => setField("hasSchedule", value)}
        />

        {state.hasSchedule && (
          <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <Field label="Dibuka" htmlFor="field-starts" error={errors.starts_at}>
              <Input
                id="field-starts"
                type="datetime-local"
                value={state.starts_at}
                onChange={(event) => setField("starts_at", event.target.value)}
                aria-invalid={!!errors.starts_at || undefined}
                className={cn("rounded-xl", errors.starts_at && "border-red-400")}
              />
            </Field>
            <Field label="Ditutup" htmlFor="field-ends" error={errors.ends_at}>
              <Input
                id="field-ends"
                type="datetime-local"
                value={state.ends_at}
                min={state.starts_at || undefined}
                onChange={(event) => setField("ends_at", event.target.value)}
                aria-invalid={!!errors.ends_at || undefined}
                className={cn("rounded-xl", errors.ends_at && "border-red-400")}
              />
            </Field>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Zona waktu: <strong>{timeZoneLabel}</strong>. Batas waktu siswa tidak akan melewati jadwal ditutup.
            </p>
          </div>
        )}
      </div>
    </EditorSection>
  );
}
