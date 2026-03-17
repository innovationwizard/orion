/**
 * Quick script to generate an invite link for a salesperson.
 * Usage: npx tsx scripts/generate-invite-link.ts user@email.com
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually (no dotenv dependency)
const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/generate-invite-link.ts user@email.com");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://orion-intelligence.vercel.app";

const supabase = createClient(url, key);

async function main() {
  // Ensure app_metadata.role = ventas
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = listData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (user) {
    await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { role: "ventas" },
    });
    console.log(`✓ app_metadata.role = ventas set for ${email} (${user.id})`);
  } else {
    console.log(`⚠ No auth user found for ${email}. Creating via invite...`);
    const { data: invite, error: invErr } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: { role: "ventas" } },
    });
    if (invErr) {
      console.error("Failed to create user:", invErr.message);
      process.exit(1);
    }
    if (invite?.user?.id) {
      await supabase.auth.admin.updateUserById(invite.user.id, {
        app_metadata: { role: "ventas" },
      });
    }
    const ht = invite?.properties?.hashed_token;
    if (ht) {
      console.log(`\n🔗 Invite link:\n${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(ht)}&type=invite\n`);
    }
    return;
  }

  // Generate magic link
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    console.error("Failed to generate link:", error.message);
    process.exit(1);
  }

  const ht = data?.properties?.hashed_token;
  if (!ht) {
    console.error("No hashed_token in response");
    process.exit(1);
  }

  console.log(`\n🔗 Invite link:\n${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(ht)}&type=magiclink\n`);
}

main();
