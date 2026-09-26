"use client";

import type { ComponentProps } from "react";
import { logoutUser } from "@/actions/auth";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";

/**
 * Sair da conta também esvazia o carrinho: ele fica no navegador, e num aparelho
 * compartilhado a próxima pessoa não deve ver os itens de quem saiu.
 */
export function useLogout() {
  const { clear } = useCart();
  return async () => {
    clear();
    await logoutUser();
  };
}

export function LogoutButton(props: Omit<ComponentProps<typeof Button>, "type">) {
  const logout = useLogout();
  return (
    <form action={logout}>
      <Button type="submit" {...props} />
    </form>
  );
}
