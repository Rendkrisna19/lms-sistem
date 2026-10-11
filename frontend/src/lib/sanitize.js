import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup", "mark", "code", "pre",
  "blockquote", "ul", "ol", "li", "h2", "h3", "h4", "span", "hr", "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title", "width", "height", "style", "colspan", "rowspan", "start"];

/**
 * Lapisan pertahanan kedua sebelum HTML ditampilkan (server juga membersihkan saat menyimpan).
 */
export function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/))/i,
  });
}

/** Konten HTML dianggap kosong bila tidak ada teks maupun gambar. */
export function isHtmlBlank(html) {
  if (!html) return true;
  if (/<img\s/i.test(html)) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/ /g, " ");
  return text.trim() === "";
}

/** Ringkasan teks polos dari HTML (untuk daftar / navigasi soal). */
export function htmlToPlainText(html, maxLength = 120) {
  if (!html) return "";
  const text = html
    .replace(/<img[^>]*>/gi, " [gambar] ")
    .replace(/<\/(p|li|h\d)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
