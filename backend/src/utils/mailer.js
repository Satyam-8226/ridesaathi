import nodemailer from "nodemailer";
import twilio from "twilio";

const smtpConfigured = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
const twilioConfigured = !!process.env.TWILIO_SID && !!process.env.TWILIO_AUTH_TOKEN && !!process.env.TWILIO_FROM;

let transporter = null;
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

let twilioClient = null;
if (twilioConfigured) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
}

export const sendOtp = async ({ contact, type, otp }) => {
  if (type === "email") {
    if (transporter) {
      const html = `<p>Your RideSaathi OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`;
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: contact,
        subject: "Your RideSaathi OTP",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        html,
      });
      return;
    }
    // fallback
    console.log(`[MAILER-FALLBACK] OTP for ${contact}: ${otp}`);
    return;
  }

  if (type === "phone") {
    if (twilioClient) {
      await twilioClient.messages.create({
        body: `RideSaathi OTP: ${otp} (expires in 5 minutes)`,
        from: process.env.TWILIO_FROM,
        to: contact,
      });
      return;
    }
    // fallback
    console.log(`[SMS-FALLBACK] OTP for ${contact}: ${otp}`);
    return;
  }

  throw new Error("Invalid type");
};
