import { memo, useMemo } from "react";
import { sanitizeHtml } from "../../lib/sanitize";
import { cn } from "../../lib/utils";

/** Menampilkan HTML hasil editor (soal, opsi, pembahasan) setelah disanitasi. */
export const RichContent = memo(function RichContent({ html, className, as: Tag = "div" }) {
  const safeHtml = useMemo(() => sanitizeHtml(html), [html]);
  if (!safeHtml) return null;
  return <Tag className={cn("rich-content", className)} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
});
