"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
  Monitor,
  Search,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DropdownSelect, SelectItem } from "@/components/ui/select";

const RESOURCE_FILTERS = [
  { label: "All Resources", value: "" },
  { label: "User", value: "USER" },
  { label: "Review", value: "REVIEW" },
  { label: "Team", value: "TEAM" },
  { label: "SSO Provider", value: "SSO_PROVIDER" },
  { label: "Custom Role", value: "CUSTOM_ROLE" },
  { label: "System Settings", value: "SYSTEM_SETTINGS" },
];

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function actionVariant(
  action: string,
): "default" | "destructive" | "secondary" | "outline" {
  if (action.includes("DELETE") || action.includes("BANNED"))
    return "destructive";
  if (action.includes("CREATED") || action.includes("ASSIGNED"))
    return "default";
  if (action.includes("UPDATED")) return "secondary";
  return "outline";
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resource, setResource] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout(
      (
        window as unknown as {
          _auditSearchTimer?: ReturnType<typeof setTimeout>;
        }
      )._auditSearchTimer,
    );
    (
      window as unknown as {
        _auditSearchTimer?: ReturnType<typeof setTimeout>;
      }
    )._auditSearchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
  };

  const { data, isLoading } = trpc.admin.getAuditLogs.useQuery({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    resource: resource || undefined,
  });

  const { refetch: exportLogs, isFetching: isExporting } =
    trpc.admin.exportAuditLogs.useQuery(
      {
        search: debouncedSearch || undefined,
        resource: resource || undefined,
      },
      { enabled: false },
    );

  const handleExport = async () => {
    const result = await exportLogs();
    if (!result.data?.csv) return;
    const blob = new Blob([result.data.csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all administrative actions — including IP address, location,
            and browser data.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search action, resource, IP…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownSelect
          value={resource}
          onValueChange={(v) => {
            setResource(v);
            setPage(1);
          }}
          placeholder="Filter by resource"
          className="w-48"
        >
          {RESOURCE_FILTERS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </DropdownSelect>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event History</CardTitle>
          <CardDescription>
            Chronological record of all platform actions with enriched metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !data?.logs.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Activity className="h-8 w-8" />
              <p className="text-sm">No audit events recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.logs.map((log) => (
                <div key={log.id} className="py-4 space-y-2">
                  {/* Row 1: action + badges + timestamp */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-sm">
                        {actionLabel(log.action)}
                      </span>
                      {log.resource && (
                        <Badge variant="outline" className="text-xs">
                          {log.resource}
                        </Badge>
                      )}
                      <Badge
                        variant={actionVariant(log.action)}
                        className="text-xs"
                      >
                        {log.action.split("_").pop()}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Row 2: actor */}
                  {log.actor && (
                    <p className="text-xs text-muted-foreground pl-6">
                      Actor:{" "}
                      <span className="text-foreground font-medium">
                        {log.actor.name ?? log.actor.email}
                      </span>
                    </p>
                  )}

                  {/* Row 3: IP + geo + UA */}
                  <div className="flex flex-wrap items-center gap-3 pl-6">
                    {log.ipAddress && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {log.ipAddress}
                      </span>
                    )}
                    {(log.country ?? log.city) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[log.city, log.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {log.userAgent && (
                      <span
                        className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[280px]"
                        title={log.userAgent}
                      >
                        <Monitor className="h-3 w-3 shrink-0" />
                        {log.userAgent.slice(0, 60)}
                        {log.userAgent.length > 60 ? "…" : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {data.pages} · {data.total} total events
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page >= data.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
