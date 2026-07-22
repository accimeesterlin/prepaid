'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize PostHog only on client side and if API key is provided
    if (
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      // Check if already initialized to prevent duplicate initialization
      if (!posthog.__loaded) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          person_profiles: 'identified_only', // Only create profiles for identified users

          // Session Replay Configuration
          session_recording: {
            maskAllInputs: true, // Mask all input fields by default for privacy
            maskTextSelector: '[data-private]', // Mask elements with data-private attribute
            recordCrossOriginIframes: false,
            // Capture console logs for debugging
            recordConsole: {
              log: true,
              warn: true,
              error: true,
            },
            // Capture network requests for debugging
            recordNetwork: {
              recordHeaders: true,
              recordBody: true,
              recordPerformance: true,
            },
          },

          // Enable session recording by default
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              posthog.debug(); // Enable debug mode in development
            }

            // Start session recording
            posthog.startSessionRecording();
          },

          // Autocapture configuration
          autocapture: {
            dom_event_allowlist: ['click', 'submit', 'change'], // Only capture specific events
            element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea'],
            css_selector_allowlist: ['[ph-capture]'], // Only capture elements with ph-capture attribute
          },

          // Capture pageviews and pageleaves
          capture_pageview: false, // We'll handle this manually for better control
          capture_pageleave: true,

          // Advanced settings
          persistence: 'localStorage+cookie', // Use both for better tracking
          cross_subdomain_cookie: true,
          secure_cookie: process.env.NODE_ENV === 'production',

          // Rate limiting
          rate_limiting: {
            events_burst_limit: 100,
            events_per_second: 10,
          },

          // Disable in development if needed
          opt_out_capturing_by_default: false,

          // Sanitize data before sending
          sanitize_properties: (properties) => {
            // Remove any sensitive data
            const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'apiKey', 'authorization'];
            const sanitized = { ...properties };

            for (const key in sanitized) {
              if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                delete sanitized[key];
              }
            }

            return sanitized;
          },
        });

        // Set up error tracking
        window.addEventListener('error', (event) => {
          posthog.capture('$exception', {
            $exception_message: event.error?.message || event.message,
            $exception_type: event.error?.name || 'Error',
            $exception_stack_trace: event.error?.stack,
            $exception_source: event.filename,
            $exception_lineno: event.lineno,
            $exception_colno: event.colno,
          });
        });

        // Set up unhandled promise rejection tracking
        window.addEventListener('unhandledrejection', (event) => {
          posthog.capture('$exception', {
            $exception_message: event.reason?.message || String(event.reason),
            $exception_type: event.reason?.name || 'UnhandledPromiseRejection',
            $exception_stack_trace: event.reason?.stack,
          });
        });
      }
    }
  }, []); // Only run once on mount

  // Track page views
  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}

// Helper function to identify users
export function identifyUser(userId: string, userProperties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, userProperties);
  }
}

// Helper function to track custom events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
}

// Helper function to reset user (on logout)
export function resetUser() {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset();
  }
}

// Helper function to set user properties
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.people.set(properties);
  }
}

// Helper function to capture exceptions manually
export function captureException(error: Error, context?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture('$exception', {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_stack_trace: error.stack,
      ...context,
    });
  }
}
