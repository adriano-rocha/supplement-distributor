import { normalizarEmail, paraUsuarioPublico } from '../../domain/entities/Usuario';
import type { Perfil, UsuarioPublico } from '../../domain/entities/Usuario';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ErroDeNegocio } from '../errors/ErroDeNegocio';
import type { IHashService } from '../services/IHashService';

interface EntradaCriarUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}

export class CriarUsuario {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly hashService: IHashService,
  ) {}

  async executar(entrada: EntradaCriarUsuario): Promise<UsuarioPublico> {
    const email = normalizarEmail(entrada.email);

    const existente = await this.usuarioRepository.buscarPorEmail(email);
    if (existente) {
      throw new ErroDeNegocio('EMAIL_JA_CADASTRADO', 'E-mail já cadastrado');
    }

    const senhaHash = await this.hashService.gerar(entrada.senha);
    const usuario = await this.usuarioRepository.criar({
      nome: entrada.nome,
      email,
      senhaHash,
      perfil: entrada.perfil,
    });

    return paraUsuarioPublico(usuario);
  }
}