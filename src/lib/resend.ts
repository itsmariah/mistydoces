import { Resend } from "resend";

// Endereço padrão de teste do Resend — funciona sem domínio verificado, mas
// só entrega para e-mails cadastrados na conta Resend usada (RESEND_API_KEY).
export const EMAIL_FROM = "MistyDoces <onboarding@resend.dev>";

let client: Resend | null = null;

// Instanciado sob demanda (não no carregamento do módulo): o construtor do
// SDK lança se a env var estiver vazia, o que quebraria o build inteiro em
// qualquer rota que importe este arquivo transitivamente, mesmo sem enviar e-mail.
export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}
