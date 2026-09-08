"use client";

import { useActionState, useState } from "react";
import { updateCompanySettings, type ActionState } from "@/lib/actions/settings";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { COUNTRIES, getCountryByCode, getCurrencyOptions } from "@/lib/countries";

const initialState: ActionState = {};
const CURRENCY_OPTIONS = getCurrencyOptions();

interface Company {
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  countryCode: string;
  currency: string;
}

export function CompanySettingsForm({ company }: { company: Company }) {
  const [state, formAction, pending] = useActionState(updateCompanySettings, initialState);
  const [countryCode, setCountryCode] = useState(company.countryCode);
  const [currency, setCurrency] = useState(company.currency);

  function handleCountryChange(code: string) {
    setCountryCode(code);
    // Auto-fill the matching currency, but leave it editable — some
    // businesses invoice in a currency other than their local one.
    setCurrency(getCountryByCode(code).currency);
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <Field label="Company name" required>
        <input name="name" defaultValue={company.name} required className={inputClass} />
      </Field>
      <Field label="Logo URL">
        <input name="logoUrl" defaultValue={company.logoUrl ?? ""} className={inputClass} />
      </Field>
      <Field label="Country of operation" required hint="Sets the default currency and address-form defaults across the app">
        <select
          name="countryCode"
          value={countryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          className={selectClass}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Currency" required hint="Auto-filled from country, but can be changed independently">
        <select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectClass}>
          {CURRENCY_OPTIONS.map((cur) => (
            <option key={cur} value={cur}>{cur}</option>
          ))}
        </select>
      </Field>
      <Field label="Address" className="md:col-span-2">
        <input name="address" defaultValue={company.address ?? ""} className={inputClass} />
      </Field>
      <Field label="Phone">
        <input name="phone" defaultValue={company.phone ?? ""} className={inputClass} />
      </Field>
      <Field label="Email">
        <input name="email" type="email" defaultValue={company.email ?? ""} className={inputClass} />
      </Field>
      <Field label="Website" className="md:col-span-2">
        <input name="website" defaultValue={company.website ?? ""} className={inputClass} />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Company Settings"}</Button>
      </div>
    </form>
  );
}
