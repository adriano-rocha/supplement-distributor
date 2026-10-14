import 'dotenv/config';
import { montarDependencias } from './composicao';
import { CriarAdminInicial } from './application/use-cases/CriarAdminInicial';
import { lerConfig } from './config/env';
import { lerConfigSeed } from './config/envSeed';
import { criarPrismaClient } from './infra/prisma/criarPrismaClient';

async function main(): Promise<void> {
  const config = lerConfig(process.env);
  const dadosAdmin = lerConfigSeed(process.env);
  const prisma = criarPrismaClient(config.databaseUrl);

  try {
    const dependencias = montarDependencias({
      prisma,
      jwtSecret: config.jwtSecret,
      jwtExpiresIn: config.jwtExpiresIn,
      bcryptCost: config.bcryptCost,
    });
    const criarAdminInicial = new CriarAdminInicial(
      dependencias.usuarioRepository,
      dependencias.casosDeUso.criarUsuario,
    );

    const { criado } = await criarAdminInicial.executar(dadosAdmin);
    console.log(
      criado
        ? `ADMIN criado: ${dadosAdmin.email}`
        : 'Já existe um ADMIN ativo: nada a fazer.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(1);
});