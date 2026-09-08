"use client";

import { useActionState, useState } from "react";
import { createStockReceipt, type ActionState } from "@/lib/actions/products";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PackagePlus, X } from "lucide-react";

const initialState: ActionState = {};

interface Option {
  id: string;
  name: string;
}

const NEW_PRODUCT_VALUE = "__new__";

export function LogStockReceiptForm({
  products,
  vendors,
  defaultProductId,
  defaultVendorId,
}: {
  products: Option[];
  vendors: Option[];
  defaultProductId?: string;
  defaultVendorId?: string;
}) {
  const [state, formAction, pending] = useActionState(createStockReceipt, initialState);
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(defaultProductId ?? "");

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <PackagePlus className="h-4 w-4" /> Log Stock Received
      </Button>
    );
  }

  const isNewProduct = productId === NEW_PRODUCT_VALUE;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Log Stock Received</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
        <Field label="Product" required>
          <select
            name="productId"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value={NEW_PRODUCT_VALUE}>+ Add new product</option>
          </select>
        </Field>
        <Field label="Vendor" required>
          <select name="vendorId" required defaultValue={defaultVendorId ?? ""} className={selectClass}>
            <option value="" disabled>Select a vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </Field>
        {isNewProduct && (
          <>
            <Field label="New product name" required>
              <input name="newProductName" required autoFocus className={inputClass} />
            </Field>
            <Field label="Unit" hint="e.g. pcs, kg, box">
              <input name="newProductUnit" defaultValue="pcs" className={inputClass} />
            </Field>
          </>
        )}
        <Field label="Quantity received" required>
          <input name="quantity" type="number" min={1} required className={inputClass} />
        </Field>
        <Field label="Unit cost" hint="Cost per unit paid to vendor">
          <input name="unitCost" type="number" step="0.01" min={0} defaultValue={0} className={inputClass} />
        </Field>
        <Field label="Date received">
          <input name="receivedAt" type="date" className={inputClass} />
        </Field>
        <Field label="Note" hint="Optional">
          <input name="note" className={inputClass} />
        </Field>
        <div className="col-span-2 flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Log Receipt"}
          </Button>
        </div>
      </form>
    </div>
  );
}
