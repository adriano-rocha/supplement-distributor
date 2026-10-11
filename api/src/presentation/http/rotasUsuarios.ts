import { Router } from 'express';
import { autorizar } from './autorizar';
import { criarAutenticar } from './autenticar';
import type { DependenciasApp } from './dependencias';
import { esquemaAtualizarUsuario, esquemaCriarUsuario, esquemaIdNaRota } from './schemas';

export function criarRotasUsuarios(dependencias: DependenciasApp): Router {
  const rotas = Router();
  const { criarUsuario, listarUsuarios, atualizarUsuario } = dependencias.casosDeUso;

  // Ordem: autenticar (401), autorizar (403) e so depois a validacao do corpo (400)
  rotas.use(criarAutenticar(dependencias), autorizar('usuarios:gerir'));

  rotas.post('/', async (requisicao, resposta) => {
    const entrada = esquemaCriarUsuario.parse(requisicao.body);
    const usuario = await criarUsuario.executar(entrada);
    resposta.status(201).json({ usuario });
  });

  rotas.get('/', async (_requisicao, resposta) => {
    const usuarios = await listarUsuarios.executar();
    resposta.json({ usuarios });
  });

  rotas.patch('/:id', async (requisicao, resposta) => {
    const { id } = esquemaIdNaRota.parse(requisicao.params);
    const dados = esquemaAtualizarUsuario.parse(requisicao.body);
    const usuario = await atualizarUsuario.executar({ id, ...dados });
    resposta.json({ usuario });
  });

  return rotas;
}