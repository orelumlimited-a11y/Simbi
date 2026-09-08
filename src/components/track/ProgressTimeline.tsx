import { HAPPY_PATH_KEYS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Check } from "lucide-react";

interface StageEvent {
  newStageKey: string;
  createdAt: Date;
}

export function ProgressTimeline({
  currentStageKey,
  events,
  isProblem,
  isFailure,
}: {
  currentStageKey: string;
  events: StageEvent[];
  isProblem: boolean;
  isFailure: boolean;
}) {
  const reachedTimes = new Map<string, Date>();
  for (const e of events) {
    if (!reachedTimes.has(e.newStageKey)) reachedTimes.set(e.newStageKey, e.createdAt);
  }

  const currentIndex = HAPPY_PATH_KEYS.indexOf(currentStageKey);
  const effectiveIndex = currentIndex === -1 ? HAPPY_PATH_KEYS.length - 1 : currentIndex;

  return (
    <div className="space-y-0">
      {HAPPY_PATH_KEYS.map((key, idx) => {
        const label = STAGE_LABELS[key] ?? key;
        const reachedAt = reachedTimes.get(key);
        const isCompleted = idx < effectiveIndex || (idx === effectiveIndex && currentIndex !== -1 && !isProblem && !isFailure);
        const isCurrent = idx === effectiveIndex && (isProblem || isFailure || currentIndex !== -1);
        const isLast = idx === HAPPY_PATH_KEYS.length - 1;

        return (
          <div key={key} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={`absolute left-[11px] top-6 h-full w-0.5 ${
                  isCompleted ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isCompleted
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                    ? isProblem || isFailure
                      ? "bg-amber-500 text-white"
                      : "bg-brand text-white"
                    : "bg-slate-200 text-slate-400"
              }`}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <div className="flex-1 pt-0.5">
              <p className={`text-sm font-medium ${isCompleted || isCurrent ? "text-slate-900" : "text-slate-400"}`}>
                {label}
              </p>
              {reachedAt && <p className="text-xs text-slate-400">{formatDateTime(reachedAt)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STAGE_LABELS: Record<string, string> = {
  ORDER_CREATED: "Order Created",
  PICKED_UP: "Picked Up",
  AT_SORTING_FACILITY: "At Sorting Facility",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};
