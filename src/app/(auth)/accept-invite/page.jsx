import Link from "next/link";
import { AcceptInviteForm } from "@/features/auth/components/accept-invite-form";

export const metadata = { title: "Accept invite | AKT Gifting Admin" };

/**
 * The token is only shape-checked here. Validating it against the database
 * would tell a stranger which links are live, so the real check happens when
 * the form is submitted in `acceptInvite`.
 */
export default async function AcceptInvitePage({ searchParams }) {
  const params = await searchParams;
  const token = String(params?.token ?? "");
  const email = String(params?.email ?? "").toLowerCase();

  if (!token || !email) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold text-brand">
          Invite link incomplete
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          This link is missing part of its address. Ask your super admin to send
          a fresh invite.
        </p>
        <Link href="/login" className="text-sm font-semibold text-brand">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold text-brand">Welcome aboard</h1>
        <p className="text-sm text-muted">
          Set a password to finish setting up your account.
        </p>
      </header>

      <AcceptInviteForm token={token} email={email} />
    </div>
  );
}
