'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Eye, Trash2, Clock, ShieldCheck } from 'lucide-react';
import type { NotificationDto } from '@healthbridge/shared-types';
import { NotificationCard } from './NotificationCard';
import { NotificationSkeleton } from './NotificationSkeleton';
import { NotificationEmptyState } from './NotificationEmptyState';
import { ErrorState } from '@/components/ui/error-state';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface NotificationListProps {
  notifications: NotificationDto[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isUnreadOnly?: boolean;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

/**
 * Reusable notification list with skeleton loading, accessible error recovery,
 * empty state, and a privacy-safe Notification Detail Modal.
 */
export function NotificationList({
  notifications,
  isLoading = false,
  isError = false,
  onRetry,
  isUnreadOnly = false,
  onMarkRead,
  onDelete,
  compact = false,
}: NotificationListProps) {
  const [selected, setSelected] = useState<NotificationDto | null>(null);

  if (isLoading) {
    return <NotificationSkeleton count={compact ? 3 : 4} compact={compact} />;
  }

  if (isError) {
    return (
      <ErrorState
        compact
        title="Could not load notifications"
        message="We were unable to retrieve your latest alerts. Please retry."
        onRetry={onRetry}
      />
    );
  }

  if (notifications.length === 0) {
    return <NotificationEmptyState isUnreadOnly={isUnreadOnly} />;
  }

  return (
    <>
      <div className="space-y-2.5" role="list" aria-label="Notifications list">
        {notifications.map((notif) => (
          <div key={notif.id} role="listitem" className="relative group">
            <NotificationCard
              notification={notif}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
            {!compact && (
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelected(notif)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-sm hover:bg-muted transition-colors focus-ring"
                >
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  <span>Inspect Details</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Privacy-Safe Notification Detail Modal */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Notification Details'}
        description={
          selected
            ? `${selected.category} · ${new Date(selected.createdAt).toLocaleString('en-IN')}`
            : undefined
        }
        size="md"
      >
        {selected && (
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" size="sm" className="font-mono">
                {selected.category}
              </Badge>
              <Badge variant={selected.isRead ? 'neutral' : 'teal'} size="sm">
                {selected.isRead ? 'Read' : 'Unread'}
              </Badge>
              <span className="inline-flex items-center gap-1 text-muted-foreground ml-auto">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{new Date(selected.createdAt).toLocaleString('en-IN')}</span>
              </span>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground leading-relaxed">
              {selected.message}
            </div>

            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Notification previews intentionally omit sensitive clinical details. Open the linked authorized portal page to view full records.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {!selected.isRead && onMarkRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMarkRead(selected.id);
                      setSelected({ ...selected, isRead: true });
                    }}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Mark Read</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDelete(selected.id);
                      setSelected(null);
                    }}
                    className="text-error hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Dismiss</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selected.linkUrl && (
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={selected.linkUrl} onClick={() => setSelected(null)}>
                      <span>Open Record</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}

export default NotificationList;
