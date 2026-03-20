import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const CRAWLER_USER_AGENTS = [
  "WhatsApp",
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "TelegramBot",
  "Discordbot",
  "Googlebot",
  "bingbot"
];

function isCrawler(request: NextRequest): boolean {
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  return CRAWLER_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

export async function middleware(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Let crawlers (e.g. WhatsApp link preview) receive the page with OG meta
  if (isCrawler(request)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        response.cookies.set({ name, value, ...options });
      },
      remove: (name: string, options: CookieOptions) => {
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  // getUser() may refresh tokens and write new cookies to `response`.
  // Any redirect we return must carry those cookies forward.
  const { data } = await supabase.auth.getUser();

  /** Create a redirect that preserves any cookies set during getUser() (token refresh). */
  function redirectTo(pathname: string): NextResponse {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redir = NextResponse.redirect(url);
    // Copy cookies from the response (may include refreshed auth tokens)
    for (const cookie of response.cookies.getAll()) {
      redir.cookies.set(cookie);
    }
    return redir;
  }

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname.startsWith("/login");
  const isAuthCallback = pathname === "/auth/callback";
  const isAuthConfirm = pathname === "/auth/confirm";
  const isSetPassword = pathname === "/auth/set-password";

  // Public reservation system pages (no auth required — availability board + calculator)
  // Note: /reservar was removed — now requires auth (salesperson must be logged in)
  const isPublicReservasPage =
    pathname.startsWith("/disponibilidad") ||
    pathname.startsWith("/cotizador");

  // Allow /auth/callback so invite/magic-link can land and client can set session from hash
  if (!data.user && !isLoginRoute && !isAuthCallback && !isAuthConfirm && !isSetPassword && !isPublicReservasPage) {
    return redirectTo("/login");
  }

  // Role-based routing for authenticated users
  if (data.user) {
    const role = (data.user.app_metadata?.role as string | undefined) ?? null;

    // Admin roles with full page access
    const ADMIN_PAGE_ROLES = ["master", "torredecontrol"];
    // Roles that can view analytics/dashboard pages (not admin mutation pages)
    const DATA_PAGE_ROLES = ["gerencia", "financiero", "contabilidad"];

    // Redirect logged-in users from /login to their home page
    if (isLoginRoute) {
      if (role === "ventas") return redirectTo("/ventas/dashboard");
      if (role && [...ADMIN_PAGE_ROLES, ...DATA_PAGE_ROLES].includes(role)) {
        return redirectTo("/");
      }
      // Unknown/unhandled role: stay on login page
      return response;
    }

    if (role === "ventas") {
      // Force password setup before any app access
      // app_metadata is authoritative; user_metadata fallback covers users who set password before this change
      const passwordSet =
        data.user.app_metadata?.password_set === true ||
        data.user.user_metadata?.password_set === true;
      if (!passwordSet && !isSetPassword && !isAuthCallback && !isAuthConfirm) {
        return redirectTo("/auth/set-password");
      }

      // Restrict to allowed pages
      const allowedPrefixes = [
        "/reservar",
        "/ventas",
        "/disponibilidad",
        "/cotizador",
        "/auth",
        "/login",
      ];
      if (!allowedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
        return redirectTo("/ventas/dashboard");
      }
    } else if (ADMIN_PAGE_ROLES.includes(role ?? "")) {
      // Full admin access — no page restrictions
    } else if (DATA_PAGE_ROLES.includes(role ?? "")) {
      // Data viewer roles: block admin-only pages, allow analytics + public
      const adminOnlyPrefixes = [
        "/admin",
        "/referidos",
        "/valorizacion",
        "/cesion",
        "/buyer-persona",
        "/integracion",
      ];
      if (adminOnlyPrefixes.some((p) => pathname.startsWith(p))) {
        return redirectTo("/");
      }
    } else {
      // Unknown/unhandled role (inventario, null, or unrecognized):
      // only allow public pages + auth routes
      if (!isPublicReservasPage && !isAuthCallback && !isAuthConfirm && !isSetPassword) {
        return redirectTo("/login");
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|favicon.png|og-image.png|og-image.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)"
  ]
};
