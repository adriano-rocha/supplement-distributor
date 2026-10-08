export type CodigoErro =
  | 'CREDENCIAIS_INVALIDAS'
  | 'EMAIL_JA_CADASTRADO'
  | 'ULTIMO_ADMIN'
  | 'USUARIO_NAO_ENCONTRADO'
  | 'SENHA_ATUAL_INCORRETA';

export class ErroDeNegocio extends Error {
  constructor(
    public readonly codigo: CodigoErro,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroDeNegocio';
  }
}