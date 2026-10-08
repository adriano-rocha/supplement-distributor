import { randomUUID } from 'node:crypto';
import type { NovoUsuario, Perfil, Usuario } from '../domain/entities/Usuario';
import type { IUsuarioRepository } from '../domain/repositories/IUsuarioRepository';
import type { IHashService } from '../application/services/IHashService';
import type { ITokenService, PayloadToken } from '../application/services/ITokenService';

export class UsuarioRepositoryEmMemoria implements IUsuarioRepository {
  private usuarios: Usuario[] = [];

  async criar(dados: NovoUsuario): Promise<Usuario> {
    const usuario: Usuario = { id: randomUUID(), ativo: true, criadoEm: new Date(), ...dados };
    this.usuarios.push(usuario);
    return usuario;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.email === email) ?? null;
  }

  async listar(): Promise<Usuario[]> {
    return [...this.usuarios];
  }

  async atualizar(
    id: string,
    dados: Partial<Pick<Usuario, 'nome' | 'perfil' | 'ativo'>>,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) throw new Error('Usuario inexistente no repositorio em memoria');
    Object.assign(usuario, dados);
    return usuario;
  }

  async atualizarSenha(id: string, senhaHash: string): Promise<void> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) throw new Error('Usuario inexistente no repositorio em memoria');
    usuario.senhaHash = senhaHash;
  }

  async contarAdminsAtivos(): Promise<number> {
    return this.usuarios.filter((u) => u.perfil === 'ADMIN' && u.ativo).length;
  }
}

export class HashServiceFake implements IHashService {
  async gerar(senha: string): Promise<string> {
    return `hash:${senha}`;
  }

  async comparar(senha: string, hash: string): Promise<boolean> {
    return hash === `hash:${senha}`;
  }
}

export class TokenServiceFake implements ITokenService {
  gerar(payload: PayloadToken): string {
    return `token:${payload.sub}:${payload.perfil}`;
  }

  verificar(token: string): PayloadToken {
    const [, sub, perfil] = token.split(':');
    return { sub, perfil: perfil as Perfil };
  }
}