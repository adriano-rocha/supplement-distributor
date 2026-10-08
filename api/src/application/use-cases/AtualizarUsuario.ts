import { paraUsuarioPublico } from '../../domain/entities/Usuario';
import type { Perfil, UsuarioPublico } from '../../domain/entities/Usuario';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ErroDeNegocio } from '../errors/ErroDeNegocio';

interface EntradaAtualizarUsuario {
  id: string;
  nome?: string;
  perfil?: Perfil;
  ativo?: boolean;
}

export class AtualizarUsuario {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async executar(entrada: EntradaAtualizarUsuario): Promise<UsuarioPublico> {
    const { id, ...dados } = entrada;

    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new ErroDeNegocio('USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado');
    }

    const deixaDeSerAdminAtivo =
      usuario.perfil === 'ADMIN' &&
      usuario.ativo &&
      ((dados.perfil !== undefined && dados.perfil !== 'ADMIN') || dados.ativo === false);

    if (deixaDeSerAdminAtivo && (await this.usuarioRepository.contarAdminsAtivos()) <= 1) {
      throw new ErroDeNegocio('ULTIMO_ADMIN', 'O sistema precisa manter ao menos um ADMIN ativo');
    }

    const atualizado = await this.usuarioRepository.atualizar(id, dados);
    return paraUsuarioPublico(atualizado);
  }
}