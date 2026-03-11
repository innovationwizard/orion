import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the service_role key.
 *
 * SECURITY: This client bypasses all RLS policies.
 * Use ONLY in server-side API routes for operations that require it:
 *   - Calling SECURITY DEFINER functions (submit_reservation, confirm, reject, desist)
 *   - Writing to receipt_extractions
 *   - Managing storage objects
 *
 * NEVER expose this client or the service_role key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
