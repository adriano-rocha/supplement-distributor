# Handoff — estado atual do projeto

Última atualização: 2026-10-10 por conta A

## Onde estamos
Fase 2 (Auth + RBAC), Passo 5B em andamento: serviços de infraestrutura `BcryptHashService` (IHashService) e `JwtTokenService` (ITokenService), testes primeiro (T16, T17). Etapa atual: dependências `bcrypt` e `jsonwebtoken` já instaladas (52 testes verdes); faltam spec, ErroDeNegocio, testes e ver FALHAR antes de implementar.

## Concluído
- Fase 1 (Fundação): repo, CLAUDE.md, README, Docker (Postgres na porta 5436 com supplement_dev e supplement_test), ambiente api/ (TypeScript, Vitest).
- Passo 3B: entidade `Usuario` e mapa de permissões (T01 a T03).
- Passo 4A a 4C: contratos, fakes (src/testing/fakes.ts) e casos de uso AutenticarUsuario, CriarUsuario, AtualizarUsuario, AlterarSenha (T04 a T10c). Camada de aplicação completa.
- Passo 5A: Prisma 7.10.0 instalado e configurado, schema do `Usuario` (e-mail UNIQUE, id uuid gerado pelo banco), migration `criar_usuarios` aplicada em supplement_dev e supplement_test. Cliente gerado removido do Git. 52 testes verdes, typecheck limpo.

## Próximo passo
- Passo 5B: `npm install bcrypt jsonwebtoken` e `npm install -D @types/bcrypt @types/jsonwebtoken`; adicionar 'NAO_AUTENTICADO' ao ErroDeNegocio; criar BcryptHashService e JwtTokenService em api/src/infra/security/ com testes T16 (bcrypt: hash de 60 caracteres, salt aleatório, comparar) e T17 (JWT: ida e volta, outro segredo, expirado, malformado, perfil inexistente, alg none). Esperado: 61 testes.
- Passo 5C: `PrismaUsuarioRepository` com testes de integração no banco supplement_test (traduzir violação do UNIQUE do e-mail para EMAIL_JA_CADASTRADO; regra do último ADMIN em transação).
- Passo 6: Express, middlewares `autenticar` e `autorizar`, Zod, testes de integração T11 a T15.
- Passo 7: seed do primeiro ADMIN.

## Roadmap (9 fases)
1 Fundação ✅ | 2 Auth+RBAC 🔄 | 3 Produtos | 4 Movimentação (ledger) | 5 Vendas | 6 Relatórios | 7 Frontend base | 8 Dashboard | 9 Seed e deploy. Entrega final: documento didático do projeto inteiro.

## Decisões já tomadas (não reabrir sem avisar o usuário)
- Projeto fictício: distribuidora de suplementos B2B (clientes são varejistas).
- Stack: React + Vite + TS + Tailwind + shadcn (gráficos: shadcn charts/Recharts; ECharts só pontual); Node + Express + TS + Zod + Prisma; Postgres (Docker em dev/teste, Neon em produção); Vitest + Supertest; deploy Vercel + Render + Neon.
- Prisma 7 (NÃO o 8, que ainda é release candidate): `prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7`, `pg`, `dotenv`. Arquivo de config `api/prisma7.config.ts`. Gerador `prisma-client` com `moduleFormat = "cjs"` e saída em `api/src/infra/prisma/generated` (ignorado pelo Git; recriar com `npx prisma generate`).
- Hash de senha: `bcrypt` (pacote nativo, preferência do usuário; hash assíncrono roda no thread pool); token: `jsonwebtoken` com HS256 fixado na geração e na verificação.
- Fora do escopo: lote/validade, nota fiscal, multi-filial, financeiro, pagamento, importação CSV.
- Ledger de movimentações; saldoAtual é cache; estoque nunca negativo; venda + baixa na mesma transação; snapshot de preço; estorno em vez de exclusão; soft delete; Decimal para dinheiro.
- Spec 01 (D1 a D6): sem cadastro público; JWT 1h sem refresh; middleware `autenticar` confere usuário ativo no banco; autorização por permissão; bcrypt (custo por env, 12 em produção e 4 nos testes); erro de login genérico.
- Validação de formato (Zod) na camada de apresentação; regras de negócio nos casos de uso; autorização nos middlewares.
- Dashboard MVP: 5 KPIs, 5 gráficos, 2 tabelas; v2: gauge de cobertura, ranking de vendedores, exportação CSV.
- Deploy (Render, Docker): o `bcrypt` é módulo nativo; preferir imagem `node:*-slim` (Debian) em vez de alpine, e conferir que o binário pré-compilado carrega no container.

## Ambiente e armadilhas conhecidas
- Windows + PowerShell + VS Code. Comandos npm/vitest/tsc/prisma rodam dentro de `api/`; git e docker compose na raiz (ou `docker compose -f ..\docker-compose.yml` de dentro de api/).
- Ordem de subida: Docker Desktop aberto, container supplement-db `healthy`, depois Prisma e testes. Erro P1001 = banco fora do ar.
- Postgres do Docker na porta externa 5436 (outras portas já em uso pelo usuário).
- Migration no banco de teste: `$env:DATABASE_URL="postgresql://supplement:supplement@localhost:5436/supplement_test"; npx prisma migrate deploy; Remove-Item Env:DATABASE_URL`.
- NUNCA rodar `npm i @prisma/client@latest` nem `npx prisma@latest`: instala o Prisma 8.
- Bug do npm com dependências opcionais (rolldown/Vitest): se aparecer "Cannot find native binding", apagar node_modules e