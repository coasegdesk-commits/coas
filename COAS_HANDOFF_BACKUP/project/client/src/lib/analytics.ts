type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void | Promise<unknown>;
    };
  }
}

/** The publishing proxy supplies the tracker; never load another analytics script. */
export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === "undefined") return;

  try {
    const result = window.umami?.track(name, data);
    // Both synchronous failures and rejected requests must leave the UI working.
    if (result) void Promise.resolve(result).catch(() => {});
  } catch {
    // Analytics must never break a user interaction.
  }
}