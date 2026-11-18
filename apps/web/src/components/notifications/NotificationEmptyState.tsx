'use client';

import React from 'react';
import { EmptyIllustration } from '@/components/ui/visual-asset';

interface NotificationEmptyStateProps {
  title?: string;
  description?: string;
  isUnreadOnly?: boolean;
}

export function NotificationEmptyState({
  title = 'No Notifications',
  description = 'You are all caught up! New clinical and operational updates will appear here.',
  isUnreadOnly = false,
}: NotificationEmptyStateProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-10 text-center max-w-md mx-auto my-6 space-y-3 shadow-xs">
      <EmptyIllustration
        asset={isUnreadOnly ? 'onboarding-success' : 'no-notifications'}
        compact
      />
      <h3 className="text-sm font-bold text-foreground">
        {isUnreadOnly ? 'No Unread Notifications' : title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isUnreadOnly
          ? 'Great job! You have reviewed all notifications in this category.'
          : description}
      </p>
    </div>
  );
}
