import { beforeEach, describe, expect, it } from 'vitest';
import { ListarUsuarios } from './ListarUsuarios';
import { UsuarioRepositoryEmMemoria } from '../../testing/fakes';

describe('ListarUsuarios', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let casoDeUso: ListarUsuarios;

  beforeEach(() => {
    repositorio = new UsuarioRepositoryEmMemoria();
    casoDeUso = new ListarUsuarios(repositorio);
  });

  it('T30: devolve todos os usuarios sem senhaHash', async () => {
    await repositorio.criar({
      nome: 'Ana',
      email: 'ana@lh.com',
      senhaHash: 'hash:a',
      perfil: 'GERENTE',
    });
    await repositorio.criar({
      nome: 'Bruno',
      email: 'bruno@lh.com',
      senhaHash: 'hash:b',
      perfil: 'VENDEDOR',
    });

    const resultado = await casoDeUso.executar();

    expect(resultado.map((usuario) => usuario.email).sort()).toEqual(['ana@lh.com', 'bruno@lh.com']);
    for (const usuario of resultado) {
      expect(usuario).not.toHaveProperty('senhaHash');
    }
  });

  it('T30b: devolve lista vazia quando nao ha usuarios', async () => {
    expect(await casoDeUso.executar()).toEqual([]);
  });
});