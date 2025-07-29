from PyQt5.QtWidgets import QPushButton, QVBoxLayout, QLabel, QWidget
from PyQt5.QtCore import Qt, QPropertyAnimation, QEasingCurve, pyqtProperty, pyqtSignal
from PyQt5.QtGui import QPixmap
from launcher.image_cache import baixar_imagem
import logging

logger = logging.getLogger(__name__)

class GameCard(QPushButton):
    """Widget de cartão de jogo para exibição na grade de jogos.
    
    Este widget exibe a capa do jogo, título e outras informações em um
    cartão interativo que pode ser focado e clicado.
    """
    
    # Sinal emitido quando o cartão é clicado
    clicked_with_id = pyqtSignal(str)
    
    def __init__(self, jogo, parent: QWidget = None):
        """Inicializa o cartão do jogo.
        
        Args:
            jogo: Dicionário com informações do jogo
            parent: Widget pai, se houver
        """
        super().__init__(parent)
        self.jogo = jogo
        self._scale = 1.0
        
        # Configurações iniciais
        self.setFocusPolicy(Qt.StrongFocus)
        self.setFixedSize(300, 400)
        self.setProperty('class', 'game-card')
        
        # Configura a animação de foco
        self.animation = QPropertyAnimation(self, b"scale")
        self.animation.setDuration(200)
        self.animation.setEasingCurve(QEasingCurve.OutBack)
        
        # Layout principal
        self.layout = QVBoxLayout()
        self.layout.setContentsMargins(10, 10, 10, 10)
        self.layout.setSpacing(8)
        self.setLayout(self.layout)
        
        # Inicializa a interface do usuário
        self._setup_ui()
        
        # Conecta o sinal de clique personalizado
        self.clicked.connect(self._on_clicked)

    def _setup_ui(self):
        """Configura os componentes da interface do usuário do cartão."""
        # Container da capa do jogo
        self.capa_container = QWidget()
        self.capa_container.setProperty('class', 'game-card-cover-container')
        capa_layout = QVBoxLayout(self.capa_container)
        capa_layout.setContentsMargins(0, 0, 0, 0)
        
        # Label para a capa do jogo
        self.capa = QLabel()
        self.capa.setFixedSize(280, 320)
        self.capa.setAlignment(Qt.AlignCenter)
        self.capa.setProperty('class', 'game-card-cover')
        capa_layout.addWidget(self.capa)
        
        # Adiciona o container da capa ao layout principal
        self.layout.addWidget(self.capa_container)
        
        # Container para as informações do jogo
        info_container = QWidget()
        info_container.setProperty('class', 'game-card-info')
        info_layout = QVBoxLayout(info_container)
        info_layout.setContentsMargins(5, 5, 5, 5)
        info_layout.setSpacing(4)
        
        # Nome do jogo
        self.nome_label = QLabel(self.jogo.get('nome', 'Sem nome'))
        self.nome_label.setProperty('class', 'game-card-title')
        self.nome_label.setWordWrap(True)
        self.nome_label.setAlignment(Qt.AlignCenter)
        info_layout.addWidget(self.nome_label)
        
        # Fonte/plataforma do jogo
        if 'fonte' in self.jogo:
            self.fonte_label = QLabel(self.jogo['fonte'])
            self.fonte_label.setProperty('class', 'game-card-platform')
            self.fonte_label.setAlignment(Qt.AlignCenter)
            info_layout.addWidget(self.fonte_label)
        
        # Adiciona o container de informações ao layout principal
        self.layout.addWidget(info_container)
        
        # Carrega a imagem da capa em segundo plano
        self._load_cover_image()

    def _load_cover_image(self):
        """Carrega a imagem da capa do jogo de forma assíncrona."""
        cover_url = self.jogo.get("capa")
        if not cover_url:
            self.capa.setText("Sem capa")
            return
            
        # Define uma imagem de placeholder enquanto carrega
        placeholder = QPixmap(280, 320)
        placeholder.fill(Qt.transparent)
        self.capa.setPixmap(placeholder)
        
        # Usa a thread de I/O para baixar a imagem
        def on_image_loaded(pixmap):
            if pixmap and not pixmap.isNull():
                self.capa.setPixmap(
                    pixmap.scaled(
                        self.capa.size(), 
                        Qt.KeepAspectRatio, 
                        Qt.SmoothTransformation
                    )
                )
            else:
                self.capa.setText("Erro ao carregar")
        
        # Inicia o download da imagem
        baixar_imagem(cover_url, on_image_loaded)
    
    def enterEvent(self, event):
        """Evento quando o mouse entra no cartão."""
        self.setCursor(Qt.PointingHandCursor)
        self._start_animation(1.05)  # Efeito de hover mais sutil
        super().enterEvent(event)
    
    def leaveEvent(self, event):
        """Evento quando o mouse sai do cartão."""
        self.setCursor(Qt.ArrowCursor)
        self._start_animation(1.0)
        super().leaveEvent(event)
    
    def focusInEvent(self, event):
        """Evento quando o cartão recebe foco (teclado ou programaticamente)."""
        self._start_animation(1.05)
        super().focusInEvent(event)
    
    def focusOutEvent(self, event):
        """Evento quando o cartão perde o foco."""
        self._start_animation(1.0)
        super().focusOutEvent(event)
    
    def _start_animation(self, target_scale):
        """Inicia a animação de escala do cartão."""
        if self.animation.state() == QPropertyAnimation.Running:
            self.animation.pause()
        
        self.animation.setStartValue(self._scale)
        self.animation.setEndValue(target_scale)
        self.animation.start()
    
    def _on_clicked(self):
        """Manipulador de clique do cartão."""
        jogo_id = self.jogo.get('id')
        if jogo_id:
            self.clicked_with_id.emit(jogo_id)

    def getScale(self):
        """Obtém o fator de escala atual do cartão."""
        return self._scale
    
    def setScale(self, scale):
        """Define o fator de escala do cartão com animação suave."""
        if self._scale == scale:
            return
            
        self._scale = scale
        self.setFixedSize(300 * scale, 400 * scale)
        
        # Atualiza o tamanho da fonte com base na escala para melhor legibilidade
        if hasattr(self, 'nome_label'):
            base_size = 16  # Tamanho base da fonte
            scaled_size = max(10, int(base_size * (0.8 + 0.2 * scale)))
            self.nome_label.setStyleSheet(f"font-size: {scaled_size}px;")
    
    # Define a propriedade scale para animação
    scale = pyqtProperty(float, getScale, setScale)
    scale = pyqtProperty(float, getScale, setScale)
