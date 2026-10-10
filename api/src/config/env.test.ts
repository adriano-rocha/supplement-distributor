import { describe, expect, it } from 'vitest';
import { lerConfig } from './env';

const ENV_VALIDO = {
  DATABASE_URL: 'postgresql://usuario:senha@localhost:5436/banco',
  JWT_SECRET: 'x'.repeat(32),
  JWT_EXPIRES_IN: '1h',
  BCRYPT_COST: '12',
  PORT: '4000',
};

function mensagemDoErro(funcao: () => unknown): string {
  try {
    funcao();
  } catch (erro) {
    return erro instanceof Error ? erro.message : String(erro);
  }
  return '';
}

describe('lerConfig', () => {
  it('T24: ambiente valido devolve configuracao tipada com numeros convertidos', () => {
    expect(lerConfig(ENV_VALIDO)).toEqual({
      databaseUrl: 'postgresql://usuario:senha@localhost:5436/banco',
      jwtSecret: 'x'.repeat(32),
      jwtExpiresIn: '1h',
      bcryptCost: 12,
      port: 4000,
    });
  });

  it('T24b: PORT ausente usa o padrao 3333', () => {
    const semPorta = { ...ENV_VALIDO, PORT: undefined };

    expect(lerConfig(semPorta).port).toBe(3333);
  });

  it('T24c: JWT_SECRET com menos de 32 caracteres e rejeitado citando o nome', () => {
    const mensagem = mensagemDoErro(() => lerConfig({ ...ENV_VALIDO, JWT_SECRET: 'curto' }));

    expect(mensagem).toContain('JWT_SECRET');
  });

  it('T24d: variaveis ausentes sao listadas todas de uma vez', () => {
    const mensagem = mensagemDoErro(() => lerConfig({}));

    for (const nome of ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'BCRYPT_COST']) {
      expect(mensagem).toContain(nome);
    }
  });

  it('T24e: BCRYPT_COST fora do intervalo de 4 a 15 e rejeitado', () => {
    expect(mensagemDoErro(() => lerConfig({ ...ENV_VALIDO, BCRYPT_COST: '3' }))).toContain(
      'BCRYPT_COST',
    );
    expect(mensagemDoErro(() => lerConfig({ ...ENV_VALIDO, BCRYPT_COST: '16' }))).toContain(
      'BCRYPT_COST',
    );
  });
});