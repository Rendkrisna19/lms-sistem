import { RefreshCw } from "lucide-react";
import { Alert } from "./alert";
import { Button } from "./button";

/** Alert error pemuatan data dengan tombol "Coba lagi". Tidak dirender bila `error` kosong. */
export function QueryError({ error, onRetry, title = "Gagal memuat data", className }) {
  if (!error) return null;
  return (
    <Alert
      variant="danger"
      title={title}
      className={className}
      action={
        onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </Button>
        )
      }
    >
      {error}
    </Alert>
  );
}
