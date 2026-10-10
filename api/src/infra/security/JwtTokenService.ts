import * as jwt from 'jsonwebtoken';
import { ErroDeNegocio } from '../../application/errors/ErroDeNegocio';
import type { ITokenService, PayloadToken } from '../../application/services/ITokenService';
import { PERFIS } from '../../domain/entities/Usuario';
import type { Perfil } from '../../domain/entities/Usuario';

function ehPerfil(valor: unknown): valor is Perfil {
  return typeof valor === 'string' && (PERFIS as readonly string[]).includes(valor);
}

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly segredo: string,
    private readonly expiraEm: jwt.SignOptions['expiresIn'],
  ) {}

  gerar(payload: PayloadToken): string {
    return jwt.sign({ perfil: payload.perfil }, this.segredo, {
      algorithm: 'HS256',
      subject: payload.sub,
      expiresIn: this.expiraEm,
    });
  }

  verificar(token: string): PayloadToken {
    try {
      const conteudo = jwt.verify(token, this.segredo, { algorithms: ['HS256'] });

      if (
        typeof conteudo === 'string' ||
        typeof conteudo.sub !== 'string' ||
        !ehPerfil(conteudo['perfil'])
      ) {
        throw new Error('Payload inesperado');
      }

      return { sub: conteudo.sub, perfil: conteudo['perfil'] };
    } catch {
      throw new ErroDeNegocio('NAO_AUTENTICADO', 'Token inválido ou expirado');
    }
  }
}