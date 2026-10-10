import { paraUsuarioPublico } from '../../domain/entities/Usuario';
import type { UsuarioPublico } from '../../domain/entities/Usuario';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ErroDeNegocio } from '../errors/ErroDeNegocio';

export class ObterUsuario {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async executar(entrada: { id: string }): Promise<UsuarioPublico> {
    const usuario = await this.usuarioRepository.buscarPorId(entrada.id);
    if (!usuario) {
      throw new ErroDeNegocio('USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado');
    }

    return paraUsuarioPublico(usuario);
  }
}