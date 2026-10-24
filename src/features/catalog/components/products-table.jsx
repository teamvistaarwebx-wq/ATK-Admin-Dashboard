import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_STATUS } from "@/constants/enums";
import { formatPrice } from "@/lib/format";
import { DeleteProductButton } from "./delete-product-button";

/**
 * The catalogue table, laid out like Shopify's product index: thumbnail and
 * title, a status badge, inventory as a count ("4 in stock", red when it is
 * at or under the product's warning level), then category, type and price.
 *
 * A server component: nothing in a row is interactive except the two action
 * controls, and only one of those needs state. Hoisted at module scope so the
 * icon elements are built once for the whole page, not once per row.
 */
const EDIT_ICON = <Pencil className="h-4 w-4" strokeWidth={2} />;
const DELETE_ICON = <Trash2 className="h-4 w-4" strokeWidth={2} />;

const STATUS_BADGE = {
  [PRODUCT_STATUS.ACTIVE]: { tone: "success", label: "Active" },
  [PRODUCT_STATUS.DRAFT]: { tone: "info", label: "Draft" },
  [PRODUCT_STATUS.ARCHIVED]: { tone: "neutral", label: "Archived" },
};

export function ProductsTable({
  items,
  canDelete,
  buildEditHref,
  showStock = true,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] text-left text-[0.8125rem]">
        <thead className="border-y border-border bg-surface-subdued text-xs text-muted">
          <tr>
            <th scope="col" className="py-2 pl-4 pr-3 font-medium">
              Product
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Status
            </th>
            {showStock ? (
              <th scope="col" className="px-3 py-2 font-medium">
                Inventory
              </th>
            ) : null}
            <th scope="col" className="px-3 py-2 font-medium">
              Category
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Type
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Price
            </th>
            <th scope="col" className="py-2 pl-3 pr-4">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {items.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              canDelete={canDelete}
              showStock={showStock}
              editHref={buildEditHref(product.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductRow({ product, canDelete, showStock, editHref }) {
  const status = STATUS_BADGE[product.status] ?? STATUS_BADGE[PRODUCT_STATUS.DRAFT];

  return (
    <tr className="group transition hover:bg-surface-subdued">
      <td className="py-2 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-subdued">
            {product.imageUrl ? (
              /**
               * A plain <img>, not next/image: these are thumbnails on an
               * internal page, and next/image would need every storefront
               * host allow-listed in next.config.mjs to render them.
               *
               * Empty alt because the title sits right beside it — a screen
               * reader announcing it twice is noise, not information.
               */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0">
            {/* Opens the drawer over this list, keeping the active filters —
                editing the third Saree lands back among the Sarees. */}
            <Link
              href={editHref}
              className="line-clamp-2 font-semibold text-foreground hover:underline"
            >
              {product.title}
            </Link>
            {product.sku ? (
              <p className="truncate text-xs text-muted">{product.sku}</p>
            ) : null}
          </div>
        </div>
      </td>

      <td className="px-3 py-2">
        <Badge tone={status.tone}>{status.label}</Badge>
      </td>

      {showStock ? (
        <td className="whitespace-nowrap px-3 py-2">
          <Inventory product={product} />
        </td>
      ) : null}

      <td className="px-3 py-2 text-foreground">{product.category || "—"}</td>
      <td className="px-3 py-2 text-foreground">{product.type || "—"}</td>

      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground">
        {/* Variant products price from their cheapest active variant, so the
            figure is a floor rather than the price. */}
        {product.priceVaries ? "From " : ""}
        {formatPrice(product.price)}
      </td>

      <td className="py-2 pl-3 pr-4">
        <div className="flex items-center justify-end gap-0.5 opacity-60 transition group-hover:opacity-100">
          <Link
            href={editHref}
            aria-label={`Edit ${product.title}`}
            className="rounded-lg p-1.5 text-muted transition hover:bg-black/5 hover:text-foreground"
          >
            {EDIT_ICON}
          </Link>

          {canDelete ? (
            <DeleteProductButton
              id={product.id}
              title={product.title}
              icon={DELETE_ICON}
            />
          ) : null}
        </div>
      </td>
    </tr>
  );
}

/**
 * "Inventory not tracked" when nothing is counted, otherwise the sellable
 * count — red at or under the warning level, the way Shopify flags it.
 */
function Inventory({ product }) {
  if (!product.trackInventory) {
    return <span className="text-muted">Inventory not tracked</span>;
  }

  const low = product.available <= product.lowStockThreshold;

  return (
    <span className={low ? "text-danger" : "text-foreground"}>
      {product.available} in stock
      {product.allowBackorder && product.available <= 0 ? (
        <span className="text-muted"> · backorder</span>
      ) : null}
    </span>
  );
}
