# Handoff — estado atual do projeto

Última atualização: 2026-10-10 por conta A

## Onde estamos
Fase 2 (Auth + RBAC), Passo 6B: middlewares `autenticar` e `autorizar` (testes primeiro). Ainda não iniciado.

## Concluído
- Fase 1 (Fundação): repo, CLAUDE.md, README, Docker (Postgres na porta 5436 com supplement_dev e supplement_test), ambiente api/ (TypeScript, Vitest).
- Passo 3B: entidade `Usuario` e mapa de permissões (T01 a T03).
- Passo 4A a 4C: contratos, fakes (src/testing/fakes.ts) e casos de uso AutenticarUsuario, CriarUsuario, AtualizarUsuario, AlterarSenha (T04 a T10c).
- Passo 5A a 5C: Prisma 7.10.0 (schema do Usuario, migration), BcryptHashService, JwtTokenService, PrismaUsuarioRepository com testes de integração (T16 a T23b).
- Passo 6A: base da API: `lerConfig` (Zod, src/config/env.ts), `tratarErros` e `criarApp` (src/presentation/http/), com T24 a T26. Total esperado: 88 testes verdes.
- Spec 02 (estoque e pedidos) escrita e APROVADA pelo usuário: `specs/02-pedidos-e-estoque.md`.

## Próximo passo
- 6B: middlewares `autenticar` (valida o token e confere no banco que o usuário existe e está ativo, D3) e `autorizar(permissao)` (usa perfilTemPermissao); testes com supertest.
- 6C: rotas POST /auth/login, GET /auth/me, PATCH /auth/senha, POST /usuarios, GET /usuarios, PATCH /usuarios/:id, com schemas Zod (senha entre 8 e 72 caracteres, id uuid) e a composição das dependências em `server.ts`; testes de integração T11 a T15.
- Passo 7: seed do primeiro ADMIN (ADMIN_EMAIL e ADMIN_SENHA).
- Depois, Fases 3 a 5 conforme as specs 01 e 02. No INÍCIO da Fase 5 (ou da Fase 3, quando as permissões de produto entrarem), trocar via TDD as permissões da spec 01 pelas da spec 02: `vendas:registrar` e `vendas:cancelar` viram `pedidos:*`; `relatorios:proprias_vendas` vira `relatorios:proprios_pedidos`; acrescentar clientes:*, estoque:ajustar, pedidos:ler_todos, pedidos:ler_proprios, pedidos:confirmar, pedidos:despachar, pedidos:cancelar, pedidos:cancelar_proprio, pedidos:expirar_reservas (o teste T03 e o `Record<Permissao,...>` forçam a atualização da matriz).

## Roadmap (9 fases)
1 Fundação ✅ | 2 Auth+RBAC 🔄 | 3 Produtos e Clientes | 4 Estoque (ledger, reservado, disponível, CHECKs) | 5 Pedidos (reserva, estados, despacho, cancelamento, histórico, expiração) | 6 Relatórios | 7 Frontend base (5 telas) | 8 Dashboard | 9 Seed e deploy. Entrega final: documento didático do projeto inteiro.

## Decisões já tomadas (não reabrir sem avisar o usuário)
- Projeto fictício: distribuidora de suplementos B2B (clientes são varejistas).
- Stack: React + Vite + TS + Tailwind + shadcn (gráficos: shadcn charts/Recharts; ECharts só pontual); Node + Express + TS + Zod + Prisma; Postgres (Docker em dev/teste, Neon em produção); Vitest + Supertest; deploy Vercel + Render + Neon.
- Prisma 7 (NÃO o 8, release candidate): `prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7`, `pg`, `dotenv`. Config em `api/prisma7.config.ts`. Gerador `prisma-client` com `moduleFormat = "cjs"`, saída em `api/src/infra/prisma/generated` (ignorado pelo Git; recriar com `npx prisma generate`). O PrismaClient recebe um driver adapter (PrismaPg) no construtor (ver criarPrismaClient).
- Hash de senha: `bcrypt` (pacote nativo, preferência do usuário); token: `jsonwebtoken` com HS256 fixado.
- Spec 01 (D1 a D6): sem cadastro público; JWT 1h sem refresh; `autenticar` confere usuário ativo no banco; autorização por permissão; bcrypt com custo por env (12 em produção, 4 nos testes); erro de login genérico.
- Spec 02 (aprovada): pedido com estados RESERVADO, CONFIRMADO, DESPACHADO, CANCELADO; reserva na criação (tudo ou nada); despachar baixa físico e reservado; cancelar libera a reserva; CANCELADO e DESPACHADO finais e imutáveis; itens imutáveis; histórico PedidoEvento; CHECK no banco (0 <= reservado <= físico); vendedor cancela só o próprio pedido em RESERVADO; produto com reservas não desativa; ajuste negativo não passa abaixo do reservado; expiração de reservas (Plus, caso de uso disparado por ADMIN, sem agendador); 5 telas de frontend. Fora (v2): devolução, edição de itens, ENTREGUE, limite de crédito, idempotência por chave, reservas parciais.
- Validação de formato (Zod) na apresentação; regras de negócio nos casos de uso; autorização nos middlewares; unicidade de e-mail garantida pelo UNIQUE do banco; status HTTP só em tratarErros.
- Dashboard MVP: 5 KPIs, 5 gráficos, 2 tabelas; faturamento = pedidos DESPACHADOS; v2: gauge de cobertura, ranking de vendedores, exportação CSV.

## Ambiente e armadilhas conhecidas
- Windows + PowerShell + VS Code. Comandos npm/vitest/tsc/prisma rodam dentro de `api/`; git e docker compose na raiz (ou `docker compose -f ..\docker-compose.yml` de dentro de api/).
- Ordem de subida: Docker Desktop aberto, container supplement-db `healthy`, depois Prisma e testes. Erro P1001 = banco fora do ar. O `npm test` inclui testes de integração que precisam do banco.
- Os testes de integração apagam dados e têm trava: só rodam se DATABASE_URL_TEST apontar para supplement_test.
- Postgres do Docker na porta externa 5436 (outras portas já em uso pelo usuário).
- Migration no banco de teste: `$env:DATABASE_URL="postgresql://supplement:supplement@localhost:5436/supplement_test"; npx prisma migrate deploy; Remove-Item Env:DATABASE_URL`.
- NUNCA rodar `npm i @prisma/client@latest`, `npx prisma@latest` nem `npm audit fix --force` (instalam o Prisma 8 ou fazem downgrade).
- Bug do npm com dependências opcionais (rolldown/Vitest): sempre rodar `npm test` logo após instalar pacotes; se aparecer "Cannot find native binding", rodar em api/: `Remove-Item -Recurse -Force node_modules, package-lock.json; npm install`. Isso não conta como "vermelho" de teste.
- TypeScript: module/moduleResolution NodeNext, projeto CommonJS, imports relativos sem extensão.
- Criar arquivos: o usuário cola o CONTEÚDO no VS Code no caminho indicado. Nunca colar o invólucro `@' ... '@ | Set-Content` dentro de arquivos, nem colar no terminal linhas que são conteúdo de arquivo.
- Arquivo "completo, substitui o atual" significa apagar o conteúdo antigo inteiro antes de colar.
- Git no PowerShell abre paginador: sair com `q` ou usar `git --no-pager`.

## Decisões em aberto / pendências
- npm audit: 4 alertas altos na cadeia da CLI do Prisma (deepmerge-ts, mysql2). `npm audit --omit=dev` ainda os lista, então o `prisma` pode estar contado como dependência de produção; análise em andamento (conferir `npm pkg get dependencies devDependencies` e `npm ls deepmerge-ts mysql2`). Nunca usar `--force`. Rodar `npm audit --omit=dev` antes do deploy.
- Regra do último ADMIN: AtualizarUsuario faz "contar admins" e depois "atualizar" em dois passos; endurecer com transação/lock depois do Passo 6.
- Passo 6: Zod valida o id das rotas como uuid; separar scripts `test:unit` e `test:integration`; com mais de um arquivo de integração no mesmo banco, desativar paralelismo entre eles.
- Fases 4 e 5: CHECKs do banco (0 <= reservado <= físico) entram editando o SQL da migration (o Prisma não declara CHECK no schema); reservas por UPDATE condicional (disponível >= quantidade) com itens ordenados por produto para evitar deadlock.
- Deploy (Render, Docker): o build precisa rodar `prisma generate`; o `bcrypt` é módulo nativo, preferir imagem `node:*-slim` (Debian) em vez de alpine.

## Como encerrar uma sessão
Pedir ao agente: "gere o docs/HANDOFF.md atualizado", colar no arquivo, commitar e dar push.