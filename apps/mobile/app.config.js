// Extends app.json with environment-specific values.
// Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your shell (or .env) before
// running `expo run:ios` / `eas build`.
/** @type {(ctx: { config: import('@expo/config-types').ExpoConfig }) => import('@expo/config-types').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    tursoUrl: process.env.TURSO_DATABASE_URL ?? '',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? '',
  },
});
