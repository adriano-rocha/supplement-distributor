import type { Perfil } from '../../domain/entities/Usuario';

export interface PayloadToken {
  sub: string;
  perfil: Perfil;
}

export interface ITokenService {
  gerar(payload: PayloadToken): string;
  verificar(token: string): PayloadToken;
}