"use server";

// import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { PlatformUser, PlatformConfig } from "@/contexts/PlatformConfigContext";

const ADMIN_ACCESS_KEY = "Adiel&Adryan2026@!"; // In a real app, use existing environment variable or Context constant

function authorize(key: string) {
  if (key !== ADMIN_ACCESS_KEY) {
    throw new Error("Acesso negado: Chave de administrador inválida.");
  }
}

export async function getAdminData(
  accessKey: string,
): Promise<{ users: PlatformUser[]; config: PlatformConfig | null }> {
  authorize(accessKey);

  console.warn("Firebase Admin SDK not configured. Returning empty data.");
  // throw new Error("Firebase Admin SDK required for server-side admin data fetching.");

  return {
    users: [],
    config: null,
  };

  /*
  const [usersResult, configResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("*"),
    supabaseAdmin.from("platform_config").select("config").eq("id", 1).single(),
  ]);

  if (usersResult.error) throw new Error(usersResult.error.message);

  return {
    users: usersResult.data || [],
    config: configResult.data?.config || null,
  };
  */
}

export async function createPlatformUser(
  accessKey: string,
  userData: Omit<PlatformUser, "id" | "createdAt" | "lastLogin"> & {
    password?: string;
  },
): Promise<{ id: string; createdAt: string; tempPassword?: string }> {
  authorize(accessKey);

  console.warn("Firebase Admin SDK not configured. Returning mock user.");
  // throw new Error("Firebase Admin SDK required for server-side user creation.");

  return {
    id: "mock-id-" + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
    tempPassword: userData.password || "mock-password",
  };

  /*
  // 1. Create Auth User
  // Use provided password or generate a random one.
  const password =
    userData.password || Math.random().toString(36).substring(2, 10);

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        salonName: userData.salonName,
      },
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
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error("Erro ao criar perfil: " + profileError.message);
  }

  return {
    id: userId,
    createdAt,
    tempPassword: password, // Return the password used (generated or provided)
  };
  */
}

export async function updatePlatformUser(
  accessKey: string,
  id: string,
  updates: Partial<PlatformUser>,
) {
  authorize(accessKey);
  void id;
  void updates;

  console.warn(
    "Firebase Admin SDK not configured. updatePlatformUser skipped.",
  );
  throw new Error("Firebase Admin SDK required for server-side user updates.");

  /*
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
  */
}

export async function deletePlatformUser(accessKey: string, id: string) {
  authorize(accessKey);
  void id;

  console.warn(
    "Firebase Admin SDK not configured. deletePlatformUser skipped.",
  );
  throw new Error("Firebase Admin SDK required for server-side user deletion.");

  /*
  // Delete from Auth (Cascade should delete profile)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) throw new Error("Erro ao excluir usuário: " + error.message);
  */
}

export async function updatePlatformConfig(
  accessKey: string,
  config: PlatformConfig,
) {
  authorize(accessKey);
  void config;

  console.warn(
    "Firebase Admin SDK not configured. updatePlatformConfig skipped.",
  );
  throw new Error(
    "Firebase Admin SDK required for server-side config updates.",
  );

  /*
  const { error } = await supabaseAdmin.from("platform_config").upsert({
    id: 1,
    config,
    updated_at: new Date().toISOString(),
  });

  if (error)
    throw new Error("Erro ao atualizar configuração: " + error.message);
  */
}
