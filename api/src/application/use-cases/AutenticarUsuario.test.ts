import { beforeEach, describe, expect, it } from 'vitest';
import { AutenticarUsuario } from './AutenticarUsuario';
import { ErroDeNegocio } from '../errors/ErroDeNegocio';
import type { Usuario } from '../../domain/entities/Usuario';
import {
  HashServiceFake,
  TokenServiceFake,
  UsuarioRepositoryEmMemoria,
} from '../../testing/fakes';

describe('AutenticarUsuario', () => {
  let repositorio: UsuarioRepositoryEmMemoria;
  let hashService: HashServiceFake;
  let tokenService: TokenServiceFake;
  let casoDeUso: AutenticarUsuario;
  let ana: Usuario;

  beforeEach(async () => {
    repositorio = new UsuarioRepositoryEmMemoria();
    hashService = new HashServiceFake();
    tokenService = new TokenServiceFake();
    casoDeUso = new AutenticarUsuario(repositorio, hashService, tokenService);
    ana = await repositorio.criar({
      nome: 'Ana',
      email: 'ana@lh.com',
      senhaHash: await hashService.gerar('senha1234'),
      perfil: 'GERENTE',
    });
  });

  it('T04: credenciais corretas retornam token e usuario sem senhaHash', async () => {
    const resultado = await casoDeUso.executar({ email: 'ana@lh.com', senha: 'senha1234' });

    expect(tokenService.verificar(resultado.token)).toEqual({ sub: ana.id, perfil: 'GERENTE' });
    expect(resultado.usuario).toEqual({
      id: ana.id,
      nome: 'Ana',
      email: 'ana@lh.com',
      perfil: 'GERENTE',
      ativo: true,
    });
    expect(resultado.usuario).not.toHaveProperty('senhaHash');
  });

  it('T04b: e-mail com maiusculas e espacos nas pontas encontra o usuario', async () => {
    const resultado = await casoDeUso.executar({ email: '  ANA@LH.com ', senha: 'senha1234' });

    expect(resultado.usuario.id).toBe(ana.id);
  });

  it('T05: e-mail inexistente e senha errada geram exatamente o mesmo erro', async () => {
    const erroEmail = await casoDeUso
      .executar({ email: 'nao@existe.com', senha: 'senha1234' })
      .catch((e: unknown) => e);
    const erroSenha = await casoDeUso
      .executar({ email: 'ana@lh.com', senha: 'outra-senha' })
      .catch((e: unknown) => e);

    expect(erroEmail).toBeInstanceOf(ErroDeNegocio);
    expect(erroSenha).toBeInstanceOf(ErroDeNegocio);
    expect(erroEmail).toMatchObject({ codigo: 'CREDENCIAIS_INVALIDAS' });
    expect(erroSenha).toMatchObject({ codigo: 'CREDENCIAIS_INVALIDAS' });
    expect((erroEmail as ErroDeNegocio).message).toBe((erroSenha as ErroDeNegocio).message);
  });

  it('T06: usuario inativo recebe CREDENCIAIS_INVALIDAS mesmo com a senha certa', async () => {
    await repositorio.atualizar(ana.id, { ativo: false });

    await expect(
      casoDeUso.executar({ email: 'ana@lh.com', senha: 'senha1234' }),
    ).rejects.toMatchObject({ codigo: 'CREDENCIAIS_INVALIDAS' });
  });
});