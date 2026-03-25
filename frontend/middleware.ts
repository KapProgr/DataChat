import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public pages that don't require auth
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)", "/api/contact", "/privacy", "/terms", "/faq", "/contact"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};