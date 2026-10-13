/** Ilustrasi geometris untuk panel kiri halaman login: lingkaran, busur, chevron, dan titik-titik. Murni dekoratif. */
export function AuthHeroArt() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 640" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <linearGradient id="auth-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="600" height="640" fill="url(#auth-sheen)" />
      <circle cx="520" cy="60" r="150" fill="#ffffff" fillOpacity="0.09" />
      <circle cx="90" cy="520" r="120" fill="#ffffff" fillOpacity="0.08" />
      <circle cx="430" cy="470" r="70" fill="#93C5FD" fillOpacity="0.22" />
      <circle cx="40" cy="120" r="34" fill="#ffffff" fillOpacity="0.12" />
      <path d="M 300 40 A 220 220 0 0 1 520 260" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
      <path d="M 70 380 A 160 160 0 0 0 230 540" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="2" />
      <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 52 210 L 70 228 L 88 210" />
        <path d="M 52 236 L 70 254 L 88 236" />
        <path d="M 470 360 L 488 378 L 506 360" />
        <path d="M 470 386 L 488 404 L 506 386" />
      </g>
      <g fill="#ffffff" fillOpacity="0.3">
        {Array.from({ length: 7 }).flatMap((_, row) =>
          Array.from({ length: 6 }).map((__, col) => (
            <circle key={`d-${row}-${col}`} cx={330 + col * 18} cy={380 + row * 18} r="2" />
          ))
        )}
      </g>
    </svg>
  );
}
