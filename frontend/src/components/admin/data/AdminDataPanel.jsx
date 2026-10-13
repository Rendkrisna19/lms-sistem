import { Card } from "../../ui/card";
import { Pagination } from "../../ui/pagination";

/**
 * Kerangka halaman daftar admin.
 * - `actions`: tombol pendukung (segarkan, impor, ekspor), dikelompokkan dalam satu bilah.
 * - `primaryAction`: satu tombol utama (mis. "Tambah guru") yang berdiri sendiri di kanan.
 */
export function AdminDataPanel({ icon: Icon, title, description, actions, primaryAction, notice, toolbar, table, pagination }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          </div>
          {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:shrink-0 xl:justify-end">
          {actions && (
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 p-1">{actions}</div>
          )}
          {primaryAction}
        </div>
      </div>

      {notice && <div className="border-b border-slate-100 px-5 py-3">{notice}</div>}

      {toolbar}
      {table}

      {pagination && (
        <div className="border-t border-slate-100 px-4 py-3">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.pageSize}
            onPageChange={pagination.onPageChange}
            itemName={pagination.itemName}
          />
        </div>
      )}
    </Card>
  );
}
