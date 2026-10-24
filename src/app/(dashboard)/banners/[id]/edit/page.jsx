import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { BannerForm } from "@/features/banners/components/banner-form";
import { getBanner } from "@/features/banners/queries/get-banners";
import { requireAdmin } from "@/lib/auth/dal";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const banner = await getBanner(id);

  return { title: `${banner?.name ?? "Banner"} | AKT Gifting Admin` };
}

export default async function EditBannerPage({ params }) {
  await requireAdmin();

  const { id } = await params;
  const banner = await getBanner(id);

  if (!banner) notFound();

  return (
    <>
      <PageHeader
        title={banner.name}
        subtitle={
          banner.isActive
            ? "Live on the storefront home page — changes go out as soon as you save."
            : "A draft. Publish it to replace the current hero."
        }
      />

      <div className="px-6 py-6 sm:px-8">
        <Link
          href="/banners"
          className="font-nunito text-sm text-muted underline-offset-2 hover:underline"
        >
          ← All banners
        </Link>

        <div className="mt-6 max-w-4xl">
          <BannerForm banner={banner} />
        </div>
      </div>
    </>
  );
}
