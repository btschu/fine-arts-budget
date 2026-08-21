import { formatCurrency } from "@/lib/format";
import { categoryBadgeClass } from "@/lib/categoryColors";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";

export type CategoryBreakdownItem = {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  allocatedAmount: number;
  spent: number;
};

export default function CategoryBreakdown({
  schoolYearId,
  categories,
  admin,
}: {
  schoolYearId: string;
  categories: CategoryBreakdownItem[];
  admin: boolean;
}) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Budget categories
        </h2>
        {admin && (
          <ManageCategoriesModal
            schoolYearId={schoolYearId}
            categories={categories}
          />
        )}
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No budget categories set up yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {categories.map((c) => {
            const remaining = c.allocatedAmount - c.spent;
            return (
              <div
                key={c.id}
                className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <span
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${categoryBadgeClass(c.color)}`}
                >
                  {c.name}
                  {c.isDefault && <span className="opacity-70">· default</span>}
                </span>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    remaining < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {formatCurrency(remaining)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatCurrency(c.spent)} of {formatCurrency(c.allocatedAmount)} spent
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
