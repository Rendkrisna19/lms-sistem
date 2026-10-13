import { api } from "./api";

/** Nama berkas dari header Content-Disposition, atau nama cadangan bila tidak ada. */
function fileNameFrom(res, fallbackName) {
  const disposition = res.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallbackName;
}

/** Memicu unduhan dari blob yang sudah diterima. */
export function saveBlob(res, fallbackName) {
  const fileName = fileNameFrom(res, fallbackName);
  const objectUrl = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/** Unduh berkas dari endpoint GET yang membutuhkan token (mis. ekspor CSV, template Excel). */
export async function downloadFromApi(url, fallbackName, config = {}) {
  const res = await api.get(url, { ...config, responseType: "blob" });
  saveBlob(res, fallbackName);
}

/** Unduh berkas dari endpoint POST (mis. ekspor baris yang dipilih). */
export async function postDownload(url, body, fallbackName, config = {}) {
  const res = await api.post(url, body, { ...config, responseType: "blob" });
  saveBlob(res, fallbackName);
}
