import { requireAdmin } from "@/lib/auth/dal";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

/**
 * Every authenticated screen hangs off here. `requireAdmin()` runs before any
 * child does, and because `getSession()` is cache()-wrapped the pages
 * underneath can ask again for free.
 */
export default async function DashboardLayout({ children }) {
  const session = await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-60 shrink-0 lg:block">
        <AdminSidebar session={session} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
