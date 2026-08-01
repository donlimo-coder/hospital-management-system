// Thin wrapper around the Africa's Talking SMS SDK. Failures here are
// logged but never thrown up to the caller — a booking or reminder action
// should still succeed even if the SMS itself doesn't go through.
let smsClient = null;

const getClient = () => {
  if (smsClient) return smsClient;
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) return null;

  const AfricasTalking = require("africastalking")({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  });
  smsClient = AfricasTalking.SMS;
  return smsClient;
};

// phone should be in international format, e.g. +2547XXXXXXXX
const sendSMS = async (phone, message) => {
  try {
    const client = getClient();
    if (!client) {
      console.log("SMS not sent (Africa's Talking not configured):", message);
      return { sent: false, reason: "not_configured" };
    }
    if (!phone) {
      console.log("SMS not sent (no phone number on file):", message);
      return { sent: false, reason: "no_phone" };
    }

    const response = await client.send({ to: [phone], message });
    console.log("SMS sent:", response);
    return { sent: true, response };
  } catch (err) {
    console.error("SMS send failed:", err.message);
    return { sent: false, reason: err.message };
  }
};

module.exports = { sendSMS };