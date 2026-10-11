import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  itemName = "data",
}) {
  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-1 text-xs text-slate-500">
      <div className="text-center sm:text-left">
        Menampilkan{" "}
        <strong className="text-slate-800 font-semibold">{startItem}</strong> -{" "}
        <strong className="text-slate-800 font-semibold">{endItem}</strong> dari{" "}
        <strong className="text-slate-800 font-semibold">{totalItems}</strong> {itemName}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                ...
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <Button
              key={p}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(p)}
              className={`h-8 w-8 p-0 rounded-xl text-xs font-semibold cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xs border-transparent"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          title="Halaman Berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
