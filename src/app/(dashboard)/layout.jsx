import { requireAdmin } from "@/lib/auth/dal";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

/**
 * Every authenticated screen hangs off here. `requireAdmin()` runs before any
 * child does, and because `getSession()` is cache()-wrapped the pages
 * underneath can ask again for free.
 *
 * Shopify's frame: a dark sidebar on the left, the page on a grey canvas to
 * the right. On a phone the sidebar folds into a top bar and a slide-over.
 */
export default async function DashboardLayout({ children }) {
  const session = await requireAdmin();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar lg:flex-row">
      <aside className="hidden w-60 shrink-0 lg:block">
        <AdminSidebar session={session} />
      </aside>

      <MobileNav>
        <AdminSidebar session={session} />
      </MobileNav>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background lg:my-2 lg:mr-2 lg:rounded-xl">
        {children}
      </div>
    </div>
  );
}
