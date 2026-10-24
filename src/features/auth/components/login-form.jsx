"use client";

import { useActionState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "@/features/auth/actions/sign-in";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { TextField } from "@/components/ui/text-field";

const INITIAL_STATE = { error: "" };

export function LoginForm({ from = "" }) {
  const [state, formAction] = useActionState(signIn, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(() => {
          formAction(formData);
        });
      }}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="from" value={from} />

      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@atulyakarigari.com"
        autoComplete="username"
        required
        disabled={isPending}
      />

      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••••"
        autoComplete="current-password"
        required
        disabled={isPending}
      />

      <FormError message={state?.error} />

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-xs leading-relaxed text-muted">
        Accounts are created by invitation. Ask your super admin if you need
        access.
      </p>
    </form>
  );
}
