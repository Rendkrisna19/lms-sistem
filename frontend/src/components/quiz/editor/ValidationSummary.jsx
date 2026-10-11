import { Alert } from "../../ui/alert";

/** Ringkasan kesalahan setelah gagal menyimpan, dengan tautan ke lokasi kesalahan. */
export function ValidationSummary({ errors, onJump, onDismiss }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  const shown = entries.slice(0, 6);

  return (
    <Alert variant="danger" title={`Periksa kembali ${entries.length} isian sebelum menyimpan`} onDismiss={onDismiss}>
      <ul className="mt-1 space-y-1">
        {shown.map(([key, message]) => (
          <li key={key}>
            <button type="button" onClick={() => onJump(key)} className="text-left underline decoration-red-300 underline-offset-2 hover:decoration-red-600">
              {message}
            </button>
          </li>
        ))}
        {entries.length > shown.length && <li className="opacity-75">…dan {entries.length - shown.length} lainnya.</li>}
      </ul>
    </Alert>
  );
}
