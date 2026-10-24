import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "Sign in | AKT Gifting Admin" };

export default async function LoginPage({ searchParams }) {
  if (await getSession()) redirect("/");

  const params = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      {/* The brand panel is hidden below lg, so the logo has to appear here
          too or a phone gets an unbranded form. */}
      <Image
        src="/images/logo/logo.svg"
        alt="Atulya Karigari"
        width={150}
        height={51}
        priority
        unoptimized
        className="lg:hidden"
      />

      <header className="flex flex-col gap-1.5">
        <h1 className="font-newsreader text-3xl font-semibold text-brand">
          Sign in
        </h1>
        <p className="text-sm text-muted">
          Use the email your account was created with.
        </p>
      </header>

      <LoginForm from={params?.from ?? ""} />
    </div>
  );
}
