# MistyDoces 🐾

![Status](https://img.shields.io/badge/status-em_desenvolvimento-3f6ba8?style=flat-square)
![Escopo](https://img.shields.io/badge/escopo-single--tenant-8e6fb3?style=flat-square)
![Idioma](https://img.shields.io/badge/idioma-pt--BR-a3c0e8?style=flat-square)

Sistema web completo (cardápio + pedidos online + pagamento + painel administrativo) desenvolvido para uma confeitaria artesanal real, do zero até o deploy.

O nome é uma homenagem a uma gatinha de estimação, a Misty — por isso a identidade visual (paleta azul bebê/lilás e uma mascote ilustrada, a gatinha confeiteira) aparece nos estados vazios, no agradecimento pós-pedido e nas páginas institucionais, sem deixar de lado a cara de e-commerce sério.

> Este repositório documenta o processo de construção do projeto para fins de portfólio. Nenhum dado real da loja (nome comercial completo, endereço, telefone, credenciais) é exposto aqui — variáveis sensíveis ficam em `.env`, que nunca é versionado.

## Sobre o projeto

Diferente de um projeto de estudo isolado, o objetivo aqui foi construir uma aplicação com potencial real de uso: um visitante navega pelo cardápio, cria conta, monta um pedido, paga (online ou na entrega) e acompanha o status em tempo real; a equipe da loja gerencia pedidos, produtos, cupons e avaliações em um painel administrativo com níveis de acesso.

O sistema é **single-tenant por decisão de escopo** — feito para uma única loja, sem abstrações de multi-tenant/SaaS, priorizando simplicidade e capacidade real de entrar em produção antes de qualquer generalização futura.

Todo o planejamento (requisitos, casos de uso, fluxos, arquitetura, modelagem de dados, roadmap) foi conduzido antes da primeira linha de código, e está documentado nas seções abaixo.

## Funcionalidades

**Loja**
- Cardápio com busca (ignora acentos), filtro por categoria, ordenação e selo "Mais vendido" calculado pelas vendas reais
- Produtos com variações de preço (ex.: tamanhos), avaliações de quem recebeu o pedido e prévias de link para compartilhar
- Carrinho com desfazer remoção, checkout em etapas, entrega ou retirada e cupons de desconto
- Pagamento online por **Pix** e **cartão de crédito** (Mercado Pago), ou na entrega (dinheiro, Pix manual, cartão)
- Área do cliente com histórico, linha do tempo do pedido e status atualizado em tempo real
- E-mails transacionais: confirmação de pedido, mudança de status e redefinição de senha

**Painel administrativo**
- Visão geral com vendas, pedidos em aberto e mais vendidos
- Financeiro: despesas do mês por categoria x faturamento, com aviso por e-mail quando as despesas são cobertas
- Pedidos com busca, paginação, filtro por status e aviso sonoro de pedido novo
- Catálogo com fotos, filtros, botão rápido de esgotado e cupons com selo automático de situação
- Clientes com busca e atalho para os pedidos de cada um; moderação de avaliações
- Equipe com três níveis de acesso — **Proprietário**, **Gerente** e **Atendente** — com permissões por ação

## Stack técnica

**Linguagem e framework**

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)

**Interface**

![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-F56565?style=for-the-badge&logo=lucide&logoColor=white)
![Sonner](https://img.shields.io/badge/Sonner-000000?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDhhNiA2IDAgMCAxIDEyIDBjMCA3IDMgOSAzIDlIM3MzLTIgMy05Ii8+PHBhdGggZD0iTTEwLjMgMjFhMS45NCAxLjk0IDAgMCAwIDMuNCAwIi8+PC9zdmc+)

**Formulários e validação**

![React Hook Form](https://img.shields.io/badge/React_Hook_Form-7-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-4-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

**Dados e autenticação**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-5-7C3AED?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjExIiB3aWR0aD0iMTgiIGhlaWdodD0iMTEiIHJ4PSIyIi8+PHBhdGggZD0iTTcgMTFWN2E1IDUgMCAwIDEgMTAgMHY0Ii8+PC9zdmc+)

**Integrações**

![Mercado Pago](https://img.shields.io/badge/Mercado_Pago-00B1EA?style=for-the-badge&logo=mercadopago&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white)

**Qualidade e deploy**

![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui (sobre Base UI) |
| Backend | Server Actions e Route Handlers do próprio Next.js |
| Banco de dados | PostgreSQL + Prisma ORM (adapter `pg`) |
| Autenticação | Auth.js (Credentials + sessão JWT) + senhas com bcrypt |
| Formulários | React Hook Form + Zod (schemas compartilhados entre client e server) |
| Pagamento online | Mercado Pago — Pix e cartão via Payment Brick, confirmação por webhook |
| Upload de imagens | Cloudinary (upload assinado, direto do navegador) |
| E-mail transacional | Resend (pedidos e redefinição de senha) |
| Feedback de interface | Sonner (toasts) + ícones Lucide |
| Testes | Vitest (regras de negócio, camada de serviço) |
| Deploy | Vercel + Postgres gerenciado |

## Decisões arquiteturais principais

- **Sem multi-tenancy, sem sistema de assinatura** — o escopo atual é uma única loja; a arquitetura evita abstrações que só fariam sentido num produto SaaS.
- **Duas camadas de autorização** — o `proxy` do Next.js 16 (antigo middleware) protege as rotas, e cada Server Action confere de novo a permissão específica da ação (ex.: `orders:cancel`, `products:toggle_availability`). Nunca confiar apenas no roteamento.
- **Permissões por ação, não por cargo** — os três níveis da equipe são listas de permissões num único arquivo; o painel esconde o que a pessoa não pode fazer, e o servidor recusa se ela tentar mesmo assim.
- **Snapshot de preço, nome do produto, endereço e cupom em cada pedido** — o histórico de um pedido nunca muda, mesmo que o produto seja repreçado/renomeado, o endereço editado ou o cupom excluído depois.
- **Toda regra de negócio (preço, quantidade, disponibilidade, transição de status, desconto) é revalidada no backend**, nunca confiando em valores vindos do frontend.
- **Uso de cupom debitado de forma atômica** — o contador é incrementado com SQL direto dentro de uma transação, para que dois pedidos simultâneos não usem a "última vaga" de um cupom limitado.
- **O webhook de pagamento não é a fonte da verdade** — a assinatura HMAC do Mercado Pago é validada e, em seguida, o status é consultado na API do Mercado Pago antes de marcar o pedido como pago.
- **E-mail nunca derruba um pedido** — falhas no envio são registradas, mas não desfazem nem bloqueiam a criação do pedido ou a mudança de status.
- **Carrinho 100% client-side** (sem tabela no banco) — simplicidade deliberada para o estágio atual do produto.

## Estrutura do projeto

```
src/
├── app/            # rotas (App Router): público, auth, cliente, admin, api (auth, uploads, webhooks)
├── actions/        # Server Actions — camada de transporte
├── services/       # regras de negócio (domain layer), testável isoladamente
├── lib/            # Prisma client, Auth.js, permissões, erros de domínio, máquina de status
├── validations/    # schemas Zod compartilhados entre client e server
├── components/     # organizados por domínio (catalog, cart, checkout, orders, admin...)
├── hooks/ context/ # estado do carrinho (client-side)
└── proxy.ts        # proteção de rotas (Next.js 16)
prisma/
└── schema.prisma   # modelo de dados
public/branding/    # ilustrações da mascote e elementos da marca
```

## Modelo de dados (resumo)

`User` → `Address` (1:N) · `User` → `Order` (1:N) · `User` → `PasswordResetToken` (1:N) · `User` → `Review` (1:N) · `Category` → `Product` (1:N) · `Product` → `ProductVariant` (1:N) · `Product` → `Review` (1:N) · `Order` → `OrderItem` (1:N) · `Order` → `Payment` (1:1) · `Coupon` → `Order` (1:N, opcional) · `StoreSettings` como registro único (singleton).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com suas próprias credenciais locais
npm run db:migrate     # aplica o schema no seu PostgreSQL local
npm run dev
```

Não existe cadastro de equipe pelo site (por decisão de escopo). Pra transformar a primeira conta em **Proprietário**, cadastre-se normalmente e rode:

```bash
npm run admin:promote -- seu-email@exemplo.com
```

A partir daí, o Proprietário adiciona Gerentes e Atendentes pela página **Equipe** do painel.

Para testar pagamentos, use as credenciais de **teste** do Mercado Pago no `.env` (veja os comentários em `.env.example`).

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
- [x] Fase 8 — Funcionalidades futuras (cupons de desconto · avaliações de produto · notificações por e-mail · pagamento online com Pix e cartão)
- [x] Extra — Identidade visual com mascote ilustrada e melhorias de experiência na loja
- [x] Extra — Dashboard do painel administrativo (resumo de vendas, pedidos em aberto e mais vendidos)
- [x] Extra — Níveis de acesso da equipe (Proprietário, Gerente e Atendente)
- [x] Extra — Melhorias de experiência no painel (barra lateral, avisos, busca, filtros e paginação)
- [x] Extra — Mini dashboard financeiro (despesas x faturamento e aviso de despesas cobertas)
- [ ] Revisão das decisões simplificadas no MVP
- [ ] Fase 9 — Deploy (com domínio próprio)

> **Observação:** os itens "Extra" não faziam parte do planejamento original. Eles foram incluídos depois da Fase 8, a partir do uso real da loja e do painel, e entram antes do deploy.

---

Projeto pessoal, desenvolvido para uso real e como peça de portfólio de desenvolvimento frontend.
