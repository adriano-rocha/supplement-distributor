import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import type { CriarUsuario } from './CriarUsuario';

interface DadosAdminInicial {
  nome: string;
  email: string;
  senha: string;
}

export class CriarAdminInicial {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly criarUsuario: CriarUsuario,
  ) {}

  async executar(dados: DadosAdminInicial): Promise<{ criado: boolean }> {
    if ((await this.usuarioRepository.contarAdminsAtivos()) > 0) {
      return { criado: false };
    }

    await this.criarUsuario.executar({ ...dados, perfil: 'ADMIN' });
    return { criado: true };
  }
}