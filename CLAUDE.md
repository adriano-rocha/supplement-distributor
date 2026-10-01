# LH Supplement Distributor — Mini-ERP

Projeto de estudo e portfólio (empresa **fictícia**): ERP de estoque e vendas de uma
distribuidora de suplementos (whey, creatina etc.) que vende para **varejistas (B2B)**.

## Stack
- web/: React + Vite + TypeScript + Tailwind + shadcn/ui
- Gráficos: shadcn charts (Recharts) como padrão; Apache ECharts só em gráficos pontuais
- api/: Node + TypeScript + Express + Zod + Prisma
- Banco: PostgreSQL (Docker em dev/teste, Neon em produção)
- Testes: Vitest (unitários) + Supertest (integração)
- Deploy: Vercel (web) + Render (api) + Neon (db)

## Arquitetura (api/src)
- domain/        entidades, regras de negócio, interfaces de repositório. NÃO importa nada de fora.
- application/   casos de uso (1 classe por caso de uso, método `executar`).
- infra/         Prisma, repositórios concretos, serviços externos.
- presentation/  controllers, rotas, middlewares, validação Zod.
Regra de dependência: presentation → application → domain ← infra.

## Frontend (web/src)
- Fase 7a: layout, login, rotas protegidas e telas de CRUD.
- Fase 7b: Dashboard.
- Sem regra de negócio em componente React; componentes só apresentam e chamam a API.
- Gráficos consomem ENDPOINTS AGREGADOS (o banco calcula, o front só desenha).
- Estados obrigatórios em toda tela de dados: carregando (skeleton), vazio e erro.
- Responsivo e com tema claro/escuro.
- Não misturar mais de uma lib de gráficos por tela; ECharts apenas onde Recharts não alcança.

## Dashboard (MVP)
- KPIs: faturamento do período (com variação vs período anterior), nº de vendas e ticket médio,
  valor em estoque (saldo × custo), produtos abaixo do mínimo, margem bruta.
- Gráficos: vendas por dia, top 10 produtos, vendas por categoria, entradas vs saídas, curva ABC.
- Tabelas: alertas de reposição, últimas movimentações.
- Filtro de período: 7d / 30d / 90d.
- Conteúdo por perfil: ADMIN/GERENTE veem tudo; ESTOQUISTA vê estoque, alertas e movimentações;
  VENDEDOR vê apenas as próprias vendas.
- Seed realista (~6 meses de vendas gerados por script) para o painel e a demo.
- Fora do MVP (v2): gauge de cobertura, ranking de vendedores, exportação CSV.

## Perfis (RBAC, validado SEMPRE no backend)
ADMIN, GERENTE, ESTOQUISTA, VENDEDOR (matriz completa em specs/01-auth-permissoes.md).
O frontend apenas esconde o que o perfil não pode usar; a autorização real é do backend.

## Regras de negócio invioláveis
- RN01: estoque nunca fica negativo.
- RN02: venda e baixa de estoque na MESMA transação.
- RN03: preço do item da venda é congelado (snapshot).
- RN04: cancelamento gera movimento de ESTORNO; nunca apagar registros.
- RN05: produto com histórico é desativado (soft delete), não excluído.
- RN06: alerta de estoque abaixo do mínimo.
- Saldo é consequência dos movimentos (ledger); saldoAtual é apenas cache.
- Dinheiro em Decimal, nunca float.

## Fora do escopo do projeto (v2)
Nota fiscal, multi-filial, financeiro, importação CSV, pagamento, lote/validade.

## Fluxo de trabalho (Spec-Driven Development)
1. Escrever/atualizar a spec em specs/ ANTES de qualquer código.
2. Escrever os testes (devem falhar).
3. Implementar o mínimo para passar (KISS/YAGNI).
4. Revisão (agentes em .claude/agents/).
5. Commit.

## Convenções
- Conventional Commits em português (ex: `feat: adiciona entrada de estoque`).
- Domínio em português (Produto, Venda, MovimentoEstoque); infraestrutura em inglês
  (Repository, Controller). Manter consistente.
- Use-cases: PascalCase sem sufixo (ex: RegistrarVenda.ts).
- Um arquivo por responsabilidade; nada de arquivos gigantes.

## Nunca faça
- Lógica de negócio em controller ou componente React.
- Editar saldo de produto diretamente (só via MovimentoEstoque).
- Confiar em dados do body para identidade/perfil (usar o token).
- Calcular agregações pesadas no frontend.
- Commitar .env ou segredos.

## Definição de pronto (por feature)
- Spec escrita e coberta por testes; todos passando.
- Invariante testada: saldoAtual == soma dos movimentos.
- Nenhum import de infra em domain/application.
- Resumo de estudo (🔑) registrado.