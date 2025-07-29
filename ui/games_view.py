from PyQt5.QtWidgets import (QWidget, QLabel, QVBoxLayout, QGridLayout, 
                            QScrollArea, QMessageBox)
from PyQt5.QtCore import Qt, QTimer
from ui.game_card import GameCard
from ui.game_detail_view import GameDetailView
from launcher.input_handler import GamepadListener
from launcher.game_manager import game_manager
import logging

logger = logging.getLogger(__name__)

class GamesView(QWidget):
    def __init__(self):
        super().__init__()
        self.setStyleSheet("background-color:#111;")
        self.setLayout(QVBoxLayout())
        self.cards = []
        self.indice = 0
        self.cols = 3
        
        # Configura o gerenciador de jogos
        self.game_manager = game_manager
        
        # Configura a interface do usuário
        self._setup_ui()
        
        # Configura o listener de gamepad
        self.gp = GamepadListener(self._on_gp)
        self.gp.start()
        
        # Inicializa o carregamento dos jogos em background
        self._init_game_loading()

    def _setup_ui(self):
        titulo = QLabel("Minha Biblioteca")
        titulo.setAlignment(Qt.AlignCenter)
        titulo.setStyleSheet("font-size:32px; color:white; padding:20px;")
        self.layout().addWidget(titulo)
        self.sa = QScrollArea()
        self.container = QWidget()
        self.grid = QGridLayout()
        self.grid.setSpacing(20)
        self.container.setLayout(self.grid)
        self.sa.setWidgetResizable(True)
        self.sa.setWidget(self.container)
        self.layout().addWidget(self.sa)

    def _init_game_loading(self):
        """Inicializa o carregamento dos jogos de forma assíncrona."""
        # Exibe uma mensagem de carregamento
        self.loading_label = QLabel("Carregando jogos...")
        self.loading_label.setStyleSheet("color: white; font-size: 24px;")
        self.loading_label.setAlignment(Qt.AlignCenter)
        self.layout().addWidget(self.loading_label)
        
        # Inicializa o gerenciador de jogos em uma thread separada
        QTimer.singleShot(100, self._initialize_game_manager)
    
    def _initialize_game_manager(self):
        """Inicializa o gerenciador de jogos e carrega os jogos."""
        try:
            # Inicializa o gerenciador de jogos
            if not self.game_manager.initialize():
                raise Exception("Falha ao inicializar o gerenciador de jogos")
            
            # Registra o callback para atualizações da lista de jogos
            self.game_manager.add_game_list_updated_callback(self._on_games_updated)
            
            # Força uma atualização inicial dos jogos
            self.game_manager.refresh_games()
            
        except Exception as e:
            logger.error(f"Erro ao carregar jogos: {e}", exc_info=True)
            QMessageBox.critical(
                self, 
                "Erro", 
                f"Não foi possível carregar os jogos: {str(e)}"
            )
            # Remove a mensagem de carregamento em caso de erro
            if hasattr(self, 'loading_label'):
                self.loading_label.deleteLater()
    
    def _on_games_updated(self, games):
        """Callback chamado quando a lista de jogos é atualizada."""
        try:
            # Remove a mensagem de carregamento se existir
            if hasattr(self, 'loading_label'):
                self.loading_label.deleteLater()
                del self.loading_label
            
            # Limpa os cards existentes
            self._clear_games()
            
            # Adiciona os novos jogos
            for idx, game in enumerate(games):
                self._add_game_card(game, idx)
            
            # Define o foco no primeiro jogo, se houver jogos
            if self.cards:
                self._set_focus(0)
            
        except Exception as e:
            logger.error(f"Erro ao atualizar a lista de jogos: {e}", exc_info=True)
    
    def _clear_games(self):
        """Remove todos os cards de jogos da interface."""
        for card in self.cards:
            card.deleteLater()
        self.cards = []
        self.indice = 0
    
    def _add_game_card(self, game, index):
        """Adiciona um card de jogo à grade."""
        try:
            # Converte o jogo para o formato esperado pelo GameCard
            jogo = {
                'id': game.id,
                'name': game.name,
                'platform': game.platform,
                'banner': game.banner,
                'icon': game.icon,
                'playtime': game.playtime,
                'last_played': game.last_played
            }
            
            # Cria o card do jogo
            card = GameCard(jogo)
            card.clicked.connect(lambda _, c=card, g=game: self._open_detail(g, c))
            
            # Adiciona o card à grade
            self.cards.append(card)
            row = len(self.cards) // self.cols
            col = len(self.cards) % self.cols
            self.grid.addWidget(card, row, col)
            
        except Exception as e:
            logger.error(f"Erro ao adicionar card do jogo {game.name}: {e}")

    def keyPressEvent(self, e):
        k = e.key()
        if k in (Qt.Key_Right, Qt.Key_Left, Qt.Key_Up, Qt.Key_Down):
            d = {Qt.Key_Right:1, Qt.Key_Left:-1,
                 Qt.Key_Down:self.cols, Qt.Key_Up:-self.cols}.get(k)
            self._move(d)
        elif k in (Qt.Key_Return, Qt.Key_Enter):
            self.cards[self.indice].click()
        else:
            super().keyPressEvent(e)

    def _on_gp(self, code, state):
        if state != 1:
            return
        if code == "BTN_DPAD_RIGHT": self._move(1)
        elif code == "BTN_DPAD_LEFT": self._move(-1)
        elif code == "BTN_DPAD_DOWN": self._move(self.cols)
        elif code == "BTN_DPAD_UP": self._move(-self.cols)
        elif code == "BTN_SOUTH": self.cards[self.indice].click()

    def _move(self, delta):
        new = self.indice + delta
        if 0 <= new < len(self.cards):
            self._set_focus(new)

    def _set_focus(self, i):
        if self.cards:
            self.cards[self.indice].clearFocus()
            self.indice = i
            self.cards[self.indice].setFocus()
            self.cards[self.indice].ensureVisible()

    def _open_detail(self, jogo, card):
        """Abre a visualização detalhada de um jogo."""
        try:
            # Converte o jogo para o formato esperado pelo GameDetailView
            jogo_dict = {
                'id': jogo.id,
                'name': jogo.name,
                'platform': jogo.platform,
                'banner': jogo.banner,
                'icon': jogo.icon,
                'playtime': jogo.playtime,
                'last_played': jogo.last_played,
                'metadata': jogo.metadata or {}
            }
            
            # Cria e exibe a visualização detalhada
            dv = GameDetailView(jogo_dict, lambda: self._back_to_grid())
            self.layout().addWidget(dv)
            dv.setFocus()
            card.clearFocus()
            
        except Exception as e:
            logger.error(f"Erro ao abrir detalhes do jogo: {e}", exc_info=True)
            QMessageBox.warning(
                self,
                "Erro",
                f"Não foi possível abrir os detalhes do jogo: {str(e)}"
            )

    def _back_to_grid(self):
        w = self.layout().itemAt(1).widget()
        w.deleteLater()
        self._set_focus(self.indice)
