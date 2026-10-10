import { describe, expect, it } from "vitest";
import { isCheckoutCallback, safeCallbackPath, withCallbackUrl } from "@/lib/callback-url";

const ORIGIN = "https://mistydoces.com.br";

describe("safeCallbackPath", () => {
  it("devolve caminho e busca de uma URL do próprio site", () => {
    expect(safeCallbackPath(`${ORIGIN}/checkout?x=1`, ORIGIN)).toBe("/checkout?x=1");
  });

  it("aceita caminho relativo", () => {
    expect(safeCallbackPath("/conta/pedidos", ORIGIN)).toBe("/conta/pedidos");
  });

  it("recusa outro site (open redirect)", () => {
    expect(safeCallbackPath("https://malicioso.com/checkout", ORIGIN)).toBeNull();
    expect(safeCallbackPath("//malicioso.com/checkout", ORIGIN)).toBeNull();
  });

  it("ignora as telas de login e cadastro", () => {
    expect(safeCallbackPath(`${ORIGIN}/login`, ORIGIN)).toBeNull();
    expect(safeCallbackPath(`${ORIGIN}/cadastro`, ORIGIN)).toBeNull();
  });

  it("sem destino, devolve null", () => {
    expect(safeCallbackPath(undefined, ORIGIN)).toBeNull();
  });
});

describe("isCheckoutCallback", () => {
  it("reconhece o checkout, absoluto ou relativo", () => {
    expect(isCheckoutCallback(`${ORIGIN}/checkout`)).toBe(true);
    expect(isCheckoutCallback("/checkout")).toBe(true);
  });

  it("não confunde com outras páginas", () => {
    expect(isCheckoutCallback(`${ORIGIN}/conta`)).toBe(false);
    expect(isCheckoutCallback(undefined)).toBe(false);
  });
});

describe("withCallbackUrl", () => {
  it("leva o destino codificado", () => {
    expect(withCallbackUrl("/cadastro", `${ORIGIN}/checkout`)).toBe(
      "/cadastro?callbackUrl=https%3A%2F%2Fmistydoces.com.br%2Fcheckout",
    );
  });

  it("sem destino, devolve só o caminho", () => {
    expect(withCallbackUrl("/login", undefined)).toBe("/login");
  });
});
