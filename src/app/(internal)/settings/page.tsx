import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import { NewServiceForm } from "@/components/settings/NewServiceForm";
import { NewUserForm } from "@/components/settings/NewUserForm";
import { StageBadge } from "@/components/ui/StageBadge";
import { toggleServiceActive, toggleUserActive, updateNotificationSetting } from "@/lib/actions/settings";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getCountryByCode } from "@/lib/countries";
import clsx from "clsx";

export default async function SettingsPage() {
  const [company, stages, services, notificationSettings, users, auditLogs] = await Promise.all([
    prisma.companySettings.findUnique({ where: { id: "singleton" } }),
    prisma.deliveryStage.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.notificationSetting.findMany(),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const currency = company?.currency ?? "USD";
  const locale = getCountryByCode(company?.countryCode).locale;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage company details, delivery workflow, pricing, notifications, and staff access.</p>
      </div>

      <Card id="company">
        <CardHeader><CardTitle>Company Settings</CardTitle></CardHeader>
        <CardBody>
          <CompanySettingsForm
            key={`${company?.countryCode ?? "US"}-${company?.currency ?? "USD"}`}
            company={
              company ?? {
                name: "Simbi Logistics",
                logoUrl: null,
                address: null,
                phone: null,
                email: null,
                website: null,
                countryCode: "US",
                currency: "USD",
              }
            }
          />
        </CardBody>
      </Card>

      <Card id="stages">
        <CardHeader><CardTitle>Delivery Stages Workflow</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <p className="mb-2 text-xs text-slate-400">Every order moves through these stages. Order and keys are fixed; labels can be customized.</p>
          {stages.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <StageBadge label={s.label} color={s.color} size="sm" />
              <span className="text-xs text-slate-400">{s.key}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card id="pricing">
        <CardHeader><CardTitle>Delivery Services & Pricing</CardTitle></CardHeader>
        <CardBody>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  {s.description && <p className="text-xs text-slate-400">{s.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">{formatCurrency(s.basePrice, currency, locale)}</span>
                  <form action={toggleServiceActive}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                        s.active ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-slate-100 text-slate-500 ring-slate-300"
                      )}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
          <NewServiceForm />
        </CardBody>
      </Card>

      <Card id="notifications">
        <CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
        <CardBody>
          <p className="mb-3 text-xs text-slate-400">
            Choose which delivery events trigger notifications. Email/SMS/WhatsApp providers are configured via environment variables
            (see <code className="rounded bg-slate-100 px-1">.env</code>) — this controls which events are eligible to send once a provider is connected.
          </p>
          <div className="space-y-2">
            {notificationSettings.map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="text-sm text-slate-700">{n.label}</span>
                <div className="flex gap-2">
                  {(["emailEnabled", "smsEnabled", "whatsappEnabled"] as const).map((channel) => (
                    <form key={channel} action={updateNotificationSetting}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="channel" value={channel} />
                      <button
                        type="submit"
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                          n[channel] ? "bg-blue-50 text-blue-700 ring-blue-300" : "bg-slate-100 text-slate-400 ring-slate-300"
                        )}
                      >
                        {channel === "emailEnabled" ? "Email" : channel === "smsEnabled" ? "SMS" : "WhatsApp"}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card id="users">
        <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
        <CardBody>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email} · {ROLE_LABELS[u.role as Role] ?? u.role}{u.financeAccess ? " · Finance access" : ""}</p>
                </div>
                <form action={toggleUserActive}>
                  <input type="hidden" name="id" value={u.id} />
                  <button
                    type="submit"
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                      u.active ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-slate-100 text-slate-500 ring-slate-300"
                    )}
                  >
                    {u.active ? "Active" : "Disabled"}
                  </button>
                </form>
              </div>
            ))}
          </div>
          <NewUserForm />
        </CardBody>
      </Card>

      <Card id="audit-log">
        <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <p className="mb-1 text-xs text-slate-400">Recent administrative actions (most recent 30).</p>
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm last:border-0">
              <div>
                <span className="font-medium text-slate-700">{log.action.replace(/_/g, " ")}</span>
                <span className="text-slate-400"> · {log.entityType}{log.details ? ` · ${log.details}` : ""}</span>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{log.user?.name ?? "System"}</p>
                <p>{formatDateTime(log.createdAt)}</p>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && <p className="text-sm text-slate-400">No audit log entries yet.</p>}
        </CardBody>
      </Card>
    </div>
  );
}
