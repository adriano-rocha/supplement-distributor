# LH Supplement Distributor — Mini-ERP

Projeto de estudo e portfólio (empresa **fictícia**): ERP de estoque e pedidos de uma
distribuidora de suplementos (whey, creatina etc.) que vende para **varejistas (B2B)**.
Foco: fluxo de várias etapas com dados consistentes (pedido, reserva de estoque, despacho,
cancelamento), transações, estados e permissões. Detalhe do fluxo em `specs/02-pedidos-e-estoque.md`.

## Stack
- web/: React + Vite + TypeScript + Tailwind + shadcn/ui
- Gráficos: shadcn charts (Recharts) como padrão; Apache ECharts só em gráficos pontuais
- api/: Node + TypeScript + Express + Zod + Prisma 7 (driver adapter pg) + bcrypt + jsonwebtoken
- Banco: PostgreSQL (Docker em dev/teste, Neon em produção)
- Testes: Vitest (unitários e integração) + Supertest (HTTP)
- Deploy: Vercel (web) + Render (api) + Neon (db)

## Arquitetura (api/src)
- domain/        entidades, regras de negócio, interfaces de repositório. NÃO importa nada de fora.
- application/   casos de uso (1 classe por caso de uso, método `executar`), erros de negócio, interfaces de serviços.
- infra/         Prisma (repositórios), segurança (bcrypt, JWT). Implementa as interfaces.
- presentation/  Express: app, middlewares, rotas, controllers, validação Zod, tradução de erros em HTTP.
- config/        validação das variáveis de ambiente.
- testing/       fakes em memória usados nos testes unitários.
Regra de dependência: presentation → application → domain ← infra.

## Fluxo de negócio (resumo; fonte da verdade: specs/02)
- Estoque: saldoFisico (soma dos movimentos), saldoReservado (itens de pedidos RESERVADO e CONFIRMADO), disponivel = fisico - reservado.
- Pedido: RESERVADO → CONFIRMADO → DESPACHADO; cancelar a partir de RESERVADO ou CONFIRMADO → CANCELADO.
- Reserva na CRIAÇÃO do pedido, todos os itens, tudo ou nada. Despachar gera SAIDA e baixa físico e reservado juntos.
- CANCELADO e DESPACHADO são finais e imutáveis; itens do pedido nunca são editados.
- Toda mudança de estado grava um PedidoEvento (quem, quando, de, para, motivo).

## Perfis e permissões (RBAC + regra de dono; validado SEMPRE no backend)
ADMIN, GERENTE, ESTOQUISTA, VENDEDOR. Matrizes: specs/01 (autenticação, em vigor) e specs/02 (pedidos e estoque, aprovada; substitui `vendas:*` e `relatorios:proprias_vendas`).
O frontend apenas esconde o que o perfil não pode usar; a autorização real é do backend.

## Regras de negócio invioláveis
- RN01: saldoFisico nunca negativo e 0 <= saldoReservado <= saldoFisico (também por CHECK no banco).
- RN02: criar pedido + reservas, e despachar (saídas + baixas + mudança de estado), acontecem cada um em UMA transação.
- RN03: preço do item do pedido é congelado (snapshot); total calculado no servidor.
- RN04: cancelar libera a reserva (sem movimento físico); devolução pós-despacho (estorno) é v2.
- RN05: soft delete; produto com reservas ativas não pode ser desativado.
- RN06: alerta de estoque disponível abaixo do mínimo.
- Saldo físico é consequência dos movimentos (ledger); saldos nos produtos são cache.
- Transições de estado só as da spec 02; mudança de estado condicionada ao estado atual (update condicional).
- Dinheiro em Decimal, nunca float.

## Frontend (web/src)
- Enxuto: 5 telas (login, produtos, novo pedido, pedidos, detalhe do pedido com linha do tempo e ações por perfil e estado).
- Sem regra de negócio em componente React; componentes só apresentam e chamam a API.
- Estados obrigatórios em toda tela de dados: carregando, vazio e erro.
- Gráficos consomem ENDPOINTS AGREGADOS (o banco calcula, o front só desenha).

## Dashboard (Fase 8, MVP)
- KPIs: faturamento (pedidos DESPACHADOS) vs período anterior, pedidos e ticket médio, valor em estoque, produtos abaixo do mínimo, margem bruta.
- Gráficos: pedidos despachados por dia, top 10 produtos, por categoria, entradas vs saídas, curva ABC. Tabelas: alertas de reposição, últimas movimentações.
- Conteúdo por perfil; seed realista (~6 meses). v2: gauge de cobertura, ranking de vendedores, exportação CSV.

## Fora do escopo (v2)
Devolução de pedido despachado, edição de itens, estado ENTREGUE, limite de crédito, idempotência por chave, reservas parciais, nota fiscal, multi-filial, financeiro, pagamento, importação CSV, lote/validade.

## Fluxo de trabalho (Spec-Driven Development)
1. Escrever/atualizar a spec em specs/ ANTES de qualquer código.
2. Escrever os testes e VER FALHAR pelo motivo certo.
3. Implementar o mínimo para passar (KISS/YAGNI).
4. Rodar testes e typecheck; revisar (agentes em .claude/agents/).
5. Commit em Conventional Commits, em português.

## Convenções
- Domínio em português (Produto, Pedido, MovimentoEstoque); infraestrutura em inglês (Repository, Controller). Manter consistente.
- Use-cases: PascalCase sem sufixo (ex: CriarPedido.ts), método `executar`.
- Um arquivo por responsabilidade; nada de arquivos gigantes.
- Códigos de erro de negócio em `ErroDeNegocio`; o status HTTP vive só em `presentation/http/tratarErros.ts`.

## Nunca faça
- Lógica de negócio em controller ou componente React.
- Editar saldos de produto fora de operações transacionais que gravem o movimento ou a reserva correspondente.
- Confiar em dados do body para identidade, perfil, preço ou total (usar token e dados do servidor).
- Calcular agregações pesadas no frontend.
- Alterar pedido em estado final.
- Commitar .env, segredos ou o cliente Prisma gerado.
- Rodar `npm audit fix --force`, `npm i @prisma/client@latest` ou `npx prisma@latest` (instalam o Prisma 8).

## Definição de pronto (por feature)
- Spec escrita; testes passando (vistos falhar antes) e typecheck limpo.
- Invariantes testadas (saldos batem com movimentos e reservas).
- Nenhum import de infra em domain/application.
- Resumo de estudo (🔑) registrado e HANDOFF atualizado.

## Continuidade entre agentes
- Ler `docs/HANDOFF.md` antes de qualquer ação; o prompt padrão está em `docs/PROMPT-CONTINUIDADE.md`.
- Um agente por vez. Antes de começar: `git pull`. Ao terminar: atualizar o HANDOFF, commitar e dar push.
- Nunca reabrir uma decisão registrada sem avisar o usuário; discordâncias vão para "Decisões em aberto".