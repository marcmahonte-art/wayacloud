import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  is_favorite: z.boolean().optional(),
  color_label: z.enum(["red","orange","yellow","green","blue","purple","pink","gray"]).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_trashed: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Non authentifié." }, { status: 401 });

  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ message: "Données invalides.", errors: body.error.issues }, { status: 400 });

  const updates: Record<string, any> = {};
  if (body.data.name !== undefined) updates.name = body.data.name;
  if (body.data.is_favorite !== undefined) updates.is_favorite = body.data.is_favorite;
  if (body.data.color_label !== undefined) updates.color_label = body.data.color_label;
  if (body.data.parent_id !== undefined) updates.parent_id = body.data.parent_id;
  if (body.data.is_trashed !== undefined) {
    updates.is_trashed = body.data.is_trashed;
    updates.trashed_at = body.data.is_trashed ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("files")
    .update(updates)
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Non authentifié." }, { status: 401 });

  const { data: file, error: findError } = await supabase
    .from("files")
    .select("id, object_key, status")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (findError || !file) return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 });

  const { error: delError } = await supabase
    .from("files")
    .update({ status: "deleted", updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (delError) return NextResponse.json({ message: delError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
