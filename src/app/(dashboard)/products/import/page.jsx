import { Upload } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { connectDb } from "@/db/connect";
import { Product } from "@/models/product.model";
import { ProductImport } from "@/features/catalog/components/product-import";
import { getProductCategoryOptions } from "@/features/catalog/queries/get-product-category-options";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata = { title: "Import products | AKT Gifting Admin" };

/**
 * Bulk CSV import — products and their stock in one file.
 *
 * The page hands the importer two small lists: the categories (so the preview
 * can check names before anything is sent) and the SKUs already in use (so
 * it can say which rows create and which update). Both are re-checked on the
 * server for every row.
 */
export default async function ImportProductsPage() {
  await requireAdmin();
  await connectDb();

  const [groups, skus] = await Promise.all([
    getProductCategoryOptions(),
    Product.distinct("sku", { isDeleted: false, sku: { $type: "string" } }),
  ]);

  const categories = groups.flatMap((group) =>
    group.subcategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      parentName: group.name,
    }))
  );

  return (
    <>
      <PageHeader
        width="narrow"
        backHref="/products"
        title="Import products"
        icon={<Upload className="h-5 w-5" strokeWidth={2} />}
        subtitle="Add or update up to 1,000 products — with photos, SKUs, stock and SEO — from one CSV."
      />
      <PageBody width="narrow">
        <ProductImport categories={categories} existingSkus={skus} />
      </PageBody>
    </>
  );
}
