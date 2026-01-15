import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware en Edge Runtime
 * --------------------------------------------------
 * ⚠️ NO usar Supabase aquí (Edge no soporta Node APIs).
 * Este middleware SOLO gestiona redirecciones básicas
 * de rutas protegidas.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas que requieren sesión
  const protectedPrefixes = [
    "/my",
    "/onboarding",
    "/orders",
    "/listings/new",
  ];

  const isProtected = protectedPrefixes.some((p) =>
    pathname.startsWith(p)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  /**
   * Aquí NO comprobamos sesión real.
   * La verificación real de auth se hace en:
   *  - Server Components
   *  - Server Actions
   *  - Route Handlers
   */
  const hasSession =
    req.cookies.has("sb-access-token") ||
    req.cookies.has("sb-refresh-token");

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
