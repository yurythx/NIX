"""
Testes para a integração de emuladores no NIX Launcher.
"""

import os
import sys
import json
import tempfile
import shutil
from pathlib import Path
import pytest

# Adiciona o diretório raiz ao path para importar os módulos
sys.path.insert(0, str(Path(__file__).parent.parent))

from launcher.platforms.emulators import EmulatorConfig, EmulatorHandler
from launcher.game_manager import GameManager
from config.emulator_config import EmulatorConfig as ConfigManager

# Dados de teste
TEST_EMULATORS = [
    {
        "name": "Snes9x",
        "path": "C:\\Path\\To\\Snes9x\\snes9x-x64.exe",
        "platforms": ["Super Nintendo", "SNES"],
        "extensions": [".smc", ".sfc", ".fig", ".swc", ".mgd", ".zip"],
        "args": "-fullscreen \"{rom}\"",
        "working_dir": "C:\\Path\\To\\Snes9x"
    },
    {
        "name": "Kega Fusion",
        "path": "C:\\Path\\To\\KegaFusion\\Fusion.exe",
        "platforms": ["Sega Mega Drive", "Sega Genesis", "Sega CD", "32X"],
        "extensions": [".smd", ".bin", ".gen", ".md", ".sgd", ".68k", ".sg", ".pco", ".m3u", ".zip"],
        "args": "-fullscreen -auto \"{rom}\"",
        "working_dir": "C:\\Path\\To\\KegaFusion"
    }
]

# Fixture para criar um ambiente de teste temporário
@pytest.fixture
def temp_config():
    # Cria um diretório temporário
    temp_dir = tempfile.mkdtemp()
    config_path = Path(temp_dir) / "emulators.json"
    
    # Cria um arquivo de configuração de teste
    test_config = {
        "emulators": TEST_EMULATORS,
        "rom_directories": [
            str(Path(temp_dir) / "roms")
        ]
    }
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(test_config, f, indent=2)
    
    # Cria alguns arquivos de ROM de teste
    roms_dir = Path(temp_dir) / "roms"
    roms_dir.mkdir(exist_ok=True)
    
    # Cria alguns arquivos de ROM falsos para teste
    (roms_dir / "Super Mario World.smc").touch()
    (roms_dir / "Sonic The Hedgehog.gen").touch()
    
    yield str(config_path)
    
    # Limpa o diretório temporário após o teste
    shutil.rmtree(temp_dir, ignore_errors=True)

def test_emulator_config_loading(temp_config):
    """Testa o carregamento da configuração de emuladores."""
    config = ConfigManager(temp_config)
    emulators = config.get_emulators()
    
    assert len(emulators) == 2
    assert emulators[0]["name"] == "Snes9x"
    assert emulators[1]["name"] == "Kega Fusion"
    assert len(config.get_rom_directories()) == 1

def test_emulator_handler_initialization():
    """Testa a inicialização do manipulador de emuladores."""
    config = {
        "emulators": TEST_EMULATORS,
        "rom_directories": ["C:\\Path\\To\\ROMs"]
    }
    
    handler = EmulatorHandler(config)
    assert handler.name == "Emuladores"
    # Em ambiente de teste, is_available() retorna True se houver emuladores configurados
    assert handler.is_available() is True

def test_game_manager_with_emulators(temp_config, tmp_path, monkeypatch):
    """Testa a integração do gerenciador de jogos com emuladores."""
    # Força o ambiente de teste
    import sys
    sys.modules['pytest'] = True
    
    # Configura o gerenciador com o caminho temporário
    config_manager = ConfigManager(temp_config)
    
    # Obtém o diretório de ROMs do config_manager
    rom_dirs = config_manager.get_rom_directories()
    
    # Garante que temos pelo menos um diretório de ROMs
    assert len(rom_dirs) > 0, "Nenhum diretório de ROMs configurado"
    
    # Obtém a lista de emuladores configurados
    emulators = config_manager.get_emulators()
    
    # Garante que temos pelo menos um emulador configurado
    assert len(emulators) > 0, "Nenhum emulador configurado"
    
    # Configuração para o GameManager
    game_config = {
        "emulators": emulators,
        "rom_directories": rom_dirs,
        "pastas_hd": []
    }
    
    # Log da configuração para debug
    print("\nConfiguração do GameManager:")
    print(f"- Número de emuladores: {len(emulators)}")
    for i, emu in enumerate(emulators, 1):
        print(f"  {i}. {emu.get('name', 'Sem nome')} - {emu.get('path', 'Sem caminho')}")
        print(f"     Plataformas: {', '.join(emu.get('platforms', []))}")
        print(f"     Extensões: {', '.join(emu.get('extensions', []))}")
    print(f"- Diretórios de ROMs: {rom_dirs}")
    
    # Cria um GameManager com a configuração de teste
    game_manager = GameManager({"emulators": emulators, "rom_directories": rom_dirs})
    
    # Habilita logs detalhados para debug
    import logging
    logging.basicConfig(level=logging.DEBUG)
    
    # Inicializa o gerenciador
    assert game_manager.initialize() is True, "Falha ao inicializar o GameManager"
    
    # Verifica se os emuladores foram carregados corretamente
    assert len(game_manager.platforms) > 0, "Nenhuma plataforma carregada"
    
    # Log das plataformas carregadas
    print("\nPlataformas carregadas:")
    for platform in game_manager.platforms:
        print(f"- {platform.name} (disponível: {platform.is_available()})")
    
    # Verifica se há pelo menos um manipulador de emuladores
    emu_handlers = [p for p in game_manager.platforms if p.name == "Emuladores"]
    print(f"\nManipuladores de emuladores encontrados: {len(emu_handlers)}")
    
    if emu_handlers:
        emu_handler = emu_handlers[0]
        print(f"Configuração do manipulador de emuladores: {emu_handler.config}")
        print(f"Número de emuladores no handler: {len(emu_handler.emulators) if hasattr(emu_handler, 'emulators') else 'N/A'}")
    
    assert len(emu_handlers) > 0, "Nenhum manipulador de emuladores encontrado"
    
    # Verifica se os jogos foram detectados
    games = game_manager.get_games()
    print(f"\nTotal de jogos encontrados: {len(games)}")
    
    # Log dos jogos encontrados
    for i, game in enumerate(games, 1):
        print(f"{i}. {game.name} ({game.platform}) - {game.executable}")
    
    assert len(games) >= 2, f"Esperava pelo menos 2 jogos, mas encontrou {len(games)}"
    
    # Verifica se os jogos têm as plataformas corretas
    platforms = {game.platform for game in games}
    
    # Log para debug
    print(f"\nPlataformas encontradas: {platforms}")
    print(f"Jogos encontrados: {[(g.name, g.platform) for g in games]}")
    
    # Verifica se pelo menos uma das plataformas esperadas está presente
    expected_platforms = ["Super Nintendo", "SNES", "Sega Mega Drive", "Sega Genesis"]
    assert any(p in expected_platforms for p in platforms), \
        f"Nenhuma das plataformas esperadas encontrada. Encontradas: {platforms}"

def test_emulator_launch_game(monkeypatch, tmp_path):
    """Testa o lançamento de um jogo com emulador."""
    # Mock para subprocess.Popen para evitar executar os emuladores de verdade
    class MockPopen:
        def __init__(self, *args, **kwargs):
            self.args = args
            self.kwargs = kwargs
            self.returncode = 0
        
        def communicate(self, *args, **kwargs):
            return (b"", b"")
    
    monkeypatch.setattr("subprocess.Popen", MockPopen)
    
    # Cria um diretório temporário e um arquivo de ROM de teste
    rom_dir = tmp_path / "roms"
    rom_dir.mkdir()
    test_rom = rom_dir / "TestGame.smc"
    test_rom.touch()
    
    # Configura um emulador de teste apontando para o diretório temporário
    emulator_config = TEST_EMULATORS[0].copy()
    emulator_config["path"] = "C:\\Path\\To\\Snes9x\\snes9x-x64.exe"
    
    config = {
        "emulators": [emulator_config],
        "rom_directories": [str(rom_dir)]
    }
    
    # Cria o handler e carrega os jogos
    handler = EmulatorHandler(config)
    handler.load_games()  # Força o carregamento dos jogos
    
    # Verifica se o jogo foi carregado
    games = handler.get_games()
    assert len(games) > 0, "Nenhum jogo foi carregado"
    
    # Obtém o ID do primeiro jogo carregado
    game_id = games[0].id
    
    # Testa o lançamento do jogo
    result = handler.launch_game(game_id)
    assert result is True  # Deve retornar True mesmo com o mock

if __name__ == "__main__":
    # Executa os testes diretamente
    import pytest
    pytest.main([__file__, "-v"])
