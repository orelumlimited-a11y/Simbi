"use client";

import { useActionState, useState } from "react";
import { manualNotify, type ActionState } from "@/lib/actions/notifications";
import { selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { NOTIFICATION_EVENTS } from "@/lib/constants";
import { Mail, MessageSquare, Phone, Send } from "lucide-react";
import clsx from "clsx";

const initialState: ActionState = {};

export function ManualNotifyForm({
  orderId,
  currentStageKey,
  hasEmail,
  hasPhone,
}: {
  orderId: string;
  currentStageKey: string;
  hasEmail: boolean;
  hasPhone: boolean;
}) {
  const [state, formAction, pending] = useActionState(manualNotify, initialState);
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP">("EMAIL");

  const defaultEvent = NOTIFICATION_EVENTS.some((e) => e.key === currentStageKey) ? currentStageKey : NOTIFICATION_EVENTS[0].key;

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Send className="h-3.5 w-3.5" /> Notify Customer
      </Button>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="channel" value={channel} />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Channel</label>
        <div className="flex gap-2">
          <ChannelButton icon={Mail} label="Email" active={channel === "EMAIL"} disabled={!hasEmail} onClick={() => setChannel("EMAIL")} />
          <ChannelButton icon={MessageSquare} label="SMS" active={channel === "SMS"} disabled={!hasPhone} onClick={() => setChannel("SMS")} />
          <ChannelButton icon={Phone} label="WhatsApp" active={channel === "WHATSAPP"} disabled={!hasPhone} onClick={() => setChannel("WHATSAPP")} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
        <select name="eventKey" defaultValue={defaultEvent} className={selectClass}>
          {NOTIFICATION_EVENTS.map((e) => (
            <option key={e.key} value={e.key}>{e.label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-400">
        This sends immediately regardless of the customer&apos;s saved contact preferences or the event&apos;s company-wide setting — use it for one-off requests.
      </p>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Sending..." : "Send Now"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ChannelButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Mail;
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? "No contact info on file for this channel" : undefined}
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors",
        disabled
          ? "cursor-not-allowed bg-slate-100 text-slate-300 ring-slate-200"
          : active
            ? "bg-brand text-white ring-brand"
            : "bg-white text-slate-500 ring-slate-300 hover:bg-slate-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
