/** Tautan embed YouTube dari URL tonton / pendek. Null bila bukan tautan YouTube. */
export function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
}

/** Tautan pratinjau Google Drive (view → preview). */
export function getDrivePreviewUrl(url) {
  if (!url) return null;
  return url.replace(/\/view(\?.*)?$/, "/preview");
}
