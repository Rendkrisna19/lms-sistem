import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export function BarChartCard({ role }) {
  const [chartPeriod, setChartPeriod] = useState("weekly");
  const [activeBarDay, setActiveBarDay] = useState(2); // Wednesday (Medlio default)

  const barChartDataWeekly = [
    { day: "Sen", fullDay: "Senin", value: 65, count: 65 },
    { day: "Sel", fullDay: "Selasa", value: 85, count: 85 },
    { day: "Rab", fullDay: "Rabu", value: 120, count: 120 },
    { day: "Kam", fullDay: "Kamis", value: 75, count: 75 },
    { day: "Jum", fullDay: "Jumat", value: 90, count: 90 },
    { day: "Sab", fullDay: "Sabtu", value: 45, count: 45 },
    { day: "Min", fullDay: "Minggu", value: 60, count: 60 },
  ];

  return (
    <Card className="lg:col-span-6 bg-white border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <CardHeader className="p-0 pb-4 border-b border-slate-100 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
            <BarChart3 className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold text-slate-900">
            {role === "admin"
              ? "Aktivitas Pengguna Harian"
              : role === "guru"
              ? "Akses Siswa per Bahan Ajar"
              : "Durasi Belajar Mandiri (Menit)"}
          </CardTitle>
        </div>

        {/* Period Pills (Interactive Medlio Controls using Shadcn Button) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setChartPeriod("daily");
              toast.info("Filter diubah ke: Hari Ini");
            }}
            className={cn(
              "h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-all",
              chartPeriod === "daily" ? "bg-white text-brand-700 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Hari Ini
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setChartPeriod("monthly");
              toast.info("Filter diubah ke: Bulanan");
            }}
            className={cn(
              "h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-all",
              chartPeriod === "monthly" ? "bg-white text-brand-700 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Bulanan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setChartPeriod("weekly");
              toast.info("Filter diubah ke: Mingguan");
            }}
            className={cn(
              "h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-all",
              chartPeriod === "weekly" ? "bg-white text-brand-700 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Mingguan
          </Button>
        </div>
      </CardHeader>

      {/* Chart Body: Rounded Pill Bars with Interactive Pointer Tooltip */}
      <CardContent className="p-0 pt-6 pb-2">
        <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
          {barChartDataWeekly.map((item, idx) => {
            const isSelected = activeBarDay === idx;
            const heightPercent = (item.value / 140) * 100;

            return (
              <div
                key={item.day}
                onClick={() => {
                  setActiveBarDay(idx);
                  toast.info(`${item.fullDay}: ${item.count} aktivitas tercatat.`);
                }}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Tooltip Bubble above Active Bar (Medlio Signature Feature) */}
                {isSelected && (
                  <div className="mb-2 relative animate-bounce">
                    <div className="bg-[#2563EB] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
                      {item.count}
                    </div>
                    <div className="w-1.5 h-1.5 bg-[#2563EB] rotate-45 mx-auto -mt-0.5" />
                  </div>
                )}

                {/* Bar Pillar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={cn(
                    "w-full max-w-[34px] rounded-full transition-all duration-300",
                    isSelected
                      ? "bg-[#2563EB] shadow-md shadow-blue-500/30"
                      : "bg-[#93C5FD] hover:bg-[#60A5FA]"
                  )}
                />

                {/* Day Label */}
                <span
                  className={cn(
                    "text-[11px] mt-2.5 font-medium transition-colors",
                    isSelected ? "font-bold text-[#2563EB]" : "text-slate-400 group-hover:text-slate-700"
                  )}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
