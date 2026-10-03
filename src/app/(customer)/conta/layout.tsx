import Image from "next/image";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountTabs } from "@/components/account/account-tabs";
import { LogoutButton } from "@/components/shared/logout-button";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  // A rota já é protegida pelo proxy (RN02). O nome vem do banco, não da sessão:
  // a sessão (JWT) guarda o nome do login e ficaria velha depois de editar o perfil.
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { name: true, email: true },
  });
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/branding/23_gatinha_chef_rostinho.png"
            alt=""
            width={165}
            height={237}
            className="h-14 w-auto shrink-0"
          />
          <div className="min-w-0">
            <p className="font-display text-2xl text-link">olá, {firstName}!</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <LogoutButton variant="ghost">Sair</LogoutButton>
      </div>

      <AccountTabs />

      <div className="pt-2">{children}</div>
    </div>
  );
}
