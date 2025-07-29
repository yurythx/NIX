# 🎮 NIX Launcher

[![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

Um launcher de jogos moderno e personalizável, desenvolvido em Python com interface PyQt5, que permite organizar e iniciar jogos de múltiplas plataformas, incluindo Steam e jogos locais.

![Screenshot do NIX Launcher](screenshot.png)

## 📋 Visão Geral

O NIX Launcher é uma aplicação desktop que facilita o gerenciamento e inicialização de jogos de várias plataformas em um único local. Com uma interface intuitiva e suporte a teclado/gamepad, oferece uma experiência de usuário fluida e personalizável.

### 🎥 Demonstração em Vídeo

[![Assistir demonstração](https://img.youtube.com/vi/SEU_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=SEU_VIDEO_ID)

*Clique na imagem acima para assistir a uma demonstração do NIX Launcher em ação*

## ✨ Recursos Principais

### 🎮 Suporte a Múltiplas Plataformas
- Jogos Steam
- Jogos de outras plataformas (Epic, GOG, etc.)
- Executáveis locais
- Emuladores e ROMs

### 🖥️ Interface de Usuário
- Design moderno e responsivo
- Suporte a temas claro/escuro
- Navegação por teclado e gamepad
- Busca em tempo real
- Carregamento otimizado com cache de imagens
- Suporte a múltiplos monitores
- Atalhos personalizáveis

### ⚙️ Personalização
- Temas personalizáveis
- Layouts de grade personalizáveis
- Capas de jogos personalizáveis
- Categorias e tags personalizadas
- Metadados editáveis

### 🚀 Desempenho
- Carregamento otimizado
- Gerenciamento de memória eficiente
- Inicialização rápida
- Atualizações em segundo plano

## 📦 Requisitos

- Python 3.8 ou superior
- PyQt5
- Bibliotecas listadas em `requirements.txt`

## 🚀 Começando

### 📋 Pré-requisitos

- Python 3.8 ou superior
- Pip (gerenciador de pacotes Python)
- Git (para clonar o repositório)
- Bibliotecas listadas em `requirements.txt`

### 🛠️ Instalação Rápida

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/nix-launcher.git
   cd nix-launcher
   ```

2. **Execute o script de inicialização** (recomendado):
   ```bash
   # Windows
   python bootstrap.py
   
   # Linux/MacOS
   python3 bootstrap.py
   ```
   
   O script irá:
   - Verificar e instalar automaticamente todas as dependências necessárias
   - Configurar o ambiente de execução
   - Iniciar o NIX Launcher

### 🔧 Instalação Manual (Avançado)

1. **Configure o ambiente virtual** (recomendado):
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # Linux/MacOS
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Instale as dependências**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Inicie o aplicativo**:
   ```bash
   python main.py
   ```
   
   Ou para modo de depuração:
   ```bash
   python main.py --debug
   ```

### ⚙️ Configuração

O NIX Launcher agora possui um sistema de configuração centralizado. As configurações são salvas automaticamente em:
- **Windows**: `%USERPROFILE%\.nix_launcher\settings.json`
- **Linux/MacOS**: `~/.nix_launcher/settings.json`

Você pode redefinir as configurações para os padrões executando:
```bash
python main.py --reset-config
```

### 🎮 Configuração de Gamepads

O suporte a gamepads é fornecido pela biblioteca `inputs`. Para instalar manualmente:
```bash
pip install inputs
```

No Linux, você pode precisar de permissões adicionais para acessar os dispositivos de entrada. Adicione seu usuário ao grupo `input`:
```bash
sudo usermod -a -G input $USER
```
     ],
     "steam_path": "C:\\Program Files (x86)\\Steam",
     "theme": "dark",
     "language": "pt_BR",
     "game_directories": [
       "C:\\Program Files (x86)\\Steam\\steamapps\\common",
       "D:\\Jogos"
     ],
     "emulators": [
       {
         "name": "Dolphin",
         "path": "C:\\Program Files\\Dolphin\\Dolphin.exe",
         "platforms": ["GameCube", "Wii"]
       }
     ]
     }
     ```

## 🚀 Como Usar

Execute o launcher com:
```bash
python main.py
```

### 🎮 Controles

**Teclado:**
- `Setas` ou `WASD`: Navegar entre os jogos
- `Enter` ou `Espaço`: Iniciar jogo selecionado
- `ESC` ou `Backspace`: Voltar/Sair
- `Tab`: Alternar entre abas
- `F11`: Alternar tela cheia

**Gamepad:**
- `D-Pad` ou `Joystick Esquerdo`: Navegar
- `A`: Selecionar
- `B`: Voltar
- `X`: Adicionar aos favoritos
- `Y`: Mostrar detalhes
- `Start`: Abrir menu
- `Select`: Alternar visualização

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
nix-launcher/
├── launcher/           # Lógica principal do launcher
│   ├── game_finder.py  # Localização de jogos
│   ├── game_launcher.py # Inicialização de jogos
│   └── input_handler.py # Gerenciamento de entradas
├── ui/                 # Interface do usuário
│   ├── main_window.py  # Janela principal
│   ├── games_view.py   # Visualização de jogos
│   └── game_card.py    # Card de jogo individual
├── assets/             # Recursos (imagens, ícones)
├── config.json         # Configurações do usuário
└── main.py             # Ponto de entrada
```

### Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o push da branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Aos desenvolvedores do PyQt5
- À comunidade Python
- Aos testadores e contribuidores
