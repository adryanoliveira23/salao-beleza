"use server";

// import { supabaseAdmin } from "@/app/lib/supabase-admin"; // Removed

export async function processPaymentAndCreateUser(
  email: string,
  name: string,
  salonName: string,
  password?: string,
) {
  try {
    // 1. Use provided password or generate a random one if not provided
    const finalPassword =
      password || Math.random().toString(36).substring(2, 10);

    console.log(`[SIMULATION] Creating user: ${email}`);

    // Firebase Admin SDK required for server-side user creation
    // Since we are migrating to client-side Firebase or need Admin SDK credentials
    // this part is temporarily disabled/stubbed.

    console.warn("Firebase Admin SDK not configured. User creation skipped.");
    throw new Error(
      "Firebase Admin SDK required for server-side user creation.",
    );

    /*
    // 2. Create user in Supabase Auth via Admin API
    const { data: userData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { name, salonName },
      });

    if (authError) {
      console.error("Error creating user:", authError);
      return { success: false, error: authError.message };
    }

    // 3. Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userData.user.id,
        email,
        name,
        salon_name: salonName,
        username:
          email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000),
        plan: "essencial",
        status: "active",
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    // 4. Simulate sending welcome email
    await simulateEmail(email, name);

    return { success: true };
    */
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      success: false,
      error: "Erro interno no servidor (Firebase Admin missing)",
    };
  }
}

async function simulateEmail(email: string, name: string) {
  console.log(`
    -------------------------------------------
    ENVIANDO EMAIL PARA: ${email}
    ASSUNTO: Bem-vindo ao Agendly Glow! 🚀
    
    Olá ${name}, seu pagamento foi confirmado e sua conta está ativa!
    
    Você já pode acessar o sistema com o e-mail e a senha que cadastrou.
    URL: https://agendlyglow.com/login
    
    Estamos felizes em ter você conosco!
    -------------------------------------------
  `);
  // Delay simulated
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
