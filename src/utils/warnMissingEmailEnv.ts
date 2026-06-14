import config from '@/config/config.js';

const emailEnvVars = {
  GOOGLE_EMAIL: config.email.googleEmail,
  GOOGLE_CLIENT_ID: config.email.googleClientId,
  GOOGLE_CLIENT_SECRET: config.email.googleClientSecret,
  GOOGLE_REFRESH_TOKEN: config.email.googleRefreshToken,
  GOOGLE_REDIRECT_URI: config.email.googleRedirectUri,
  FRONTEND_URL: config.email.frontendUrl,
} as const;

export function warnMissingEmailEnv(): void {
  const missingEmailEnvVars = Object.entries(emailEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingEmailEnvVars.length !== 0) {
    console.warn(
      `[Server] Missing email env var(s): ${missingEmailEnvVars.join(', ')}`,
    );
  }
}
