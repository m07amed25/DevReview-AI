"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Globe,
  Zap,
  AlertTriangle,
} from "lucide-react";

const PROTECTIONS = [
  {
    title: "Edge-Level Authentication",
    status: "Active",
    description:
      "Middleware validates sessions at the edge before any route logic executes.",
    icon: Lock,
    color: "text-green-500",
  },
  {
    title: "Session Token Hardening",
    status: "Active",
    description:
      "Strict regex and length validation for better-auth session cookies.",
    icon: Fingerprint,
    color: "text-blue-500",
  },
  {
    title: "Global Security Headers",
    status: "Active",
    description:
      "HSTS, CSP, XSS-Protection, and Frame Options are enforced globally.",
    icon: Globe,
    color: "text-indigo-500",
  },
  {
    title: "API Rate Limiting",
    status: "Active",
    description:
      "Upstash-powered rate limiting on all public and protected tRPC routes.",
    icon: Zap,
    color: "text-amber-500",
  },
];

export default function AdminSecurityPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor and manage platform security posture.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1 text-sm font-medium text-green-500">
          <ShieldCheck className="h-4 w-4" />
          All Systems Secure
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PROTECTIONS.map((p) => (
          <Card key={p.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">{p.title}</CardTitle>
              <p.icon className={`h-4 w-4 ${p.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {p.status}
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                {p.description}
              </p>
            </CardContent>
            <div
              className={`absolute bottom-0 left-0 h-1 w-full opacity-20 bg-current ${p.color}`}
            />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>
              Real-time log of security-related activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  event: "Admin session validated",
                  time: "2 minutes ago",
                  status: "Success",
                },
                {
                  event: "Rate limit threshold reached (IP: 192.168.1.x)",
                  time: "1 hour ago",
                  status: "Blocked",
                },
                {
                  event: "New GitHub Webhook signature verified",
                  time: "3 hours ago",
                  status: "Success",
                },
              ].map((e, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${e.status === "Success" ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">{e.event}</p>
                      <p className="text-xs text-muted-foreground">{e.time}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${e.status === "Success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p className="text-muted-foreground">
              Your platform is currently following best practices. Consider the
              following:
            </p>
            <ul className="list-disc pl-4 space-y-2 text-muted-foreground/80">
              <li>Rotate GITHUB_WEBHOOK_SECRET every 90 days.</li>
              <li>Enable 2FA for all ADMIN accounts.</li>
              <li>Review audit logs for unusual repository connections.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
