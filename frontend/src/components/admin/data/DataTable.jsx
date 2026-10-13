import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Skeleton } from "../../ui/skeleton";
import { EmptyState } from "../../ui/empty-state";
import { cn } from "../../../lib/utils";

const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * Tabel data admin: header biru, judul kolom yang dapat diurutkan, dan status kosong / memuat.
 *
 * @param {object} props
 * @param {Array<{key: string, label: string, sortKey?: string, align?: "left"|"center"|"right", className?: string, render: (row, index) => React.ReactNode}>} props.columns
 * @param {Array} props.rows              baris pada halaman ini
 * @param {(row) => string|number} props.rowKey
 * @param {{key: string, dir: "asc"|"desc"}} props.sort
 * @param {(sortKey: string) => void} props.onSort
 * @param {boolean} props.isLoading
 * @param {string} props.emptyTitle
 * @param {string} props.emptyDescription
 * @param {number} props.startIndex       nomor urut baris pertama pada halaman ini (dimulai dari 1)
 */
export function DataTable({ columns, rows, rowKey, sort, onSort, isLoading, emptyTitle, emptyDescription, startIndex = 1 }) {
  const columnCount = columns.length;

  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-sm">
        <TableHeader className="bg-brand-600">
          <TableRow className="border-brand-700 hover:bg-brand-600">
            {columns.map((column) => {
              const isSorted = column.sortKey && sort.key === column.sortKey;
              const Icon = !column.sortKey ? null : !isSorted ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <TableHead
                  key={column.key}
                  aria-sort={isSorted ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "h-11 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-wider text-white",
                    ALIGN[column.align ?? "left"],
                    column.className
                  )}
                >
                  {column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-white/10",
                        column.align === "center" && "mx-auto",
                        column.align === "right" && "ml-auto"
                      )}
                    >
                      {column.label}
                      <Icon className={cn("h-3.5 w-3.5", isSorted ? "text-white" : "text-white/60")} aria-hidden="true" />
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={columnCount} className="px-4 py-3">
                  <Skeleton className="h-6 w-full rounded-lg" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="p-0">
                <EmptyState icon={undefined} title={emptyTitle} description={emptyDescription} className="py-12" />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={rowKey(row)} className="transition-colors hover:bg-brand-50/50">
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn("px-4 py-3 align-middle text-slate-700", ALIGN[column.align ?? "left"], column.className)}
                  >
                    {column.render(row, startIndex - 1 + index)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
