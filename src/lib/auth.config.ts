import type { NextAuthConfig } from "next-auth";

/**
 * Configuração "edge-safe": usada pelo middleware, sem provider de Credentials
 * nem callbacks que acessam o Prisma (o driver Postgres não roda no Edge Runtime).
 * A configuração completa, com acesso a banco, está em `lib/auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin")) {
        return isLoggedIn && auth.user.role === "ADMIN";
      }
      if (pathname.startsWith("/conta") || pathname.startsWith("/checkout")) {
        return isLoggedIn;
      }
      return true;
    },
    // Precisa estar aqui, e não só em `lib/auth.ts`: sem ele o proxy recebe a
    // sessão padrão (só name/email/image) e `auth.user.role` fica undefined,
    // barrando todo admin em /admin. Lê só o token, então segue edge-safe.
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
