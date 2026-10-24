import { trackVisit } from "@/features/analytics/lib/track-visit";
import { isInternalRequest, unauthorized } from "@/lib/internal-auth";
import { badRequest, ok, serverError } from "@/lib/api-response";

/**
 * POST /api/analytics/track — one storefront hit.
 *
 * Server-to-server, bearer-authenticated like every other storefront call:
 * the storefront's own route handler receives the browser's beacon, adds the
 * edge geo headers and the visitor cookie, and forwards it here. The browser
 * never holds the secret. See README.md for the payload.
 */
export async function POST(request) {
  if (!isInternalRequest(request)) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  try {
    const ownHost = process.env.STOREFRONT_URL
      ? new URL(process.env.STOREFRONT_URL).hostname
      : "";
    const result = await trackVisit(body, { ownHost });
    if (result.error) return badRequest(result.error);
    return ok(result);
  } catch (error) {
    console.error("POST /api/analytics/track failed:", error);
    return serverError("Could not record the visit");
  }
}
