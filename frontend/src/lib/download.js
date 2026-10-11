import { api } from "./api";

/** Unduh berkas dari endpoint yang membutuhkan token (mis. ekspor CSV). */
export async function downloadFromApi(url, fallbackName) {
  const res = await api.get(url, { responseType: "blob" });
  const disposition = res.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const fileName = match ? decodeURIComponent(match[1]) : fallbackName;

  const objectUrl = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
