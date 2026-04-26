"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, User, Shield, Info } from "lucide-react";

export default function AdminAuditPage() {
  const logs = [
    {
      id: 1,
      action: "User Role Updated",
      user: "admin@devreview.ai",
      target: "user_01",
      time: "2 mins ago",
      icon: User,
    },
    {
      id: 2,
      action: "Security Rule Modified",
      user: "admin@devreview.ai",
      target: "Global Headers",
      time: "15 mins ago",
      icon: Shield,
    },
    {
      id: 3,
      action: "New Repo Added",
      user: "admin@devreview.ai",
      target: "acme/web-app",
      time: "1 hour ago",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all administrative actions performed across the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>
            A chronological record of management events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-muted">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-center gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border shadow-sm z-10">
                  <log.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{log.action}</p>
                    <span className="text-xs text-muted-foreground">
                      {log.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Performed by{" "}
                    <span className="text-foreground font-medium">
                      {log.user}
                    </span>{" "}
                    on{" "}
                    <span className="text-foreground font-medium">
                      {log.target}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
