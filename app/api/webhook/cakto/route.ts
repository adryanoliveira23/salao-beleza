import { NextResponse } from "next/server";
import { processPaymentAndCreateUser } from "@/app/actions/payment";

/**
 * Cakto Webhook Endpoint
 * ---------------------
 * This endpoint should be configured in your Cakto dashboard.
 * When a payment is successful, Cakto sends a POST request here.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(
      "[CAKTO WEBHOOK] Received payload:",
      JSON.stringify(body, null, 2),
    );

    // 1. Verify Cakto Secret
    // Note: In some webhook implementations, the secret is sent in a header.
    // Cakto standard often sends the secret or uses a signature.
    // For now, we'll check against the environment variable.
    const secret = process.env.CAKTO_WEBHOOK_SECRET;

    // Some gateways pass 'token' or 'secret' in the body
    if (body.webhook_secret && body.webhook_secret !== secret) {
      console.error("[CAKTO WEBHOOK] Invalid secret provided in body");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract user data
    // Cakto often merges metadata into the root level or a metadata object
    const email = body.email || body.metadata?.email || body.customer?.email;
    const name = body.name || body.metadata?.name || body.customer?.name;
    const salonName =
      body.metadata?.salonName || body.custom_fields?.salonName || "Meu Salão";

    if (!email || !name) {
      console.error("[CAKTO WEBHOOK] Missing required fields:", {
        email,
        name,
      });
      return NextResponse.json(
        { error: "Dados insuficientes (email ou nome faltando)" },
        { status: 400 },
      );
    }

    // 3. Process payment: Create user, profile, and send email
    console.log(`[CAKTO WEBHOOK] Processing success for ${email}`);
    const result = await processPaymentAndCreateUser(email, name, salonName);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Pagamento processado e email enviado",
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
