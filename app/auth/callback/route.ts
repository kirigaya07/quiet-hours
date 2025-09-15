// app/auth/callback/route.ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("Auth callback called with code:", code ? "present" : "missing");

  if (code) {
    try {
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch (error) {
                console.error("Error setting cookies:", error);
              }
            },
          },
        }
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(
          `${origin}/signin?error=auth_callback_error&message=${encodeURIComponent(
            error.message
          )}`
        );
      }

      if (data.session) {
        console.log("Auth successful, user:", data.session.user.email);
        // Successful authentication, redirect to the intended page
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error("No session created");
        return NextResponse.redirect(`${origin}/signin?error=no_session`);
      }
    } catch (error) {
      console.error("Auth callback exception:", error);
      return NextResponse.redirect(
        `${origin}/signin?error=auth_callback_exception&message=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`
      );
    }
  }

  // No code provided, redirect to signin
  console.log("No code provided in callback");
  return NextResponse.redirect(`${origin}/signin?error=no_code`);
}
