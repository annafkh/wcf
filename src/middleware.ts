import { defineMiddleware } from "astro:middleware";
import { getContent } from "./server/content";
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === "/") {
    context.locals.content = await getContent();
  }
  const response = await next();
  if (context.url.pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    response.headers.set("Referrer-Policy", "same-origin");
  }
  if (context.url.pathname === "/")
    response.headers.set("Cache-Control", "no-cache");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
});
