import { StageBadge } from "@/components/ui/StageBadge";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS, type Role } from "@/lib/constants";

interface Event {
  id: string;
  newStageKey: string;
  location: string | null;
  note: string | null;
  createdAt: Date;
  changedByRole: string | null;
  changedBy: { name: string } | null;
  newStage: { label: string; color: string };
}

export function StatusTimeline({ events }: { events: Event[] }) {
  const sorted = [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <ol className="space-y-0">
      {sorted.map((e, idx) => (
        <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
          {idx !== sorted.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
          <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-brand ring-2 ring-brand/20" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StageBadge label={e.newStage.label} color={e.newStage.color} size="sm" />
              <span className="text-xs text-slate-400">{formatDateTime(e.createdAt)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {e.changedBy ? `Updated by ${e.changedBy.name}` : "Updated automatically"}
              {e.changedByRole && ` (${ROLE_LABELS[e.changedByRole as Role] ?? e.changedByRole})`}
              {e.location && ` · ${e.location}`}
            </p>
            {e.note && <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{e.note}</p>}
          </div>
        </li>
      ))}
      {sorted.length === 0 && <p className="text-sm text-slate-400">No status history yet.</p>}
    </ol>
  );
}
