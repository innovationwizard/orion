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

  const { data } = await supabase.auth.getUser();
  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");

  if (!data.user && !isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (data.user && isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|favicon.png|og-image.png|og-image.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)"
  ]
};
