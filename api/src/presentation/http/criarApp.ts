import express, { type Express, type Request, type Response } from 'express';
import type { DependenciasApp } from './dependencias';
import { criarRotasAuth } from './rotasAuth';
import { criarRotasUsuarios } from './rotasUsuarios';
import { tratarErros } from './tratarErros';

export function criarApp(dependencias?: DependenciasApp): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/saude', (_requisicao: Request, resposta: Response) => {
    resposta.json({ status: 'ok' });
  });

  if (dependencias) {
    app.use('/auth', criarRotasAuth(dependencias));
    app.use('/usuarios', criarRotasUsuarios(dependencias));
  }

  app.use((_requisicao: Request, resposta: Response) => {
    resposta
      .status(404)
      .json({ erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota não encontrada' } });
  });

  app.use(tratarErros);

  return app;
}