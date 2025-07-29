"""Configuração global para testes do NIX Launcher.

Este arquivo contém fixtures e configurações que são compartilhadas entre diferentes
módulos de teste. O pytest carrega automaticamente este arquivo quando os testes são
iniciados.
"""

import pytest
from typing import Generator, Any, Dict
from unittest.mock import MagicMock, patch

# Adiciona a raiz do projeto ao path do Python para importações
import sys
from pathlib import Path

# Obtém o diretório raiz do projeto (onde está o pyproject.toml)
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Configuração do logging durante os testes
import logging
logging.basicConfig(level=logging.WARNING)  # Reduz o nível de log durante os testes

# Fixtures globais podem ser definidas aqui

@pytest.fixture(autouse=True)
def no_sleep(monkeypatch: pytest.MonkeyPatch) -> None:
    """Substitui time.sleep para acelerar os testes."""
    def sleep_mock(seconds: float) -> None:
        pass
    
    monkeypatch.setattr('time.sleep', sleep_mock)

@pytest.fixture
def mock_qt_app() -> Generator[MagicMock, None, None]:
    """Fornece um mock para QApplication para testes que envolvem Qt."""
    with patch('PyQt5.QtWidgets.QApplication', autospec=True) as mock:
        yield mock

@pytest.fixture
def mock_threading() -> Generator[Dict[str, MagicMock], None, None]:
    """Fornece mocks para funções do módulo threading."""
    with patch('threading.Thread') as mock_thread_class, \
         patch('threading.Lock') as mock_lock_class, \
         patch('threading.Event') as mock_event_class:
        
        # Configura o mock para a classe Thread
        mock_thread = MagicMock()
        mock_thread_class.return_value = mock_thread
        
        # Configura o mock para a classe Lock
        mock_lock = MagicMock()
        mock_lock_class.return_value = mock_lock
        
        # Configura o mock para a classe Event
        mock_event = MagicMock()
        mock_event_class.return_value = mock_event
        
        yield {
            'Thread': mock_thread_class,
            'Lock': mock_lock_class,
            'Event': mock_event_class,
            'thread_instance': mock_thread,
            'lock_instance': mock_lock,
            'event_instance': mock_event
        }

# Adiciona opções de linha de comando para o pytest
def pytest_addoption(parser: Any) -> None:
    """Adiciona opções de linha de comando personalizadas para o pytest."""
    parser.addoption(
        "--run-slow", 
        action="store_true", 
        default=False, 
        help="executa testes lentos"
    )

def pytest_configure(config: Any) -> None:
    """Configura o pytest."""
    config.addinivalue_line("markers", "slow: marca o teste como lento")

def pytest_collection_modifyitems(config: Any, items: Any) -> None:
    """Modifica a coleção de testes com base nas opções de linha de comando."""
    if config.getoption("--run-slow"):
        # --run-slow fornecido: não pular testes lentos
        return
    
    skip_slow = pytest.mark.skip(reason="necessário --run-slow para executar")
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(skip_slow)
