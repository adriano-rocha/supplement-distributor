# Handoff — estado atual do projeto

Última atualização: 2026-10-08 por conta A

## Onde estamos
Fase 2 (Auth + RBAC), Passo 5: infraestrutura real (Prisma, bcrypt, JWT) e repositório Prisma. Ainda não iniciado.

## Concluído
- Fase 1 (Fundação): repo, CLAUDE.md, README, Docker (Postgres na porta 5436 com supplement_dev e supplement_test), ambiente api/ (TypeScript, Vitest).
- Passo 3B: entidade `Usuario` e mapa de permissões (T01 a T03, 38 testes verdes).
- Passo 4A: contratos (IUsuarioRepository, IHashService, ITokenService, ErroDeNegocio), fakes em src/testing/fakes.ts, `AutenticarUsuario` (T04 a T06).
- Passo 4B: `CriarUsuario` (T07, T08), com mutation check feito.
- Passo 4C: `AtualizarUsuario` (regra do último ADMIN) e `AlterarSenha` (T09 a T10c). Camada de aplicação da Fase 2 completa: 52 testes verdes, typecheck limpo.

## Próximo passo
Passo 5 (infra): ANTES de configurar, consultar a documentação oficial atual do Prisma (versão e forma de configuração). Depois: instalar Prisma, schema do Usuario com UNIQUE no e-mail, migration, `PrismaUsuarioRepository` (implementa IUsuarioRepository), `BcryptHashService` (IHashService), `JwtTokenService` (ITokenService). Testes de integração do repositório contra o banco supplement_test.
Depois: Passo 6 (Express, middlewares `autenticar` e `autorizar`, Zod, testes de integração T11 a T15) e Passo 7 (seed do primeiro ADMIN).

## Roadmap (9 fases)
1 Fundação ✅ | 2 Auth+RBAC 🔄 | 3 Produtos | 4 Movimentação (ledger) | 5 Vendas | 6 Relatórios | 7 Frontend base | 8 Dashboard | 9 Seed e deploy. Entrega final: documento didático do projeto inteiro.

## Decisões já tomadas (não reabrir sem avisar o usuário)
- Projeto fictício: distribuidora de suplementos B2B (clientes são varejistas).
- Stack: React + Vite + TS + Tailwind + shadcn (gráficos: shadcn charts/Recharts; ECharts só pontual); Node + Express + TS + Zod + Prisma; Postgres (Docker em dev/teste, Neon em produção); Vitest + Supertest; deploy Vercel + Render + Neon.
- Fora do escopo: lote/validade, nota fiscal, multi-filial, financeiro, pagamento, importação CSV.
- Ledger de movimentações; saldoAtual é cache; estoque nunca negativo; venda + baixa na mesma transação; snapshot de preço; estorno em vez de exclusão; soft delete; Decimal para dinheiro.
- Spec 01 (D1 a D6): sem cadastro público; JWT 1h sem refresh; middleware `autenticar` confere usuário ativo no banco; autorização por permissão; bcrypt (custo por env); erro de login genérico.
- Validação de formato (Zod) na camada de apresentação; regras de negócio nos casos de uso; autorização nos middlewares.
- Dashboard MVP: 5 KPIs, 5 gráficos, 2 tabelas; v2: gauge de cobertura, ranking de vendedores, exportação CSV.

## Ambiente e armadilhas conhecidas
- Windows + PowerShell + VS Code. Comandos npm/vitest/tsc rodam dentro de `api/` (ou `npm --prefix api ...`); git e docker compose na raiz.
- Postgres do Docker na porta externa 5436 (outras portas já em uso pelo usuário).
- TypeScript: module/moduleResolution NodeNext, projeto CommonJS, imports relativos sem extensão.
- Criar arquivos: o usuário cola o CONTEÚDO no VS Code no caminho indicado. Nunca colar o invólucro `@' ... '@ | Set-Content` dentro de arquivos.
- Bind mount de arquivo inexistente no Docker cria pasta: criar o arquivo antes do `docker compose up`.
- Arquivo "completo, substitui o atual" significa apagar o conteúdo antigo inteiro antes de colar.
- Git no PowerShell abre paginador: sair com `q` ou usar `git --no-pager`.

## Decisões em aberto / pendências
- Verificar a versão atual do Prisma e sua configuração na documentação oficial antes do Passo 5.
- Passo 5: a unicidade de e-mail precisa de UNIQUE no banco; o repositório Prisma deve traduzir a violação para ErroDeNegocio('EMAIL_JA_CADASTRADO').
- Passo 5: a regra do último ADMIN (contar e atualizar) precisa de transação ou lock no repositório Prisma para evitar condição de corrida.

## Como encerrar uma sessão
Pedir ao agente: "gere o docs/HANDOFF.md atualizado", colar no arquivo, commitar e dar push.