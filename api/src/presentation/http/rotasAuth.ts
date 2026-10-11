import { Router, type Request } from 'express';
import { ErroDeNegocio } from '../../application/errors/ErroDeNegocio';
import { criarAutenticar } from './autenticar';
import type { DependenciasApp } from './dependencias';
import { esquemaAlterarSenha, esquemaLogin } from './schemas';

function usuarioAutenticado(requisicao: Request): { id: string } {
  if (!requisicao.usuario) {
    throw new ErroDeNegocio('NAO_AUTENTICADO', 'Autenticação necessária');
  }
  return requisicao.usuario;
}

export function criarRotasAuth(dependencias: DependenciasApp): Router {
  const rotas = Router();
  const autenticar = criarAutenticar(dependencias);
  const { autenticarUsuario, obterUsuario, alterarSenha } = dependencias.casosDeUso;

  rotas.post('/login', async (requisicao, resposta) => {
    const entrada = esquemaLogin.parse(requisicao.body);
    const resultado = await autenticarUsuario.executar(entrada);
    resposta.json(resultado);
  });

  rotas.get('/me', autenticar, async (requisicao, resposta) => {
    const { id } = usuarioAutenticado(requisicao);
    const usuario = await obterUsuario.executar({ id });
    resposta.json({ usuario });
  });

  rotas.patch('/senha', autenticar, async (requisicao, resposta) => {
    const { id } = usuarioAutenticado(requisicao);
    const entrada = esquemaAlterarSenha.parse(requisicao.body);
    await alterarSenha.executar({ usuarioId: id, ...entrada });
    resposta.status(204).send();
  });

  return rotas;
}