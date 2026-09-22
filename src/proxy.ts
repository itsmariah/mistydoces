import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next.js 16 renomeou o arquivo/exportação de "middleware" para "proxy".
// A checagem de rota (RN02) fica em `authConfig.callbacks.authorized`.
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: ["/admin/:path*", "/conta/:path*", "/checkout/:path*"],
};
