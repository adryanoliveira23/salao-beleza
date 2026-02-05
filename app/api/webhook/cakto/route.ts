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

    // In a real scenario, verify the Cakto signature/secret here
    // Example: if (body.secret !== process.env.CAKTO_WEBHOOK_SECRET) return ...

    // Extract user data sent during registration (often passed via 'metadata' or 'custom_fields')
    // For this simulation, we'll assume Cakto passes back the metadata we would send
    const { email, name, salonName } = body.metadata || {};

    if (!email || !name) {
      return NextResponse.json(
        { error: "Dados insuficientes" },
        { status: 400 },
      );
    }

    // Process payment: Create user, profile, and send email
    const result = await processPaymentAndCreateUser(
      email,
      name,
      salonName || "Meu Salão",
    );

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
