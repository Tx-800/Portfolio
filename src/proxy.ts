import { NextResponse, userAgent, type NextRequest } from "next/server";
import { DEVICE_COOKIE, deviceFromUserAgent, isDevice, MOBILE_ROUTE } from "@/lib/device";

/**
 * "/" serves the right experience on the first response, with no redirect:
 *   phones / tablets → REWRITE to /m (the Data Core); everyone else → the desktop journey.
 * The URL stays "/". The cookie (written by DeviceSwitch when the browser finds the guess was
 * wrong: iPads that say "Mac", "Desktop site" mode, foldables, resizing) wins over the user agent.
 *
 * Caching: both "/" and "/m" stay fully static. On Vercel the proxy runs BEFORE the CDN cache,
 * so the cache only ever sees the two rewritten paths: it varies by device type (2 entries),
 * not by user agent. Static HTML is sent with `max-age=0, must-revalidate`, so a browser always
 * comes back through the proxy and can't reuse the other device's page.
 * Client-side navigations to "/" (RSC requests) are normalised to "/" before they reach the
 * proxy, so they get the same rewrite.
 */
export function proxy(request: NextRequest) {
  const cookie = request.cookies.get(DEVICE_COOKIE)?.value;
  const device = isDevice(cookie) ? cookie : deviceFromUserAgent(userAgent(request).device.type);
  let response = NextResponse.next();
  if (device === "mobile") {
    const url = request.nextUrl.clone(); // keeps any query string
    url.pathname = MOBILE_ROUTE;
    response = NextResponse.rewrite(url);
  }
  response.headers.set("x-device", device);
  return response;
}

export const config = {
  matcher: "/",
};
