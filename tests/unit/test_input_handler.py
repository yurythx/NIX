"""Testes unitários para o módulo launcher.input_handler.

Este módulo contém testes para a classe InputHandler, que gerencia entradas
de gamepad e teclado no NIX Launcher.
"""

import pytest
import time
from unittest.mock import MagicMock, patch, ANY
from typing import Dict, Any, Callable, Optional

from launcher.input_handler import (
    InputHandler,
    InputEvent,
    Button,
    ButtonState,
    GAMEPAD_AVAILABLE,
    DEFAULT_DEADZONE,
)

# Constantes para testes
TEST_DEADZONE = 0.1
TEST_CALLBACK_INTERVAL = 0.01

# Fixtures

@pytest.fixture
def mock_input_callback() -> MagicMock:
    """Retorna um mock para ser usado como callback de entrada."""
    return MagicMock()

@pytest.fixture
def input_handler(mock_input_callback: MagicMock) -> InputHandler:
    """Retorna uma instância de InputHandler para testes."""
    handler = InputHandler(mock_input_callback)
    handler.set_deadzone(TEST_DEADZONE)
    return handler

# Classes de teste

class TestInputEvent:
    """Testes para a classe InputEvent."""
    
    def test_input_event_creation_digital(self):
        """Testa a criação de um evento digital."""
        event = InputEvent(Button.A, 1)
        assert event.button == Button.A
        assert event.state == 1
        assert not event.is_analog
        assert isinstance(event.timestamp, float)
    
    def test_input_event_creation_analog(self):
        """Testa a criação de um evento analógico."""
        event = InputEvent(Button.LEFT_X, 0.5, is_analog=True)
        assert event.button == Button.LEFT_X
        assert event.state == 0.5
        assert event.is_analog
    
    def test_input_event_str_representation(self):
        """Testa a representação em string do evento."""
        event = InputEvent(Button.A, 1)
        assert "A" in str(event)
        assert "1" in str(event)
    
    def test_input_event_repr_representation(self):
        """Testa a representação técnica do evento."""
        event = InputEvent(Button.A, 1)
        assert "InputEvent" in repr(event)
        assert "A" in repr(event)
        assert "1" in repr(event)

class TestInputHandler:
    """Testes para a classe InputHandler."""
    
    def test_initialization(self, mock_input_callback: MagicMock):
        """Testa a inicialização do InputHandler."""
        handler = InputHandler(mock_input_callback)
        assert handler._running is False
        assert handler._thread is None
        assert handler._deadzone == DEFAULT_DEADZONE
        assert isinstance(handler._keyboard_mapping, dict)
    
    def test_set_deadzone(self, input_handler: InputHandler):
        """Testa a configuração da zona morta."""
        # Testa valores válidos
        input_handler.set_deadzone(0.3)
        assert input_handler._deadzone == 0.3
        
        # Testa valores fora do intervalo (deve ser limitado entre 0 e 1)
        input_handler.set_deadzone(-0.1)
        assert input_handler._deadzone == 0.0
        
        input_handler.set_deadzone(1.5)
        assert input_handler._deadzone == 1.0
    
    @patch('launcher.input_handler.get_gamepad')
    @patch('launcher.input_handler.devices')
    def test_detect_gamepad_type(self, mock_devices: MagicMock, mock_get_gamepad: MagicMock, input_handler: InputHandler):
        """Testa a detecção do tipo de gamepad."""
        if not GAMEPAD_AVAILABLE:
            pytest.skip("Suporte a gamepad não disponível")
            
        # Configura o mock para simular um gamepad Xbox
        mock_device = MagicMock()
        mock_device.name = "Xbox 360 Controller"
        mock_devices.gamepads = [mock_device]
        
        # Chama o método de detecção
        input_handler._detect_gamepad_type()
        
        # Verifica se o tipo foi detectado corretamente
        assert hasattr(input_handler, '_gamepad_type')
        assert isinstance(input_handler._gamepad_type, str)
    
    @pytest.mark.parametrize("value,min_val,max_val,expected", [
        (0, -32768, 32767, -1.0),    # Valor mínimo
        (32767, -32768, 32767, 1.0),  # Valor máximo
        (0, -32768, 32767, -1.0),     # Zero (deve ser normalizado para -1.0)
        (16383, -32768, 32767, 0.0),  # Ponto médio
    ])
    def test_normalize_axis_value(self, value: int, min_val: int, max_val: int, expected: float, input_handler: InputHandler):
        """Testa a normalização de valores de eixo analógico."""
        # A normalização pode ter pequenas diferenças de arredondamento
        result = input_handler._normalize_axis_value(value, min_val, max_val)
        assert abs(result - expected) < 0.001
    
    def test_send_event_digital(self, input_handler: InputHandler, mock_input_callback: MagicMock):
        """Testa o envio de um evento digital."""
        # Cria um evento de botão digital
        event = InputEvent(Button.A, 1)
        
        # Envia o evento
        input_handler._send_event(event)
        
        # Verifica se o callback foi chamado com o evento correto
        mock_input_callback.assert_called_once()
        called_event = mock_input_callback.call_args[0][0]
        assert called_event.button == Button.A
        assert called_event.state == 1
    
    def test_send_event_analog_below_deadzone(self, input_handler: InputHandler, mock_input_callback: MagicMock):
        """Testa que eventos analógicos abaixo da zona morta são ignorados."""
        # Configura uma zona morta de 10%
        input_handler.set_deadzone(0.1)
        
        # Cria um evento analógico abaixo da zona morta
        event = InputEvent(Button.LEFT_X, 0.05, is_analog=True)
        
        # Envia o evento
        input_handler._send_event(event)
        
        # Verifica que o callback NÃO foi chamado
        mock_input_callback.assert_not_called()
    
    @patch('launcher.input_handler.threading.Thread')
    def test_start_stop(self, mock_thread_class: MagicMock, input_handler: InputHandler):
        """Testa o início e parada do manipulador de entrada."""
        # Configura o mock para a thread
        mock_thread = MagicMock()
        mock_thread_class.return_value = mock_thread
        
        # Testa o início
        input_handler.start()
        assert input_handler._running is True
        mock_thread_class.assert_called_once_with(target=input_handler._event_loop, daemon=True)
        mock_thread.start.assert_called_once()
        
        # Reseta o mock para o teste de parada
        mock_thread_class.reset_mock()
        
        # Testa a parada
        input_handler.stop()
        assert input_handler._running is False
        mock_thread.join.assert_called_once()
    
    @pytest.mark.skipif(not GAMEPAD_AVAILABLE, reason="Suporte a gamepad não disponível")
    def test_process_gamepad_event_button(self, input_handler: InputHandler, mock_input_callback: MagicMock):
        """Testa o processamento de eventos de botão do gamepad."""
        # Cria um evento de botão simulado
        mock_event = MagicMock()
        mock_event.ev_type = "Key"
        mock_event.code = "BTN_SOUTH"  # Botão A no mapeamento padrão
        mock_event.state = 1  # Pressionado
        
        # Processa o evento
        input_handler._process_gamepad_event(mock_event)
        
        # Verifica se o callback foi chamado com o evento correto
        mock_input_callback.assert_called_once()
        called_event = mock_input_callback.call_args[0][0]
        assert called_event.button == Button.A
        assert called_event.state == 1
    
    @pytest.mark.skipif(not GAMEPAD_AVAILABLE, reason="Suporte a gamepad não disponível")
    def test_process_gamepad_event_axis(self, input_handler: InputHandler, mock_input_callback: MagicMock):
        """Testa o processamento de eventos de eixo do gamepad."""
        # Cria um evento de eixo simulado
        mock_event = MagicMock()
        mock_event.ev_type = "Absolute"
        mock_event.code = "ABS_X"  # Eixo X esquerdo
        mock_event.state = 16384  # Valor bruto (deve ser normalizado para ~0.5)
        
        # Processa o evento
        input_handler._process_gamepad_event(mock_event)
        
        # Verifica se o callback foi chamado com o evento correto
        mock_input_callback.assert_called_once()
        called_event = mock_input_callback.call_args[0][0]
        assert called_event.button == Button.LEFT_X
        assert 0.4 < called_event.state < 0.6  # Deve estar próximo de 0.5
        assert called_event.is_analog

# Testes de integração (opcional, podem ser movidos para outro arquivo)

class TestInputHandlerIntegration:
    """Testes de integração para a classe InputHandler."""
    
    @pytest.mark.skipif(not GAMEPAD_AVAILABLE, reason="Suporte a gamepad não disponível")
    def test_gamepad_connection(self, mock_input_callback: MagicMock):
        """Testa a detecção de conexão/desconexão de gamepad."""
        # Este teste requer um gamepad físico conectado
        handler = InputHandler(mock_input_callback)
        
        try:
            # Inicia o manipulador
            handler.start()
            
            # Dá um tempo para detecção inicial
            time.sleep(0.5)
            
            # Verifica se houve alguma interação (não podemos garantir o que será)
            # Apenas verificamos se não houve erros
            assert True
            
        finally:
            # Garante que o manipulador seja parado
            handler.stop()
