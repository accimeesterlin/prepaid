// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://42e9fdd582614df585f09c7cde9e6c17@glitchtip-web-production-ea73.up.railway.app/5",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Disable sending PII (Personally Identifiable Information)
  // We'll manually set user context with non-PII data only
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  // Scrub sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Remove any PII from the event
    if (event.user) {
      // Remove email and any other PII fields
      delete event.user.email;
      delete event.user.username;
      delete event.user.ip_address;
    }

    // Remove sensitive request data
    if (event.request) {
      // Remove cookies that might contain sensitive data
      delete event.request.cookies;

      // Sanitize headers - remove authorization and other sensitive headers
      if (event.request.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.authorization;
        delete event.request.headers.Cookie;
        delete event.request.headers.cookie;
      }
    }

    return event;
  },
});
