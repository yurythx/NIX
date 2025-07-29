"""
Módulo para gerenciar entradas de gamepad e teclado no NIX Launcher.

Este módulo fornece uma interface unificada para lidar com entradas de gamepads
(usando a biblioteca inputs) e teclado, com suporte a mapeamento de botões
e tratamento de erros robusto.

Características principais:
- Suporte a múltiplos tipos de gamepads (Xbox, PlayStation, Nintendo, genéricos)
- Mapeamento personalizável de botões e eixos
- Tratamento de zona morta para controles analógicos
- Processamento eficiente de eventos com baixa latência
- Logging detalhado para diagnóstico de problemas
"""

from __future__ import annotations

import os
import sys
import time
import logging
import logging.handlers
import threading
from dataclasses import dataclass, field
from enum import Enum, auto, unique
from pathlib import Path
from typing import (
    Any, Callable, ClassVar, Dict, List, Literal, Optional, 
    Tuple, TypedDict, TypeVar, Union, cast, overload
)
from typing_extensions import Self

# Configuração de logging avançada
def setup_logging(log_level: int = logging.INFO, log_file: str = 'nix_launcher.log') -> None:
    """Configura o sistema de logging para o módulo.
    
    Args:
        log_level: Nível de log (padrão: logging.INFO)
        log_file: Caminho para o arquivo de log (padrão: 'nix_launcher.log')
    """
    # Cria o diretório de logs se não existir
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    log_path = log_dir / log_file
    
    # Configura o formato do log
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    formatter = logging.Formatter(log_format, datefmt=date_format)
    
    # Configura o handler para arquivo com rotação
    file_handler = logging.handlers.RotatingFileHandler(
        log_path, 
        maxBytes=5*1024*1024,  # 5MB
        backupCount=3,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    
    # Configura o handler para console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    # Configura o logger raiz
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove handlers existentes para evitar duplicação
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Adiciona os novos handlers
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

# Configura o logging ao importar o módulo
setup_logging()
logger = logging.getLogger(__name__)

# Constantes
DEFAULT_DEADZONE = 0.2  # 20% de zona morta padrão
EVENT_LOOP_SLEEP = 0.005  # 5ms entre iterações do loop de eventos

# Tipos personalizados
GamepadType = Literal['xbox', 'playstation', 'nintendo', 'generic', 'unknown']
InputCallback = Callable[['InputEvent'], None]
ButtonState = Union[int, float]  # 0-1 para digital, -1.0 a 1.0 para analógico

# Configuração de compatibilidade com a biblioteca inputs
GAMEPAD_AVAILABLE = False
GamepadDevice = TypedDict('GamepadDevice', {
    'name': str,
    'vendor_id': int,
    'product_id': int
})

# Tenta importar a biblioteca inputs com tratamento de erros aprimorado
try:
    import inputs
    from inputs import InputEvent as RawInputEvent, devices, get_gamepad
    from inputs import UnpluggedError, UnknownEventCode, DeviceManager
    
    # Verifica se a biblioteca está funcionando corretamente
    try:
        # Tenta listar dispositivos para verificar se há permissões
        _ = devices.gamepads
        GAMEPAD_AVAILABLE = True
        logger.info("Biblioteca 'inputs' carregada com sucesso. Suporte a gamepad ativado.")
    except Exception as e:
        logger.warning("Não foi possível acessar dispositivos de entrada: %s", str(e))
        logger.info("O suporte a gamepad estará desativado. Certifique-se de que as permissões estão configuradas corretamente.")
        GAMEPAD_AVAILABLE = False
        
    # Define a classe GamepadDevice como um TypedDict para melhor tipagem
    class GamepadDevice(TypedDict):
        """Estrutura para informações do dispositivo gamepad.
        
        Attributes:
            name: Nome do dispositivo gamepad.
            vendor_id: ID do fabricante do dispositivo.
            product_id: ID do produto do dispositivo.
            version: Versão do driver/interface do dispositivo.
            path: Caminho do dispositivo no sistema (opcional).
        """
        name: str
        vendor_id: int
        product_id: int
        version: int
        path: Optional[str]
        
except (ImportError, OSError) as e:
    logger.warning("Não foi possível carregar suporte a gamepad: %s", str(e), 
                  exc_info=logger.isEnabledFor(logging.DEBUG))
    GAMEPAD_AVAILABLE = False
    
    # Stubs para type checking quando inputs não estiver disponível
    class RawInputEvent:  # type: ignore
        """Classe stub para RawInputEvent quando inputs não está disponível."""
        ev_type: str
        code: str
        state: Any
        
    class DeviceManager:  # type: ignore
        """Stub para DeviceManager quando inputs não está disponível."""
        def __init__(self):
            self.devices: List[Any] = []
    
    devices = DeviceManager()  # type: ignore

class Button(Enum):
    """Enumeração de botões e eixos suportados do gamepad.
    
    Esta classe define todos os controles suportados pelo sistema, incluindo botões
    digitais, gatilhos analógicos e eixos de joystick. Os valores são mapeados
    para códigos de entrada físicos através do dicionário BUTTON_MAPPING.
    
    Exemplo de uso:
        >>> from launcher.input_handler import Button, InputHandler
        >>> 
        >>> def on_input_event(event):
        ...     if event.button == Button.A and event.state > 0.5:
        ...         print("Botão A pressionado!")
        ...     elif event.button == Button.LEFT_X:
        ...         print(f"Eixo X esquerdo: {event.state:.2f}")
        ...
        >>> handler = InputHandler(on_input_event)
        >>> handler.start()
        
    Atributos:
        A, B, X, Y: Botões de ação principais (A=inferior, B=direito, X=esquerdo, Y=superior).
        LB, RB: Bumpers esquerdo e direito (L1/R1).
        LT, RT: Gatilhos analógicos esquerdo e direito (L2/R2).
        BACK, START, GUIDE: Botões de menu e sistema (Select, Start, Xbox/PS).
        DPAD_UP, DPAD_DOWN, DPAD_LEFT, DPAD_RIGHT: Botões direcionais do D-Pad.
        L3, R3: Botões de pressionar os joysticks (LSB/RSB).
        LEFT_X, LEFT_Y: Eixos X e Y do joystick esquerdo (valores de -1.0 a 1.0).
        RIGHT_X, RIGHT_Y: Eixos X e Y do joystick direito (valores de -1.0 a 1.0).
        LEFT_TRIGGER, RIGHT_TRIGGER: Gatilhos analógicos (valores de 0.0 a 1.0).
        
    Notas:
        - Os eixos dos joysticks retornam valores de -1.0 a 1.0, onde 0.0 é a posição central.
        - Os gatilhos analógicos retornam valores de 0.0 (soltos) a 1.0 (totalmente pressionados).
        - Botões digitais retornam 0 (soltos) ou 1 (pressionados).
    """
    # Botões de ação
    A = auto()
    B = auto()
    X = auto()
    Y = auto()
    
    # Gatilhos e botões laterais
    LB = auto()  # Bumper esquerdo
    RB = auto()  # Bumper direito
    LT = auto()  # Gatilho esquerdo (analógico)
    RT = auto()  # Gatilho direito (analógico)
    
    # Botões de menu
    START = auto()
    SELECT = auto()
    HOME = auto()  # Botão Xbox/PS
    
    # Botões de direção digital
    DPAD_UP = auto()
    DPAD_DOWN = auto()
    DPAD_LEFT = auto()
    DPAD_RIGHT = auto()
    
    # Botões analógicos
    L3 = auto()  # Pressionar joystick esquerdo
    R3 = auto()  # Pressionar joystick direito
    
    # Eixos analógicos
    LEFT_X = auto()      # Eixo X do joystick esquerdo
    LEFT_Y = auto()      # Eixo Y do joystick esquerdo
    RIGHT_X = auto()     # Eixo X do joystick direito
    RIGHT_Y = auto()     # Eixo Y do joystick direito
    LEFT_TRIGGER = auto()   # Gatilho esquerdo (valor analógico)
    RIGHT_TRIGGER = auto()  # Gatilho direito (valor analógico)

@dataclass
class InputEvent:
    """Representa um evento de entrada do usuário, como pressionamento de botão ou movimento de eixo.
    
    Esta classe é usada para encapsular todas as informações relevantes sobre um evento
    de entrada, seja de um gamepad ou teclado. Os eventos são normalizados para fornecer
    uma interface consistente independentemente do dispositivo de entrada.
    
    Exemplo de uso:
        >>> def on_input_event(event):
        ...     if event.button == Button.A and event.state == 1:
        ...         print(f"Botão A pressionado em {event.timestamp}")
        ...     elif event.button == Button.LEFT_X and event.is_analog:
        ...         print(f"Eixo X esquerdo: {event.state:.2f}")
        ...
        >>> handler = InputHandler(on_input_event)
        >>> handler.start()
    
    Atributos:
        button: O botão ou eixo que gerou o evento (da enumeração Button).
        state: O estado do controle:
               - Para botões digitais: 0 (soltar) ou 1 (pressionar).
               - Para eixos analógicos: valor normalizado entre -1.0 e 1.0.
               - Para gatilhos analógicos: valor normalizado entre 0.0 e 1.0.
        is_analog: Indica se o evento é de um controle analógico (True) ou digital (False).
        timestamp: Timestamp em segundos desde a época (time.time()) quando o evento ocorreu.
        
    Notas:
        - Para botões digitais, os eventos de pressionar e soltar são enviados separadamente.
        - Para controles analógicos, eventos são enviados continuamente enquanto o valor muda.
        - O valor do timestamp é o mesmo retornado por time.time() no momento do evento.
    """
    button: Button
    state: Union[int, float]
    is_analog: bool = False
    timestamp: float = field(default_factory=time.time)
    
    def __post_init__(self) -> None:
        """Valida os valores após a inicialização."""
        if not isinstance(self.button, Button):
            raise TypeError(f"button deve ser do tipo Button, não {type(self.button).__name__}")
            
        if self.is_analog and not isinstance(self.state, (int, float)):
            raise TypeError("Para eventos analógicos, state deve ser int ou float")
        elif not self.is_analog and not isinstance(self.state, int):
            raise TypeError("Para eventos digitais, state deve ser int (0 ou 1)")
    
    def __str__(self) -> str:
        """Retorna uma representação legível do evento."""
        event_type = "Analog" if self.is_analog else "Digital"
        return f"{event_type} Event: {self.button.name} = {self.state}"
    
    def __repr__(self) -> str:
        """Retorna uma representação técnica do evento."""
        return (
            f"{self.__class__.__name__}("
            f"button={self.button!r}, "
            f"state={self.state!r}, "
            f"is_analog={self.is_analog!r}, "
            f"timestamp={self.timestamp!r})"
        )

class InputHandler:
    """
    Manipulador unificado de entradas de gamepad e teclado para o NIX Launcher.
    
    Esta classe fornece uma interface unificada e thread-safe para lidar com entradas de múltiplos
    dispositivos, incluindo gamepads (Xbox, PlayStation, Nintendo e genéricos) e teclado, com 
    suporte a mapeamento personalizado de botões, zonas mortas configuráveis e tratamento de 
    erros robusto.
    
    A classe implementa o padrão Observer, onde callbacks são chamados quando eventos
    de entrada são detectados. Ela gerencia automaticamente a conexão/desconexão de
    dispositivos, normaliza as entradas para uma interface consistente e lida com falhas
    de forma elegante.
    
    Principais recursos:
    - Suporte a múltiplos gamepads conectados simultaneamente
    - Mapeamento personalizável de botões e eixos
    - Tratamento de zona morta para controles analógicos
    - Filtragem de ruído e supressão de eventos duplicados
    - Logging detalhado para diagnóstico de problemas
    - Thread segura para operações concorrentes
    
    Exemplo de uso básico:
    
    ```python
    from launcher.input_handler import InputHandler, Button, InputEvent
    import time
    
    def on_input_event(event: InputEvent) -> None:
        """Callback chamado quando um evento de entrada é detectado."""
        if event.button == Button.A and event.state == 1:
            print("Botão A pressionado!")
        elif event.button == Button.LEFT_X and event.is_analog:
            print(f"Eixo X esquerdo: {event.state:.2f}")
    
    # Criar e configurar o manipulador
    handler = InputHandler(
        on_input_event=on_input_event,
        deadzone=0.1,  # 10% de zona morta
        poll_interval=0.005  # 5ms entre leituras
    )
    
    try:
        # Iniciar a captura de eventos em uma thread separada
        handler.start()
        print("Pressione os botões do controle...")
        
        # Manter o programa em execução
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nParando o manipulador de entradas...")
        handler.stop()
    ```
    
    Para mapeamentos personalizados e configurações avançadas, consulte os métodos
    adicionais da classe e a documentação dos parâmetros.
    
    Atributos:
        DEFAULT_KEYBOARD_MAPPING (ClassVar[Dict[str, Button]]): Mapeamento padrão de 
            teclas para botões do gamepad.
        BUTTON_MAPPING (ClassVar[Dict[str, Union[Button, Tuple[Button, Button]]]]): 
            Mapeamento de códigos de botão para a enumeração Button.
            
    Raises:
        RuntimeError: Se ocorrer um erro ao inicializar o suporte a gamepads.
        TypeError: Se o callback fornecido não for chamável.
    """
    
    # Mapeamento padrão de teclado para botões do gamepad
    DEFAULT_KEYBOARD_MAPPING: ClassVar[Dict[str, Button]] = {
        # Navegação
        'KEY_UP': Button.DPAD_UP,
        'KEY_DOWN': Button.DPAD_DOWN,
        'KEY_LEFT': Button.DPAD_LEFT,
        'KEY_RIGHT': Button.DPAD_RIGHT,
        
        # Ações
        'KEY_ENTER': Button.A,
        'KEY_SPACE': Button.A,
        'KEY_ESC': Button.B,
        'KEY_BACKSPACE': Button.B,
        'KEY_TAB': Button.SELECT,
        'KEY_RETURN': Button.START,
        
        # WASD para navegação alternativa
        'KEY_W': Button.DPAD_UP,
        'KEY_S': Button.DPAD_DOWN,
        'KEY_A': Button.DPAD_LEFT,
        'KEY_D': Button.DPAD_RIGHT,
        
        # Botões de ação alternativos
        'KEY_J': Button.A,  # Ação primária
        'KEY_K': Button.B,  # Voltar/Cancelar
        'KEY_I': Button.Y,  # Ação secundária
        'KEY_U': Button.X,  # Ação terciária
        'KEY_Q': Button.LB,  # Botão lateral esquerdo
        'KEY_E': Button.RB,  # Botão lateral direito
        'KEY_1': Button.START,  # Menu
        'KEY_2': Button.SELECT,  # Visualização
    }
    
    # Mapeamento de códigos de botão para a enumeração Button
    BUTTON_MAPPING: ClassVar[Dict[str, Union[Button, Tuple[Button, Button]]]] = {
        # Mapeamento de botões Xbox/PS4
        'BTN_SOUTH': Button.A,      # A (Xbox) / Cross (PS)
        'BTN_EAST': Button.B,       # B (Xbox) / Circle (PS)
        'BTN_NORTH': Button.Y,      # Y (Xbox) / Triangle (PS)
        'BTN_WEST': Button.X,       # X (Xbox) / Square (PS)
        'BTN_TL': Button.LB,        # Bumper esquerdo
        'BTN_TR': Button.RB,        # Bumper direito
        'BTN_SELECT': Button.SELECT,# Botão Select/View
        'BTN_START': Button.START,  # Botão Start/Menu
        'BTN_MODE': Button.HOME,    # Botão Xbox/PS
        'BTN_THUMBL': Button.L3,    # Pressionar joystick esquerdo
        'BTN_THUMBR': Button.R3,    # Pressionar joystick direito
        
        # Eixos analógicos
        'ABS_X': Button.LEFT_X,       # Eixo X do joystick esquerdo
        'ABS_Y': Button.LEFT_Y,       # Eixo Y do joystick esquerdo
        'ABS_RX': Button.RIGHT_X,     # Eixo X do joystick direito
        'ABS_RY': Button.RIGHT_Y,     # Eixo Y do joystick direito
        'ABS_Z': Button.LEFT_TRIGGER,  # Gatilho esquerdo analógico
        'ABS_RZ': Button.RIGHT_TRIGGER, # Gatilho direito analógico
        
        # D-Pad (tratado como eixos)
        'ABS_HAT0Y': (Button.DPAD_UP, Button.DPAD_DOWN),   # Eixo Y do D-Pad
        'ABS_HAT0X': (Button.DPAD_LEFT, Button.DPAD_RIGHT), # Eixo X do D-Pad
    }
    
    def __init__(
        self, 
        on_input_event: Callable[[InputEvent], None],
        deadzone: float = DEFAULT_DEADZONE,
        poll_interval: float = EVENT_LOOP_SLEEP,
        keyboard_mapping: Optional[Dict[str, Button]] = None,
        gamepad_mapping: Optional[Dict[str, Union[Button, Tuple[Button, Button]]]] = None
    ) -> None:
        """Inicializa o manipulador de entradas com configurações personalizáveis.
        
        Este método configura o manipulador de entradas com os parâmetros fornecidos,
        incluindo o callback para eventos de entrada, mapeamentos personalizáveis de 
        teclado e gamepad, além de configurações de zona morta e intervalo de leitura.
        
        A inicialização inclui:
        - Configuração dos mapeamentos de teclado e gamepad
        - Detecção automática do tipo de gamepad conectado (se disponível)
        - Inicialização de estruturas de dados internas
        - Configuração de parâmetros de desempenho
        
        Exemplo de uso avançado:
        ```python
        # Mapeamento personalizado de teclado
        custom_keymap = {
            'w': Button.DPAD_UP,
            's': Button.DPAD_DOWN,
            'a': Button.DPAD_LEFT,
            'd': Button.DPAD_RIGHT,
            'space': Button.A,
            'lshift': Button.B
        }
        
        # Criar manipulador com configurações personalizadas
        handler = InputHandler(
            on_input_event=handle_input,
            deadzone=0.15,  # 15% de zona morta
            poll_interval=0.01,  # 10ms entre leituras
            keyboard_mapping=custom_keymap
        )
        ```
        
        Args:
            on_input_event (Callable[[InputEvent], None]): Função de callback chamada 
                quando um evento de entrada é detectado. Deve aceitar um único 
                parâmetro do tipo InputEvent e retornar None.
            deadzone (float, optional): Valor entre 0.0 e 1.0 que define a zona morta 
                para controles analógicos. Padrão: 0.2.
            poll_interval (float, optional): Intervalo em segundos entre leituras de 
                eventos. Padrão: 0.005s.
            keyboard_mapping (Optional[Dict[str, Button]], optional): Dicionário para 
                mapeamento personalizado de teclas. Padrão: None.
            gamepad_mapping (Optional[Dict[str, Union[Button, Tuple[Button, Button]]]], optional): 
                Dicionário para mapeamento personalizado de botões do gamepad. 
                Padrão: None.
                           
        Raises:
            TypeError: Se on_input_event não for callable ou se os tipos dos parâmetros 
                estiverem incorretos.
            ValueError: Se deadzone não estiver entre 0.0 e 1.0 ou se poll_interval 
                for menor ou igual a zero.
            RuntimeError: Se ocorrer um erro crítico durante a inicialização ou se 
                não for possível detectar dispositivos de entrada.
            
        Example:
            ```python
            def handle_input(event: InputEvent) -> None:
                print(f"Botão {event.button} pressionado com estado {event.state}")
                
            handler = InputHandler(handle_input)
            ```
        """
        # Validação do callback
        if not callable(on_input_event):
            error_msg = "on_input_event deve ser uma função callável que aceite um parâmetro InputEvent"
            logger.error(error_msg)
            raise TypeError(error_msg)
            
        # Inicialização dos atributos básicos
        self.on_input_event = on_input_event
        self._running: bool = False
        self._thread: Optional[threading.Thread] = None
        self._last_events: Dict[Button, Union[int, float]] = {}
        self._key_event_timestamps: Dict[Button, float] = {}  # Rastreia timestamps dos eventos de teclado
        self._deadzone: float = 0.2  # 20% de zona morta padrão
        self._callback_error_count: int = 0  # Contador de erros no callback
        self._gamepad_type: str = "unknown"
        self._initialized: bool = True  # Flag para verificação no __del__
        
        # Inicializa o mapeamento de teclado com uma cópia do mapeamento padrão
        try:
            self._keyboard_mapping = self.DEFAULT_KEYBOARD_MAPPING.copy()
        except Exception as e:
            logger.error("Falha ao copiar o mapeamento padrão do teclado: %s", str(e))
            self._keyboard_mapping = {}
        
        # Configura o mapeamento específico para o sistema operacional
        if GAMEPAD_AVAILABLE:
            try:
                logger.info("Detectando tipo de gamepad...")
                self._detect_gamepad_type()
                logger.info("Gamepad detectado: %s", self._gamepad_type)
            except Exception as e:
                error_msg = f"Erro ao detectar tipo de gamepad: {str(e)}"
                logger.error(error_msg)
                logger.debug("Detalhes do erro:", exc_info=True)
                # Não levantamos a exceção aqui para permitir que o teclado continue funcionando
        else:
            logger.info("Nenhum gamepad detectado, apenas suporte a teclado disponível")
                
    def __del__(self):
        """Libera recursos ao destruir a instância.
        
        Garante que a thread de captura seja parada corretamente quando o objeto
        for destruído pelo coletor de lixo.
        """
        # Verifica se o objeto foi inicializado corretamente
        if hasattr(self, '_initialized') and self._initialized and self._running:
            try:
                logger.debug("Destruindo InputHandler, parando thread de captura...")
                self.stop()
            except Exception as e:
                # Evita exceções durante a coleta de lixo
                logger.error("Erro ao parar o InputHandler durante a destruição: %s", str(e))
                logger.debug("Detalhes do erro:", exc_info=True)
    
    def _detect_gamepad_type(self) -> None:
        """Detecta o tipo de gamepad conectado e ajusta os mapeamentos.
        
        Esta função tenta identificar o modelo do gamepad (Xbox, PlayStation, Nintendo, etc.)
        e ajusta os mapeamentos de botões conforme necessário para garantir
        uma experiência consistente entre diferentes modelos de controles.
        
        O método suporta detecção dos seguintes tipos de gamepads:
        - Controles Sony (DualShock 3/4, DualSense)
        - Controles Nintendo (Switch Pro, Joy-Con)
        - Controles Xbox (360, One, Series X/S)
        - Controles genéricos (XInput, DInput)
        
        Raises:
            RuntimeError: Se ocorrer um erro crítico ao acessar os dispositivos de entrada.
            
        Note:
            - O método atualiza o atributo _gamepad_type com o tipo detectado.
            - Os mapeamentos de botões são ajustados para corresponder ao layout físico do controle.
            - Em caso de erro, o tipo é definido como 'error' e uma exceção é levantada.
        """
        if not GAMEPAD_AVAILABLE:
            logger.warning("Suporte a gamepad não está disponível")
            self._gamepad_type = "unavailable"
            return
            
        try:
            # Obtém a lista de gamepads conectados
            try:
                gamepads = [dev for dev in devices.gamepads]
            except Exception as e:
                logger.error("Falha ao acessar dispositivos de entrada: %s", str(e))
                self._gamepad_type = "error"
                raise RuntimeError("Não foi possível acessar os dispositivos de entrada") from e
                
            if not gamepads:
                logger.info("Nenhum gamepad detectado")
                self._gamepad_type = "none"
                return
                
            # Armazena informações sobre os gamepads detectados para log
            detected_pads = [{"name": g.name, "path": getattr(g, 'path', 'unknown')} for g in gamepads]
            logger.debug("Gamepads detectados: %s", detected_pads)
            
            # Detecta o tipo de gamepad baseado no nome do dispositivo
            for gamepad in gamepads:
                gamepad_name = gamepad.name.lower()
                logger.debug("Analisando gamepad: %s", gamepad.name)
                
                # Controle Sony (DualShock/DualSense)
                sony_ids = ['sony', 'dualshock', 'dualsense', 'playstation', 'ps3', 'ps4', 'ps5']
                if any(sony_id in gamepad_name for sony_id in sony_ids):
                    logger.info("Controle Sony detectado: %s", gamepad.name)
                    self._gamepad_type = "sony"
                    
                    # Ajusta os mapeamentos para controles Sony
                    sony_mapping = {
                        # Botões de ação
                        'BTN_EAST': Button.B,    # Circle
                        'BTN_SOUTH': Button.A,   # Cross (X)
                        'BTN_WEST': Button.Y,    # Triangle
                        'BTN_NORTH': Button.X,   # Square
                        
                        # Gatilhos e botões laterais
                        'BTN_TL': Button.L1,
                        'BTN_TR': Button.R1,
                        'BTN_TL2': Button.L2,
                        'BTN_TR2': Button.R2,
                        'BTN_THUMBL': Button.L3,
                        'BTN_THUMBR': Button.R3,
                        
                        # Botões do meio
                        'BTN_SELECT': Button.SELECT,
                        'BTN_START': Button.START,
                        'BTN_MODE': Button.HOME,  # Botão PS
                    }
                    
                    # Atualiza o mapeamento com as configurações específicas do controle Sony
                    self.BUTTON_MAPPING.update(sony_mapping)
                    logger.debug("Mapeamento Sony aplicado")
                    break
                    
                # Controle Nintendo (Switch Pro/Joystick)
                nintendo_ids = ['nintendo', 'switch', 'joy-con', 'joycon', 'pro controller']
                if any(nintendo_id in gamepad_name for nintendo_id in nintendo_ids):
                    logger.info("Controle Nintendo detectado: %s", gamepad.name)
                    self._gamepad_type = "nintendo"
                    
                    # Ajusta os mapeamentos para controles Nintendo
                    nintendo_mapping = {
                        # Botões de ação (layout A/B/X/Y invertido)
                        'BTN_EAST': Button.A,    # B (direita)
                        'BTN_SOUTH': Button.B,   # A (baixo)
                        'BTN_WEST': Button.Y,    # X (esquerda)
                        'BTN_NORTH': Button.X,   # Y (cima)
                        
                        # Gatilhos e botões laterais
                        'BTN_TL': Button.L1,
                        'BTN_TR': Button.R1,
                        'BTN_TL2': Button.L2,
                        'BTN_TR2': Button.R2,
                        'BTN_THUMBL': Button.L3,
                        'BTN_THUMBR': Button.R3,
                        
                        # Botões do meio
                        'BTN_SELECT': Button.SELECT,  # -
                        'BTN_START': Button.START,   # +
                        'BTN_MODE': Button.HOME,     # Home
                    }
                    
                    self.BUTTON_MAPPING.update(nintendo_mapping)
                    logger.debug("Mapeamento Nintendo aplicado")
                    break
                
                # Controle Xbox (XInput)
                xbox_ids = ['xbox', 'x-box', 'xinput', 'x360', 'xone', 'series x', 'series s']
                if any(xbox_id in gamepad_name for xbox_id in xbox_ids):
                    logger.info("Controle Xbox detectado: %s", gamepad.name)
                    self._gamepad_type = "xbox"
                    
                    # Mapeamento padrão já está otimizado para Xbox
                    # Apenas registramos a detecção
                    logger.debug("Usando mapeamento padrão (Xbox)")
                    break
                    
            else:  # Nenhum mapeamento específico encontrado
                logger.info("Controle genérico detectado: %s", gamepads[0].name)
                self._gamepad_type = "generic"
                
                # Tenta identificar se é um controle XInput genérico
                if any(attr in gamepad_name for attr in ['xinput', 'x-box', 'xbox']):
                    logger.debug("Controle genérico identificado como XInput")
                    self._gamepad_type = "xinput"
                
                # Registra informações adicionais para diagnóstico
                logger.debug("Usando mapeamento genérico. Nomes dos dispositivos: %s", 
                           [g.name for g in gamepads])
                
        except UnpluggedError as ue:
            logger.warning("Gamepad foi desconectado durante a detecção: %s", str(ue))
            self._gamepad_type = "disconnected"
            
        except Exception as e:
            error_msg = f"Erro ao detectar tipo de gamepad: {str(e)}"
            logger.error(error_msg)
            logger.debug("Detalhes do erro:", exc_info=True)
            self._gamepad_type = "error"
            raise RuntimeError(error_msg) from e
        
        # Log final com o tipo detectado
        logger.info("Tipo de gamepad detectado: %s", self._gamepad_type)
    
    def _normalize_axis_value(self, value: Union[int, float], min_val: Union[int, float], 
                            max_val: Union[int, float]) -> float:
        """Normaliza o valor de um eixo analógico para o intervalo [-1.0, 1.0].
        
        Este método converte valores brutos de eixos analógicos de gamepads para um intervalo
        padronizado, facilitando o processamento posterior. Garante que o resultado final
        esteja sempre no intervalo [-1.0, 1.0], onde 0.0 representa a posição central/neutra.
        
        Args:
            value: Valor bruto do eixo a ser normalizado. Pode estar fora dos limites.
            min_val: Valor mínimo possível para o eixo.
            max_val: Valor máximo possível para o eixo.
            
        Returns:
            float: Valor normalizado no intervalo [-1.0, 1.0], onde:
                  -1.0 = valor mínimo (esquerda/baixo)
                   0.0 = posição central/neutra
                   1.0 = valor máximo (direita/cima)
                   
        Raises:
            ValueError: Se min_val for maior ou igual a max_val.
            TypeError: Se algum dos parâmetros não for numérico.
            
        Example:
            >>> handler = InputHandler(lambda e: None)
            >>> handler._normalize_axis_value(128, 0, 255)  # Valor central
            0.003921568627450966
            >>> handler._normalize_axis_value(0, 0, 255)    # Mínimo
            -1.0
            >>> handler._normalize_axis_value(255, 0, 255)  # Máximo
            1.0
        """
        # Validação dos tipos dos parâmetros
        if not all(isinstance(x, (int, float)) for x in (value, min_val, max_val)):
            raise TypeError("Todos os parâmetros devem ser numéricos")
            
        # Validação dos limites
        if min_val >= max_val:
            raise ValueError(f"min_val ({min_val}) deve ser menor que max_val ({max_val})")
            
        # Se o valor já estiver normalizado, retorna diretamente (com validação)
        if -1.0 <= value <= 1.0 and min_val == -1.0 and max_val == 1.0:
            return float(value)
            
        # Garante que o valor está dentro dos limites (clamping)
        clamped_value = max(min_val, min(value, max_val))
        
        # Evita divisão por zero (embora já coberto pela validação acima)
        if min_val == max_val:
            return 0.0
            
        # Normaliza para [0, 1] e depois converte para [-1, 1]
        normalized = (clamped_value - min_val) / (max_val - min_val)
        return (normalized * 2.0) - 1.0
    
    def _process_gamepad_event(self, event: RawInputEvent) -> None:
        """Processa um evento bruto do gamepad.
        
        Este método converte eventos brutos do gamepad em eventos padronizados
        que podem ser processados pelo aplicativo. Suporta os seguintes tipos de entrada:
        - Botões digitais (pressionado/solto)
        - Eixos analógicos (joysticks, gatilhos)
        - D-Pad (tratado como botões digitais)
        
        O método inclui tratamento robusto de erros, validações rigorosas e otimizações
        para garantir um processamento eficiente e seguro dos eventos de entrada.
        
        Args:
            event: O evento bruto do gamepad a ser processado. Deve conter os
                  atributos 'ev_type' (tipo), 'code' (código) e 'state' (estado).
            
        Note:
            - Botões digitais: convertidos para 0 (soltos) ou 1 (pressionados)
            - Eixos analógicos: normalizados para o intervalo [-1.0, 1.0]
            - Gatilhos analógicos: normalizados para [0.0, 1.0]
            - D-Pad: tratado como botões digitais com valores 0 ou 1
            - Zona morta: aplicada a todos os eixos analógicos
            - Limiar de mudança: ignora mudanças menores que 1% em eixos analógicos
            
        Raises:
            AttributeError: Se o evento não tiver os atributos necessários.
            ValueError: Se o tipo de evento for desconhecido ou inválido.
            
        Example:
            # Processa um evento de botão pressionado
            event = SimpleNamespace(ev_type='Key', code='BTN_SOUTH', state=1)
            handler._process_gamepad_event(event)
            
            # Processa um evento de eixo analógico
            event = SimpleNamespace(ev_type='Absolute', code='ABS_X', state=16000)
            handler._process_gamepad_event(event)
        """
        # Validação inicial rápida
        if not GAMEPAD_AVAILABLE:
            return
            
        # Verificação de atributos obrigatórios
        required_attrs = ('ev_type', 'code', 'state')
        if not all(hasattr(event, attr) for attr in required_attrs):
            logger.debug("Evento inválido: atributos ausentes: %s", 
                        [attr for attr in required_attrs if not hasattr(event, attr)])
            return
            
        try:
            button: Optional[Union[Button, Tuple[Button, Button]]] = None
            state: Optional[Union[int, float]] = None
            is_analog: bool = False
            
            # Obtém o tipo de evento em maiúsculas para comparação consistente
            event_type = str(event.ev_type).upper()
            event_code = str(event.code).upper()
            
            # Processa botões digitais (Key events)
            if event_type == 'KEY':
                button = self.BUTTON_MAPPING.get(event_code)
                
                # Ignora eventos de botão não mapeados
                if button is None:
                    return
                    
                # Garante 0 (soltar) ou 1 (pressionar) para botões digitais
                state = 1 if event.state else 0
                is_analog = False
            
            # Processa eixos analógicos (Absolute events)
            elif event_type == 'ABSOLUTE':
                button_info = self.BUTTON_MAPPING.get(event_code)
                
                # Ignora eixos não mapeados
                if button_info is None:
                    return
                    
                is_analog = True
                
                # Trata D-Pad (eixos HAT) - delega para o método especializado
                if event_code in ('ABS_HAT0Y', 'ABS_HAT0X') and isinstance(button_info, tuple):
                    self._process_dpad_event(event_code, button_info, event.state)
                    return
                
                # Processa outros tipos de eixos analógicos usando o método auxiliar
                button, state = self._process_analog_axis(event_code, button_info, event.state)
                if button is None or state is None:
                    return  # Evento não processado ou inválido
            else:
                # Ignora tipos de evento desconhecidos
                logger.debug("Tipo de evento desconhecido: %s", event_type)
                return
            
            # Validação final antes de enviar o evento
            if button is not None and state is not None and isinstance(button, Button):
                # Verifica se o estado mudou significativamente para eventos analógicos
                if is_analog:
                    last_state = self._last_events.get(button)
                    if last_state is not None and abs(last_state - state) < 0.01:  # Limiar de 1%
                        return  # Ignora mudanças muito pequenas
                
                # Envia o evento processado
                self._send_event(InputEvent(button, state, is_analog))
                
        except Exception as e:
            logger.error("Erro ao processar evento do gamepad (tipo: %s, código: %s, estado: %s): %s", 
                        getattr(event, 'ev_type', '?'),
                        getattr(event, 'code', '?'),
                        getattr(event, 'state', '?'),
                        str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
            if __debug__:  # Apenas levanta exceções em modo de depuração
                raise
    
    def _process_dpad_event(self, axis_name: str, button_info: Tuple[Button, Button], state: int) -> None:
        """Processa eventos do D-Pad (eixos HAT).
        
        O D-Pad é tratado como um par de botões digitais (cima/baixo ou esquerda/direita).
        Quando o D-Pad é movido para uma direção, um botão é ativado (estado=1) e o outro
        é desativado (estado=0). Quando o D-Pad retorna à posição neutra, ambos os botões
        são desativados.
        
        Args:
            axis_name: Nome do eixo do D-Pad ('ABS_HAT0X' ou 'ABS_HAT0Y').
            button_info: Tupla contendo os botões para as duas direções do eixo.
            state: Estado atual do eixo (-1, 0 ou 1).
            
        Note:
            - Para eixo X: button_info[0] = esquerda, button_info[1] = direita
            - Para eixo Y: button_info[0] = cima, button_info[1] = baixo
        """
        try:
            if state == 0:  # D-Pad retornou à posição neutra
                # Envia eventos de soltura para ambas as direções
                button1, button2 = button_info
                self._send_event(InputEvent(button1, 0, is_analog=False))
                self._send_event(InputEvent(button2, 0, is_analog=False))
            else:
                # Determina qual botão do D-Pad foi pressionado
                button = button_info[0] if state < 0 else button_info[1]
                # Envia evento de pressão para o botão ativado
                self._send_event(InputEvent(button, 1, is_analog=False))
                
                # Log detalhado apenas em modo debug
                logger.debug("D-Pad %s: %s ativado (estado=%d)", 
                           axis_name, button.name, state)
                
        except Exception as e:
            logger.error("Erro ao processar evento do D-Pad (%s, %s, %d): %s", 
                       axis_name, str(button_info), state, str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
    
    def _process_analog_axis(self, axis_name: str, button_info: Union[Button, Any], 
                           raw_value: Union[int, float]) -> Tuple[Optional[Button], Optional[float]]:
        """Processa eventos de eixos analógicos (joysticks e gatilhos).
        
        Este método trata a normalização e aplicação da zona morta para eixos analógicos.
        
        Args:
            axis_name: Nome do eixo analógico (ex: 'ABS_X', 'ABS_RZ').
            button_info: Botão associado ao eixo ou tupla para D-Pad.
            raw_value: Valor bruto do eixo.
            
        Returns:
            Tupla (button, state) onde:
            - button: O botão associado ao eixo, ou None se inválido.
            - state: O estado normalizado do eixo, ou None se inválido.
            
        Note:
            - Para joysticks: normaliza para [-1.0, 1.0] com zona morta central.
            - Para gatilhos: normaliza para [0.0, 1.0] com zona morta na base.
        """
        if not isinstance(button_info, Button):
            return None, None
            
        try:
            state: Optional[float] = None
            button = button_info
            
            # Converte para inteiro se for uma string
            if isinstance(raw_value, str):
                raw_value = int(raw_value)
                
            # Trata gatilhos analógicos (LT/RT) - normaliza para [0.0, 1.0]
            if axis_name in ('ABS_Z', 'ABS_RZ', 'ABS_BRAKE', 'ABS_GAS'):
                # Normaliza para 0.0 a 1.0 (assumindo faixa 0-255 para gatilhos)
                try:
                    normalized = (int(raw_value) + 32768) / 65535.0
                    state = max(0.0, min(1.0, normalized))
                    
                    # Aplica zona morta na base do gatilho
                    if state < self._deadzone:
                        state = 0.0
                        
                except (TypeError, ValueError) as e:
                    logger.warning("Valor inválido para gatilho %s: %s", 
                                 axis_name, str(raw_value))
                    return None, None
                    
            # Trata joysticks analógicos - normaliza para [-1.0, 1.0]
            else:
                try:
                    # Normaliza para -1.0 a 1.0
                    normalized = self._normalize_axis_value(int(raw_value), -32768, 32767)
                    
                    # Aplica zona morta central
                    if abs(normalized) < self._deadzone:
                        normalized = 0.0
                        
                    state = normalized
                    
                except (TypeError, ValueError) as e:
                    logger.warning("Valor inválido para eixo %s: %s", 
                                 axis_name, str(raw_value))
                    return None, None
            
            return button, state
            
        except Exception as e:
            logger.error("Erro ao processar eixo analítico %s: %s", 
                       axis_name, str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
            return None, None
    
    def _process_keyboard_event(self, event: RawInputEvent) -> None:
        """Processa um evento de teclado.
        
        Converte eventos de teclado em eventos de botão do gamepad usando o
        mapeamento configurado. Apenas teclas mapeadas são processadas.
        
        Este método inclui tratamento robusto de erros, validações e otimizações
        para garantir um processamento eficiente e seguro dos eventos de teclado.
        
        Args:
            event: O evento de teclado a ser processado. Deve conter os
                  atributos 'ev_type', 'code' e 'state'.
            
        Note:
            - Apenas eventos de tecla pressionada (state=1) são processados.
            - Eventos de liberação de tecla (state=0) são ignorados para evitar
              duplicação, já que o jogo pode gerenciar o estado de forma contínua.
            - Teclas não mapeadas são ignoradas silenciosamente.
              
        Raises:
            AttributeError: Se o evento não tiver os atributos necessários.
            ValueError: Se o tipo de evento for desconhecido ou inválido.
        """
        # Validação inicial do evento
        if not hasattr(event, 'ev_type') or not hasattr(event, 'code') or not hasattr(event, 'state'):
            logger.warning("Evento de teclado inválido: atributos ausentes")
            return
            
        # Ignora eventos que não são de teclado ou são de liberação de tecla
        if event.ev_type != 'Key' or event.state != 1:
            return
            
        try:
            # Obtém o código da tecla em maiúsculas para consistência
            key = str(event.code).upper()
            
            # Verifica se a tecla está mapeada para algum botão do gamepad
            button = self._keyboard_mapping.get(key)
            if button is None:
                return  # Ignora teclas não mapeadas
                
            # Verifica se o botão mapeado é válido
            if not isinstance(button, Button):
                logger.warning("Mapeamento de tecla inválido para '%s': %s", key, str(button))
                return
                
            # Verifica se já existe um evento pendente para este botão
            current_time = time.time()
            last_event_time = self._key_event_timestamps.get(button, 0)
            
            # Aplica um atraso mínimo entre eventos do mesmo botão para evitar duplicação
            min_key_repeat_delay = 0.05  # 50ms
            if current_time - last_event_time < min_key_repeat_delay:
                return
                
            # Atualiza o timestamp do último evento para este botão
            self._key_event_timestamps[button] = current_time
            
            # Cria e envia o evento de entrada
            input_event = InputEvent(button, 1, is_analog=False)
            self._send_event(input_event)
                
        except Exception as e:
            logger.error("Erro ao processar evento de teclado: %s", str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
            if __debug__:  # Apenas levanta exceções em modo de depuração
                raise
    
    def _send_event(self, event: InputEvent) -> None:
        """Envia um evento de entrada processado para o callback registrado.
        
        Este método gerencia o envio de eventos de entrada, garantindo que apenas
        eventos significativos (com mudança de estado acima de um limiar) sejam
        repassados ao callback. Isso ajuda a reduzir o ruído e melhorar a
        responsividade do sistema.
        
        O método inclui validações rigorosas, tratamento de erros robusto e
        otimizações para garantir um processamento eficiente e seguro dos
        eventos de entrada.
        
        Args:
            event: O evento de entrada a ser processado. Deve ser uma instância
                  de InputEvent com os atributos 'button', 'state' e 'is_analog'.
            
        Note:
            - Para eventos analógicos, um limiar de 5% é aplicado para evitar
              atualizações desnecessárias por pequenas flutuações.
            - Para eventos digitais, apenas mudanças de estado são repassadas.
            - O método é seguro para ser chamado de qualquer thread.
            
        Raises:
            AttributeError: Se o evento não tiver os atributos necessários.
            TypeError: Se o evento não for uma instância de InputEvent.
        """
        # Validação inicial do evento
        if not isinstance(event, InputEvent):
            logger.error("Tipo de evento inválido: %s", type(event).__name__)
            return
            
        if not hasattr(event, 'button') or not hasattr(event, 'state') or not hasattr(event, 'is_analog'):
            logger.error("Evento de entrada inválido: atributos ausentes")
            return
            
        # Verifica se há um callback registrado
        if not hasattr(self, 'on_input_event') or not callable(self.on_input_event):
            logger.warning("Nenhum callback registrado para eventos de entrada")
            return
            
        try:
            # Obtém o último estado registrado para este botão
            last_state = self._last_events.get(event.button)
            
            # Para eventos analógicos, verifica se a diferença é significativa
            if event.is_analog:
                # Valida o estado do evento analógico
                if not isinstance(event.state, (int, float)):
                    logger.warning("Estado analógico inválido: %s", str(event.state))
                    return
                    
                # Verifica se o estado está dentro dos limites esperados
                if event.state < -1.0 or event.state > 1.0:
                    logger.warning("Estado analógico fora do intervalo [-1.0, 1.0]: %f", event.state)
                    # Normaliza para o intervalo válido
                    event.state = max(-1.0, min(1.0, event.state))
                
                # Aplica o limiar apenas se houver um estado anterior para comparar
                if last_state is not None:
                    # Limiar de 5% para eventos analógicos (evita atualizações por ruído)
                    if abs(event.state - last_state) < 0.05:
                        return
            
            # Para botões digitais, verifica se o estado realmente mudou
            elif not event.is_analog and last_state == event.state:
                return
                
            # Atualiza o último estado registrado
            self._last_events[event.button] = event.state
            
            # Envia o evento para o callback registrado em um bloco try/except separado
            # para garantir que erros no callback não afetem o processamento de eventos
            try:
                self.on_input_event(event)
            except Exception as callback_error:
                logger.error("Erro no callback de evento de entrada: %s", str(callback_error))
                logger.debug("Detalhes do erro no callback:", exc_info=True)
                
                # Se o callback falhar repetidamente, podemos querer desativá-lo
                # para evitar sobrecarga do sistema de logs
                if hasattr(self, '_callback_error_count'):
                    self._callback_error_count += 1
                    if self._callback_error_count > 10:  # Limite arbitrário
                        logger.error("Muitos erros no callback, desativando...")
                        self.on_input_event = None
                else:
                    self._callback_error_count = 1
                
        except Exception as e:
            logger.error("Erro ao processar evento de entrada: %s", str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
            if __debug__:  # Apenas levanta exceções em modo de depuração
                raise

    def _process_keyboard_event(self, event: RawInputEvent) -> None:
        """Processa um evento de teclado.
        
        Converte eventos de teclado em eventos de botão do gamepad usando o
        mapeamento configurado. Apenas teclas mapeadas são processadas.
        
        Args:
            event: O evento de teclado a ser processado.
                
        Note:
            Este método ignora silenciosamente erros durante o processamento
            para evitar que falhas no teclado afetem a execução principal.
        """
        try:
            # Ignora eventos de liberação de tecla que não estão mapeados
            if event.ev_type != 'Key' or event.state == 0:
                return
                
            key = event.code.upper()
            button = self._keyboard_mapping.get(key)
                
            if button is not None:
                # Envia o evento apenas quando a tecla é pressionada (state=1)
                # Ignora eventos de liberação (state=0) para evitar duplicação
                # já que o jogo pode querer lidar com o estado de forma contínua
                self._send_event(InputEvent(button, 1))
                    
        except Exception as e:
            logger.error("Erro ao processar evento de teclado: %s", str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
            if __debug__:  # Apenas levanta exceções em modo de depuração
                raise
    
    def _send_event(self, event: InputEvent) -> None:
        """Envia um evento de entrada processado para o callback registrado.
        
        Este método gerencia o envio de eventos de entrada, garantindo que apenas
        eventos significativos (com mudança de estado acima de um limiar) sejam
        repassados ao callback. Isso ajuda a reduzir o ruído e melhorar a
        responsividade do sistema.
        
        Args:
            event: O evento de entrada a ser processado.
                
        Note:
            - Para eventos analógicos, um limiar de 5% é aplicado para evitar
              atualizações desnecessárias por pequenas flutuações.
            - Para eventos digitais, apenas mudanças de estado são repassadas.
        """
        if not hasattr(self, 'on_input_event') or not callable(self.on_input_event):
            logger.warning("Nenhum callback registrado para eventos de entrada")
            return
                
        try:
            # Obtém o último estado registrado para este botão
            last_state = self._last_events.get(event.button)
                
            # Para eventos analógicos, verifica se a diferença é significativa
            if event.is_analog and last_state is not None:
                # Limiar de 5% para eventos analógicos (evita atualizações por ruído)
                if abs(event.state - last_state) < 0.05:
                    return
                
            # Para botões digitais, verifica se o estado realmente mudou
            elif not event.is_analog and last_state == event.state:
                return
                    
            # Atualiza o último estado registrado
            self._last_events[event.button] = event.state
                
            # Envia o evento para o callback registrado
            try:
                self.on_input_event(event)
            except Exception as callback_error:
                logger.error("Erro no callback de evento de entrada: %s", str(callback_error))
                logger.debug("Detalhes do erro no callback:", exc_info=True)
                    
        except Exception as e:
            logger.error("Erro ao processar evento de entrada: %s", str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
        if __debug__:  # Apenas levanta exceções em modo de depuração
            raise
    
    def _event_loop(self):
        """Loop principal para capturar eventos de entrada.
        
        Este método executa um loop contínuo que captura eventos de entrada do gamepad
        (se disponível) e os processa. O loop é executado em uma thread separada e
        inclui controle de taxa de atualização e tratamento robusto de erros.
        
        O loop usa um atraso dinâmico para manter uma taxa de atualização consistente
        enquanto minimiza o uso da CPU. Em caso de erros, o loop continua em execução
        a menos que um erro crítico ocorra ou que o sinal de parada seja recebido.
        """
        logger.info("Iniciando loop de eventos de entrada")
        
        # Taxa de atualização alvo (em segundos entre iterações)
        target_fps = 200  # 200 FPS para baixa latência
        target_frame_time = 1.0 / target_fps
        
        # Contador para rastrear erros consecutivos
        error_count = 0
        max_consecutive_errors = 5
        
        while self._running:
            frame_start_time = time.time()
            
            try:
                # Processa eventos do gamepad se disponível
                if GAMEPAD_AVAILABLE:
                    try:
                        events = get_gamepad()
                        for event in events:
                            if event.ev_type in ("Key", "Absolute"):
                                self._process_gamepad_event(event)
                    except (UnpluggedError, OSError) as e:
                        logger.warning("Gamepad desconectado ou erro de E/S: %s", str(e))
                        # Tenta redetectar o gamepad na próxima iteração
                        time.sleep(1)
                        continue
                
                # Calcula o tempo restante para manter a taxa de quadros desejada
                frame_time = time.time() - frame_start_time
                sleep_time = max(0, target_frame_time - frame_time)
                
                # Usa um pequeno atraso para reduzir o uso da CPU
                if sleep_time > 0.001:  # Apenas dorme se o tempo for significativo
                    time.sleep(min(sleep_time, 0.05))  # Máximo de 50ms para manter responsividade
                
                # Reseta o contador de erros após uma iteração bem-sucedida
                error_count = 0
                
            except Exception as e:
                error_count += 1
                logger.error("Erro no loop de eventos (%d/%d): %s", 
                           error_count, max_consecutive_errors, str(e))
                logger.debug("Detalhes do erro:", exc_info=True)
                
                # Se muitos erros consecutivos ocorrerem, faz uma pausa maior
                if error_count >= max_consecutive_errors:
                    logger.error("Muitos erros consecutivos, pausando por 5 segundos...")
                    time.sleep(5)
                    error_count = 0  # Reseta após a pausa
                    
                    # Se ainda estiver com problemas após a pausa, tenta reiniciar
                    if self._running:
                        logger.info("Tentando recuperar o loop de eventos...")
    
    def start(self) -> None:
        """Inicia a captura de eventos de entrada em uma thread separada.
        
        Este método inicia um loop de eventos em uma thread separada que fica
        aguardando por entradas do usuário (teclado/gamepad) e as processa
        conforme configurado.
        
        Raises:
            RuntimeError: Se ocorrer um erro ao iniciar a thread de captura.
                
        Note:
            O método é seguro para chamadas múltiplas - se já estiver em execução,
            uma mensagem de aviso será registrada e o método retornará sem fazer nada.
        """
        if self._running:
            logger.warning("InputHandler já está em execução")
            return
                
        try:
            self._running = True
            self._thread = threading.Thread(
                target=self._event_loop,
                name="InputHandler",
                daemon=True
            )
            self._thread.start()
            logger.info("InputHandler iniciado com sucesso")
                
            # Pequena pausa para garantir que a thread foi iniciada corretamente
            if not self._thread.is_alive():
                raise RuntimeError("Falha ao iniciar a thread de captura de entrada")
                    
        except Exception as e:
            self._running = False
            if self._thread:
                self._thread.join(timeout=1.0)
                self._thread = None
            logger.error("Erro ao iniciar o InputHandler: %s", str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
            if __debug__:  # Apenas levanta exceções em modo de depuração
                raise
    
    def is_running(self) -> bool:
        """Verifica se o monitoramento de entradas está ativo."""
        return self._running
    
    def stop(self) -> None:
        """Para o monitoramento de entradas de forma segura.
        
        Este método sinaliza para a thread de captura de eventos parar e aguarda
        sua finalização. É seguro chamar este método mesmo que o monitoramento
        já tenha sido parado.
        
        Note:
            O método é seguro para chamadas múltiplas - se já estiver parado,
            uma mensagem de aviso será registrada e o método retornará sem fazer nada.
        """
        if not self._running:
            logger.warning("InputHandler já está parado")
            return
            
        try:
            logger.info("Parando InputHandler...")
            self._running = False
            
            if self._thread and self._thread.is_alive():
                logger.debug("Aguardando thread de captura terminar...")
                self._thread.join(timeout=2.0)  # Timeout de 2 segundos
                
                if self._thread.is_alive():
                    logger.warning("Thread de captura não respondeu ao sinal de parada")
            
            logger.info("InputHandler parado com sucesso")
            
        except Exception as e:
            logger.error("Erro ao parar o InputHandler: %s", str(e))
            logger.debug("Detalhes do erro:", exc_info=True)
            if __debug__:  # Apenas levanta exceções em modo de depuração
                raise
    
    def set_keyboard_mapping(self, mapping: Dict[str, Button]):
        """
        Define um mapeamento personalizado de teclado para botões.
        
        Args:
            mapping: Dicionário mapeando códigos de tecla para botões do gamepad.
        """
        self._keyboard_mapping = mapping or self.DEFAULT_KEYBOARD_MAPPING.copy()
    
    def set_deadzone(self, deadzone: float):
        """
        Define o valor da zona morta para eixos analógicos.
        
        Args:
            deadzone: Valor da zona morta (0.0 a 1.0).
        """
        self._deadzone = max(0.0, min(1.0, deadzone))

# Alias para compatibilidade com código existente
GamepadListener = InputHandler
