// Self-healing utilities for normal (non-incognito) browser sessions.
// Fixes corrupted localStorage, stale service-worker caches, and invalid
// saved Supabase sessions that cause blank screens / freezes.

const isBrowser = typeof window !== "undefined";

/**
 * Unregister any service workers and clear all caches on load.
 * This app does not ship a service worker, so any registration found is stale
 * and must be removed to stop it serving outdated files.
 */
export function cleanupServiceWorkers() {
  if (!isBrowser) return;
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((r) => r.unregister());
        })
        .catch((e) => console.error("[recovery] SW unregister failed", e));
    }
    if (typeof caches !== "undefined") {
      caches
        .keys()
        .then((keys) => {
          keys.forEach((key) => caches.delete(key));
        })
        .catch((e) => console.error("[recovery] cache clear failed", e));
    }
  } catch (e) {
    console.error("[recovery] cleanupServiceWorkers error", e);
  }
}

/**
 * Walk localStorage and remove any entry that cannot be read or whose
 * JSON-shaped value fails to parse. A single corrupted value must never
 * crash the app session.
 */
export function sanitizeStorage() {
  if (!isBrowser) return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k) keys.push(k);
      }
      for (const key of keys) {
        try {
          const value = store.getItem(key);
          if (value === null) continue;
          // Only validate values that look like JSON (Supabase stores JSON tokens).
          const trimmed = value.trim();
          if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            JSON.parse(value);
          }
        } catch (e) {
          console.error(`[recovery] removing corrupted storage key "${key}"`, e);
          try {
            store.removeItem(key);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      console.error("[recovery] sanitizeStorage error", e);
    }
  }
}

/**
 * Clear all app-related localStorage/sessionStorage keys so the user starts
 * fresh after a sign-out / recovery.
 */
export function clearAppStorage() {
  if (!isBrowser) return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && (k.startsWith("sb-") || k.startsWith("supabase"))) keys.push(k);
      }
      keys.forEach((k) => {
        try {
          store.removeItem(k);
        } catch {
          /* ignore */
        }
      });
    } catch (e) {
      console.error("[recovery] clearAppStorage error", e);
    }
  }
}
