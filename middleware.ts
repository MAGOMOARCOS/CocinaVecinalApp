import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware en Edge Runtime
 * ─────────────────────────
 * ⚠️ NO usar Supabase aquí (Edge no soporta Node APIs).
 * Este middleware SOLO gestiona redirecciones de rutas protegidas.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas que requieren login
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

/**
 * Aplica a todo excepto assets estáticos
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
