import { ErroDeNegocio } from '../../application/errors/ErroDeNegocio';
import type { NovoUsuario, Usuario } from '../../domain/entities/Usuario';
import type { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import type { PrismaClient } from './generated/client';

// Codigo do Prisma para violacao de restricao UNIQUE
const CODIGO_VIOLACAO_UNICIDADE = 'P2002';

function violouUnicidade(erro: unknown): boolean {
  return (
    typeof erro === 'object' &&
    erro !== null &&
    'code' in erro &&
    (erro as { code: unknown }).code === CODIGO_VIOLACAO_UNICIDADE
  );
}

// Copia explicita: o dominio nao depende do tipo gerado pelo Prisma
function paraDominio(registro: Usuario): Usuario {
  return {
    id: registro.id,
    nome: registro.nome,
    email: registro.email,
    senhaHash: registro.senhaHash,
    perfil: registro.perfil,
    ativo: registro.ativo,
    criadoEm: registro.criadoEm,
  };
}

export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoUsuario): Promise<Usuario> {
    try {
      const registro = await this.prisma.usuario.create({ data: dados });
      return paraDominio(registro);
    } catch (erro) {
      if (violouUnicidade(erro)) {
        throw new ErroDeNegocio('EMAIL_JA_CADASTRADO', 'E-mail já cadastrado');
      }
      throw erro;
    }
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { id } });
    return registro ? paraDominio(registro) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { email } });
    return registro ? paraDominio(registro) : null;
  }

  async listar(): Promise<Usuario[]> {
    const registros = await this.prisma.usuario.findMany({ orderBy: { criadoEm: 'asc' } });
    return registros.map(paraDominio);
  }

  async atualizar(
    id: string,
    dados: Partial<Pick<Usuario, 'nome' | 'perfil' | 'ativo'>>,
  ): Promise<Usuario> {
    const registro = await this.prisma.usuario.update({ where: { id }, data: dados });
    return paraDominio(registro);
  }

  async atualizarSenha(id: string, senhaHash: string): Promise<void> {
    await this.prisma.usuario.update({ where: { id }, data: { senhaHash } });
  }

  async contarAdminsAtivos(): Promise<number> {
    return this.prisma.usuario.count({ where: { perfil: 'ADMIN', ativo: true } });
  }
}