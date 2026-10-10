import { describe, expect, it } from 'vitest';
import { BcryptHashService } from './BcryptHashService';

describe('BcryptHashService', () => {
  // custo 4 so nos testes (rapido); em producao vem de BCRYPT_COST (12)
  const servico = new BcryptHashService(4);

  it('T16: gera hash bcrypt de 60 caracteres, diferente da senha', async () => {
    const hash = await servico.gerar('senha1234');

    expect(hash).not.toBe('senha1234');
    expect(hash).toMatch(/^\$2[aby]\$04\$/);
    expect(hash).toHaveLength(60);
  });

  it('T16b: a mesma senha gera hashes diferentes (salt aleatorio)', async () => {
    const hash1 = await servico.gerar('senha1234');
    const hash2 = await servico.gerar('senha1234');

    expect(hash1).not.toBe(hash2);
  });

  it('T16c: comparar aceita a senha correta e rejeita a errada', async () => {
    const hash = await servico.gerar('senha1234');

    await expect(servico.comparar('senha1234', hash)).resolves.toBe(true);
    await expect(servico.comparar('outra-senha', hash)).resolves.toBe(false);
  });
});