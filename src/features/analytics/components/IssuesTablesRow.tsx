import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IssuesTablesRowProps {
  issuesData:
    | {
        topIssues: Array<{ issue: string; count: number }>;
        topRejectionReasons: Array<{ reason: string; count: number }>;
      }
    | undefined;
}

export function IssuesTablesRow({ issuesData }: IssuesTablesRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Top Issues */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Issues Detected</h3>
        <div className="space-y-2">
          {issuesData?.topIssues && issuesData.topIssues.length > 0 ? (
            issuesData.topIssues.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <span className="font-medium">{item.issue}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No issues data available
            </p>
          )}
        </div>
      </Card>

      {/* Rejection Reasons */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rejection Reasons</h3>
        <div className="space-y-2">
          {issuesData?.topRejectionReasons &&
          issuesData.topRejectionReasons.length > 0 ? (
            issuesData.topRejectionReasons.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <span className="font-medium">{item.reason}</span>
                <Badge variant="destructive">{item.count}</Badge>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No rejection data available
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
