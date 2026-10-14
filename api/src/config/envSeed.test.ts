import { describe, expect, it } from 'vitest';
import { lerConfigSeed } from './envSeed';

const ENV_VALIDO = {
  ADMIN_EMAIL: 'admin@lhsupplement.com',
  ADMIN_SENHA: 'uma-senha-forte-123',
};

function mensagemDoErro(funcao: () => unknown): string {
  try {
    funcao();
  } catch (erro) {
    return erro instanceof Error ? erro.message : String(erro);
  }
  return '';
}

describe('lerConfigSeed', () => {
  it('T35: devolve nome, email e senha com nome padrao Administrador', () => {
    expect(lerConfigSeed(ENV_VALIDO)).toEqual({
      nome: 'Administrador',
      email: 'admin@lhsupplement.com',
      senha: 'uma-senha-forte-123',
    });
  });

  it('T35b: usa ADMIN_NOME quando informado', () => {
    expect(lerConfigSeed({ ...ENV_VALIDO, ADMIN_NOME: 'Maria Admin' }).nome).toBe('Maria Admin');
  });

  it('T35c: rejeita a senha de exemplo do .env.example', () => {
    const mensagem = mensagemDoErro(() =>
      lerConfigSeed({ ...ENV_VALIDO, ADMIN_SENHA: 'troque-esta-senha' }),
    );

    expect(mensagem).toContain('ADMIN_SENHA');
  });

  it('T35d: rejeita senha curta e e-mail invalido citando os nomes', () => {
    expect(mensagemDoErro(() => lerConfigSeed({ ...ENV_VALIDO, ADMIN_SENHA: 'curta' }))).toContain(
      'ADMIN_SENHA',
    );
    expect(
      mensagemDoErro(() => lerConfigSeed({ ...ENV_VALIDO, ADMIN_EMAIL: 'nao-e-email' })),
    ).toContain('ADMIN_EMAIL');
  });

  it('T35e: variaveis ausentes sao listadas', () => {
    const mensagem = mensagemDoErro(() => lerConfigSeed({}));

    expect(mensagem).toContain('ADMIN_EMAIL');
    expect(mensagem).toContain('ADMIN_SENHA');
  });
});