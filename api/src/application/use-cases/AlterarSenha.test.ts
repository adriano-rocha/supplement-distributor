import { beforeEach, describe, expect, it } from 'vitest';
import { AlterarSenha } from './AlterarSenha';
import type { Usuario } from '../../domain/entities/Usuario';
import { HashServiceFake, UsuarioRepositoryEmMemoria } from '../../testing/fakes';

describe('AlterarSenha', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let hashService: HashServiceFake;
  let casoDeUso: AlterarSenha;
  let ana: Usuario;

  beforeEach(async () => {
    repositorio = new UsuarioRepositoryEmMemoria();
    hashService = new HashServiceFake();
    casoDeUso = new AlterarSenha(repositorio, hashService);
    ana = await repositorio.criar({
      nome: 'Ana',
      email: 'ana@lh.com',
      senhaHash: await hashService.gerar('senha-antiga1'),
      perfil: 'GERENTE',
    });
  });

  it('T10: senha atual incorreta gera SENHA_ATUAL_INCORRETA e nao altera a senha', async () => {
    await expect(
      casoDeUso.executar({
        usuarioId: ana.id,
        senhaAtual: 'errada-errada',
        novaSenha: 'senha-nova123',
      }),
    ).rejects.toMatchObject({ codigo: 'SENHA_ATUAL_INCORRETA' });

    const depois = await repositorio.buscarPorId(ana.id);
    expect(depois?.senhaHash).toBe(await hashService.gerar('senha-antiga1'));
  });

  it('T10b: senha atual correta salva o hash da nova senha', async () => {
    await casoDeUso.executar({
      usuarioId: ana.id,
      senhaAtual: 'senha-antiga1',
      novaSenha: 'senha-nova123',
    });

    const depois = await repositorio.buscarPorId(ana.id);
    expect(depois?.senhaHash).toBe(await hashService.gerar('senha-nova123'));
  });

  it('T10c: usuario inexistente gera USUARIO_NAO_ENCONTRADO', async () => {
    await expect(
      casoDeUso.executar({
        usuarioId: 'id-inexistente',
        senhaAtual: 'senha-antiga1',
        novaSenha: 'senha-nova123',
      }),
    ).rejects.toMatchObject({ codigo: 'USUARIO_NAO_ENCONTRADO' });
  });
});