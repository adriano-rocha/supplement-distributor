import { beforeEach, describe, expect, it } from 'vitest';
import { CriarAdminInicial } from './CriarAdminInicial';
import { CriarUsuario } from './CriarUsuario';
import { HashServiceFake, UsuarioRepositoryEmMemoria } from '../../testing/fakes';

const DADOS = { nome: 'Administrador', email: '  Admin@LH.com ', senha: 'senha-forte-123' };

describe('CriarAdminInicial', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let hashService: HashServiceFake;
  let casoDeUso: CriarAdminInicial;

  beforeEach(() => {
    repositorio = new UsuarioRepositoryEmMemoria();
    hashService = new HashServiceFake();
    casoDeUso = new CriarAdminInicial(repositorio, new CriarUsuario(repositorio, hashService));
  });

  it('T34: sem ADMIN ativo, cria o ADMIN com e-mail normalizado e senha como hash', async () => {
    const resultado = await casoDeUso.executar(DADOS);

    expect(resultado).toEqual({ criado: true });
    const salvo = await repositorio.buscarPorEmail('admin@lh.com');
    expect(salvo).toMatchObject({ perfil: 'ADMIN', ativo: true, nome: 'Administrador' });
    expect(salvo?.senhaHash).toBe(await hashService.gerar('senha-forte-123'));
  });

  it('T34b: ja existindo ADMIN ativo, nao cria nada', async () => {
    await repositorio.criar({
      nome: 'Outro',
      email: 'outro@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'ADMIN',
    });

    const resultado = await casoDeUso.executar(DADOS);

    expect(resultado).toEqual({ criado: false });
    expect(await repositorio.listar()).toHaveLength(1);
  });

  it('T34c: so com ADMIN inativo, cria um novo ADMIN', async () => {
    const antigo = await repositorio.criar({
      nome: 'Antigo',
      email: 'antigo@lh.com',
      senhaHash: 'hash:qualquer',
      perfil: 'ADMIN',
    });
    await repositorio.atualizar(antigo.id, { ativo: false });

    const resultado = await casoDeUso.executar(DADOS);

    expect(resultado).toEqual({ criado: true });
    expect(await repositorio.contarAdminsAtivos()).toBe(1);
  });

  it('T34d: executar duas vezes cria uma unica vez', async () => {
    const primeira = await casoDeUso.executar(DADOS);
    const segunda = await casoDeUso.executar(DADOS);

    expect(primeira).toEqual({ criado: true });
    expect(segunda).toEqual({ criado: false });
    expect(await repositorio.listar()).toHaveLength(1);
  });
});