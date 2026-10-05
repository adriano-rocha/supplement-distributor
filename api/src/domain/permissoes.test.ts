import { describe, it, expect } from 'vitest';
import { perfilTemPermissao, type Permissao } from './permissoes';
import { PERFIS, type Perfil } from './entities/Usuario';

// Fonte da verdade do teste: tabela da secao 5 da spec 01 (permissao -> perfis permitidos)
const MATRIZ: Record<Permissao, Perfil[]> = {
  'usuarios:gerir': ['ADMIN'],
  'produtos:ler': ['ADMIN', 'GERENTE', 'ESTOQUISTA', 'VENDEDOR'],
  'produtos:escrever': ['ADMIN', 'GERENTE', 'ESTOQUISTA'],
  'estoque:entrada': ['ADMIN', 'GERENTE', 'ESTOQUISTA'],
  'vendas:registrar': ['ADMIN', 'GERENTE', 'VENDEDOR'],
  'vendas:cancelar': ['ADMIN', 'GERENTE'],
  'relatorios:completo': ['ADMIN', 'GERENTE'],
  'relatorios:estoque': ['ADMIN', 'GERENTE', 'ESTOQUISTA'],
  'relatorios:proprias_vendas': ['VENDEDOR'],
};

describe('permissoes por perfil', () => {
  it('T01: VENDEDOR pode registrar venda', () => {
    expect(perfilTemPermissao('VENDEDOR', 'vendas:registrar')).toBe(true);
  });

  it('T02: VENDEDOR nao pode escrever produtos', () => {
    expect(perfilTemPermissao('VENDEDOR', 'produtos:escrever')).toBe(false);
  });

  const casos = Object.entries(MATRIZ).flatMap(([permissao, permitidos]) =>
    PERFIS.map((perfil) => ({
      permissao: permissao as Permissao,
      perfil,
      esperado: permitidos.includes(perfil),
    })),
  );

  it.each(casos)('T03: $perfil / $permissao => $esperado', ({ perfil, permissao, esperado }) => {
    expect(perfilTemPermissao(perfil, permissao)).toBe(esperado);
  });
});