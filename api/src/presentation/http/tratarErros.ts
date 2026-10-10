import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErroDeNegocio, type CodigoErro } from '../../application/errors/ErroDeNegocio';

// Record<CodigoErro, number> obriga a mapear TODO codigo de erro novo
const STATUS_POR_CODIGO: Record<CodigoErro, number> = {
  CREDENCIAIS_INVALIDAS: 401,
  NAO_AUTENTICADO: 401,
  SEM_PERMISSAO: 403,
  EMAIL_JA_CADASTRADO: 409,
  ULTIMO_ADMIN: 409,
  USUARIO_NAO_ENCONTRADO: 404,
  SENHA_ATUAL_INCORRETA: 422,
};

function ehJsonInvalido(erro: unknown): boolean {
  return (
    typeof erro === 'object' &&
    erro !== null &&
    'type' in erro &&
    (erro as { type: unknown }).type === 'entity.parse.failed'
  );
}

export function tratarErros(
  erro: unknown,
  _requisicao: Request,
  resposta: Response,
  _proximo: NextFunction,
): void {
  if (erro instanceof ErroDeNegocio) {
    resposta
      .status(STATUS_POR_CODIGO[erro.codigo])
      .json({ erro: { codigo: erro.codigo, mensagem: erro.message } });
    return;
  }

  if (erro instanceof ZodError) {
    resposta.status(400).json({
      erro: {
        codigo: 'VALIDACAO_INVALIDA',
        mensagem: 'Dados inválidos',
        detalhes: erro.issues.map((problema) => ({
          campo: problema.path.map(String).join('.'),
          mensagem: problema.message,
        })),
      },
    });
    return;
  }

  if (ehJsonInvalido(erro)) {
    resposta
      .status(400)
      .json({ erro: { codigo: 'CORPO_INVALIDO', mensagem: 'JSON malformado no corpo da requisição' } });
    return;
  }

  console.error(erro);
  resposta
    .status(500)
    .json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor' } });
}