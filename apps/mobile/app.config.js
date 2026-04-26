// Extends app.json with environment-specific values.
// Reads from .env (gitignored) for local dev; use EAS secrets for CI builds.
require('dotenv').config();

/** @type {(ctx: { config: import('@expo/config-types').ExpoConfig }) => import('@expo/config-types').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    tursoUrl: process.env.TURSO_DATABASE_URL ?? '',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN ?? '',
  },
});
