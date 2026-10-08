import type { NovoUsuario, Usuario } from '../entities/Usuario';

export interface IUsuarioRepository {
  criar(dados: NovoUsuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  /** Recebe o e-mail JÁ normalizado (minúsculas, sem espaços). */
  buscarPorEmail(email: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  atualizar(
    id: string,
    dados: Partial<Pick<Usuario, 'nome' | 'perfil' | 'ativo'>>,
  ): Promise<Usuario>;
  atualizarSenha(id: string, senhaHash: string): Promise<void>;
  contarAdminsAtivos(): Promise<number>;
}
