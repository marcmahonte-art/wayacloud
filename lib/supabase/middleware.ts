import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

const protectedPaths = [
  "/dashboard",
  "/mes-fichiers",
  "/albums",
  "/partages",
  "/whatsapp",
  "/abonnement",
  "/parametres",
  "/corbeille",
  "/outils",
];

const authPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-otp"]; // add others if needed

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return withSecurityHeaders(response);
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
  });

  const { data: { user } = {} } = await supabase.auth.getUser();

  const isProtected = protectedPaths.some(p => pathname.startsWith(p));
  if (isProtected && !user) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  const isAuth = authPaths.some(p => pathname === p);
  if (isAuth && user) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
    }
    const role = user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
    }
  }

  return withSecurityHeaders(response);
}
