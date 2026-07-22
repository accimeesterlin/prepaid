/**
 * Analytics utility for PostHog integration
 *
 * This module provides a clean API for tracking events, identifying users,
 * and capturing errors throughout the application.
 *
 * Usage:
 * ```typescript
 * import { analytics } from '@/lib/analytics';
 *
 * // Track an event
 * analytics.track('button_clicked', { button_name: 'signup' });
 *
 * // Identify a user
 * analytics.identify(user.id, { email: user.email, role: user.role });
 *
 * // Capture an error
 * analytics.captureError(error, { context: 'checkout_flow' });
 * ```
 */

import posthog from 'posthog-js';

/**
 * Check if PostHog is initialized and ready to use
 */
function isPostHogReady(): boolean {
  return typeof window !== 'undefined' && posthog.__loaded;
}

/**
 * Track a custom event
 */
function track(eventName: string, properties?: Record<string, any>): void {
  if (isPostHogReady()) {
    posthog.capture(eventName, properties);
  }
}

/**
 * Identify the current user
 */
function identify(userId: string, userProperties?: Record<string, any>): void {
  if (isPostHogReady()) {
    posthog.identify(userId, userProperties);
  }
}

/**
 * Reset the current user (call on logout)
 */
function reset(): void {
  if (isPostHogReady()) {
    posthog.reset();
  }
}

/**
 * Set user properties (for identified users)
 */
function setUserProperties(properties: Record<string, any>): void {
  if (isPostHogReady()) {
    posthog.people.set(properties);
  }
}

/**
 * Capture an exception/error
 */
function captureError(error: Error, context?: Record<string, any>): void {
  if (isPostHogReady()) {
    posthog.capture('$exception', {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_stack_trace: error.stack,
      ...context,
    });
  }
}

/**
 * Track a page view manually (useful for SPA navigation)
 */
function trackPageView(url?: string): void {
  if (isPostHogReady()) {
    posthog.capture('$pageview', {
      $current_url: url || window.location.href,
    });
  }
}

/**
 * Set super properties (properties sent with every event)
 */
function setSuperProperties(properties: Record<string, any>): void {
  if (isPostHogReady()) {
    posthog.register(properties);
  }
}

/**
 * Remove a super property
 */
function unsetSuperProperty(propertyName: string): void {
  if (isPostHogReady()) {
    posthog.unregister(propertyName);
  }
}

/**
 * Enable or disable session recording
 */
function setSessionRecording(enabled: boolean): void {
  if (isPostHogReady()) {
    if (enabled) {
      posthog.startSessionRecording();
    } else {
      posthog.stopSessionRecording();
    }
  }
}

/**
 * Create a feature flag check
 */
function isFeatureEnabled(flagKey: string, defaultValue = false): boolean {
  if (isPostHogReady()) {
    return posthog.isFeatureEnabled(flagKey) ?? defaultValue;
  }
  return defaultValue;
}

/**
 * Get feature flag payload
 */
function getFeatureFlagPayload(flagKey: string): any {
  if (isPostHogReady()) {
    return posthog.getFeatureFlagPayload(flagKey);
  }
  return undefined;
}

/**
 * Convenience functions for common events
 */
const events = {
  // Authentication events
  userSignedUp: (userId: string, properties?: Record<string, any>) => {
    track('user_signed_up', { user_id: userId, ...properties });
  },

  userLoggedIn: (userId: string, properties?: Record<string, any>) => {
    track('user_logged_in', { user_id: userId, ...properties });
  },

  userLoggedOut: () => {
    track('user_logged_out');
    reset();
  },

  // Transaction events
  transactionStarted: (transactionId: string, amount: number, currency: string) => {
    track('transaction_started', {
      transaction_id: transactionId,
      amount,
      currency,
    });
  },

  transactionCompleted: (transactionId: string, amount: number, currency: string) => {
    track('transaction_completed', {
      transaction_id: transactionId,
      amount,
      currency,
    });
  },

  transactionFailed: (transactionId: string, reason: string) => {
    track('transaction_failed', {
      transaction_id: transactionId,
      failure_reason: reason,
    });
  },

  // Product events
  productViewed: (productId: string, properties?: Record<string, any>) => {
    track('product_viewed', {
      product_id: productId,
      ...properties,
    });
  },

  productSelected: (productId: string, properties?: Record<string, any>) => {
    track('product_selected', {
      product_id: productId,
      ...properties,
    });
  },

  // Wallet events
  walletDeposit: (amount: number, currency: string) => {
    track('wallet_deposit', { amount, currency });
  },

  walletWithdrawal: (amount: number, currency: string) => {
    track('wallet_withdrawal', { amount, currency });
  },

  // Organization events
  organizationCreated: (orgId: string, orgName: string) => {
    track('organization_created', {
      organization_id: orgId,
      organization_name: orgName,
    });
  },

  organizationSwitched: (orgId: string, orgName: string) => {
    track('organization_switched', {
      organization_id: orgId,
      organization_name: orgName,
    });
  },

  // Integration events
  integrationConnected: (provider: string) => {
    track('integration_connected', { provider });
  },

  integrationDisconnected: (provider: string) => {
    track('integration_disconnected', { provider });
  },

  // Error tracking
  apiError: (endpoint: string, statusCode: number, error: string) => {
    track('api_error', {
      endpoint,
      status_code: statusCode,
      error_message: error,
    });
  },
};

/**
 * Main analytics export
 */
export const analytics = {
  track,
  identify,
  reset,
  setUserProperties,
  captureError,
  trackPageView,
  setSuperProperties,
  unsetSuperProperty,
  setSessionRecording,
  isFeatureEnabled,
  getFeatureFlagPayload,
  events,
};
