# Enhanced Notification Center

## Overview

The notification center has been significantly enhanced with a modern UI, real-time updates, advanced filtering, and comprehensive user preferences.

## Features

### 1. **Dedicated Notifications Page** (`/notifications`)
- Full-page view with enhanced filtering and search
- Bulk actions (select all, mark as read, delete multiple)
- Statistics dashboard showing total, unread, and read notifications
- Advanced search functionality
- Filter by notification type and read status
- Responsive design optimized for all devices

### 2. **Enhanced Notification Dropdown**
- Improved visual design with better animations
- Color-coded notification icons by type
- Badges showing notification categories
- Quick actions (mark as read, delete)
- Real-time badge updates
- Better accessibility with ARIA labels
- Smooth transitions and hover effects

### 3. **Notification Preferences**
Located in `/settings#notifications`, users can customize:

#### General Settings
- **Email Notifications**: Toggle email delivery
- **Desktop Notifications**: Browser push notifications
- **Sound Effects**: Audio alerts for new notifications

#### Team Activity
- Team invitations
- New team members

#### Code Reviews
- Review assignments
- Review completed
- Review failed
- Review approved
- Changes requested

#### Automated Scans
- Scheduled scan completions

### 4. **Real-Time Notifications**
- Powered by Pusher for instant updates
- No page refresh required
- Desktop notifications (with permission)
- Optional sound effects
- Toast notifications with action buttons
- Automatic UI updates when new notifications arrive

### 5. **Notification Types**
The system supports 8 notification types:

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `TEAM_INVITE` | UserPlus | Blue | Team invitation received |
| `TEAM_MEMBER_ADDED` | UserCog | Green | New member joined team |
| `REVIEW_COMPLETED` | FileCheck | Emerald | Code review finished successfully |
| `REVIEW_FAILED` | FileX | Red | Code review encountered an error |
| `SCHEDULED_SCAN_COMPLETED` | Clock | Purple | Automated scan completed |
| `REVIEW_ASSIGNED` | GitPullRequest | Orange | Review assigned to you |
| `REVIEW_APPROVED` | ThumbsUp | Green | Your code was approved |
| `REVIEW_CHANGES_REQUESTED` | AlertTriangle | Yellow | Changes requested on review |

## Technical Implementation

### Database Schema

New fields added to the `User` model in Prisma:

```prisma
// Notification preferences
emailNotifications            Boolean @default(true)
notifyTeamInvites             Boolean @default(true)
notifyTeamMemberAdded         Boolean @default(true)
notifyReviewCompleted         Boolean @default(true)
notifyReviewFailed            Boolean @default(true)
notifyScheduledScanCompleted  Boolean @default(false)
notifyReviewAssigned          Boolean @default(true)
notifyReviewApproved          Boolean @default(true)
notifyReviewChangesRequested  Boolean @default(true)
notificationSoundEnabled      Boolean @default(false)
desktopNotifications          Boolean @default(true)
```

### API Routes

#### Notification Router (`/api/trpc/notification`)
- `list` - Get paginated notifications with filtering
- `unreadCount` - Get count of unread notifications
- `markAsRead` - Mark single notification as read
- `markAllAsRead` - Mark all notifications as read
- `delete` - Delete a single notification

#### Settings Router (`/api/trpc/settings`)
- `getNotificationPreferences` - Get user's notification preferences
- `updateNotificationPreferences` - Update notification preferences

### Real-Time Integration

#### Pusher Events
Channel: `private-user-{userId}`
Event: `notification:new`

Payload:
```typescript
{
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
}
```

#### Notification Service

Use the centralized notification service for creating notifications:

```typescript
import { createNotification } from "@/server/services/notification-service";

// Create a single notification
await createNotification(db, {
  userId: "user_123",
  type: "REVIEW_COMPLETED",
  title: "Review Completed",
  message: "Your code review has finished successfully",
  link: "/reviews/abc123"
});

// Batch create notifications
import { createNotifications } from "@/server/services/notification-service";

await createNotifications(db, [
  { userId: "user_1", type: "...", title: "...", message: "..." },
  { userId: "user_2", type: "...", title: "...", message: "..." },
]);
```

This automatically:
1. Creates the notification in the database
2. Triggers real-time Pusher event
3. Updates the UI instantly for connected users

### Client-Side Hook

```typescript
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";

function MyComponent() {
  const { data: session } = authClient.useSession();
  const { isConnected } = useRealtimeNotifications(session?.user?.id);
  
  // Notifications will automatically update in real-time
}
```

## User Experience Features

### Smart Time Formatting
- "Just now" - Less than 1 minute
- "5m ago" - Minutes
- "2h ago" - Hours  
- "3d ago" - Days
- Date format - Older than 7 days

### Visual Indicators
- **Unread notifications**: Blue background accent, bold title
- **Badge pulsing**: Animated badge for new notifications
- **Type badges**: Small labels indicating notification category
- **Hover effects**: Smooth transitions on interaction

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode compatible
- Focus indicators

### Desktop Notifications
Requires user permission. Features:
- Native browser notifications
- Click to navigate to related page
- Auto-dismiss after 5 seconds
- Prevents duplicate notifications (same ID)

### Sound Effects
- Web Audio API-based notification sound
- Non-intrusive, short tone (800Hz, 0.5s)
- Respects user preferences
- Fails gracefully if not supported

## Migration Guide

To migrate from the old notification system:

1. **Run Prisma Migration**:
```bash
npx prisma migrate dev --name add_notification_preferences
```

2. **Update Notification Creation**:
Replace all `db.notification.create()` calls with the new service:

```typescript
// Old
await ctx.db.notification.create({
  data: { userId, type, title, message, link }
});

// New
import { createNotification } from "@/server/services/notification-service";
await createNotification(ctx.db, { userId, type, title, message, link });
```

3. **Add PusherProvider** (if not already present):
Ensure your app root wraps with `<PusherProvider>`:

```typescript
import { PusherProvider } from "@/lib/pusher/client";

<PusherProvider>
  {children}
</PusherProvider>
```

## Environment Variables

Required for real-time notifications:

```env
# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster

# Server-side
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
```

## Browser Compatibility

- **Desktop Notifications**: Chrome 22+, Firefox 22+, Safari 6+, Edge 14+
- **Web Audio API**: Chrome 10+, Firefox 25+, Safari 6+, Edge 12+
- **Pusher WebSocket**: All modern browsers

## Performance Considerations

- Notifications are lazy-loaded (dropdown only loads when opened)
- Pagination support for large notification lists
- Efficient Pusher channel subscriptions (auto cleanup)
- Debounced search input
- Optimistic UI updates

## Future Enhancements

Potential additions:
- Notification grouping (e.g., "5 new review completions")
- Rich notifications with embedded actions
- Email digest preferences (daily/weekly summaries)
- Notification history archival
- Advanced filtering (date ranges, custom queries)
- Notification templates for customization
- Mobile app push notifications
- Scheduled quiet hours
- VIP user notifications (priority)

## Troubleshooting

### Notifications not appearing in real-time
1. Check Pusher environment variables
2. Verify WebSocket connection in browser dev tools
3. Check browser console for errors
4. Ensure user is authenticated

### Desktop notifications not working
1. Check browser permissions (chrome://settings/content/notifications)
2. Verify HTTPS connection (required for notifications API)
3. Check that desktop notifications preference is enabled

### Sound not playing
1. Check browser audio permissions
2. Verify sound preference is enabled
3. Check browser console for Web Audio API errors

## Support

For issues or questions about the notification system, please check:
- The browser console for error messages
- Network tab for API/Pusher connection issues
- Prisma Studio to verify database state
