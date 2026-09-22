import { redirect } from "next/navigation";

// Painel ainda não tem um dashboard dedicado — pedidos é a tela mais usada no dia a dia.
export default function AdminHomePage() {
  redirect("/admin/pedidos");
}
