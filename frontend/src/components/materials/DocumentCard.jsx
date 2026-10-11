import React from "react";
import { FileText, ExternalLink, Download } from "lucide-react";
import { Card, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { toast } from "sonner";

export function DocumentCard() {
  return (
    <Card className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 bg-blue-50 text-brand-700 text-xs font-semibold border-none">
            <FileText className="h-3.5 w-3.5" /> Model 1: Dokumen PDF
          </Badge>
          <span className="text-[11px] text-slate-400 font-mono">3.2 MB</span>
        </div>
        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
          Modul 01: Konsep Alokasi Memori dan Array
        </h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          Materi bacaan teori sistem indeks berbasis nol (zero-based index) dan alamat memori kontigu RAM.
        </p>
      </div>

      <CardFooter className="p-0 mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.info("Membuka In-App PDF Reader Cendekia.")}
          className="rounded-xl text-xs gap-1.5 cursor-pointer"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Baca Dokumen
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toast.success("Mengunduh file Modul_01_Array.pdf")}
          className="rounded-xl text-xs text-slate-500 hover:text-brand-600 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Unduh
        </Button>
      </CardFooter>
    </Card>
  );
}
