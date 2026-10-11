import { ClipboardList } from "lucide-react";
import { EditorSection } from "./EditorSection";
import { AssignmentPicker } from "./AssignmentPicker";
import { Field } from "../../ui/field";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { cn } from "../../../lib/utils";

function NumberWithSuffix({ id, value, onChange, suffix, min, max, invalid }) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={cn("pr-16 rounded-xl tabular-nums", invalid && "border-red-400 focus-visible:ring-red-300")}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{suffix}</span>
    </div>
  );
}

export function QuizDetailsCard({ state, setField, errors, assignedOptions }) {
  return (
    <EditorSection id="section-details" icon={ClipboardList} title="Informasi Ujian" description="Tentukan kelas tujuan, judul, durasi, dan nilai KKM.">
      <div className="space-y-5">
        <AssignmentPicker
          options={assignedOptions}
          value={state.assignmentKey}
          onChange={(value) => setField("assignmentKey", value)}
          error={errors.assignment}
        />

        <Field label="Judul ujian" htmlFor="field-title" required error={errors.title}>
          <Input
            id="field-title"
            value={state.title}
            maxLength={255}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Contoh: Kuis 01 — Normalisasi Basis Data"
            aria-invalid={!!errors.title || undefined}
            aria-describedby={errors.title ? "field-title-error" : undefined}
            className={cn("rounded-xl", errors.title && "border-red-400")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Durasi pengerjaan" htmlFor="field-duration" required error={errors.duration_minutes} hint="1–600 menit, dihitung sejak siswa menekan Mulai.">
            <NumberWithSuffix
              id="field-duration"
              value={state.duration_minutes}
              onChange={(value) => setField("duration_minutes", value)}
              suffix="menit"
              min={1}
              max={600}
              invalid={!!errors.duration_minutes}
            />
          </Field>
          <Field label="Nilai KKM" htmlFor="field-passing" required error={errors.passing_score} hint="Nilai minimum kelulusan (skala 0–100).">
            <NumberWithSuffix
              id="field-passing"
              value={state.passing_score}
              onChange={(value) => setField("passing_score", value)}
              suffix="/ 100"
              min={0}
              max={100}
              invalid={!!errors.passing_score}
            />
          </Field>
        </div>

        <Field label="Petunjuk pengerjaan" htmlFor="field-instructions" hint="Ditampilkan kepada siswa sebelum ujian dimulai.">
          <Textarea
            id="field-instructions"
            rows={3}
            maxLength={5000}
            value={state.instructions}
            onChange={(event) => setField("instructions", event.target.value)}
            placeholder="Contoh: Kerjakan secara mandiri. Dilarang membuka tab lain selama ujian."
          />
        </Field>
      </div>
    </EditorSection>
  );
}
