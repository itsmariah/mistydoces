import { redirect } from "next/navigation";

// Painel ainda não tem dashboard (Fase 6) — a única tela hoje é configurações.
export default function AdminHomePage() {
  redirect("/admin/configuracoes");
}
