import type { RequestHandler } from 'express';
import { ErroDeNegocio } from '../../application/errors/ErroDeNegocio';
import { perfilTemPermissao, type Permissao } from '../../domain/permissoes';

export function autorizar(permissao: Permissao): RequestHandler {
  return (requisicao, _resposta, proximo) => {
    if (!requisicao.usuario) {
      proximo(new ErroDeNegocio('NAO_AUTENTICADO', 'Autenticação necessária'));
      return;
    }

    if (!perfilTemPermissao(requisicao.usuario.perfil, permissao)) {
      proximo(new ErroDeNegocio('SEM_PERMISSAO', 'Você não tem permissão para esta ação'));
      return;
    }

    proximo();
  };
}