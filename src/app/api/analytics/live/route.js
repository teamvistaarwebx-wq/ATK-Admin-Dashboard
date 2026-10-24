import { getLiveView } from "@/features/analytics/queries/get-live-view";
import { getSession } from "@/lib/auth/session";
import { ok, serverError } from "@/lib/api-response";

/**
 * GET /api/analytics/live — the dashboard's live card polls this.
 *
 * Session-checked rather than bearer-checked: the caller is a signed-in admin
 * in a browser. getSession, not requireAdmin, so a signed-out poll gets a 401
 * instead of being redirected to an HTML login page.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401 });

  try {
    return ok(await getLiveView(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/analytics/live failed:", error);
    return serverError("Could not load the live view");
  }
}
