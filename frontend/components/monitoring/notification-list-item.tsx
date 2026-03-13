import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/monitoring/severity-badge";
import type { NotificationItem } from "@/types/monitoring";
import { formatDateTime } from "@/lib/utils";

interface NotificationListItemProps {
  item: NotificationItem;
  isRead: boolean;
  onMarkRead: (id: string) => void;
}

export function NotificationListItem({ item, isRead, onMarkRead }: NotificationListItemProps) {
  return (
    <Card className={isRead ? "opacity-75" : "border-emerald-200"}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={item.severity} />
            <span className={`text-xs font-medium ${isRead ? "text-slate-500" : "text-emerald-700"}`}>{isRead ? "Read" : "Unread"}</span>
          </div>
        </div>
        <p className="text-sm text-slate-700">{item.message}</p>
        <p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onMarkRead(item.id)} disabled={isRead}>Mark as read</Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={item.href}>Open</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
