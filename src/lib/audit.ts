import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export interface AuditEvent {
  eventType: string;
  resourceType: string;
  resourceId?: string;
  resourceLabel?: string;
  details?: Record<string, unknown>;
  request?: Request;
}

/**
 * Log an audit event to the centralized audit_events table.
 * Fire-and-forget: audit failure does NOT block the primary operation.
 */
export async function logAudit(user: User, event: AuditEvent): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_role: getUserRole(user) ?? "unknown",
      actor_email: user.email ?? null,
      event_type: event.eventType,
      resource_type: event.resourceType,
      resource_id: event.resourceId ?? null,
      resource_label: event.resourceLabel ?? null,
      details: event.details ?? null,
      ip_address: event.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      http_method: event.request?.method ?? null,
      http_path: event.request ? new URL(event.request.url).pathname : null,
    });

    if (error) {
      console.error("[audit] Failed to log event:", error.message, event.eventType);
    }
  } catch (err) {
    console.error("[audit] Unexpected error:", err);
  }
}
