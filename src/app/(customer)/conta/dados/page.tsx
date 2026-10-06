import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";
import { AvatarField } from "@/components/account/avatar-field";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export const metadata: Metadata = { title: "Dados e senha" };

export default async function AccountDataPage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { name: true, phone: true, avatarUrl: true },
  });

  return (
    <div className="space-y-10">
      <h1 className="sr-only">Dados e senha</h1>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-medium">Foto de perfil</h2>
        <AvatarField name={user.name} avatarUrl={user.avatarUrl} />
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
