import type { Perfil } from '../../domain/entities/Usuario';

declare global {
  namespace Express {
    interface Request {
      usuario?: { id: string; perfil: Perfil };
    }
  }
}

export {};