from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton
from PyQt5.QtCore import Qt
from launcher.game_launcher import iniciar_jogo

class GameDetailView(QWidget):
    def __init__(self, jogo, voltar_callback):
        super().__init__()
        self.jogo = jogo
        self.voltar = voltar_callback
        self.setLayout(QVBoxLayout())
        self.setStyleSheet("background-color:#111; color:white;")
        self._setup_ui()

    def _setup_ui(self):
        titulo = QLabel(self.jogo['nome'])
        titulo.setAlignment(Qt.AlignCenter)
        titulo.setStyleSheet("font-size:36px;")
        self.layout().addWidget(titulo)
        desc = QLabel(self.jogo.get('descricao', 'Sem descrição disponível.'))
        desc.setWordWrap(True)
        desc.setStyleSheet("font-size:18px; padding:20px;")
        self.layout().addWidget(desc)
        btn_jogar = QPushButton("Jogar")
        btn_jogar.setFixedSize(200,60)
        btn_jogar.clicked.connect(self._jogar)
        self.layout().addWidget(btn_jogar, alignment=Qt.AlignCenter)
        btn_voltar = QPushButton("Voltar")
        btn_voltar.setFixedSize(200,60)
        btn_voltar.clicked.connect(self.voltar)
        self.layout().addWidget(btn_voltar, alignment=Qt.AlignCenter)

    def _jogar(self):
        iniciar_jogo(self.jogo.get("executavel"))
