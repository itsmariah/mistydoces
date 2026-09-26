import type { Role } from "@/generated/prisma/client";

/**
 * Controle de acesso da equipe. O código sempre pergunta "pode X?" (`can`),
 * nunca "é nível Y?" — mudar o que um nível faz é editar só `ROLE_PERMISSIONS`.
 * Sem dependência de Prisma em runtime: roda no proxy (edge), no servidor e no cliente.
 */
export type Permission =
  | "dashboard:view"
  | "orders:view"
  | "orders:update_status"
  | "orders:cancel"
  | "orders:mark_paid"
  | "reviews:view"
  | "reviews:moderate"
  | "customers:view"
  | "products:view"
  | "products:edit"
  | "products:delete"
  | "categories:view"
  | "categories:edit"
  | "categories:delete"
  | "coupons:view"
  | "coupons:edit"
  | "coupons:delete"
  | "settings:manage"
  | "team:manage";

const STAFF_PERMISSIONS: Permission[] = [
  "orders:view",
  "orders:update_status",
  "reviews:view",
  "customers:view",
  "products:view",
  "categories:view",
  "coupons:view",
];

const MANAGER_PERMISSIONS: Permission[] = [
  ...STAFF_PERMISSIONS,
  "dashboard:view",
  "orders:cancel",
  "orders:mark_paid",
  "reviews:moderate",
  "products:edit",
  "categories:edit",
  "coupons:edit",
];

const OWNER_PERMISSIONS: Permission[] = [
  ...MANAGER_PERMISSIONS,
  "products:delete",
  "categories:delete",
  "coupons:delete",
  "settings:manage",
  "team:manage",
];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  CUSTOMER: new Set(),
  STAFF: new Set(STAFF_PERMISSIONS),
  MANAGER: new Set(MANAGER_PERMISSIONS),
  OWNER: new Set(OWNER_PERMISSIONS),
};

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Cliente",
  STAFF: "Atendente",
  MANAGER: "Gerente",
  OWNER: "Proprietário",
};

/** Níveis da equipe, do menor para o maior. */
export const STAFF_ROLES = ["STAFF", "MANAGER", "OWNER"] as const satisfies readonly Role[];
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  STAFF: "Acompanha pedidos e altera o status. Vê produtos, categorias, cupons, avaliações e clientes, sem editar.",
  MANAGER: "Tudo do Atendente, mais a visão geral, cancelar pedidos, moderar avaliações e criar/editar produtos, categorias e cupons.",
  OWNER: "Acesso total: excluir itens, configurações da loja e gestão da equipe.",
};

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && ROLE_PERMISSIONS[role].has(permission);
}

/** Qualquer nível da equipe — pode entrar no painel, cada área checa sua permissão. */
export function isStaff(role: Role | undefined): boolean {
  return !!role && role !== "CUSTOMER";
}

/** Página inicial do painel para o nível: a visão geral, ou os pedidos para quem não vê faturamento. */
export function adminHomePath(role: Role | undefined): string {
  return can(role, "dashboard:view") ? "/admin" : "/admin/pedidos";
}
