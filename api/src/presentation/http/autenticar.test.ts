import express, { type Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Usuario } from '../../domain/entities/Usuario';
import { JwtTokenService } from '../../infra/security/JwtTokenService';
import { UsuarioRepositoryEmMemoria } from '../../testing/fakes';
import { criarAutenticar } from './autenticar';
import { tratarErros } from './tratarErros';

const SEGREDO = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';

describe('autenticar', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let tokenService: JwtTokenService;
  let app: Express;
  let ana: Usuario;

  beforeEach(async () => {
    repositorio = new UsuarioRepositoryEmMemoria();
    tokenService = new JwtTokenService(SEGREDO, '1h');
    ana = await repositorio.criar({
      nome: 'Ana',
      email: 'ana@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'GERENTE',
    });

    app = express();
    app.get(
      '/protegida',
      criarAutenticar({ tokenService, usuarioRepository: repositorio }),
      (requisicao, resposta) => {
        resposta.json({ usuario: requisicao.usuario });
      },
    );
    app.use(tratarErros);
  });

  function esperarNaoAutenticado(resposta: request.Response): void {
    expect(resposta.status).toBe(401);
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO');
  }

  it('T27: sem cabecalho Authorization responde 401', async () => {
    esperarNaoAutenticado(await request(app).get('/protegida'));
  });

  it('T27b: esquema diferente de Bearer responde 401', async () => {
    const resposta = await request(app).get('/protegida').set('Authorization', 'Basic abc123');

    esperarNaoAutenticado(resposta);
  });

  it('T27c: token invalido responde 401', async () => {
    const resposta = await request(app)
      .get('/protegida')
      .set('Authorization', 'Bearer isto-nao-e-um-token');

    esperarNaoAutenticado(resposta);
  });

  it('T27d: token expirado responde 401', async () => {
    const jaExpirado = new JwtTokenService(SEGREDO, -10);
    const token = jaExpirado.gerar({ sub: ana.id, perfil: 'GERENTE' });

    const resposta = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);

    esperarNaoAutenticado(resposta);
  });

  it('T27e: usuario removido (token valido, id inexistente) responde 401', async () => {
    const token = tokenService.gerar({ sub: 'id-removido', perfil: 'ADMIN' });

    const resposta = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);

    esperarNaoAutenticado(resposta);
  });

  it('T27f: usuario inativo com token ainda valido responde 401 (decisao D3)', async () => {
    const token = tokenService.gerar({ sub: ana.id, perfil: 'GERENTE' });
    await repositorio.atualizar(ana.id, { ativo: false });

    const resposta = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);

    esperarNaoAutenticado(resposta);
  });

  it('T27g: token valido de usuario ativo segue com req.usuario', async () => {
    const token = tokenService.gerar({ sub: ana.id, perfil: 'GERENTE' });

    const resposta = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toEqual({ id: ana.id, perfil: 'GERENTE' });
  });

  it('T27h: o perfil vem do banco, nao do token', async () => {
    const tokenComPerfilAntigo = tokenService.gerar({ sub: ana.id, perfil: 'ADMIN' });

    const resposta = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${tokenComPerfilAntigo}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario.perfil).toBe('GERENTE');
  });
});