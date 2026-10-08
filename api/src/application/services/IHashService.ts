export interface IHashService {
  gerar(senha: string): Promise<string>;
  comparar(senha: string, hash: string): Promise<boolean>;
}