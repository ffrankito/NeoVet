import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  sendDefaultPii: false,

  includeLocalVariables: false,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: false,

  beforeSend(event, hint) {
    const error = hint?.originalException as { digest?: string; message?: string } | undefined;
    if (error?.digest === "NEXT_REDIRECT" || error?.digest === "NEXT_NOT_FOUND") {
      return null;
    }
    return event;
  },
});
