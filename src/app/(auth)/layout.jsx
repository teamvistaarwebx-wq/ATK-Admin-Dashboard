import Image from "next/image";

/**
 * Split shell for the two unauthenticated screens. The brand panel collapses
 * away below `lg` so a phone gets the form and nothing else.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-brand px-12 py-14 lg:flex">
        <Image
          src="/images/logo/logo.svg"
          alt="Atulya Karigari"
          width={175}
          height={59}
          priority
          // The optimizer passes SVG through untouched, so the round trip
          // through /_next/image would only add a hop.
          unoptimized
        />

        <div className="max-w-sm">
          <h2 className="font-newsreader text-3xl leading-snug text-white">
            Gifts woven from the heart of artisans.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Manage the catalogue, banners, orders and corporate gifting
            enquiries behind the Karigari storefront.
          </p>
        </div>

        <p className="text-xs text-white/50">
          Atulya Karigari · Admin
        </p>
      </aside>

      <main className="flex items-center justify-center bg-surface px-6 py-14 sm:px-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
