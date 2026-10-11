import React from "react";
import { FileText, Volume2, Video } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { toast } from "sonner";

export function DiagnosticsCard() {
  return (
    <Card className="lg:col-span-3 bg-white border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <CardHeader className="p-0 pb-3 border-b border-slate-100 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Aktivitas Akademik
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Membuka log aktivitas lengkap.")}
            className="h-auto p-0 text-xs text-brand-600 hover:text-brand-700 font-bold hover:underline cursor-pointer"
          >
            Lihat Semua &gt;
          </Button>
        </CardHeader>

        <CardContent className="p-0 mt-3.5 space-y-3">
          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Modul 01: Teori Array</p>
                <p className="text-[11px] text-slate-400">Model 1 • Dokumen</p>
              </div>
            </div>
            <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
              Selesai
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Volume2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Audio Vokal Guru</p>
                <p className="text-[11px] text-slate-400">Model 2 • 12m 25s</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-brand-700 border-blue-200">
              Diputar
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Video className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Video Tutorial HD</p>
                <p className="text-[11px] text-slate-400">Model 3 • Simulasi</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
              1080p
            </Badge>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
