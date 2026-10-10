import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ErroDeNegocio } from '../../application/errors/ErroDeNegocio';
import type { ITokenService } from '../../application/services/ITokenService';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

interface Dependencias {
  tokenService: ITokenService;
  usuarioRepository: IUsuarioRepository;
}

const PADRAO_BEARER = /^Bearer (\S+)$/i;

function naoAutenticado(): ErroDeNegocio {
  return new ErroDeNegocio('NAO_AUTENTICADO', 'Autenticação necessária');
}

export function criarAutenticar(dependencias: Dependencias): RequestHandler {
  return async (requisicao: Request, _resposta: Response, proximo: NextFunction) => {
    try {
      const cabecalho = requisicao.headers.authorization ?? '';
      const encontrado = PADRAO_BEARER.exec(cabecalho);
      if (!encontrado) {
        throw naoAutenticado();
      }

      const payload = dependencias.tokenService.verificar(encontrado[1]);
      const usuario = await dependencias.usuarioRepository.buscarPorId(payload.sub);
      if (!usuario || !usuario.ativo) {
        throw naoAutenticado();
      }

      requisicao.usuario = { id: usuario.id, perfil: usuario.perfil };
      proximo();
    } catch (erro) {
      proximo(erro);
    }
  };
}