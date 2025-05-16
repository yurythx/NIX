# Guia de Autenticação da API Viixen

Este documento descreve como autenticar-se na API Viixen usando JWT (JSON Web Token).

## Endpoints de Autenticação

A API Viixen utiliza o Djoser e o Simple JWT para autenticação. Aqui estão os principais endpoints:

### Registro de Usuário

```
POST /api/v1/auth/users/
```

**Corpo da requisição:**
```json
{
  "email": "usuario@exemplo.com",
  "username": "usuario",
  "password": "SenhaSegura123!@#",
  "re_password": "SenhaSegura123!@#"
}
```

**Importante:**
- A senha deve ser complexa e não pode ser similar ao nome de usuário ou email
- Deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais

**Resposta (201 Created):**
```json
{
  "email": "usuario@exemplo.com",
  "username": "usuario",
  "id": 1
}
```

### Obter Token JWT

```
POST /api/v1/auth/jwt/create/
```

**Corpo da requisição:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha_segura"
}
```

**Nota importante:** O sistema está configurado para usar o email como campo de login, não o username.

**Resposta (200 OK):**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Atualizar Token JWT

```
POST /api/v1/auth/jwt/refresh/
```

**Corpo da requisição:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Resposta (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Verificar Token JWT

```
POST /api/v1/auth/jwt/verify/
```

**Corpo da requisição:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Resposta (200 OK):**
```json
{}
```

### Obter Usuário Atual

```
GET /api/v1/auth/users/me/
```

**Cabeçalhos:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Resposta (200 OK):**
```json
{
  "email": "usuario@exemplo.com",
  "username": "usuario",
  "id": 1
}
```

## Como Usar o Token JWT

Após obter o token JWT, você deve incluí-lo no cabeçalho de todas as requisições que exigem autenticação:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Exemplo de Fluxo de Autenticação

1. Registre um novo usuário usando o endpoint `/api/v1/auth/users/`
2. Obtenha um token JWT usando o endpoint `/api/v1/auth/jwt/create/`
3. Use o token de acesso no cabeçalho `Authorization` para acessar endpoints protegidos
4. Quando o token de acesso expirar, use o token de atualização para obter um novo token de acesso

## Notas Importantes

- O token de acesso expira após 24 horas (configurável)
- O token de atualização expira após 7 dias (configurável)
- Mantenha seus tokens seguros e não os compartilhe
- Use HTTPS em produção para proteger suas credenciais e tokens

## Solução de Problemas

### Erro 401 Unauthorized

Se você receber um erro 401, verifique:
- Se o token JWT está correto e não expirou
- Se o formato do cabeçalho de autorização está correto (`Bearer {token}`)
- Se o usuário tem permissão para acessar o recurso

### Erro 400 Bad Request

Se você receber um erro 400 ao tentar obter um token:
- Verifique se as credenciais (username/password) estão corretas
- Verifique se o formato do corpo da requisição está correto

### Erro 403 Forbidden

Se você receber um erro 403:
- O usuário está autenticado, mas não tem permissão para acessar o recurso
- Verifique as permissões do usuário
