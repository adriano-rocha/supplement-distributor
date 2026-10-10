import { beforeEach, describe, expect, it } from 'vitest';
import { ObterUsuario } from './ObterUsuario';
import { UsuarioRepositoryEmMemoria } from '../../testing/fakes';

describe('ObterUsuario', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let casoDeUso: ObterUsuario;

  beforeEach(() => {
    repositorio = new UsuarioRepositoryEmMemoria();
    casoDeUso = new ObterUsuario(repositorio);
  });

  it('T29: devolve o usuario publico sem senhaHash', async () => {
    const ana = await repositorio.criar({
      nome: 'Ana',
      email: 'ana@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'GERENTE',
    });

    const resultado = await casoDeUso.executar({ id: ana.id });

    expect(resultado).toEqual({
      id: ana.id,
      nome: 'Ana',
      email: 'ana@lh.com',
      perfil: 'GERENTE',
      ativo: true,
    });
    expect(resultado).not.toHaveProperty('senhaHash');
  });

  it('T29b: id inexistente gera USUARIO_NAO_ENCONTRADO', async () => {
    await expect(casoDeUso.executar({ id: 'id-inexistente' })).rejects.toMatchObject({
      codigo: 'USUARIO_NAO_ENCONTRADO',
    });
  });
});