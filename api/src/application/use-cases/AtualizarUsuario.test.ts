import { beforeEach, describe, expect, it } from 'vitest';
import { AtualizarUsuario } from './AtualizarUsuario';
import type { Perfil, Usuario } from '../../domain/entities/Usuario';
import { UsuarioRepositoryEmMemoria } from '../../testing/fakes';

interface CasoUltimoAdmin {
  descricao: string;
  mudanca: { perfil?: Perfil; ativo?: boolean };
}

const CASOS_ULTIMO_ADMIN: CasoUltimoAdmin[] = [
  { descricao: 'rebaixar o perfil', mudanca: { perfil: 'GERENTE' } },
  { descricao: 'desativar', mudanca: { ativo: false } },
];

describe('AtualizarUsuario', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let casoDeUso: AtualizarUsuario;
  let admin: Usuario;

  beforeEach(async () => {
    repositorio = new UsuarioRepositoryEmMemoria();
    casoDeUso = new AtualizarUsuario(repositorio);
    admin = await repositorio.criar({
      nome: 'Admin',
      email: 'admin@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'ADMIN',
    });
  });

  it.each(CASOS_ULTIMO_ADMIN)(
    'T09: $descricao do unico ADMIN ativo gera ULTIMO_ADMIN',
    async ({ mudanca }) => {
      await expect(casoDeUso.executar({ id: admin.id, ...mudanca })).rejects.toMatchObject({
        codigo: 'ULTIMO_ADMIN',
      });

      const depois = await repositorio.buscarPorId(admin.id);
      expect(depois).toMatchObject({ perfil: 'ADMIN', ativo: true });
    },
  );

  it('T09b: com outro ADMIN ativo, rebaixar e permitido e nao expoe senhaHash', async () => {
    await repositorio.criar({
      nome: 'Admin 2',
      email: 'admin2@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'ADMIN',
    });

    const resultado = await casoDeUso.executar({ id: admin.id, perfil: 'GERENTE' });

    expect(resultado).toEqual({
      id: admin.id,
      nome: 'Admin',
      email: 'admin@lh.com',
      perfil: 'GERENTE',
      ativo: true,
    });
    expect(resultado).not.toHaveProperty('senhaHash');
  });

  it('T09c: id inexistente gera USUARIO_NAO_ENCONTRADO', async () => {
    await expect(casoDeUso.executar({ id: 'id-inexistente', nome: 'X' })).rejects.toMatchObject({
      codigo: 'USUARIO_NAO_ENCONTRADO',
    });
  });

  it('T09d: alterar so o nome do unico ADMIN e permitido', async () => {
    const resultado = await casoDeUso.executar({ id: admin.id, nome: 'Novo Nome' });

    expect(resultado).toMatchObject({ nome: 'Novo Nome', perfil: 'ADMIN', ativo: true });
  });
});