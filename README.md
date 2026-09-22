# MistyDoces 🐾

Sistema web completo (cardápio + pedidos online + painel administrativo) desenvolvido para uma confeitaria artesanal real, do zero até o deploy.

O nome é uma homenagem a uma gatinha de estimação — por isso alguns detalhes sutis de marca (paleta lilás/azul bebê, ícone de pata) remetem a gatos, mesmo a aplicação sendo um e-commerce sério.

> Este repositório documenta o processo de construção do projeto para fins de portfólio. Nenhum dado real da loja (nome comercial completo, endereço, telefone, credenciais) é exposto aqui — variáveis sensíveis ficam em `.env`, que nunca é versionado.

## Sobre o projeto

Diferente de um projeto de estudo isolado, o objetivo aqui foi construir uma aplicação com potencial real de uso: um visitante navega pelo cardápio, cria conta, monta um pedido e acompanha seu status; a proprietária gerencia produtos, categorias e pedidos em um painel administrativo dedicado.

O sistema é **single-tenant por decisão de escopo** — feito para uma única loja, sem abstrações de multi-tenant/SaaS, priorizando simplicidade e capacidade real de entrar em produção antes de qualquer generalização futura.

Todo o planejamento (requisitos, casos de uso, fluxos, arquitetura, modelagem de dados, roadmap) foi conduzido antes da primeira linha de código, e está documentado nas seções abaixo.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Server Actions e Route Handlers do próprio Next.js |
| Banco de dados | PostgreSQL + Prisma ORM |
| Autenticação | Auth.js (Credentials + sessão JWT) |
| Upload de imagens | Cloudinary (upload assinado, direto do navegador) |
| E-mail transacional | Resend (redefinição de senha) |
| Testes | Vitest (regras de negócio, camada de serviço) |
| Deploy | Vercel + Postgres gerenciado |

## Decisões arquiteturais principais

- **Sem multi-tenancy, sem sistema de assinatura** — o escopo atual é uma única loja; a arquitetura evita abstrações que só fariam sentido num produto SaaS.
- **Duas camadas de autorização** (middleware + verificação de role/`userId` dentro de cada Server Action) — nunca confiar apenas no roteamento.
- **Snapshot de preço, nome do produto e endereço em cada pedido** — o histórico de um pedido nunca muda, mesmo que o produto seja repreçado/renomeado ou o endereço editado depois.
- **Toda regra de negócio (preço, quantidade, disponibilidade, transição de status) é revalidada no backend**, nunca confiando em valores vindos do frontend.
- **Carrinho 100% client-side** (sem tabela no banco) — simplicidade deliberada para o estágio atual do produto.
- **Sem pagamento online no MVP** — o pedido registra a forma de pagamento (dinheiro, Pix manual, cartão na entrega); a integração com gateway fica reservada para uma fase futura, sem redesenho de arquitetura.

## Estrutura do projeto

```
src/
├── app/            # rotas (App Router): público, auth, cliente, admin, api
├── actions/        # Server Actions — camada de transporte
├── services/       # regras de negócio (domain layer), testável isoladamente
├── lib/            # Prisma client, Auth.js, erros de domínio, máquina de status
├── validations/    # schemas Zod compartilhados entre client e server
├── components/     # organizados por domínio (catalog, cart, checkout, admin...)
├── hooks/ context/ # estado do carrinho (client-side)
prisma/
└── schema.prisma   # modelo de dados
```

## Modelo de dados (resumo)

`User` → `Address` (1:N) · `User` → `Order` (1:N) · `User` → `PasswordResetToken` (1:N) · `Category` → `Product` (1:N) · `Order` → `OrderItem` (1:N) · `Order` → `Payment` (1:1) · `StoreSettings` como registro único (singleton).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com suas próprias credenciais locais
npm run db:migrate     # aplica o schema no seu PostgreSQL local
npm run dev
```

Testes automatizados (regras de negócio, sem depender de banco):

```bash
npm test
```

## Roadmap de desenvolvimento

- [x] Fase 1 — Fundação do projeto
- [x] Fase 2 — Autenticação
- [x] Fase 3 — Catálogo / cardápio
- [x] Fase 4 — Carrinho
- [x] Fase 5 — Checkout e pedidos
- [x] Fase 6 — Painel administrativo
- [x] Fase 7 — Polimento, segurança e testes
- [ ] Fase 8 — Funcionalidades futuras (pagamento online, cupons, notificações, avaliações)
- [ ] Fase 9 — Deploy (com domínio próprio)

---

Projeto pessoal, desenvolvido para uso real e como peça de portfólio de desenvolvimento frontend.
