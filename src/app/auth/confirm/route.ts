import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const CRAWLER_USER_AGENTS = [
  "whatsapp",
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "telegrambot",
  "discordbot",
  "googlebot",
  "bingbot",
  "bot",
  "crawler",
  "spider",
  "preview",
];

/**
 * GET /auth/confirm?token_hash=...&type=invite|magiclink|recovery
 *
 * Verifies the OTP token server-side, sets session cookies, and redirects
 * to /auth/set-password. Crawlers/bots are blocked from consuming the
 * one-time token (WhatsApp link previews would invalidate it otherwise).
 */
export async function GET(request: NextRequest) {
  // Block crawlers from consuming one-time tokens via link preview fetches
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  const isCrawler = CRAWLER_USER_AGENTS.some((bot) => ua.includes(bot));
  if (isCrawler) {
    return new NextResponse("OK", { status: 200 });
  }

  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const redirectUrl = request.nextUrl.clone();

  if (!tokenHash || !type) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "invalid_link");
    return NextResponse.redirect(redirectUrl);
  }

  // Build response first so we can write cookies into it
  redirectUrl.pathname = "/auth/set-password";
  redirectUrl.searchParams.delete("token_hash");
  redirectUrl.searchParams.delete("type");
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        response.cookies.set({ name, value, ...options });
      },
      remove: (name: string, options: CookieOptions) => {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    const errorUrl = request.nextUrl.clone();
    errorUrl.pathname = "/login";
    errorUrl.searchParams.set("error", "invalid_link");
    return NextResponse.redirect(errorUrl);
  }

  return response;
}
