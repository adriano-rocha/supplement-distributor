# Handoff — estado atual do projeto

Última atualização: 2026-10-13 por conta A (chat da Fase 2)

## Onde estamos
Fase 2 (Auth + RBAC) CONCLUÍDA. Próxima: Fase 3 (Produtos e clientes), em chat novo. Antes de qualquer código da Fase 3, validar o ponto de partida: `git log --oneline -3` mostra o commit "feat: adiciona seed idempotente do primeiro ADMIN"; `npm test` com 133 testes verdes (18 arquivos) e `npm run typecheck` limpo, com o Docker `healthy`.

## Concluído
- Fase 1 (Fundação): repo, CLAUDE.md, README, Docker (Postgres na porta 5436 com supplement_dev e supplement_test, restart unless-stopped), ambiente api/ (TypeScript, Vitest).
- Fase 2 (Auth + RBAC):
  - Domínio: entidade `Usuario`, `normalizarEmail`, `paraUsuarioPublico`, mapa de permissões `perfilTemPermissao` (T01 a T03).
  - Casos de uso (com fakes em src/testing/fakes.ts): AutenticarUsuario, CriarUsuario, AtualizarUsuario (regra do último ADMIN), AlterarSenha, ObterUsuario, ListarUsuarios, CriarAdminInicial (T04 a T10c, T29, T30, T34).
  - Infra: Prisma 7.10.0 (schema do Usuario, migration criar_usuarios), PrismaUsuarioRepository, BcryptHashService (pacote bcrypt), JwtTokenService (HS256) (T16 a T23b).
  - API: `lerConfig` e `lerConfigSeed` (Zod), `tratarErros`, `criarApp(dependencias?)`, middlewares `autenticar` e `autorizar`, rotas /auth (login, me, senha) e /usuarios (criar, listar, atualizar), schemas Zod, `composicao.ts` (raiz de composição), `server.ts` e `seed.ts` (T24 a T28, T11 a T15, T31 a T33, T35).
  - Scripts: `npm run dev` (tsx watch src/server.ts) e `npm run seed` (tsx src/seed.ts).
- Spec 02 (estoque e pedidos) escrita e APROVADA: `specs/02-pedidos-e-estoque.md`.

## Próximo passo: Fase 3 (Produtos e clientes), PROPOSTA de escopo a confirmar com o usuário
1. Escrever `specs/03-produtos-e-clientes.md` (rascunho) e obter aprovação ANTES de código.
2. Entidades: Categoria (id, nome único), Produto (id, sku único, nome, categoriaId, precoVenda e custo em Decimal(12,2), estoqueMinimo inteiro >= 0, ativo), Cliente (id, razaoSocial, cnpj único com 14 dígitos e dígitos verificadores válidos, ativo). Os saldos (saldoFisico, saldoReservado) NÃO entram agora: são da Fase 4.
3. Permissões: produtos:ler e produtos:escrever já existem. Acrescentar clientes:ler (ADMIN, GERENTE, VENDEDOR) e clientes:escrever (ADMIN, GERENTE) via TDD: primeiro atualizar a matriz do teste T03 (o `Record<Permissao,...>` força a atualização), ver falhar, depois implementar.
4. Domínio: value object `Cnpj` (validação com dígitos verificadores, testes primeiro); regras de soft delete (desativar, nunca excluir).
5. Casos de uso enxutos por entidade (criar, atualizar, desativar/reativar, listar com filtro simples e paginação, obter), repositórios Prisma com testes de integração, rotas /categorias, /produtos, /clientes com Zod e testes de integração HTTP.
6. Migrations: editar schema.prisma, `npx prisma migrate dev --name <nome>` no dev e `migrate deploy` no banco de teste.

## Roadmap (9 fases)
1 Fundação ✅ | 2 Auth+RBAC ✅ | 3 Produtos e Clientes 🔄 próxima | 4 Estoque (ledger, reservado, disponível, CHECKs) | 5 Pedidos (reserva, estados, despacho, cancelamento, histórico, expiração) | 6 Relatórios | 7 Frontend base (5 telas) | 8 Dashboard | 9 Seed e deploy. Entrega final: documento didático para o usuário estudar e explicar o projeto a recrutadores (críticos: reserva de estoque, transações, máquina de estados, permissões, testes).
Organização: um chat novo por fase ou feature grande.

## Decisões já tomadas (não reabrir sem avisar o usuário)
- Projeto fictício: distribuidora de suplementos B2B (clientes são varejistas).
- Stack: React + Vite + TS + Tailwind + shadcn (gráficos: shadcn charts/Recharts; ECharts só pontual); Node + Express 5 + TS + Zod + Prisma 7; Postgres (Docker em dev/teste, Neon em produção); Vitest + Supertest; deploy Vercel + Render + Neon.
- Prisma 7 (NÃO o 8, release candidate): `prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7`, `pg`, `dotenv`. Config em `api/prisma7.config.ts`. Gerador `prisma-client` com `moduleFormat = "cjs"`, saída em `api/src/infra/prisma/generated` (ignorado pelo Git; recriar com `npx prisma generate`). PrismaClient recebe driver adapter (PrismaPg) no construtor (ver criarPrismaClient).
- Hash de senha: `bcrypt` (nativo, preferência do usuário); token: `jsonwebtoken`, HS256 fixado.
- Spec 01 (D1 a D6): sem cadastro público (primeiro ADMIN por seed); JWT 1h sem refresh; `autenticar` confere no banco que o usuário existe e está ativo e usa o perfil do banco; autorização por permissão; erro de login genérico.
- Spec 02 (aprovada): pedido com estados RESERVADO, CONFIRMADO, DESPACHADO, CANCELADO; reserva na criação (tudo ou nada); despachar baixa físico e reservado; cancelar libera a reserva; estados finais imutáveis; itens imutáveis; histórico PedidoEvento; CHECK no banco (0 <= reservado <= físico); vendedor cancela só o próprio pedido em RESERVADO; produto com reservas não desativa; ajuste negativo não passa abaixo do reservado; expiração de reservas (Plus, caso de uso disparado por ADMIN); 5 telas de frontend. Fora (v2): devolução, edição de itens, ENTREGUE, limite de crédito, idempotência por chave, reservas parciais.
- Camadas: validação de formato (Zod) na apresentação; regras de negócio nos casos de uso; autorização nos middlewares; status HTTP só em `tratarErros`; unicidade garantida pelo UNIQUE do banco; rotas finas (valida, chama um caso de uso, responde); composição só em `composicao.ts`.
- Dashboard MVP: 5 KPIs, 5 gráficos, 2 tabelas; faturamento = pedidos DESPACHADOS; v2: gauge de cobertura, ranking de vendedores, exportação CSV.

## Ambiente e armadilhas conhecidas
- Windows + PowerShell + VS Code. Comandos npm/vitest/tsc/prisma rodam dentro de `api/`; git e docker compose na raiz (ou `docker compose -f ..\docker-compose.yml` de dentro de api/).
- O arquivo de ambiente que vale é `api/.env` (copiado de `api/.env.example`; fora do Git). Variáveis: PORT, DATABASE_URL, DATABASE_URL_TEST (deve conter supplement_test), JWT_SECRET (>= 32 caracteres, aleatório), JWT_EXPIRES_IN, BCRYPT_COST, ADMIN_NOME, ADMIN_EMAIL, ADMIN_SENHA (só o seed usa; trocar no .env não muda a senha de um ADMIN existente; para isso, PATCH /auth/senha).
- Recomeçar usuários no banco de DEV (nunca em produção): `docker compose -f ..\docker-compose.yml exec db psql -U supplement -d supplement_dev -c "DELETE FROM usuarios;"` e `npm run seed`.
- Ordem de subida: Docker Desktop aberto, container supplement-db `healthy`, depois Prisma, seed, API e testes. Banco fora do ar causa P1001 ou "Invalid ... invocation" (o motivo real está no fim da mensagem). O `npm test` inclui testes de integração que precisam do banco.
- Os testes de integração apagam dados e têm trava (DATABASE_URL_TEST deve conter supplement_test); os arquivos rodam em fila (fileParallelism false no vitest.config.mts). Ignorar a sugestão `isolate: false` do Vitest.
- Postgres do Docker na porta externa 5436 (outras portas já em uso pelo usuário).
- Migration no banco de teste: `$env:DATABASE_URL="postgresql://supplement:supplement@localhost:5436/supplement_test"; npx prisma migrate deploy; Remove-Item Env:DATABASE_URL`.
- NUNCA rodar `npm i @prisma/client@latest`, `npx prisma@latest` nem `npm audit fix --force`.
- Bug do npm com dependências opcionais (rolldown/Vitest): sempre rodar `npm test` logo após instalar pacotes; se aparecer "Cannot find native binding", em api/: `Remove-Item -Recurse -Force node_modules, package-lock.json; npm install`. Não conta como "vermelho" de teste.
- TypeScript: module/moduleResolution NodeNext, projeto CommonJS, imports relativos sem extensão.
- Criar arquivos: o usuário cola o CONTEÚDO no VS Code, no caminho indicado, conferindo o nome da aba (teste e implementação têm nomes parecidos). Nunca colar o invólucro `@' ... '@ | Set-Content` dentro de arquivos, nem colar no terminal linhas que são conteúdo de arquivo. Placeholders como SEU-EMAIL precisam ser substituídos.
- Arquivo "completo, substitui o atual" significa apagar o conteúdo antigo inteiro antes de colar.
- Git no PowerShell abre paginador: sair com `q` ou usar `git --no-pager`.
- Ritual de cada passo: spec, teste, VER FALHAR pelo motivo certo (módulo inexistente; verificar que os arquivos novos aparecem na lista do Vitest), implementação mínima, verde + typecheck, commit, `git log`.

## Decisões em aberto / pendências
- Fase 3: como representar dinheiro no domínio (Prisma devolve Decimal; opções: string decimal, centavos inteiros ou Decimal.js); decidir na spec 03.
- Início da Fase 5 (ou quando as permissões de pedido entrarem), trocar via TDD as permissões da spec 01: `vendas:registrar` e `vendas:cancelar` viram `pedidos:*`; `relatorios:proprias_vendas` vira `relatorios:proprios_pedidos`; acrescentar as demais permissões da spec 02. A tabela de permissões da spec 01 fica desatualizada nesse ponto.
- npm audit: 4 alertas altos na cadeia da CLI do Prisma (deepmerge-ts, mysql2), que `npm audit --omit=dev` também lista; análise pendente (`npm pkg get dependencies devDependencies` e `npm ls deepmerge-ts mysql2`). Nunca usar `--force`. Reavaliar antes do deploy.
- Regra do último ADMIN: AtualizarUsuario faz "contar admins" e depois "atualizar" em dois passos; endurecer com transação/lock depois.
- Fases 4 e 5: CHECKs do banco entram editando o SQL da migration (o Prisma não declara CHECK no schema); reservas por UPDATE condicional (disponível >= quantidade) com itens ordenados por produto para evitar deadlock.
- Separar scripts `test:unit` (sem banco) e `test:integration`.
- Deploy (Render, Docker): o build precisa rodar `prisma generate`; o `bcrypt` é módulo nativo, preferir imagem `node:*-slim` (Debian); definir ADMIN_EMAIL, ADMIN_SENHA e JWT_SECRET fortes nas variáveis do servidor.

## Como encerrar uma sessão
Pedir ao agente: "gere o docs/HANDOFF.md atualizado", colar no arquivo, commitar e dar push.