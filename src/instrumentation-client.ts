// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://42e9fdd582614df585f09c7cde9e6c17@glitchtip-web-production-ea73.up.railway.app/5",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
