import { NextResponse } from "next/server";

const marketingHosts = ["konnuko.com", "www.konnuko.com"];
const bypassPaths = [
  "/_next",
  "/api",
  "/favicon",
  "/robots",
  "/sitemap",
  "/privacy",
  "/terms",
];

export default function proxy(req) {
  const host = req.headers.get("host")?.toLowerCase();
  const url = req.nextUrl.clone();

  if (host && marketingHosts.includes(host)) {
    const pathname = url.pathname;
    const isStaticAsset = pathname.includes(".");
    const shouldBypass =
      isStaticAsset || bypassPaths.some((prefix) => pathname.startsWith(prefix));

    if (!shouldBypass && pathname !== "/marketing") {
      url.pathname = "/marketing";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
