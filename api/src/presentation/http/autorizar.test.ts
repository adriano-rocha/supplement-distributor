import express, { type Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Usuario } from '../../domain/entities/Usuario';
import { JwtTokenService } from '../../infra/security/JwtTokenService';
import { UsuarioRepositoryEmMemoria } from '../../testing/fakes';
import { criarAutenticar } from './autenticar';
import { autorizar } from './autorizar';
import { tratarErros } from './tratarErros';

const SEGREDO = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';

describe('autorizar', () => {
  let tokenService: JwtTokenService;
  let app: Express;
  let admin: Usuario;
  let vendedor: Usuario;

  beforeEach(async () => {
    const repositorio = new UsuarioRepositoryEmMemoria();
    tokenService = new JwtTokenService(SEGREDO, '1h');
    admin = await repositorio.criar({
      nome: 'Admin',
      email: 'admin@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'ADMIN',
    });
    vendedor = await repositorio.criar({
      nome: 'Vera',
      email: 'vera@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'VENDEDOR',
    });

    const autenticar = criarAutenticar({ tokenService, usuarioRepository: repositorio });

    app = express();
    app.get('/admin', autenticar, autorizar('usuarios:gerir'), (_requisicao, resposta) => {
      resposta.json({ ok: true });
    });
    app.get('/sem-autenticar', autorizar('usuarios:gerir'), (_requisicao, resposta) => {
      resposta.json({ ok: true });
    });
    app.use(tratarErros);
  });

  it('T28: perfil com a permissao segue (200)', async () => {
    const token = tokenService.gerar({ sub: admin.id, perfil: 'ADMIN' });

    const resposta = await request(app).get('/admin').set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ok: true });
  });

  it('T28b: perfil sem a permissao responde 403 SEM_PERMISSAO', async () => {
    const token = tokenService.gerar({ sub: vendedor.id, perfil: 'VENDEDOR' });

    const resposta = await request(app).get('/admin').set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(403);
    expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO');
  });

  it('T28c: autorizar sem autenticar antes responde 401 (falha fechada)', async () => {
    const resposta = await request(app).get('/sem-autenticar');

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });
});