# NIX - Sistema de Gerenciamento de Projetos

Sistema de gerenciamento de projetos desenvolvido com Django e Django REST Framework.

## Requisitos

- Python 3.11 ou superior
- PostgreSQL
- Redis (para Celery)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/NIX.git
cd NIX
```

2. Crie um ambiente virtual e ative-o:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
DEBUG=True
SECRET_KEY=sua-chave-secreta
DATABASE_URL=postgres://usuario:senha@localhost:5432/nix
REDIS_URL=redis://localhost:6379/0
```

5. Execute as migrações:
```bash
python manage.py migrate
```

6. Crie um superusuário:
```bash
python manage.py createsuperuser
```

7. Inicie o servidor de desenvolvimento:
```bash
python manage.py runserver
```

## Estrutura do Projeto

```
NIX/
├── apps/
│   ├── projects/      # Aplicação principal de projetos
│   ├── users/         # Gerenciamento de usuários
│   └── core/          # Funcionalidades core do sistema
├── config/            # Configurações do projeto
├── static/            # Arquivos estáticos
└── templates/         # Templates HTML
```

## Funcionalidades

- Gerenciamento de projetos
- Quadros de tarefas (Kanban)
- Comentários e anexos
- Sistema de permissões
- API RESTful
- Documentação Swagger/ReDoc

## Desenvolvimento

Para contribuir com o projeto:

1. Crie uma branch para sua feature:
```bash
git checkout -b feature/nova-feature
```

2. Faça commit das suas alterações:
```bash
git commit -m "Adiciona nova feature"
```

3. Envie para o repositório:
```bash
git push origin feature/nova-feature
```

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.