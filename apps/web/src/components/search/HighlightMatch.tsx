'use client';

import React from 'react';
import { splitHighlightSegments } from '@/features/search/lib/recent-navigation';

export interface HighlightMatchProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Safely highlights matched search keywords using semantic `<mark>` spans.
 * Zero `dangerouslySetInnerHTML`, fully theme-aware in Light and Dark modes.
 */
export function HighlightMatch({ text, query, className }: HighlightMatchProps) {
  const segments = splitHighlightSegments(text, query);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.matched ? (
          <mark
            key={`${index}-${segment.text}`}
            className="bg-primary/15 text-foreground rounded-xs px-0.5 font-semibold"
          >
            {segment.text}
          </mark>
        ) : (
          <React.Fragment key={`${index}-${segment.text}`}>{segment.text}</React.Fragment>
        )
      )}
    </span>
  );
}

export default HighlightMatch;
