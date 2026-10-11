import type { SignOptions } from 'jsonwebtoken';
import { AlterarSenha } from './application/use-cases/AlterarSenha';
import { AtualizarUsuario } from './application/use-cases/AtualizarUsuario';
import { AutenticarUsuario } from './application/use-cases/AutenticarUsuario';
import { CriarUsuario } from './application/use-cases/CriarUsuario';
import { ListarUsuarios } from './application/use-cases/ListarUsuarios';
import { ObterUsuario } from './application/use-cases/ObterUsuario';
import type { PrismaClient } from './infra/prisma/generated/client';
import { PrismaUsuarioRepository } from './infra/prisma/PrismaUsuarioRepository';
import { BcryptHashService } from './infra/security/BcryptHashService';
import { JwtTokenService } from './infra/security/JwtTokenService';
import type { DependenciasApp } from './presentation/http/dependencias';

export interface OpcoesComposicao {
  prisma: PrismaClient;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptCost: number;
}

// Raiz de composicao: unico lugar que conhece as classes concretas e as liga as interfaces
export function montarDependencias(opcoes: OpcoesComposicao): DependenciasApp {
  const usuarioRepository = new PrismaUsuarioRepository(opcoes.prisma);
  const hashService = new BcryptHashService(opcoes.bcryptCost);
  const tokenService = new JwtTokenService(
    opcoes.jwtSecret,
    opcoes.jwtExpiresIn as SignOptions['expiresIn'],
  );

  return {
    tokenService,
    usuarioRepository,
    casosDeUso: {
      autenticarUsuario: new AutenticarUsuario(usuarioRepository, hashService, tokenService),
      criarUsuario: new CriarUsuario(usuarioRepository, hashService),
      listarUsuarios: new ListarUsuarios(usuarioRepository),
      atualizarUsuario: new AtualizarUsuario(usuarioRepository),
      alterarSenha: new AlterarSenha(usuarioRepository, hashService),
      obterUsuario: new ObterUsuario(usuarioRepository),
    },
  };
}