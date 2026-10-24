import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getStockByCategory } from "../queries/get-stock-by-category";

export async function StockByCategory() {
  const rows = await getStockByCategory();

  return (
    <Card title="Stock by category">
      {rows.length === 0 ? (
        <p className="px-5 pb-5 pt-3 text-sm text-muted">
          No published products yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 px-5 pb-5 pt-4">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-foreground">
                {row.name}
              </span>

              <ProgressBar
                value={row.inStock}
                max={row.total}
                label={`${row.name} stock`}
              />

              <span className="w-24 shrink-0 text-right text-[11px] text-muted">
                {row.inStock}/{row.total} In Stock
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
