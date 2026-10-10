import { z } from 'zod';

const esquemaEnv = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
});

export interface Config {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptCost: number;
  port: number;
}

export function lerConfig(env: Record<string, string | undefined>): Config {
  const resultado = esquemaEnv.safeParse(env);

  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((problema) => `${problema.path.map(String).join('.')}: ${problema.message}`)
      .join('; ');
    throw new Error(`Configuração de ambiente inválida -> ${problemas}`);
  }

  const dados = resultado.data;
  return {
    databaseUrl: dados.DATABASE_URL,
    jwtSecret: dados.JWT_SECRET,
    jwtExpiresIn: dados.JWT_EXPIRES_IN,
    bcryptCost: dados.BCRYPT_COST,
    port: dados.PORT,
  };
}