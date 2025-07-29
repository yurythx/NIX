"""
Testes para o módulo theme_manager.
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Adiciona o diretório raiz ao PATH para importações
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Importa o módulo a ser testado
from utils.theme_manager import ThemeManager, theme_manager

# Dados de teste
TEST_THEME_DIR = Path(__file__).parent.parent.parent / 'ui' / 'styles'

@pytest.fixture
def mock_settings():
    """Mock para o módulo de configurações."""
    with patch('utils.theme_manager.settings') as mock:
        mock.get.return_value = 'dark'
        yield mock

@pytest.fixture
def theme_manager_instance(mock_settings):
    """Instância do ThemeManager para testes."""
    # Reseta o singleton para cada teste
    ThemeManager._instance = None
    return ThemeManager()

def test_theme_manager_singleton(theme_manager_instance):
    """Testa se o ThemeManager segue o padrão Singleton."""
    # Cria uma nova instância
    another_instance = ThemeManager()
    
    # Verifica se é a mesma instância
    assert theme_manager_instance is another_instance
    assert id(theme_manager_instance) == id(another_instance)

def test_load_theme_success(theme_manager_instance, tmp_path):
    """Testa o carregamento de um tema existente."""
    # Cria um arquivo de tema temporário
    theme_file = tmp_path / 'test_theme.qss'
    theme_file.write_text('QWidget { color: red; }')
    
    # Configura o tema de teste
    theme_manager_instance._styles_dir = tmp_path
    theme_manager_instance.THEMES = {
        'test': {'file': 'test_theme.qss', 'is_dark': True}
    }
    
    # Carrega o tema
    result = theme_manager_instance.load_theme('test')
    
    # Verifica o resultado
    assert result is True
    assert theme_manager_instance.current_theme == 'test'
    assert 'color: red' in theme_manager_instance._style_sheet

def test_load_theme_file_not_found(theme_manager_instance, tmp_path, caplog):
    """Testa o carregamento de um tema com arquivo inexistente."""
    # Configura o tema de teste com arquivo que não existe
    theme_manager_instance._styles_dir = tmp_path
    theme_manager_instance.THEMES = {
        'test': {'file': 'non_existent.qss', 'is_dark': True}
    }
    
    # Carrega o tema
    with patch.object(theme_manager_instance, 'load_theme') as mock_load_default:
        mock_load_default.return_value = True
        result = theme_manager_instance.load_theme('test')
    
    # Verifica se tentou carregar o tema padrão
    assert 'dark' in caplog.text.lower()

def test_apply_theme(theme_manager_instance, qtbot):
    """Testa a aplicação do tema a um aplicativo Qt."""
    from PyQt5.QtWidgets import QApplication
    
    # Configura o tema
    theme_manager_instance._style_sheet = 'QWidget { color: red; }'
    theme_manager_instance._current_theme = 'dark'
    
    # Cria um aplicativo de teste
    app = QApplication.instance() or QApplication(sys.argv)
    
    # Aplica o tema
    theme_manager_instance.apply_theme(app)
    
    # Verifica se o estilo foi aplicado
    assert 'color: red' in app.styleSheet()
    
    # Verifica se a paleta foi configurada para tema escuro
    palette = app.palette()
    assert palette.window().color().name() == '#1e1e1e'

def test_is_dark_theme_property(theme_manager_instance):
    """Testa a propriedade is_dark_theme."""
    # Testa com tema escuro
    theme_manager_instance._current_theme = 'dark'
    assert theme_manager_instance.is_dark_theme is True
    
    # Testa com tema claro
    theme_manager_instance._current_theme = 'light'
    assert theme_manager_instance.is_dark_theme is False
    
    # Testa com tema do sistema (mock da detecção do sistema)
    theme_manager_instance._current_theme = 'system'
    with patch.object(theme_manager_instance, '_is_system_dark_theme', return_value=True):
        assert theme_manager_instance.is_dark_theme is True
    
    with patch.object(theme_manager_instance, '_is_system_dark_theme', return_value=False):
        assert theme_manager_instance.is_dark_theme is False

@patch('platform.system')
def test_detect_system_theme_windows(mock_system, theme_manager_instance):
    """Testa a detecção de tema no Windows."""
    mock_system.return_value = 'Windows'
    
    # Testa com tema escuro
    with patch('winreg.OpenKey') as mock_open_key, \
         patch('winreg.QueryValueEx', return_value=(0, 1)) as mock_query_value:
        assert theme_manager_instance._is_system_dark_theme() is True
        mock_open_key.assert_called_once()
    
    # Testa com tema claro
    with patch('winreg.OpenKey') as mock_open_key, \
         patch('winreg.QueryValueEx', return_value=(1, 1)) as mock_query_value:
        assert theme_manager_instance._is_system_dark_theme() is False

@patch('platform.system')
def test_detect_system_theme_macos(mock_system, theme_manager_instance):
    """Testa a detecção de tema no macOS."""
    mock_system.return_value = 'Darwin'
    
    # Mock para o Foundation
    mock_nsuserdefaults = MagicMock()
    mock_nsuserdefaults.stringForKey_.return_value = 'Dark'
    
    with patch.dict('sys.modules', {'Foundation': MagicMock(NSUserDefaults=MagicMock(return_value=mock_nsuserdefaults))}):
        assert theme_manager_instance._is_system_dark_theme() is True
    
    mock_nsuserdefaults.stringForKey_.return_value = 'Light'
    with patch.dict('sys.modules', {'Foundation': MagicMock(NSUserDefaults=MagicMock(return_value=mock_nsuserdefaults))}):
        assert theme_manager_instance._is_system_dark_theme() is False

@patch('platform.system')
def test_detect_system_theme_linux(mock_system, theme_manager_instance):
    """Testa a detecção de tema no Linux."""
    mock_system.return_value = 'Linux'
    
    # Testa com tema GNOME
    with patch('subprocess.run') as mock_run:
        mock_run.return_value.returncode = 0
        mock_run.return_value.stdout = "'Adwaita-dark'"
        assert theme_manager_instance._is_system_dark_theme() is True
    
    # Testa com tema claro
    with patch('subprocess.run') as mock_run:
        mock_run.return_value.returncode = 0
        mock_run.return_value.stdout = "'Adwaita-light'"
        assert theme_manager_instance._is_system_dark_theme() is False
    
    # Testa com falha no subprocesso (cai para o padrão)
    with patch('subprocess.run', side_effect=FileNotFoundError):
        assert theme_manager_instance._is_system_dark_theme() is False

def test_theme_change_notification(theme_manager_instance, mock_settings):
    """Testa a notificação de mudança de tema."""
    # Função de callback mock
    callback = MagicMock()
    theme_manager_instance.add_observer(callback)
    
    # Simula mudança de configuração
    mock_settings.get.return_value = 'light'
    theme_manager_instance._on_setting_changed('ui.theme', 'light')
    
    # Verifica se o callback foi chamado
    assert theme_manager_instance.current_theme == 'light'
    callback.assert_called_once_with('ui.theme', 'light')
