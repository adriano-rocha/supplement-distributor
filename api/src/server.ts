import 'dotenv/config';
import { lerConfig } from './config/env';
import { montarDependencias } from './composicao';
import { criarPrismaClient } from './infra/prisma/criarPrismaClient';
import { criarApp } from './presentation/http/criarApp';

const config = lerConfig(process.env);
const prisma = criarPrismaClient(config.databaseUrl);

const app = criarApp(
  montarDependencias({
    prisma,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
    bcryptCost: config.bcryptCost,
  }),
);

const servidor = app.listen(config.port, () => {
  console.log(`API ouvindo na porta ${config.port}`);
});

async function encerrar(): Promise<void> {
  servidor.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void encerrar());
process.on('SIGTERM', () => void encerrar());