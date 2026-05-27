import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/mes-fichiers", "/albums", "/partages", "/whatsapp", "/abonnement", "/parametres", "/corbeille", "/outils", "/referral", "/gift"];

const authPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-otp"];

const publicPaths = ["/verify-email"];

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/webhook") || pathname.startsWith("/s/")) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/auth/callback")) {
    return withSecurityHeaders(NextResponse.next());
  }

  const response = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return withSecurityHeaders(response);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));
  const isPublicPath = publicPaths.some((path) => pathname === path);
  const isAuthPath = authPaths.some((path) => pathname === path);

  // Redirect unauthenticated users from protected paths
  if (isProtectedPath && !user) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  // Redirect unconfirmed users from protected paths to confirmation page
  if (isProtectedPath && user && !user.email_confirmed_at) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(user.email || "")}`, request.url)),
    )
  }

  // Redirect confirmed users away from verify-email page
  if (pathname === "/verify-email" && user?.email_confirmed_at) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && user && user.email_confirmed_at) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  // Allow unconfirmed users to access verify-email page freely

  if (isAuthPath && user && !user.email_confirmed_at) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(user.email || "")}`, request.url)),
    )
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/login", request.url)),
      );
    }
    const role = user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url)),
      );
    }
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhook).*)",
  ],
};
