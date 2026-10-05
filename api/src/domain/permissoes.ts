import type { Perfil } from './entities/Usuario';

export type Permissao =
  | 'usuarios:gerir'
  | 'produtos:ler'
  | 'produtos:escrever'
  | 'estoque:entrada'
  | 'vendas:registrar'
  | 'vendas:cancelar'
  | 'relatorios:completo'
  | 'relatorios:estoque'
  | 'relatorios:proprias_vendas';

const PERMISSOES_POR_PERFIL: Record<Perfil, readonly Permissao[]> = {
  ADMIN: [
    'usuarios:gerir',
    'produtos:ler',
    'produtos:escrever',
    'estoque:entrada',
    'vendas:registrar',
    'vendas:cancelar',
    'relatorios:completo',
    'relatorios:estoque',
  ],
  GERENTE: [
    'produtos:ler',
    'produtos:escrever',
    'estoque:entrada',
    'vendas:registrar',
    'vendas:cancelar',
    'relatorios:completo',
    'relatorios:estoque',
  ],
  ESTOQUISTA: ['produtos:ler', 'produtos:escrever', 'estoque:entrada', 'relatorios:estoque'],
  VENDEDOR: ['produtos:ler', 'vendas:registrar', 'relatorios:proprias_vendas'],
};

export function perfilTemPermissao(perfil: Perfil, permissao: Permissao): boolean {
  return PERMISSOES_POR_PERFIL[perfil].includes(permissao);
}