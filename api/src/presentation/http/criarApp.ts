import express, { type Express, type Request, type Response } from 'express';
import { tratarErros } from './tratarErros';

export function criarApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/saude', (_requisicao: Request, resposta: Response) => {
    resposta.json({ status: 'ok' });
  });

  app.use((_requisicao: Request, resposta: Response) => {
    resposta
      .status(404)
      .json({ erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota não encontrada' } });
  });

  app.use(tratarErros);

  return app;
}