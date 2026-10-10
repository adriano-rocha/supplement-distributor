import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ErroDeNegocio, type CodigoErro } from '../../application/errors/ErroDeNegocio';
import { tratarErros } from './tratarErros';

function criarAppDeTeste(rota: RequestHandler) {
  const app = express();
  app.get('/x', rota);
  app.use(tratarErros);
  return app;
}

// Fonte da verdade do teste: tabela de status da secao 6 da spec 01
const STATUS_ESPERADO: Array<[CodigoErro, number]> = [
  ['CREDENCIAIS_INVALIDAS', 401],
  ['NAO_AUTENTICADO', 401],
  ['EMAIL_JA_CADASTRADO', 409],
  ['ULTIMO_ADMIN', 409],
  ['USUARIO_NAO_ENCONTRADO', 404],
  ['SENHA_ATUAL_INCORRETA', 422],
  ['SEM_PERMISSAO', 403],
];

describe('tratarErros', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(STATUS_ESPERADO)('T25: ErroDeNegocio %s vira HTTP %i', async (codigo, status) => {
    const app = criarAppDeTeste(() => {
      throw new ErroDeNegocio(codigo, 'mensagem de teste');
    });

    const resposta = await request(app).get('/x');

    expect(resposta.status).toBe(status);
    expect(resposta.body).toEqual({ erro: { codigo, mensagem: 'mensagem de teste' } });
  });

  it('T25b: ZodError vira 400 VALIDACAO_INVALIDA com detalhes por campo', async () => {
    const app = criarAppDeTeste(() => {
      z.object({ email: z.string().min(3) }).parse({ email: 'a' });
    });

    const resposta = await request(app).get('/x');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    expect(resposta.body.erro.detalhes).toEqual([
      { campo: 'email', mensagem: expect.any(String) },
    ]);
  });

  it('T25c: erro inesperado vira 500 sem vazar detalhes internos', async () => {
    const espiao = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = criarAppDeTeste(() => {
      throw new Error('segredo interno: senha do banco');
    });

    const resposta = await request(app).get('/x');

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({
      erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor' },
    });
    expect(JSON.stringify(resposta.body)).not.toContain('segredo');
    expect(espiao).toHaveBeenCalled();
  });

  it('T25d: erro lancado em handler assincrono tambem e tratado', async () => {
    const app = criarAppDeTeste(async () => {
      throw new ErroDeNegocio('USUARIO_NAO_ENCONTRADO', 'sumiu');
    });

    const resposta = await request(app).get('/x');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro.codigo).toBe('USUARIO_NAO_ENCONTRADO');
  });
});