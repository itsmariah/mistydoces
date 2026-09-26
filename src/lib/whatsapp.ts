/**
 * Link de conversa no WhatsApp a partir do telefone cadastrado (texto livre no
 * cadastro). Aceita número brasileiro com DDD, com ou sem o 55; devolve null
 * quando não dá para montar um número confiável.
 */
export function whatsappUrl(phone: string, message?: string): string | null {
  let digits = phone.replace(/\D/g, "");
  // Zero de discagem interurbana (ex.: 011 9...) não faz parte do número.
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  } else if (!(digits.startsWith("55") && (digits.length === 12 || digits.length === 13))) {
    return null;
  }

  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
