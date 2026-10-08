import { beforeEach, describe, expect, it } from 'vitest';
import { CriarUsuario } from './CriarUsuario';
import { HashServiceFake, UsuarioRepositoryEmMemoria } from '../../testing/fakes';

describe('CriarUsuario', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let hashService: HashServiceFake;
  let casoDeUso: CriarUsuario;

  beforeEach(() => {
    repositorio = new UsuarioRepositoryEmMemoria();
    hashService = new HashServiceFake();
    casoDeUso = new CriarUsuario(repositorio, hashService);
  });

  it('T07: e-mail ja cadastrado (ignorando maiusculas e espacos) gera EMAIL_JA_CADASTRADO', async () => {
    await repositorio.criar({
      nome: 'Ana',
      email: 'ana@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'GERENTE',
    });

    await expect(
      casoDeUso.executar({
        nome: 'Outra Ana',
        email: '  ANA@lh.com ',
        senha: 'senha1234',
        perfil: 'VENDEDOR',
      }),
    ).rejects.toMatchObject({ codigo: 'EMAIL_JA_CADASTRADO' });

    expect(await repositorio.listar()).toHaveLength(1);
  });

  it('T08: salva e-mail em minusculas e senha como hash, sem expor senhaHash', async () => {
    const resultado = await casoDeUso.executar({
      nome: 'Bruno',
      email: '  Bruno@LH.com ',
      senha: 'senha1234',
      perfil: 'VENDEDOR',
    });

    expect(resultado).toEqual({
      id: expect.any(String),
      nome: 'Bruno',
      email: 'bruno@lh.com',
      perfil: 'VENDEDOR',
      ativo: true,
    });
    expect(resultado).not.toHaveProperty('senhaHash');

    const salvo = await repositorio.buscarPorEmail('bruno@lh.com');
    expect(salvo?.senhaHash).toBe(await hashService.gerar('senha1234'));
    expect(salvo?.senhaHash).not.toBe('senha1234');
  });
});