import * as jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { JwtTokenService } from './JwtTokenService';

const SEGREDO = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';

function capturarErro(funcao: () => unknown): unknown {
  try {
    funcao();
  } catch (erro) {
    return erro;
  }
  return undefined;
}

describe('JwtTokenService', () => {
  const servico = new JwtTokenService(SEGREDO, '1h');

  it('T17: token gerado e verificado devolve sub e perfil', () => {
    const token = servico.gerar({ sub: 'usuario-1', perfil: 'GERENTE' });

    expect(servico.verificar(token)).toEqual({ sub: 'usuario-1', perfil: 'GERENTE' });
  });

  it('T17b: token assinado com outro segredo gera NAO_AUTENTICADO', () => {
    const outro = new JwtTokenService('outro-segredo-completamente-diferente-123456', '1h');
    const token = outro.gerar({ sub: 'usuario-1', perfil: 'ADMIN' });

    expect(capturarErro(() => servico.verificar(token))).toMatchObject({
      codigo: 'NAO_AUTENTICADO',
    });
  });

  it('T17c: token expirado gera NAO_AUTENTICADO', () => {
    const jaExpirado = new JwtTokenService(SEGREDO, -10);
    const token = jaExpirado.gerar({ sub: 'usuario-1', perfil: 'ADMIN' });

    expect(capturarErro(() => servico.verificar(token))).toMatchObject({
      codigo: 'NAO_AUTENTICADO',
    });
  });

  it('T17d: texto que nao e token gera NAO_AUTENTICADO', () => {
    expect(capturarErro(() => servico.verificar('isto-nao-e-um-token'))).toMatchObject({
      codigo: 'NAO_AUTENTICADO',
    });
  });

  it('T17e: token com perfil inexistente gera NAO_AUTENTICADO', () => {
    const token = jwt.sign({ perfil: 'SUPER' }, SEGREDO, { subject: 'usuario-1' });

    expect(capturarErro(() => servico.verificar(token))).toMatchObject({
      codigo: 'NAO_AUTENTICADO',
    });
  });

  it('T17f: token sem assinatura (alg none) gera NAO_AUTENTICADO', () => {
    const semAssinatura = jwt.sign({ perfil: 'ADMIN' }, '', {
      algorithm: 'none',
      subject: 'usuario-1',
    });

    expect(capturarErro(() => servico.verificar(semAssinatura))).toMatchObject({
      codigo: 'NAO_AUTENTICADO',
    });
  });
});