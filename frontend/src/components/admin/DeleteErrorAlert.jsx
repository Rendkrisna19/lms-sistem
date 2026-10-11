import { Alert } from "../ui/alert";

/** Pesan gagal hapus dari server, termasuk daftar data terkait (`dependencies`) bila ada. */
export function DeleteErrorAlert({ error }) {
  if (!error) return null;
  const dependencies = error.dependencies && typeof error.dependencies === "object" ? Object.entries(error.dependencies) : [];

  return (
    <Alert variant="danger" title="Tidak dapat dihapus" className="mt-3">
      <p>{error.message}</p>
      {dependencies.length > 0 && (
        <ul className="mt-2 list-disc pl-4 space-y-0.5">
          {dependencies.map(([label, count]) => (
            <li key={label}>
              <span className="font-semibold tabular-nums">{count}</span> {label}
            </li>
          ))}
        </ul>
      )}
    </Alert>
  );
}
