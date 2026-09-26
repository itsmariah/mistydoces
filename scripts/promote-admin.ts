import "dotenv/config";
import { prisma } from "@/lib/prisma";

// Promove uma conta já cadastrada a OWNER (Proprietário). Único jeito de criar o primeiro
// admin (não há bootstrap automático) — funciona igual local e em produção,
// bastando ter a DATABASE_URL correta no ambiente.
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npm run admin:promote -- email@exemplo.com");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Nenhuma conta encontrada com o e-mail "${email}". Cadastre-se pelo site primeiro.`);
    process.exitCode = 1;
    return;
  }

  if (user.role === "OWNER") {
    console.log(`"${email}" já é OWNER.`);
    return;
  }

  await prisma.user.update({ where: { email }, data: { role: "OWNER" } });
  console.log(`"${email}" agora é OWNER.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
