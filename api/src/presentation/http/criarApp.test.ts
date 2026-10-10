import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from './criarApp';

describe('criarApp', () => {
  const app = criarApp();

  it('T26: GET /saude responde 200 com status ok', async () => {
    const resposta = await request(app).get('/saude');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok' });
  });

  it('T26b: rota inexistente responde 404 no formato padrao', async () => {
    const resposta = await request(app).get('/nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({
      erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota não encontrada' },
    });
  });

  it('T26c: JSON malformado responde 400 CORPO_INVALIDO', async () => {
    const resposta = await request(app)
      .post('/saude')
      .set('Content-Type', 'application/json')
      .send('{invalido');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('CORPO_INVALIDO');
  });

  it('T26d: nao expoe o cabecalho x-powered-by', async () => {
    const resposta = await request(app).get('/saude');

    expect(resposta.headers['x-powered-by']).toBeUndefined();
  });
});