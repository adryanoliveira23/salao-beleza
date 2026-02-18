"use server";

import { adminAuth, adminDb } from "@/app/lib/firebase-admin";

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

    console.log(`[PAYMENT] Processing user creation for: ${email}`);

    if (!adminAuth || !adminDb) {
      console.error("Firebase Admin SDK not initialized.");
      return { success: false, error: "Serviço de autenticação indisponível." };
    }

    // 2. Check if user already exists
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      console.log(`User already exists: ${userRecord.uid}`);
      // Ideally, we might want to update the plan or just ensure profile exists
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // Create new user
        userRecord = await adminAuth.createUser({
          email,
          password: finalPassword,
          displayName: name,
          emailVerified: true,
        });
        console.log(`Created new user: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // 3. Create or update profile entry in Firestore
    const username =
      email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000);

    await adminDb.collection("profiles").doc(userRecord.uid).set(
      {
        id: userRecord.uid,
        email,
        name,
        salon_name: salonName,
        username, // Default username
        plan: "essencial", // Default plan, could be passed as arg
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    ); // Merge to avoid overwriting existing data if checking out again

    // 4. Simulate sending welcome email (or integrate with real email service)
    await simulateEmail(email, name, finalPassword);

    return { success: true };
  } catch (err: any) {
    console.error("Error processing payment/user creation:", err);
    return {
      success: false,
      error: err.message || "Erro interno no servidor ao processar pagamento.",
    };
  }
}

async function simulateEmail(email: string, name: string, password?: string) {
  console.log(`
    -------------------------------------------
    ENVIANDO EMAIL PARA: ${email}
    ASSUNTO: Bem-vindo ao Agendly Glow! 🚀
    
    Olá ${name}, seu pagamento foi confirmado e sua conta está ativa!
    
    Você já pode acessar o sistema com o e-mail: ${email}
    ${password ? `Sua senha temporária é: ${password}` : ""}
    
    Acesse: https://agendlyglow.com/login
    
    Estamos felizes em ter você conosco!
    -------------------------------------------
  `);
  // Delay simulated
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
