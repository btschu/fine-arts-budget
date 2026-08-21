// Shared between auth.config.ts (server) and the idle-timeout warning
// (client) so both agree on the same timing without either pulling in
// the other's dependencies.

export const SESSION_MAX_AGE_SECONDS = 60 * 60; // sign out after this long idle
export const SESSION_UPDATE_AGE_SECONDS = 5 * 60; // how often activity refreshes the session
export const SESSION_WARNING_SECONDS = 60; // show the "signing out soon" warning this long before
