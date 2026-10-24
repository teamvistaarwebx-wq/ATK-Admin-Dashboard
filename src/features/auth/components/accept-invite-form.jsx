"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { acceptInvite } from "@/features/auth/actions/accept-invite";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { TextField } from "@/components/ui/text-field";

const INITIAL_STATE = { error: "" };

export function AcceptInviteForm({ token, email }) {
  const [state, formAction, isPending] = useActionState(
    acceptInvite,
    INITIAL_STATE
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      <TextField
        id="invited-email"
        label="Email"
        value={email}
        readOnly
        disabled
      />

      <TextField
        id="password"
        name="password"
        type="password"
        label="Choose a password"
        placeholder="••••••••••"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
        disabled={isPending}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters, with letters and a number.`}
      />

      <TextField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirm password"
        placeholder="••••••••••"
        autoComplete="new-password"
        required
        disabled={isPending}
      />

      <FormError message={state?.error} />

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Setting up
          </>
        ) : (
          "Set password and sign in"
        )}
      </Button>
    </form>
  );
}
