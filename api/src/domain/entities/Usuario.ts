export const PERFIS = ['ADMIN', 'GERENTE', 'ESTOQUISTA', 'VENDEDOR'] as const;
export type Perfil = (typeof PERFIS)[number];

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: Date;
}

export type NovoUsuario = Pick<Usuario, 'nome' | 'email' | 'senhaHash' | 'perfil'>;

export type UsuarioPublico = Pick<Usuario, 'id' | 'nome' | 'email' | 'perfil' | 'ativo'>;

export function paraUsuarioPublico(usuario: Usuario): UsuarioPublico {
  const { id, nome, email, perfil, ativo } = usuario;
  return { id, nome, email, perfil, ativo };
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}