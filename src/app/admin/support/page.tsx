"use client";

import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AdminSupportPage() {
  const utils = trpc.useUtils();
  const { data: messages, isLoading } =
    trpc.admin.getSupportMessages.useQuery();

  const updateMutation = trpc.admin.updateSupportStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.admin.getSupportMessages.invalidate();
    },
  });

  const toggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PENDING" ? "RESOLVED" : "PENDING";
    updateMutation.mutate({ id, status: nextStatus });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Messages</h1>
        <p className="text-muted-foreground">
          Manage messages received from the maintenance page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Direct inquiries from users during downtime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No support messages found.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User / Email</TableHead>
                  <TableHead className="w-[40%]">Message</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">
                      {msg.email || (
                        <span className="text-muted-foreground italic">
                          Anonymous
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="whitespace-pre-wrap text-xs">
                        {msg.message}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          msg.status === "RESOLVED" ? "secondary" : "default"
                        }
                      >
                        {msg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(msg.id, msg.status)}
                        disabled={updateMutation.isPending}
                      >
                        Mark as{" "}
                        {msg.status === "PENDING" ? "Resolved" : "Pending"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
