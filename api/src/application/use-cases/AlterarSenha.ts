import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ErroDeNegocio } from '../errors/ErroDeNegocio';
import type { IHashService } from '../services/IHashService';

interface EntradaAlterarSenha {
  usuarioId: string;
  senhaAtual: string;
  novaSenha: string;
}

export class AlterarSenha {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly hashService: IHashService,
  ) {}

  async executar(entrada: EntradaAlterarSenha): Promise<void> {
    const usuario = await this.usuarioRepository.buscarPorId(entrada.usuarioId);
    if (!usuario) {
      throw new ErroDeNegocio('USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado');
    }

    const senhaConfere = await this.hashService.comparar(entrada.senhaAtual, usuario.senhaHash);
    if (!senhaConfere) {
      throw new ErroDeNegocio('SENHA_ATUAL_INCORRETA', 'Senha atual incorreta');
    }

    const novoHash = await this.hashService.gerar(entrada.novaSenha);
    await this.usuarioRepository.atualizarSenha(usuario.id, novoHash);
  }
}