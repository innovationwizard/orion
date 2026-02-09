import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk, parseJson, parseQuery } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import type { Project } from "@/lib/types";
import { generateId } from "@/lib/uuid";

const projectsQuerySchema = z.object({
  search: z.string().optional()
});

const createProjectSchema = z.object({
  name: z.string().min(2)
});

const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2)
});

const deleteProjectSchema = z.object({
  id: z.string().uuid()
});

export async function GET(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();
  const { data: query, error } = parseQuery(request, projectsQuerySchema);
  if (error) {
    return jsonError(400, error.error, error.details);
  }

  try {
    let builder = supabase.from("projects").select("*");
    if (query?.search) {
      builder = builder.ilike("name", `%${query.search}%`);
    }
    const { data, error: dbError } = await builder.order("name", { ascending: true });
    if (dbError) {
      return jsonError(500, "Database error", dbError.message);
    }
    return jsonOk({ data: (data ?? []) as Project[] });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}

export async function POST(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();
  const { data: payload, error } = await parseJson(request, createProjectSchema);
  if (error || !payload) {
    return jsonError(400, error?.error ?? "Invalid input", error?.details);
  }

  try {
    const { data: inserted, error: insertError } = await supabase
      .from("projects")
      .insert({ id: generateId(), name: payload.name })
      .select("*")
      .single();

    if (insertError || !inserted) {
      return jsonError(500, "Database error", insertError?.message);
    }

    return jsonOk({ data: inserted as Project }, { status: 201 });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}

export async function PATCH(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();
  const { data: payload, error } = await parseJson(request, updateProjectSchema);
  if (error || !payload) {
    return jsonError(400, error?.error ?? "Invalid input", error?.details);
  }

  try {
    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update({ name: payload.name })
      .eq("id", payload.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return jsonError(500, "Database error", updateError?.message);
    }

    return jsonOk({ data: updated as Project });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}

export async function DELETE(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();
  const { data: payload, error } = await parseJson(request, deleteProjectSchema);
  if (error || !payload) {
    return jsonError(400, error?.error ?? "Invalid input", error?.details);
  }

  try {
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", payload.id);
    if (deleteError) {
      return jsonError(500, "Database error", deleteError.message);
    }
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}
