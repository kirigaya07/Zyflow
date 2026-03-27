export const dynamic = "force-dynamic";

import React from "react";
import {
  Activity,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Cloud,
  Bell,
  Users,
  FileText,
  ArrowUpRight,
  Circle,
  Plus,
  Link2,
  ScrollText,
  TrendingUp,
  Star,
} from "lucide-react";
import {
  getDashboardStats,
  getRecentActivity,
  getConnectionStatus,
} from "./_actions/dashboard-actions";
import { LoadingLink } from "@/components/global/loading-link";
import { cn } from "@/lib/utils";

/* ── Tiny stat card ──────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="p-1.5 rounded-lg bg-secondary text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
        </span>
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground tracking-tight">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ── Connection dot ──────────────────────────────────────── */
function ConnectionRow({
  name,
  connected,
  Icon,
}: {
  name: string;
  connected: boolean;
  Icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-sm text-foreground">{name}</span>
      </div>
      <span
        className={cn(
          "flex items-center gap-1 text-xs font-medium",
          connected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
        )}
      >
        <Circle
          className={cn(
            "w-1.5 h-1.5 fill-current",
            connected ? "text-emerald-500" : "text-zinc-400"
          )}
        />
        {connected ? "Connected" : "Not connected"}
      </span>
    </div>
  );
}

/* ── Activity status badge ───────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    success:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    active:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    failed:   "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400",
    running:  "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
    draft:    "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", map[status] ?? map.draft)}>
      {status}
    </span>
  );
}

/* ── Page ────────────────────────────────────────────────── */
const DashboardPage = async () => {
  const stats = await getDashboardStats();
  const recentActivity = await getRecentActivity();
  const connections = await getConnectionStatus();

  const connectionList = [
    { name: "Google Drive", connected: connections.googleDrive, Icon: Cloud },
    { name: "Slack",        connected: connections.slack,        Icon: Bell },
    { name: "Discord",      connected: connections.discord,      Icon: Users },
    { name: "Notion",       connected: connections.notion,       Icon: FileText },
    { name: "Email",        connected: connections.email,        Icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">

      {/* ── Header ── */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your automation activity at a glance.
          </p>
        </div>

        {stats.activeAutomations > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            {stats.activeAutomations} workflow{stats.activeAutomations !== 1 ? "s" : ""} live
          </span>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Workflows"
          value={stats.totalWorkflows}
          sub={`${stats.activeAutomations} published · ${stats.unpublishedWorkflows} draft`}
          icon={BarChart3}
        />
        <StatCard
          label="Runs (30 days)"
          value={stats.last30DaysRuns}
          sub={`${stats.totalRuns} all time`}
          icon={Zap}
        />
        <StatCard
          label="Success Rate"
          value={stats.totalRuns > 0 ? `${stats.successRate}%` : "—"}
          sub={stats.totalRuns > 0 ? `${stats.failedCount} failed` : "No runs yet"}
          icon={Activity}
        />
        <StatCard
          label="Time Saved"
          value={`${stats.totalSavings}h`}
          sub="~0.5h per success"
          icon={Clock}
        />
      </div>

      {/* ── Quick Actions + Most Active ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <LoadingLink
              href="/workflows"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-foreground group"
            >
              <span className="p-1 rounded-md bg-secondary group-hover:bg-primary/10 transition-colors text-primary">
                <Plus className="w-3.5 h-3.5" />
              </span>
              Create Workflow
            </LoadingLink>
            <LoadingLink
              href="/connections"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-foreground group"
            >
              <span className="p-1 rounded-md bg-secondary group-hover:bg-primary/10 transition-colors text-primary">
                <Link2 className="w-3.5 h-3.5" />
              </span>
              View Connections
            </LoadingLink>
            <LoadingLink
              href="/logs"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-foreground group"
            >
              <span className="p-1 rounded-md bg-secondary group-hover:bg-primary/10 transition-colors text-primary">
                <ScrollText className="w-3.5 h-3.5" />
              </span>
              View Logs
            </LoadingLink>
          </div>
        </div>

        {/* Most Active + extra metrics */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Highlights</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-secondary text-muted-foreground shrink-0">
                <Star className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Most active workflow</p>
                <p className="text-sm text-foreground font-medium truncate">
                  {stats.mostActiveWorkflow ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-secondary text-muted-foreground shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Successful runs</p>
                <p className="text-sm text-foreground font-medium">{stats.successCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-secondary text-muted-foreground shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Time saved</p>
                <p className="text-sm text-foreground font-medium">{stats.totalSavings}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Activity — 2/3 width */}
        <section className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <LoadingLink
              href="/logs"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </LoadingLink>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Publish a workflow and trigger it to see runs here.
                  </p>
                </div>
                <LoadingLink
                  href="/workflows"
                  className="text-xs font-medium text-primary hover:underline mt-1"
                >
                  Go to Workflows →
                </LoadingLink>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentActivity.slice(0, 8).map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                    <span className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                      item.status === "success" || item.status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
                        : item.status === "failed"
                        ? "bg-red-50 dark:bg-red-950/50 text-red-500"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {item.status === "success" || item.status === "active" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : item.status === "failed" ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <StatusPill status={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Connections — 1/3 width */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Connections</h3>
            <LoadingLink
              href="/connections"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </LoadingLink>
          </div>

          <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border">
            {connectionList.map(({ name, connected, Icon }) => (
              <ConnectionRow key={name} name={name} connected={connected} Icon={Icon} />
            ))}
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-lg font-semibold text-foreground">${stats.monthlyCost.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Est. cost</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-lg font-semibold text-foreground">~{stats.totalSavings}h</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Saved</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
