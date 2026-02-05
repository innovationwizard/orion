import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "./supabase";

export const paymentTypeValues = [
  "reservation",
  "down_payment",
  "installment",
  "final"
] as const;

export const unitStatusValues = [
  "active",
  "available",
  "reserved",
  "sold"
] as const;

export const saleStatusValues = [
  "pending",
  "confirmed",
  "cancelled"
] as const;

export type ApiError = {
  error: string;
  details?: unknown;
};

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function jsonOk<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

export async function parseJson<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return { error: { error: "Invalid input", details: parsed.error.flatten() } };
    }
    return { data: parsed.data };
  } catch (error) {
    return { error: { error: "Invalid input", details: error } };
  }
}

export function parseQuery<T>(
  request: Request,
  schema: z.ZodSchema<T>
): { data?: T; error?: ApiError } {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return { error: { error: "Invalid input", details: parsed.error.flatten() } };
  }
  return { data: parsed.data };
}

export async function assertExists(
  table: string,
  id: string,
  notFoundMessage: string
): Promise<{ error?: ApiError }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { error: { error: "Database error", details: error.message } };
  }

  if (!data) {
    return { error: { error: notFoundMessage } };
  }

  return {};
}
