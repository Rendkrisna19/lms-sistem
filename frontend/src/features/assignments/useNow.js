import { useEffect, useState } from "react";

/** Waktu sekarang yang diperbarui berkala, untuk hitung mundur tenggat. */
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
