"use client";

import { useActionState } from "react";
import { resendNotification, type ActionState } from "@/lib/actions/notifications";
import { RotateCw } from "lucide-react";

const initialState: ActionState = {};

export function ResendNotificationButton({ notificationId, orderId }: { notificationId: string; orderId: string }) {
  const [state, formAction, pending] = useActionState(resendNotification, initialState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="notificationId" value={notificationId} />
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 text-xs font-medium text-brand hover:underline disabled:opacity-50"
      >
        <RotateCw className={`h-3 w-3 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Resending..." : "Resend"}
      </button>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
