import twilio from "twilio"

export async function sendReadyNotification(
  phone: string,
  roomNumber: string,
  itemCount: number
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !from) {
    console.warn("WhatsApp: Twilio no configurado — saltando notificación")
    return
  }

  const client = twilio(accountSid, authToken)

  await client.messages.create({
    from: `whatsapp:${from}`,
    to: `whatsapp:${phone}`,
    body: `¡Hola! 🧺 Tu pedido de lavandería (Hab. ${roomNumber}, ${itemCount} prendas) ya está listo para retirar.\n\nPodés pasar por recepción cuando quieras.`,
  })
}
