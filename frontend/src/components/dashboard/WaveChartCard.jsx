import React from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export function WaveChartCard({ role }) {
  const scoreText = role === "admin" ? "84.8 / 100" : role === "guru" ? "85.0 / 100" : "96.0 / 100";

  return (
    <Card className="lg:col-span-3 bg-white border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <CardHeader className="p-0 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-bold text-slate-900">Performa & Nilai</span>
          </div>
          <Badge variant="secondary" className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 border-none">
            Mingguan
          </Badge>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {scoreText}
            </h3>
            <Badge variant="success" className="text-[11px] font-bold px-1.5 py-0.5 border-none">
              +8.2%
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Rata-rata evaluasi kelas</p>
        </div>
      </CardHeader>

      {/* Smooth Curved SVG Wave Chart with Soft Gradient */}
      <CardContent className="p-0 relative mt-4 h-28 w-full overflow-hidden">
        <svg viewBox="0 0 200 90" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,60 C 40,75 80,40 120,50 C 160,60 180,20 200,25 L 200,90 L 0,90 Z"
            fill="url(#waveGradient)"
          />
          <path
            d="M 0,60 C 40,75 80,40 120,50 C 160,60 180,20 200,25"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="120" cy="50" r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
        </svg>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
          85.0
        </div>
      </CardContent>
    </Card>
  );
}
