import 'dotenv/config';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ErroDeNegocio } from '../../application/errors/ErroDeNegocio';
import type { NovoUsuario, Perfil } from '../../domain/entities/Usuario';
import { criarPrismaClient } from './criarPrismaClient';
import { PrismaUsuarioRepository } from './PrismaUsuarioRepository';

const urlTeste = process.env['DATABASE_URL_TEST'];

// Trava de seguranca: estes testes apagam dados, so rodam no banco supplement_test
if (!urlTeste || !urlTeste.includes('supplement_test')) {
  throw new Error(
    'DATABASE_URL_TEST ausente ou fora de supplement_test: testes de integracao abortados',
  );
}

const prisma = criarPrismaClient(urlTeste);
const repositorio = new PrismaUsuarioRepository(prisma);
const ID_INEXISTENTE = '00000000-0000-0000-0000-000000000000';

function novoUsuario(email: string, perfil: Perfil = 'VENDEDOR'): NovoUsuario {
  return { nome: 'Teste', email, senhaHash: 'hash:original', perfil };
}

describe('PrismaUsuarioRepository (integracao, banco supplement_test)', () => {
  beforeEach(async () => {
    await prisma.usuario.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('T18: criar persiste e devolve o usuario com id uuid, ativo e criadoEm', async () => {
    const criado = await repositorio.criar(novoUsuario('ana@lh.com', 'GERENTE'));

    expect(criado.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(criado).toMatchObject({
      nome: 'Teste',
      email: 'ana@lh.com',
      senhaHash: 'hash:original',
      perfil: 'GERENTE',
      ativo: true,
    });
    expect(criado.criadoEm).toBeInstanceOf(Date);
  });

  it('T19: buscarPorEmail encontra o usuario e devolve null quando nao existe', async () => {
    const criado = await repositorio.criar(novoUsuario('ana@lh.com'));

    expect(await repositorio.buscarPorEmail('ana@lh.com')).toMatchObject({ id: criado.id });
    expect(await repositorio.buscarPorEmail('nao@existe.com')).toBeNull();
  });

  it('T19b: buscarPorId encontra o usuario e devolve null quando nao existe', async () => {
    const criado = await repositorio.criar(novoUsuario('ana@lh.com'));

    expect(await repositorio.buscarPorId(criado.id)).toMatchObject({ email: 'ana@lh.com' });
    expect(await repositorio.buscarPorId(ID_INEXISTENTE)).toBeNull();
  });

  it('T20: listar devolve todos os usuarios', async () => {
    await repositorio.criar(novoUsuario('a@lh.com'));
    await repositorio.criar(novoUsuario('b@lh.com'));
    await repositorio.criar(novoUsuario('c@lh.com'));

    const todos = await repositorio.listar();

    expect(todos.map((u) => u.email).sort()).toEqual(['a@lh.com', 'b@lh.com', 'c@lh.com']);
  });

  it('T21: atualizar altera so os campos informados', async () => {
    const criado = await repositorio.criar(novoUsuario('ana@lh.com'));

    const atualizado = await repositorio.atualizar(criado.id, {
      nome: 'Ana Maria',
      perfil: 'GERENTE',
      ativo: false,
    });

    expect(atualizado).toMatchObject({
      id: criado.id,
      nome: 'Ana Maria',
      perfil: 'GERENTE',
      ativo: false,
      email: 'ana@lh.com',
      senhaHash: 'hash:original',
    });
  });

  it('T21b: atualizarSenha troca somente o hash da senha', async () => {
    const criado = await repositorio.criar(novoUsuario('ana@lh.com'));

    await repositorio.atualizarSenha(criado.id, 'hash:novo');

    const depois = await repositorio.buscarPorId(criado.id);
    expect(depois).toMatchObject({ senhaHash: 'hash:novo', nome: 'Teste', email: 'ana@lh.com' });
  });

  it('T22: contarAdminsAtivos conta somente ADMIN ativos', async () => {
    await repositorio.criar(novoUsuario('admin1@lh.com', 'ADMIN'));
    const admin2 = await repositorio.criar(novoUsuario('admin2@lh.com', 'ADMIN'));
    await repositorio.criar(novoUsuario('gerente@lh.com', 'GERENTE'));
    await repositorio.atualizar(admin2.id, { ativo: false });

    expect(await repositorio.contarAdminsAtivos()).toBe(1);
  });

  it('T23: e-mail duplicado gera EMAIL_JA_CADASTRADO', async () => {
    await repositorio.criar(novoUsuario('ana@lh.com'));

    const erro = await repositorio.criar(novoUsuario('ana@lh.com')).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ErroDeNegocio);
    expect(erro).toMatchObject({ codigo: 'EMAIL_JA_CADASTRADO' });
  });

  it('T23b: duas criacoes simultaneas do mesmo e-mail: so uma vence', async () => {
    const resultados = await Promise.allSettled([
      repositorio.criar(novoUsuario('corrida@lh.com')),
      repositorio.criar(novoUsuario('corrida@lh.com')),
    ]);

    const aceitos = resultados.filter((r) => r.status === 'fulfilled');
    const rejeitados = resultados.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    expect(aceitos).toHaveLength(1);
    expect(rejeitados).toHaveLength(1);
    expect(rejeitados[0].reason).toMatchObject({ codigo: 'EMAIL_JA_CADASTRADO' });
    expect(await repositorio.listar()).toHaveLength(1);
  });
});