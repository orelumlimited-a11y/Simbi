import { STAGE_COLOR_CLASSES, type StageColor } from "@/lib/constants";
import clsx from "clsx";

export function StageBadge({
  label,
  color,
  size = "md",
}: {
  label: string;
  color: string;
  size?: "sm" | "md";
}) {
  const classes = STAGE_COLOR_CLASSES[(color as StageColor) ?? "grey"] ?? STAGE_COLOR_CLASSES.grey;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap",
        classes.bg,
        classes.text,
        classes.ring,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", classes.dot)} />
      {label}
    </span>
  );
}

export function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 ring-emerald-300",
    UNPAID: "bg-red-50 text-red-700 ring-red-300",
    PARTIAL: "bg-amber-50 text-amber-700 ring-amber-300",
    REFUNDED: "bg-slate-100 text-slate-600 ring-slate-300",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        map[status] ?? map.UNPAID
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
