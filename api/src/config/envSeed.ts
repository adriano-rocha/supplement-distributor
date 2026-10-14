import { z } from 'zod';

// Senha do .env.example: nunca deve virar a senha real de um ADMIN
const SENHA_DE_EXEMPLO = 'troque-esta-senha';

const esquemaSeed = z.object({
  ADMIN_NOME: z.string().trim().min(2).max(100).default('Administrador'),
  ADMIN_EMAIL: z.string().trim().email(),
  ADMIN_SENHA: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres')
    .refine(
      (valor) => Buffer.byteLength(valor, 'utf8') <= 72,
      'A senha deve ter no máximo 72 bytes',
    )
    .refine((valor) => valor !== SENHA_DE_EXEMPLO, 'Troque a senha de exemplo do .env'),
});

export interface ConfigSeed {
  nome: string;
  email: string;
  senha: string;
}

export function lerConfigSeed(env: Record<string, string | undefined>): ConfigSeed {
  const resultado = esquemaSeed.safeParse(env);

  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((problema) => `${problema.path.map(String).join('.')}: ${problema.message}`)
      .join('; ');
    throw new Error(`Configuração do seed inválida -> ${problemas}`);
  }

  const dados = resultado.data;
  return { nome: dados.ADMIN_NOME, email: dados.ADMIN_EMAIL, senha: dados.ADMIN_SENHA };
}