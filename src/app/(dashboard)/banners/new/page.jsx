import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BannerForm } from "@/features/banners/components/banner-form";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata = { title: "New banner | AKT Gifting Admin" };

export default async function NewBannerPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="New banner"
        subtitle="Upload the desktop and mobile artwork, then publish when it's ready."
      />

      <div className="px-6 py-6 sm:px-8">
        <Link
          href="/banners"
          className="font-nunito text-sm text-muted underline-offset-2 hover:underline"
        >
          ← All banners
        </Link>

        <div className="mt-6 max-w-4xl">
          <BannerForm />
        </div>
      </div>
    </>
  );
}
