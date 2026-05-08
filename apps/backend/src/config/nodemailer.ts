import nodemailer from "nodemailer";
import { env } from "./env";

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (env.ethereal.user && env.ethereal.pass) {
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: env.ethereal.user, pass: env.ethereal.pass },
    });
    console.log("Using configured Ethereal SMTP:", env.ethereal.user);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("Auto-created Ethereal test account:", testAccount.user);
  }

  return transporter;
}

export function getPreviewUrl(info: nodemailer.SentMessageInfo): string | null {
  return nodemailer.getTestMessageUrl(info) || null;
}
