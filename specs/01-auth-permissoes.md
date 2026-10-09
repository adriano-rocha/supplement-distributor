# Spec 01 — Autenticação e Permissões

Status: rascunho para revisão

## 1. Objetivo
Identificar quem usa o sistema (autenticação) e limitar o que cada perfil pode fazer
(autorização), com toda a validação no backend.

## 2. Fora do escopo (v2)
Cadastro público, recuperação de senha por e-mail, refresh token, 2FA, limite de tentativas de login.

## 3. Decisões
- D1: Sem cadastro público. É um ERP interno: o ADMIN cria os usuários. O primeiro ADMIN vem de um
  seed (ADMIN_EMAIL e ADMIN_SENHA em variáveis de ambiente).
- D2: JWT de acesso com expiração de 1h e payload `{ sub: usuarioId, perfil }`. Sem refresh no MVP.
- D3: O middleware `autenticar` valida o token E confere no banco se o usuário existe e está ativo.
  Assim, desativar um usuário vale imediatamente, sem esperar o token expirar.
- D4: Autorização por PERMISSÃO, não por perfil. Rotas exigem uma permissão; o mapa
  perfil → permissões vive no domínio. Trocar regras não exige mexer nas rotas.
- D5: Hash de senha com bcrypt; custo configurável por env (padrão 12; 4 nos testes).
- D6: Erro de login é genérico (não revela se o e-mail existe).

## 4. Entidade Usuario
| Campo | Tipo | Regra |
|---|---|---|
| id | uuid | gerado pelo banco |
| nome | string | obrigatório, 2 a 100 caracteres |
| email | string | único, salvo em minúsculas |
| senhaHash | string | nunca exposto em resposta ou log |
| perfil | enum | ADMIN, GERENTE, ESTOQUISTA, VENDEDOR |
| ativo | boolean | padrão true |
| criadoEm | datetime | automático |

## 5. Permissões
| Permissão | ADMIN | GERENTE | ESTOQUISTA | VENDEDOR |
|---|---|---|---|---|
| usuarios:gerir | ✅ | ❌ | ❌ | ❌ |
| produtos:ler | ✅ | ✅ | ✅ | ✅ |
| produtos:escrever | ✅ | ✅ | ✅ | ❌ |
| estoque:entrada | ✅ | ✅ | ✅ | ❌ |
| vendas:registrar | ✅ | ✅ | ❌ | ✅ |
| vendas:cancelar | ✅ | ✅ | ❌ | ❌ |
| relatorios:completo | ✅ | ✅ | ❌ | ❌ |
| relatorios:estoque | ✅ | ✅ | ✅ | ❌ |
| relatorios:proprias_vendas | ❌ | ❌ | ❌ | ✅ |

## 6. Contratos da API
Formato de erro padrão: `{ "erro": { "codigo": "STRING", "mensagem": "texto" } }`

| Método e rota | Permissão | Entrada | Sucesso | Erros |
|---|---|---|---|---|
| POST /auth/login | pública | `{ email, senha }` | 200 `{ token, usuario }` | 400 VALIDACAO_INVALIDA, 401 CREDENCIAIS_INVALIDAS |
| GET /auth/me | autenticado | token | 200 `{ usuario }` | 401 NAO_AUTENTICADO |
| POST /usuarios | usuarios:gerir | `{ nome, email, senha, perfil }` | 201 `{ usuario }` | 400, 401, 403 SEM_PERMISSAO, 409 EMAIL_JA_CADASTRADO |
| GET /usuarios | usuarios:gerir | — | 200 `{ usuarios[] }` | 401, 403 |
| PATCH /usuarios/:id | usuarios:gerir | `{ nome?, perfil?, ativo? }` | 200 `{ usuario }` | 400, 401, 403, 404 USUARIO_NAO_ENCONTRADO, 409 ULTIMO_ADMIN |
| PATCH /auth/senha | autenticado | `{ senhaAtual, novaSenha }` | 204 | 400, 401, 422 SENHA_ATUAL_INCORRETA |

Resposta `usuario`: `{ id, nome, email, perfil, ativo }` (nunca inclui senhaHash).

## 7. Regras de negócio
- RA01: e-mail único e normalizado em minúsculas.
- RA02: senha com no mínimo 8 caracteres; nunca retornada nem registrada em log.
- RA03: usuário inativo não consegue autenticar (login nem token já emitido).
- RA04: o sistema sempre mantém pelo menos 1 ADMIN ativo (não é possível desativar ou rebaixar o último).
- RA05: a identidade vem sempre do token, nunca do body ou dos parâmetros da requisição.

## 8. Contratos de código (assinaturas, sem implementação)
```ts
// api/src/domain/entities/Usuario.ts
type Perfil = 'ADMIN' | 'GERENTE' | 'ESTOQUISTA' | 'VENDEDOR';

// api/src/domain/permissoes.ts
type Permissao =
  | 'usuarios:gerir' | 'produtos:ler' | 'produtos:escrever' | 'estoque:entrada'
  | 'vendas:registrar' | 'vendas:cancelar'
  | 'relatorios:completo' | 'relatorios:estoque' | 'relatorios:proprias_vendas';
function perfilTemPermissao(perfil: Perfil, permissao: Permissao): boolean;

// api/src/domain/repositories/IUsuarioRepository.ts
interface IUsuarioRepository {
  criar(dados: NovoUsuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  atualizar(id: string, dados: Partial<Pick<Usuario, 'nome' | 'perfil' | 'ativo'>>): Promise<Usuario>;
  atualizarSenha(id: string, senhaHash: string): Promise<void>;
  contarAdminsAtivos(): Promise<number>;
}

// api/src/application/services/IHashService.ts
interface IHashService { gerar(senha: string): Promise<string>; comparar(senha: string, hash: string): Promise<boolean>; }

// api/src/application/services/ITokenService.ts
interface ITokenService { gerar(payload: { sub: string; perfil: Perfil }): string; verificar(token: string): { sub: string; perfil: Perfil }; }

// Casos de uso (api/src/application/use-cases/), todos com método executar()
// AutenticarUsuario, CriarUsuario, ListarUsuarios, AtualizarUsuario, AlterarSenha
```

## 9. Cenários de teste (o "harness")
| ID | Nível | Dado / Quando / Então |
|---|---|---|
| T01 | unitário | Perfil VENDEDOR / pede `vendas:registrar` / permitido |
| T02 | unitário | Perfil VENDEDOR / pede `produtos:escrever` / negado |
| T03 | unitário | Cada perfil confere com a tabela da seção 5 (teste parametrizado) |
| T04 | unitário | AutenticarUsuario: credenciais corretas / retorna token e usuário sem senhaHash |
| T04b | unitário | AutenticarUsuario: e-mail com maiúsculas ou espaços nas pontas / encontra o usuário (RA01) |
| T05 | unitário | AutenticarUsuario: e-mail inexistente OU senha errada / mesmo erro CREDENCIAIS_INVALIDAS |
| T06 | unitário | AutenticarUsuario: usuário inativo / CREDENCIAIS_INVALIDAS |
| T07 | unitário | CriarUsuario: e-mail já existe (maiúsculas/minúsculas) / EMAIL_JA_CADASTRADO |
| T08 | unitário | CriarUsuario: salva e-mail em minúsculas e senha como hash |
| T09 | unitário | AtualizarUsuario: rebaixar ou desativar o último ADMIN ativo / ULTIMO_ADMIN |
| T09b | unitário | AtualizarUsuario: existe outro ADMIN ativo / rebaixar ou desativar é permitido |
| T09c | unitário | AtualizarUsuario: id inexistente / USUARIO_NAO_ENCONTRADO |
| T09d | unitário | AtualizarUsuario: alterar só o nome do único ADMIN / permitido |
| T10 | unitário | AlterarSenha: senha atual incorreta / SENHA_ATUAL_INCORRETA |
| T10b | unitário | AlterarSenha: senha atual correta / salva o hash da nova senha |
| T10c | unitário | AlterarSenha: usuário inexistente / USUARIO_NAO_ENCONTRADO |
| T11 | integração | POST /auth/login válido / 200 e token utilizável em GET /auth/me |
| T12 | integração | Rota protegida sem token / 401 |
| T13 | integração | VENDEDOR em POST /usuarios / 403 |
| T14 | integração | Usuário desativado com token ainda válido / 401 (decisão D3) |
| T15 | integração | Nenhuma resposta contém senhaHash |

## 10. Critérios de aceite
- T01 a T15 implementados e passando.
- Nenhum import de infra em domain/application.
- Todas as rotas da seção 6 documentadas e respondendo conforme o contrato.