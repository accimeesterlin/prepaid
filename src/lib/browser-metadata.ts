/**
 * Collect browser/device metadata from the client side.
 * Only call this in client components (browser environment).
 */
export function collectBrowserMetadata(): Record<string, unknown> {
  if (typeof window === "undefined") return {};

  const nav = window.navigator;

  return {
    language: nav.language,
    languages: nav.languages ? Array.from(nav.languages) : undefined,
    platform: nav.platform,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    cookiesEnabled: nav.cookieEnabled,
    online: nav.onLine,
    touchSupport: "ontouchstart" in window || nav.maxTouchPoints > 0,
    deviceMemory: (nav as any).deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    connectionType: (nav as any).connection?.effectiveType,
  };
}
