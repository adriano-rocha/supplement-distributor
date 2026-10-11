import { z } from 'zod';
import { PERFIS } from '../../domain/entities/Usuario';

// O bcrypt considera no maximo 72 bytes da senha
const senha = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres')
  .refine((valor) => Buffer.byteLength(valor, 'utf8') <= 72, 'A senha deve ter no máximo 72 bytes');

const nome = z.string().trim().min(2).max(100);
const email = z.string().trim().email();

export const esquemaLogin = z.object({
  email,
  senha: z.string().min(1),
});

export const esquemaCriarUsuario = z.object({
  nome,
  email,
  senha,
  perfil: z.enum(PERFIS),
});

export const esquemaAtualizarUsuario = z
  .object({
    nome: nome.optional(),
    perfil: z.enum(PERFIS).optional(),
    ativo: z.boolean().optional(),
  })
  .refine((dados) => Object.keys(dados).length > 0, 'Informe ao menos um campo');

export const esquemaAlterarSenha = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: senha,
});

export const esquemaIdNaRota = z.object({
  id: z.string().uuid(),
});