'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export type AnnouncementPoliteness = 'polite' | 'assertive';

interface LiveAnnouncerContextValue {
  announce: (message: string, politeness?: AnnouncementPoliteness) => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue>({
  announce: () => {},
});

/**
 * WCAG 2.2 AA 4.1.3 Status Messages:
 * Provides global polite and assertive live regions for assistive technologies
 * without disrupting visual focus order.
 */
export function LiveAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMsg, setPoliteMsg] = useState('');
  const [assertiveMsg, setAssertiveMsg] = useState('');

  const announce = useCallback((message: string, politeness: AnnouncementPoliteness = 'polite') => {
    const clean = message.trim();
    if (!clean) return;
    if (politeness === 'assertive') {
      setAssertiveMsg('');
      window.setTimeout(() => setAssertiveMsg(clean), 20);
    } else {
      setPoliteMsg('');
      window.setTimeout(() => setPoliteMsg(clean), 20);
    }
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMsg}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMsg}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useLiveAnnouncer() {
  return useContext(LiveAnnouncerContext);
}

export default LiveAnnouncerProvider;
