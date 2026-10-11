import type { ITokenService } from '../../application/services/ITokenService';
import type { AlterarSenha } from '../../application/use-cases/AlterarSenha';
import type { AtualizarUsuario } from '../../application/use-cases/AtualizarUsuario';
import type { AutenticarUsuario } from '../../application/use-cases/AutenticarUsuario';
import type { CriarUsuario } from '../../application/use-cases/CriarUsuario';
import type { ListarUsuarios } from '../../application/use-cases/ListarUsuarios';
import type { ObterUsuario } from '../../application/use-cases/ObterUsuario';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export interface DependenciasApp {
  tokenService: ITokenService;
  usuarioRepository: IUsuarioRepository;
  casosDeUso: {
    autenticarUsuario: AutenticarUsuario;
    criarUsuario: CriarUsuario;
    listarUsuarios: ListarUsuarios;
    atualizarUsuario: AtualizarUsuario;
    alterarSenha: AlterarSenha;
    obterUsuario: ObterUsuario;
  };
}