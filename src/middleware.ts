import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    "/",
    "/api/clerk-webhook",
    "/api/drive-activity/notification",
    "/api/zoom-webhook",
    "/api/payment/success",
    "/api/flow",
    "/api/cron/refresh-drive-listener",
    "/api/cron/cleanup-logs",
    "/api/webhooks/:workflowId*",
    "/api/inngest",
  ],
  ignoredRoutes: [
    "/api/auth/callback/discord",
    "/api/auth/callback/notion",
    "/api/auth/callback/slack",
    "/api/flow",
    "/api/zoom-webhook",
    "/api/cron/wait",
    "/api/cron/refresh-drive-listener",
    "/api/cron/cleanup-logs",
    "/api/webhooks/:workflowId*",
    "/api/inngest",
  ],
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
