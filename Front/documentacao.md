# Documentação do Projeto Viixen

## 1. Estrutura de Arquivos
```
front/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── components/
│   │   │   │   ├── ClientLayout.tsx    # Layout principal da aplicação
│   │   │   │   ├── Navbar.tsx          # Barra de navegação superior
│   │   │   │   ├── Sidebar.tsx         # Menu lateral
│   │   │   │   ├── SidebarProvider.tsx # Gerenciamento de estado da sidebar
│   │   │   │   └── SubMenu.tsx         # Submenus expansíveis
│   │   │   └── styles/
│   │   │       └── globals.css         # Estilos globais
│   │   ├── layout.tsx                  # Layout raiz do Next.js
│   │   └── page.tsx                    # Página inicial
```

## 2. Componentes Principais

### 2.1 ClientLayout (`ClientLayout.tsx`)
```typescript
// Componente principal que estrutura toda a aplicação
function LayoutContent({ children }: ClientLayoutProps) {
  const { isCollapsed } = useSidebar();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar /> {/* Menu lateral */}
      <div className="flex-1 flex flex-col">
        <Navbar /> {/* Barra superior */}
        <main>{children}</main> {/* Conteúdo principal */}
        <footer /> {/* Rodapé */}
      </div>
    </div>
  );
}
```
**Funções:**
- Gerencia o layout geral da aplicação
- Controla a autenticação do usuário
- Organiza os componentes em uma estrutura flexível
- Responsável pelo tema claro/escuro

### 2.2 Navbar (`Navbar.tsx`)
```typescript
export default function Navbar({ isAuthenticated, onToggleAuth }: NavbarProps) {
  const [darkMode, setDarkMode] = useState(true);
  const { isCollapsed } = useSidebar();

  // Funções de controle de tema
  const toggleTheme = () => {
    // Lógica de alternância entre temas
  };

  return (
    <header className="...">
      {/* Título e botões de ação */}
    </header>
  );
}
```
**Funções:**
- Exibe o título da aplicação
- Controla o tema claro/escuro
- Gerencia autenticação do usuário
- Se adapta ao estado da sidebar

### 2.3 Sidebar (`Sidebar.tsx`)
```typescript
export default function Sidebar({ isAuthenticated, user }: SidebarProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside className="...">
      {/* Perfil do usuário */}
      {/* Menu de navegação */}
      {/* Botão de toggle */}
    </aside>
  );
}
```
**Funções:**
- Exibe o menu de navegação
- Mostra informações do usuário
- Controla expansão/recolhimento
- Gerencia submenus

### 2.4 SidebarProvider (`SidebarProvider.tsx`)
```typescript
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}
```
**Funções:**
- Gerencia o estado da sidebar
- Fornece contexto para outros componentes
- Controla expansão/recolhimento

## 3. Integração com API DRF

### 3.1 Autenticação
```typescript
// Exemplo de integração com autenticação
const [isAuthenticated, setIsAuthenticated] = useState(false);

const handleAuth = async () => {
  try {
    const response = await fetch('api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'user',
        password: 'pass'
      })
    });
    const data = await response.json();
    setIsAuthenticated(true);
    // Armazenar token
  } catch (error) {
    console.error('Erro na autenticação:', error);
  }
};
```

### 3.2 Gerenciamento de Estado
```typescript
// Exemplo de gerenciamento de estado com API
const [articles, setArticles] = useState([]);

const fetchArticles = async () => {
  try {
    const response = await fetch('api/articles/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setArticles(data);
  } catch (error) {
    console.error('Erro ao buscar artigos:', error);
  }
};
```

## 4. Estilos e Temas

### 4.1 Tema Claro
```css
/* globals.css */
:root {
  --background: 270 50% 98%;
  --foreground: 270 50% 4.9%;
}

body {
  @apply bg-purple-50 text-gray-900;
}
```

### 4.2 Tema Escuro
```css
/* globals.css */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}

.dark body {
  @apply bg-gray-900 text-gray-100;
}
```

## 5. Próximos Passos para Integração

1. **Configuração da API**
   - Criar endpoints para autenticação
   - Implementar CRUD para artigos
   - Configurar CORS

2. **Autenticação**
   - Implementar login/logout
   - Gerenciar tokens JWT
   - Proteger rotas

3. **Gerenciamento de Estado**
   - Implementar React Query ou SWR
   - Criar hooks personalizados
   - Gerenciar cache

4. **Formulários**
   - Implementar validação
   - Integrar com API
   - Gerenciar uploads

5. **Tratamento de Erros**
   - Implementar feedback visual
   - Gerenciar estados de erro
   - Criar fallbacks

## 6. Dicas para Integração

1. **Autenticação**
   - Use interceptors para adicionar tokens
   - Implemente refresh token
   - Gerencie sessões

2. **Performance**
   - Implemente paginação
   - Use cache quando possível
   - Otimize requisições

3. **UX**
   - Adicione loading states
   - Implemente feedback visual
   - Gerencie estados de erro

4. **Segurança**
   - Valide dados
   - Sanitize inputs
   - Proteja rotas

## 7. Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar em produção
npm start
```

## 8. Dependências Principais

- Next.js 14
- React 18
- Tailwind CSS
- Lucide React (ícones)
- TypeScript

## 9. Estrutura de Rotas

- `/` - Página inicial (artigos)
- `/artigos` - Lista de artigos
- `/artigos/[id]` - Detalhes do artigo
- `/mangas` - Lista de mangás
- `/mangas/[id]` - Detalhes do mangá

## 10. Convenções de Código

1. **Nomenclatura**
   - Componentes: PascalCase
   - Funções: camelCase
   - Arquivos: PascalCase para componentes, camelCase para outros

2. **Organização**
   - Um componente por arquivo
   - Estilos próximos aos componentes
   - Hooks personalizados em pasta separada

3. **Tipagem**
   - Usar TypeScript para todos os componentes
   - Definir interfaces para props
   - Evitar `any`

## 11. Troubleshooting

1. **Problemas Comuns**
   - Erro de CORS: Verificar configuração do backend
   - Problemas de autenticação: Verificar tokens
   - Erros de build: Limpar cache e node_modules

2. **Soluções**
   - Limpar cache: `npm run clean`
   - Reinstalar dependências: `rm -rf node_modules && npm install`
   - Verificar logs: `npm run dev --verbose`

## 12. Contribuição

1. **Processo**
   - Criar branch para feature
   - Seguir convenções de código
   - Testar localmente
   - Criar PR

2. **Padrões**
   - Commits semânticos
   - Documentação atualizada
   - Testes quando aplicável

## 13. Suporte

Para suporte ou dúvidas:
- Abrir issue no repositório
- Consultar documentação
- Verificar exemplos de código

---

Esta documentação será atualizada conforme o projeto evolui. Mantenha-a sempre atualizada para facilitar o desenvolvimento e manutenção. 