"use server";

import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { PlatformUser, PlatformConfig } from "@/contexts/PlatformConfigContext";

const ADMIN_ACCESS_KEY = "Adiel&Adryan2026@!"; // In a real app, use existing environment variable or Context constant

function authorize(key: string) {
  if (key !== ADMIN_ACCESS_KEY) {
    throw new Error("Acesso negado: Chave de administrador inválida.");
  }
}

export async function getAdminData(accessKey: string) {
  authorize(accessKey);

  const [usersResult, configResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("*"),
    supabaseAdmin.from("platform_config").select("config").eq("id", 1).single(),
  ]);

  if (usersResult.error) throw new Error(usersResult.error.message);

  // Transform profiles to PlatformUser shape if needed
  // (Assuming database columns match PlatformUser interface roughly)

  return {
    users: usersResult.data || [],
    config: configResult.data?.config || null,
  };
}

export async function createPlatformUser(
  accessKey: string,
  userData: Omit<PlatformUser, "id" | "createdAt" | "lastLogin">,
) {
  authorize(accessKey);

  // 1. Create Auth User
  // Generate a temporary password or use a provided one.
  // For this flow, we'll set a default password and expect the user to change it,
  // or (better) we should ask for a password in the UI.
  // Since the current UI doesn't ask for password, let's generate one or set a default.
  // DEFAULT: "Mudar123!" (User should change this)
  const tempPassword = "Mudar123!";

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: userData.name },
    });

  if (authError)
    throw new Error("Erro ao criar usuário no Auth: " + authError.message);
  if (!authData.user) throw new Error("Usuário não retornado após criação.");

  const userId = authData.user.id;
  const createdAt = new Date().toISOString();

  // 2. Insert Profile
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    email: userData.email,
    name: userData.name,
    plan: userData.plan,
    status: userData.status,
    created_at: createdAt,
  });

  if (profileError) {
    // Rollback auth user if profile creation fails?
    // Ideally yes, but for now just throw.
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error("Erro ao criar perfil: " + profileError.message);
  }

  return {
    id: userId,
    createdAt,
    tempPassword, // Return this so Admin can see it? Or just communicate it.
  };
}

export async function updatePlatformUser(
  accessKey: string,
  id: string,
  updates: Partial<PlatformUser>,
) {
  authorize(accessKey);

  // Update profile
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      name: updates.name,
      plan: updates.plan,
      status: updates.status,
      // email changes require Auth update too, ignoring for now to keep simple
    })
    .eq("id", id);

  if (error) throw new Error("Erro ao atualizar usuário: " + error.message);
}

export async function deletePlatformUser(accessKey: string, id: string) {
  authorize(accessKey);

  // Delete from Auth (Cascade should delete profile)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) throw new Error("Erro ao excluir usuário: " + error.message);
}

export async function updatePlatformConfig(
  accessKey: string,
  config: PlatformConfig,
) {
  authorize(accessKey);

  const { error } = await supabaseAdmin.from("platform_config").upsert({
    id: 1,
    config,
    updated_at: new Date().toISOString(),
  });

  if (error)
    throw new Error("Erro ao atualizar configuração: " + error.message);
}
