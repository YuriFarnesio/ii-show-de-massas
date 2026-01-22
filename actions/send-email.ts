import nodemailer from "nodemailer";

import { env } from "@/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.SMTP_EMAIL,
    pass: env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 3,
});

export async function sendEmailAction(
  to: string,
  subject: string,
  html: string,
  text: string,
) {
  try {
    const from = env.SMTP_EMAIL;
    await transporter.sendMail({
      from: `"II Show de Massas" <${from}>`,
      to,
      subject,
      html,
      text,
      replyTo: from,
    });

    console.log(`[E-MAIL] E-mail enviado com sucesso para ${to}.`);
  } catch (emailError) {
    console.error(
      "[E-MAIL] Erro ao enviar e-mail:",
      emailError instanceof Error ? emailError.name : "Unknown",
    );
  }
}
