import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
