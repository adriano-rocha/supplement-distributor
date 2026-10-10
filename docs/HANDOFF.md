# Handoff — estado atual do projeto

Última atualização: 2026-10-10 por conta A

## Onde estamos
Fase 2 (Auth + RBAC), Passo 6: API HTTP (Express), middlewares `autenticar` e `autorizar`, validação com Zod e testes de integração T11 a T15 com supertest. Ainda não iniciado.

## Concluído
- Fase 1 (Fundação): repo, CLAUDE.md, README, Docker (Postgres na porta 5436 com supplement_dev e supplement_test), ambiente api/ (TypeScript, Vitest).
- Passo 3B: entidade `Usuario` e mapa de permissões (T01 a T03).
- Passo 4A a 4C: contratos, fakes (src/testing/fakes.ts) e casos de uso AutenticarUsuario, CriarUsuario, AtualizarUsuario, AlterarSenha (T04 a T10c). Camada de aplicação completa.
- Passo 5A: Prisma 7.10.0, schema do `Usuario` (e-mail UNIQUE, id uuid gerado pelo banco), migration aplicada em supplement_dev e supplement_test.
- Passo 5B: `BcryptHashService` (pacote bcrypt) e `JwtTokenService` (jsonwebtoken, HS256 fixado) em src/infra/security/ (T16, T17).
- Passo 5C: `criarPrismaClient` e `PrismaUsuarioRepository` em src/infra/prisma/, com 9 testes de integração no banco supplement_test (T18 a T23b), incluindo e-mail duplicado simultâneo traduzido para EMAIL_JA_CADASTRADO.
- Estado dos testes: 70 verdes (61 unitários + 9 de integração), typecheck limpo.

## Próximo passo
Passo 6 (API), em sub-passos guiados, testes primeiro:
- 6A: instalar express (+ @types/express), zod, supertest (+ @types/supertest) e cors/helmet se necessário; validação das variáveis de ambiente com Zod (DATABASE_URL, JWT_SECRET com no mínimo 32 caracteres, JWT_EXPIRES_IN, BCRYPT_COST, PORT); `criarApp(dependencias)` (fábrica do Express com injeção de dependências, sem listen), `server.ts` (composition root que monta Prisma, bcrypt, JWT e os casos de uso) e middleware de tratamento de erros (ErroDeNegocio -> status HTTP).
- 6B: middlewares `autenticar` (valida o token e confere no banco que o usuário existe e está ativo, D3) e `autorizar(permissao)` (usa perfilTemPermissao).
- 6C: rotas POST /auth/login, GET /auth/me, PATCH /auth/senha, POST /usuarios, GET /usuarios, PATCH /usuarios/:id, com schemas Zod (senha entre 8 e 72 caracteres, id uuid); testes de integração T11 a T15 com supertest contra o supplement_test.
- Passo 7: seed do primeiro ADMIN (variáveis ADMIN_EMAIL e ADMIN_SENHA).

## Roadmap (9 fases)
1 Fundação ✅ | 2 Auth+RBAC 🔄 | 3 Produtos | 4 Movimentação (ledger) | 5 Vendas | 6 Relatórios | 7 Frontend base | 8 Dashboard | 9 Seed e deploy. Entrega final: documento didático do projeto inteiro.

## Decisões já tomadas (não reabrir sem avisar o usuário)
- Projeto fictício: distribuidora de suplementos B2B (clientes são varejistas).
- Stack: React + Vite + TS + Tailwind + shadcn (gráficos: shadcn charts/Recharts; ECharts só pontual); Node + Express + TS + Zod + Prisma; Postgres (Docker em dev/teste, Neon em produção); Vitest + Supertest; deploy Vercel + Render + Neon.
- Prisma 7 (NÃO o 8, que ainda é release candidate): `prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7`, `pg`, `dotenv`. Arquivo de config `api/prisma7.config.ts`. Gerador `prisma-client` com `moduleFormat = "cjs"` e saída em `api/src/infra/prisma/generated` (ignorado pelo Git; recriar com `npx prisma generate`). No Prisma 7, o PrismaClient recebe um driver adapter (PrismaPg) no construtor (ver criarPrismaClient).
- Hash de senha: `bcrypt` (pacote nativo, preferência do usuário); token: `jsonwebtoken` com HS256 fixado na geração e na verificação.
- Fora do escopo: lote/validade, nota fiscal, multi-filial, financeiro, pagamento, importação CSV.
- Ledger de movimentações; saldoAtual é cache; estoque nunca negativo; venda + baixa na mesma transação; snapshot de preço; estorno em vez de exclusão; soft delete; Decimal para dinheiro.
- Spec 01 (D1 a D6): sem cadastro público; JWT 1h sem refresh; middleware `autenticar` confere usuário ativo no banco; autorização por permissão; bcrypt (custo por env, 12 em produção e 4 nos testes); erro de login genérico.
- Validação de formato (Zod) na camada de apresentação; regras de negócio nos casos de uso; autorização nos middlewares; unicidade de e-mail garantida pelo UNIQUE do banco.
- Dashboard MVP: 5 KPIs, 5 gráficos, 2 tabelas; v2: gauge de cobertura, ranking de vendedores, exportação CSV.

## Ambiente e armadilhas conhecidas
- Windows + PowerShell + VS Code. Comandos npm/vitest/tsc/prisma rodam dentro de `api/`; git e docker compose na raiz (ou `docker compose -f ..\docker-compose.yml` de dentro de api/).
- Ordem de subida: Docker Desktop aberto, container supplement-db `healthy`, depois Prisma e testes. Erro P1001 = banco fora do ar. O `npm test` agora INCLUI testes de integração: sem o banco no ar, o arquivo PrismaUsuarioRepository.integration.test.ts falha no beforeEach.
- Os testes de integração apagam dados e têm trava: só rodam se DATABASE_URL_TEST apontar para supplement_test.
- Postgres do Docker na porta externa 5436 (outras portas já em uso pelo usuário).
- Migration no banco de teste: `$env:DATABASE_URL="postgresql://supplement:supplement@localhost:5436/supplement_test"; npx prisma migrate deploy; Remove-Item Env:DATABASE_URL`.
- NUNCA rodar `npm i @prisma/client@latest` nem `npx prisma@latest`: instala o Prisma 8. NUNCA rodar `npm audit fix --force`.
- Bug do npm com dependências opcionais (rolldown/Vitest): sempre que instalar pacotes, rodar `npm test` em seguida; se aparecer "Cannot find native binding", apagar node_modules e package-lock.json de api/ e rodar `npm install`.
- TypeScript: module/moduleResolution NodeNext, projeto CommonJS, imports relativos sem extensão.
- Criar arquivos: o usuário cola o CONTEÚDO no VS Code no caminho indicado. Nunca colar o invólucro `@' ... '@ | Set-Content` dentro de arquivos, nem colar no terminal linhas que são conteúdo de arquivo.
- Arquivo "completo, substitui o atual" significa apagar o conteúdo antigo inteiro antes de colar.
- Git no PowerShell abre paginador: sair com `q` ou usar `git --no-pager`.

## Decisões em aberto / pendências
- Regra do último ADMIN: AtualizarUsuario faz "contar admins" e depois "atualizar" em dois passos; dois pedidos simultâneos poderiam rebaixar os dois últimos ADMIN. Decidir como endurecer (transação/lock no repositório) depois do Passo 6.
- Passo 6: Zod valida o id das rotas como uuid (um id malformado hoje geraria erro do banco, não "não encontrado").
- Passo 6: separar scripts `test:unit` (sem banco) e `test:integration`; com mais de um arquivo de integração, desativar paralelismo entre arquivos que usam o mesmo banco.
- Revisar o `npm audit` (4 vulnerabilidades altas reportadas na instalação do bcrypt/jsonwebtoken): avaliar caso a caso se são de desenvolvimento ou produção; nunca usar `--force`.
- Deploy (Render, Docker): o build precisa rodar `prisma generate`; o `bcrypt` é módulo nativo, preferir imagem `node:*-slim` (Debian) em vez de alpine e conferir que o binário pré-compilado carrega no container.

## Como encerrar uma sessão
Pedir ao agente: "gere o docs/HANDOFF.md atualizado", colar no arquivo, commitar e dar push.