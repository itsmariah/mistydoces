/** Telas de onde não faz sentido "voltar" depois de entrar ou criar a conta. */
const AUTH_PATHS = new Set(["/login", "/cadastro"]);

/**
 * O proxy manda o callbackUrl como URL absoluta; só aceita destinos do próprio site
 * (evita open redirect) e ignora as próprias telas de login e cadastro.
 */
export function safeCallbackPath(callbackUrl: string | undefined, origin: string): string | null {
  if (!callbackUrl) return null;
  try {
    const url = new URL(callbackUrl, origin);
    if (url.origin !== origin || AUTH_PATHS.has(url.pathname)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/**
 * Se a pessoa foi mandada para o login no meio do checkout — só para trocar o texto da tela
 * ("Entre para finalizar seu pedido"). Não decide redirecionamento: isso é `safeCallbackPath`.
 */
export function isCheckoutCallback(callbackUrl: string | undefined): boolean {
  if (!callbackUrl) return false;
  try {
    return new URL(callbackUrl, "http://localhost").pathname.startsWith("/checkout");
  } catch {
    return false;
  }
}

/** Link para a outra tela de acesso (login ↔ cadastro) sem perder o destino. */
export function withCallbackUrl(path: string, callbackUrl: string | undefined): string {
  return callbackUrl ? `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}` : path;
}
