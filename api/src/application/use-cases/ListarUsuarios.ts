import { paraUsuarioPublico } from '../../domain/entities/Usuario';
import type { UsuarioPublico } from '../../domain/entities/Usuario';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export class ListarUsuarios {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async executar(): Promise<UsuarioPublico[]> {
    const usuarios = await this.usuarioRepository.listar();
    return usuarios.map(paraUsuarioPublico);
  }
}