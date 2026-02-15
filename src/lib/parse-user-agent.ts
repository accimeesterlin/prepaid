// eslint-disable-next-line @typescript-eslint/no-require-imports
const UAParser = require("ua-parser-js");

export interface ParsedDevice {
  /** e.g. "Chrome", "Safari", "Firefox", "Edge" */
  browserName: string;
  /** e.g. "120.0" */
  browserVersion: string;
  /** e.g. "iPhone", "Android", "Desktop", "Tablet" */
  deviceType: string;
  /** e.g. "iOS", "Android", "Windows", "macOS", "Linux" */
  osName: string;
  /** e.g. "17.2" */
  osVersion: string;
}

/**
 * Parse a user-agent string into readable device and browser info.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedDevice {
  if (!ua) {
    return {
      browserName: "Unknown",
      browserVersion: "",
      deviceType: "Unknown",
      osName: "Unknown",
      osVersion: "",
    };
  }

  const result = UAParser(ua);
  const browser = result.browser || {};
  const device = result.device || {};
  const os = result.os || {};

  // Resolve device type to a friendly label
  let deviceType: string;
  if (device.type === "mobile") {
    if (os.name === "iOS") {
      deviceType = "iPhone";
    } else {
      deviceType = "Android";
    }
  } else if (device.type === "tablet") {
    if (os.name === "iOS") {
      deviceType = "iPad";
    } else {
      deviceType = "Tablet";
    }
  } else {
    deviceType = "Desktop";
  }

  // Normalize browser name: "Mobile Safari" → "Safari", "Mobile Chrome" → "Chrome"
  const rawBrowserName: string = browser.name || "Unknown";
  const browserName = rawBrowserName.replace(/^Mobile\s+/i, "");

  return {
    browserName,
    browserVersion: browser.version || "",
    deviceType,
    osName: os.name || "Unknown",
    osVersion: os.version || "",
  };
}
