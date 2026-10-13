import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

/**
 * Diagram batang sederhana dari data nyata.
 * items: [{ key, label, fullLabel, value }]. Tanpa data, tampilkan pesan kosong (bukan contoh angka).
 */
export function BarChartCard({ title, items = [], isLoading = false, emptyText = "Belum ada data untuk ditampilkan." }) {
  const [activeKey, setActiveKey] = useState(null);
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <Card className="bg-white border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <CardHeader className="p-0 pb-4 border-b border-slate-100 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold text-slate-900">{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-6 pb-2">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">{emptyText}</div>
        ) : (
          <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
            {items.map((item) => {
              const isSelected = activeKey === item.key;
              const heightPercent = (item.value / maxValue) * 100;

              return (
                <div
                  key={item.key}
                  onClick={() => {
                    setActiveKey(item.key);
                    toast.info(`${item.fullLabel ?? item.label}: ${item.value} siswa.`);
                  }}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {isSelected && (
                    <div className="mb-2 relative">
                      <div className="bg-[#2563EB] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md">{item.value}</div>
                    </div>
                  )}

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full max-w-[34px] rounded-full transition-all duration-300",
                      isSelected ? "bg-[#2563EB] shadow-md shadow-blue-500/30" : "bg-[#93C5FD] hover:bg-[#60A5FA]"
                    )}
                  />

                  <span
                    className={cn(
                      "text-[11px] mt-2.5 font-medium transition-colors truncate max-w-full",
                      isSelected ? "font-bold text-[#2563EB]" : "text-slate-400 group-hover:text-slate-700"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
