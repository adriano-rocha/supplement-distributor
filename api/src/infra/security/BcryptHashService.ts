import { compare, hash } from 'bcrypt';
import type { IHashService } from '../../application/services/IHashService';

export class BcryptHashService implements IHashService {
  constructor(private readonly custo: number) {}

  gerar(senha: string): Promise<string> {
    return hash(senha, this.custo);
  }

  comparar(senha: string, hashSalvo: string): Promise<boolean> {
    return compare(senha, hashSalvo);
  }
}