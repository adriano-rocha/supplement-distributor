# LH Supplement Distributor — Mini-ERP

Mini-ERP de estoque e vendas para uma distribuidora **fictícia** de suplementos
(whey, creatina etc.) que vende para varejistas (B2B). Projeto de estudo e portfólio,
focado em modelagem de dados, Clean Architecture, testes e um painel analítico.

> 🚧 Em construção. Veja o [status](#status) abaixo.

## O problema

Distribuidoras pequenas controlam estoque em planilha: vendem o que não têm, não sabem
o que repor e não sabem quem alterou o quê. Este sistema resolve isso com movimentações
rastreáveis, vendas transacionais, permissões por perfil e um dashboard de decisão.

## Funcionalidades (MVP)

- Autenticação e permissões por perfil (RBAC)
- Cadastro de produtos e categorias
- Movimentação de estoque: entrada, saída, ajuste e estorno
- Vendas com itens e baixa automática de estoque
- Relatórios: estoque atual, abaixo do mínimo, vendas por período, mais vendidos
- **Dashboard analítico** com KPIs, gráficos e alertas de reposição, adaptado ao perfil:
  - KPIs: faturamento (vs período anterior), vendas e ticket médio, valor em estoque,
    itens abaixo do mínimo, margem bruta
  - Gráficos: vendas por dia, top produtos, vendas por categoria, entradas vs saídas, curva ABC

**Fora do escopo (v2):** nota fiscal, multi-filial, financeiro, importação CSV, pagamento,
lote/validade, gauge de cobertura, ranking de vendedores, exportação CSV.

## Perfis de acesso

| Ação | ADMIN | GERENTE | ESTOQUISTA | VENDEDOR |
|---|---|---|---|---|
| Gerir usuários | ✅ | ❌ | ❌ | ❌ |
| Produtos | ✅ | ✅ | ✅ | ❌ |
| Entrada de estoque | ✅ | ✅ | ✅ | ❌ |
| Registrar venda | ✅ | ✅ | ❌ | ✅ |
| Cancelar venda | ✅ | ✅ | ❌ | ❌ |
| Relatórios | ✅ | ✅ | só estoque | só as próprias vendas |

## Decisões de design

- **Ledger de movimentações:** o saldo é consequência de eventos (`MovimentoEstoque`);
  `saldoAtual` é apenas cache de leitura.
- **Estoque nunca negativo** e **venda + baixa na mesma transação**.
- **Snapshot de preço** no item da venda (histórico imutável).
- **Estorno em vez de exclusão** e **soft delete** de produtos.
- **Dinheiro em `Decimal`**, nunca `float`.
- **Endpoints agregados:** o banco calcula os números do dashboard; o front só desenha.

## Stack

| Camada | Tecnologia |
|---|---|
| Front | React, Vite, TypeScript, Tailwind, shadcn/ui |
| Gráficos | shadcn charts (Recharts) e Apache ECharts em casos pontuais |
| Back | Node, Express, TypeScript, Zod, Prisma |
| Banco | PostgreSQL (Docker em dev/teste, Neon em produção) |
| Testes | Vitest, Supertest |
| Deploy | Vercel (web), Render (api), Neon (db) |

## Arquitetura (api)

```
presentation → application → domain ← infra
```

- `domain/`: entidades, regras e interfaces de repositório (sem dependências externas)
- `application/`: casos de uso
- `infra/`: Prisma e implementações concretas
- `presentation/`: controllers, rotas, middlewares e validação

## Metodologia

Spec-Driven Development: cada feature começa em `specs/`, seguida de testes e só depois
da implementação mínima. O contexto do projeto para agentes de IA fica em `CLAUDE.md`.

## Status

- [x] Fundação (estrutura, CLAUDE.md, README)
- [ ] Auth + RBAC
- [ ] Produtos
- [ ] Movimentação de estoque
- [ ] Vendas
- [ ] Relatórios (endpoints agregados)
- [ ] Frontend base: layout, login e CRUD
- [ ] Dashboard
- [ ] Seed de dados e deploy

## Como rodar

_Será documentado após a fase de Fundação do código._

## Demo

_URL e prints serão adicionados no deploy._