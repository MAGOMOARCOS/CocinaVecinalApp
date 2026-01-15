import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware SOLO para routing.
 * NO usar Supabase aquí (Edge Runtime).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedPrefixes = [
    "/my",
    "/onboarding",
    "/orders",
    "/listings/new",
  ];

  const isProtected = protectedPrefixes.some((p) =>
    pathname.startsWith(p)
  );

  if (isProtected) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
