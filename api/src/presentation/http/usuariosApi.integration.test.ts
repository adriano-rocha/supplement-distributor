import 'dotenv/config';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { montarDependencias } from '../../composicao';
import type { Perfil } from '../../domain/entities/Usuario';
import { criarPrismaClient } from '../../infra/prisma/criarPrismaClient';
import { BcryptHashService } from '../../infra/security/BcryptHashService';
import { criarApp } from './criarApp';

const urlTeste = process.env['DATABASE_URL_TEST'];

// Trava de seguranca: estes testes apagam dados, so rodam no banco supplement_test
if (!urlTeste || !urlTeste.includes('supplement_test')) {
  throw new Error(
    'DATABASE_URL_TEST ausente ou fora de supplement_test: testes de integracao abortados',
  );
}

const prisma = criarPrismaClient(urlTeste);
const hashService = new BcryptHashService(4);
const app = criarApp(
  montarDependencias({
    prisma,
    jwtSecret: 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres',
    jwtExpiresIn: '1h',
    bcryptCost: 4,
  }),
);

const SENHA_PADRAO = 'senha1234';
const ID_INEXISTENTE = '00000000-0000-0000-0000-000000000000';

async function criarNoBanco(email: string, perfil: Perfil) {
  return prisma.usuario.create({
    data: {
      nome: `Usuario ${perfil}`,
      email,
      senhaHash: await hashService.gerar(SENHA_PADRAO),
      perfil,
    },
  });
}

function comToken(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function entrarComo(email: string, senha: string = SENHA_PADRAO): Promise<string> {
  const resposta = await request(app).post('/auth/login').send({ email, senha });
  return resposta.body.token as string;
}

const CORPOS_INVALIDOS = [
  {
    descricao: 'senha curta',
    campo: 'senha',
    corpo: { nome: 'Bruno', email: 'bruno@lh.com', senha: 'curta', perfil: 'VENDEDOR' },
  },
  {
    descricao: 'perfil inexistente',
    campo: 'perfil',
    corpo: { nome: 'Bruno', email: 'bruno@lh.com', senha: SENHA_PADRAO, perfil: 'SUPER' },
  },
  {
    descricao: 'e-mail malformado',
    campo: 'email',
    corpo: { nome: 'Bruno', email: 'nao-e-email', senha: SENHA_PADRAO, perfil: 'VENDEDOR' },
  },
];

describe('API de autenticacao e usuarios (integracao, banco supplement_test)', () => {
  beforeEach(async () => {
    await prisma.usuario.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('T11: login valido devolve token e o token abre GET /auth/me', async () => {
    const admin = await criarNoBanco('admin@lh.com', 'ADMIN');

    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@lh.com', senha: SENHA_PADRAO });

    expect(login.status).toBe(200);
    expect(login.body.usuario).toEqual({
      id: admin.id,
      nome: admin.nome,
      email: 'admin@lh.com',
      perfil: 'ADMIN',
      ativo: true,
    });

    const me = await request(app).get('/auth/me').set(comToken(login.body.token));

    expect(me.status).toBe(200);
    expect(me.body.usuario).toEqual(login.body.usuario);
  });

  it('T11b: senha errada e e-mail inexistente respondem 401 CREDENCIAIS_INVALIDAS', async () => {
    await criarNoBanco('admin@lh.com', 'ADMIN');

    const senhaErrada = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@lh.com', senha: 'senha-errada' });
    const emailInexistente = await request(app)
      .post('/auth/login')
      .send({ email: 'nao@existe.com', senha: SENHA_PADRAO });

    for (const resposta of [senhaErrada, emailInexistente]) {
      expect(resposta.status).toBe(401);
      expect(resposta.body.erro.codigo).toBe('CREDENCIAIS_INVALIDAS');
    }
  });

  it('T11c: corpo invalido no login responde 400 VALIDACAO_INVALIDA', async () => {
    const malformado = await request(app)
      .post('/auth/login')
      .send({ email: 'nao-e-email', senha: SENHA_PADRAO });
    const semCorpo = await request(app).post('/auth/login');

    for (const resposta of [malformado, semCorpo]) {
      expect(resposta.status).toBe(400);
      expect(resposta.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
    }
  });

  it('T12: rotas protegidas sem token respondem 401 NAO_AUTENTICADO', async () => {
    const respostas = [
      await request(app).get('/usuarios'),
      await request(app).get('/auth/me'),
      await request(app).patch('/auth/senha').send({ senhaAtual: 'x', novaSenha: 'y' }),
    ];

    for (const resposta of respostas) {
      expect(resposta.status).toBe(401);
      expect(resposta.body.erro.codigo).toBe('NAO_AUTENTICADO');
    }
  });

  it('T13: VENDEDOR nao pode gerir usuarios (403 SEM_PERMISSAO)', async () => {
    await criarNoBanco('vendedor@lh.com', 'VENDEDOR');
    const token = await entrarComo('vendedor@lh.com');

    const criar = await request(app)
      .post('/usuarios')
      .set(comToken(token))
      .send({ nome: 'Bruno', email: 'bruno@lh.com', senha: SENHA_PADRAO, perfil: 'VENDEDOR' });
    const listar = await request(app).get('/usuarios').set(comToken(token));

    for (const resposta of [criar, listar]) {
      expect(resposta.status).toBe(403);
      expect(resposta.body.erro.codigo).toBe('SEM_PERMISSAO');
    }
  });

  it('T14: usuario desativado perde o acesso mesmo com token ainda valido', async () => {
    await criarNoBanco('admin@lh.com', 'ADMIN');
    const vendedor = await criarNoBanco('vendedor@lh.com', 'VENDEDOR');
    const tokenAdmin = await entrarComo('admin@lh.com');
    const tokenVendedor = await entrarComo('vendedor@lh.com');

    const desativar = await request(app)
      .patch(`/usuarios/${vendedor.id}`)
      .set(comToken(tokenAdmin))
      .send({ ativo: false });
    const depois = await request(app).get('/auth/me').set(comToken(tokenVendedor));

    expect(desativar.status).toBe(200);
    expect(depois.status).toBe(401);
    expect(depois.body.erro.codigo).toBe('NAO_AUTENTICADO');
  });

  it('T15: nenhuma resposta contem senhaHash', async () => {
    await criarNoBanco('admin@lh.com', 'ADMIN');
    const token = await entrarComo('admin@lh.com');

    const respostas: request.Response[] = [
      await request(app).post('/auth/login').send({ email: 'admin@lh.com', senha: SENHA_PADRAO }),
      await request(app).get('/auth/me').set(comToken(token)),
      await request(app)
        .post('/usuarios')
        .set(comToken(token))
        .send({ nome: 'Bruno', email: 'bruno@lh.com', senha: SENHA_PADRAO, perfil: 'VENDEDOR' }),
      await request(app).get('/usuarios').set(comToken(token)),
    ];
    const bruno = respostas[2].body.usuario;
    respostas.push(
      await request(app)
        .patch(`/usuarios/${bruno.id}`)
        .set(comToken(token))
        .send({ nome: 'Bruno Silva' }),
    );

    for (const resposta of respostas) {
      expect(resposta.status).toBeLessThan(300);
      const texto = JSON.stringify(resposta.body);
      expect(texto).not.toContain('senhaHash');
      expect(texto).not.toContain('$2');
    }
  });

  it('T31: ADMIN cria usuario (201), a senha vira hash e o novo usuario consegue entrar', async () => {
    await criarNoBanco('admin@lh.com', 'ADMIN');
    const token = await entrarComo('admin@lh.com');

    const resposta = await request(app)
      .post('/usuarios')
      .set(comToken(token))
      .send({ nome: 'Bruno', email: 'BRUNO@lh.com', senha: SENHA_PADRAO, perfil: 'VENDEDOR' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario).toEqual({
      id: expect.any(String),
      nome: 'Bruno',
      email: 'bruno@lh.com',
      perfil: 'VENDEDOR',
      ativo: true,
    });

    const salvo = await prisma.usuario.findUnique({ where: { email: 'bruno@lh.com' } });
    expect(salvo?.senhaHash).not.toBe(SENHA_PADRAO);
    expect(salvo?.senhaHash.startsWith('$2')).toBe(true);
    expect(await entrarComo('bruno@lh.com')).toEqual(expect.any(String));
  });

  it('T31b: e-mail duplicado (ignorando maiusculas) responde 409', async () => {
    await criarNoBanco('admin@lh.com', 'ADMIN');
    const token = await entrarComo('admin@lh.com');

    const resposta = await request(app)
      .post('/usuarios')
      .set(comToken(token))
      .send({ nome: 'Outro', email: 'ADMIN@lh.com', senha: SENHA_PADRAO, perfil: 'VENDEDOR' });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('EMAIL_JA_CADASTRADO');
  });

  it.each(CORPOS_INVALIDOS)(
    'T31c: $descricao responde 400 e aponta o campo $campo',
    async ({ campo, corpo }) => {
      await criarNoBanco('admin@lh.com', 'ADMIN');
      const token = await entrarComo('admin@lh.com');

      const resposta = await request(app).post('/usuarios').set(comToken(token)).send(corpo);

      expect(resposta.status).toBe(400);
      expect(resposta.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
      const campos = resposta.body.erro.detalhes.map((d: { campo: string }) => d.campo);
      expect(campos).toContain(campo);
    },
  );

  it('T32: ADMIN atualiza nome e perfil de outro usuario (200)', async () => {
    await criarNoBanco('admin@lh.com', 'ADMIN');
    const vendedor = await criarNoBanco('vendedor@lh.com', 'VENDEDOR');
    const token = await entrarComo('admin@lh.com');

    const resposta = await request(app)
      .patch(`/usuarios/${vendedor.id}`)
      .set(comToken(token))
      .send({ nome: 'Novo Nome', perfil: 'GERENTE' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toMatchObject({
      id: vendedor.id,
      nome: 'Novo Nome',
      perfil: 'GERENTE',
    });
  });

  it('T32b: rebaixar o unico ADMIN responde 409 ULTIMO_ADMIN', async () => {
    const admin = await criarNoBanco('admin@lh.com', 'ADMIN');
    const token = await entrarComo('admin@lh.com');

    const resposta = await request(app)
      .patch(`/usuarios/${admin.id}`)
      .set(comToken(token))
      .send({ perfil: 'GERENTE' });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('ULTIMO_ADMIN');
    const depois = await prisma.usuario.findUnique({ where: { id: admin.id } });
    expect(depois?.perfil).toBe('ADMIN');
  });

  it('T32c: id inexistente responde 404 USUARIO_NAO_ENCONTRADO', async () => {
    await criarNoBanco('admin@lh.com', 'ADMIN');
    const token = await entrarComo('admin@lh.com');

    const resposta = await request(app)
      .patch(`/usuarios/${ID_INEXISTENTE}`)
      .set(comToken(token))
      .send({ nome: 'Fantasma' });

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro.codigo).toBe('USUARIO_NAO_ENCONTRADO');
  });

  it('T32d: id malformado responde 400 antes de consultar o banco', async () => {
    await criarNoBanco('admin@lh.com', 'ADMIN');
    const token = await entrarComo('admin@lh.com');

    const resposta = await request(app)
      .patch('/usuarios/abc')
      .set(comToken(token))
      .send({ nome: 'Fantasma' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
  });

  it('T32e: corpo vazio responde 400 VALIDACAO_INVALIDA', async () => {
    const admin = await criarNoBanco('admin@lh.com', 'ADMIN');
    const token = await entrarComo('admin@lh.com');

    const resposta = await request(app)
      .patch(`/usuarios/${admin.id}`)
      .set(comToken(token))
      .send({});

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
  });

  it('T33: trocar a senha (204) faz o login exigir a nova senha', async () => {
    await criarNoBanco('ana@lh.com', 'GERENTE');
    const token = await entrarComo('ana@lh.com');

    const troca = await request(app)
      .patch('/auth/senha')
      .set(comToken(token))
      .send({ senhaAtual: SENHA_PADRAO, novaSenha: 'nova-senha-123' });
    const loginAntiga = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@lh.com', senha: SENHA_PADRAO });
    const loginNova = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@lh.com', senha: 'nova-senha-123' });

    expect(troca.status).toBe(204);
    expect(loginAntiga.status).toBe(401);
    expect(loginNova.status).toBe(200);
  });

  it('T33b: senha atual errada responde 422 SENHA_ATUAL_INCORRETA', async () => {
    await criarNoBanco('ana@lh.com', 'GERENTE');
    const token = await entrarComo('ana@lh.com');

    const resposta = await request(app)
      .patch('/auth/senha')
      .set(comToken(token))
      .send({ senhaAtual: 'errada-errada', novaSenha: 'nova-senha-123' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.erro.codigo).toBe('SENHA_ATUAL_INCORRETA');
  });

  it('T33c: nova senha curta responde 400 VALIDACAO_INVALIDA', async () => {
    await criarNoBanco('ana@lh.com', 'GERENTE');
    const token = await entrarComo('ana@lh.com');

    const resposta = await request(app)
      .patch('/auth/senha')
      .set(comToken(token))
      .send({ senhaAtual: SENHA_PADRAO, novaSenha: 'curta' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('VALIDACAO_INVALIDA');
  });
});