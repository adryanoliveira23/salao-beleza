const webhookUrl = "http://localhost:3000/api/webhook/cakto";
const secret = "7cc2963d-cf0c-45a9-a573-578fc0efac65";

const data = {
  webhook_secret: secret,
  email: "teste_webhook@agendlyglow.com",
  name: "João Teste Webhook",
  metadata: {
    salonName: "Salão do João Webhook",
  },
};

console.log("--- SIMULANDO WEBHOOK CAKTO ---");
fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
  .then((res) => res.json())
  .then((json) => console.log("Resposta:", json))
  .catch((err) => console.error("Erro na simulação:", err));
