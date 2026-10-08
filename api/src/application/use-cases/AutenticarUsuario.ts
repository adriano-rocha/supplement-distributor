import { normalizarEmail, paraUsuarioPublico } from '../../domain/entities/Usuario';
import type { UsuarioPublico } from '../../domain/entities/Usuario';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ErroDeNegocio } from '../errors/ErroDeNegocio';
import type { IHashService } from '../services/IHashService';
import type { ITokenService } from '../services/ITokenService';

interface EntradaAutenticar {
  email: string;
  senha: string;
}

interface SaidaAutenticar {
  token: string;
  usuario: UsuarioPublico;
}

export class AutenticarUsuario {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
  ) {}

  async executar(entrada: EntradaAutenticar): Promise<SaidaAutenticar> {
    const usuario = await this.usuarioRepository.buscarPorEmail(normalizarEmail(entrada.email));
    const senhaConfere = usuario
      ? await this.hashService.comparar(entrada.senha, usuario.senhaHash)
      : false;

    if (!usuario || !usuario.ativo || !senhaConfere) {
      throw new ErroDeNegocio('CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos');
    }

    const token = this.tokenService.gerar({ sub: usuario.id, perfil: usuario.perfil });
    return { token, usuario: paraUsuarioPublico(usuario) };
  }
}