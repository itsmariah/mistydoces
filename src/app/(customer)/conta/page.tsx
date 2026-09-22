import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutUser } from "@/actions/auth";
import { ProfileForm } from "@/components/account/profile-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  // A rota já é protegida pelo middleware (RN02); aqui buscamos os dados atuais do usuário.
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { name: true, email: true, phone: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Minha conta</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={logoutUser}>
          <Button type="submit" variant="ghost">
            Sair
          </Button>
        </form>
      </div>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-medium">Pedidos e endereços</h2>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/conta/pedidos" />}>
            Ver meus pedidos
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/conta/enderecos" />}>
            Meus endereços
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-medium">Dados pessoais</h2>
        <ProfileForm defaultValues={{ name: user.name, phone: user.phone }} />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-medium">Segurança</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
