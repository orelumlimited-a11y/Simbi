"use client";

import { useState } from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";
import clsx from "clsx";

interface Props {
  defaultEmail?: boolean;
  defaultSms?: boolean;
  defaultWhatsapp?: boolean;
}

/** Clickable multi-select pills for a customer's notification contact preferences. */
export function ContactPreferenceToggles({ defaultEmail = true, defaultSms = false, defaultWhatsapp = false }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [sms, setSms] = useState(defaultSms);
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp);

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-slate-600">Contact Preferences</span>
      <div className="flex flex-wrap gap-2">
        <Pill active={email} onClick={() => setEmail((v) => !v)} icon={Mail} label="Email" />
        <Pill active={sms} onClick={() => setSms((v) => !v)} icon={MessageSquare} label="SMS" />
        <Pill active={whatsapp} onClick={() => setWhatsapp((v) => !v)} icon={Phone} label="WhatsApp" />
      </div>
      <p className="mt-1 text-xs text-slate-400">Click to select how this customer wants delivery updates. You can select more than one.</p>
      <input type="hidden" name="emailOptIn" value={String(email)} />
      <input type="hidden" name="smsOptIn" value={String(sms)} />
      <input type="hidden" name="whatsappOptIn" value={String(whatsapp)} />
    </div>
  );
}

function Pill({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors",
        active ? "bg-brand text-white ring-brand" : "bg-white text-slate-500 ring-slate-300 hover:bg-slate-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
