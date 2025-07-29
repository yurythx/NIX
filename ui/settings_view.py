"""
Módulo para a visualização de configurações do NIX Launcher.

Este módulo define a interface do usuário para as configurações do aplicativo,
permitindo que os usuários personalizem a aparência e o comportamento do launcher.
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional

from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QLabel, QPushButton, QComboBox, 
    QFormLayout, QCheckBox, QSpinBox, QFileDialog, QMessageBox
)
from PyQt5.QtCore import Qt

from config import settings
from utils.theme_manager import theme_manager

logger = logging.getLogger(__name__)

class SettingsView(QWidget):
    """Visualização de configurações do NIX Launcher."""
    
    def __init__(self, parent: Optional[QWidget] = None):
        """Inicializa a visualização de configurações.
        
        Args:
            parent: Widget pai, se houver.
        """
        super().__init__(parent)
        
        # Configurações iniciais
        self.settings_changed = False
        self.original_settings: Dict[str, Any] = {}
        
        # Inicializa a interface do usuário
        self._init_ui()
        
        # Carrega as configurações atuais
        self._load_settings()
    
    def _init_ui(self) -> None:
        """Inicializa os componentes da interface do usuário."""
        # Layout principal
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(20, 20, 20, 20)
        self.layout.setSpacing(15)
        
        # Título
        title = QLabel("Configurações")
        title.setProperty('class', 'settings-title')
        self.layout.addWidget(title)
        
        # Formulário de configurações
        self.form_layout = QFormLayout()
        self.form_layout.setHorizontalSpacing(20)
        self.form_layout.setVerticalSpacing(10)
        
        # Tema
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Escuro", "Claro", "Sistema"])
        self.theme_combo.currentIndexChanged.connect(self._on_setting_changed)
        self.form_layout.addRow("Tema:", self.theme_combo)
        
        # Modo tela cheia
        self.fullscreen_check = QCheckBox("Iniciar em tela cheia")
        self.fullscreen_check.stateChanged.connect(self._on_setting_changed)
        self.form_layout.addRow("", self.fullscreen_check)
        
        # Tamanho da fonte
        self.font_size_spin = QSpinBox()
        self.font_size_spin.setRange(8, 24)
        self.font_size_spin.setSuffix(" px")
        self.font_size_spin.valueChanged.connect(self._on_setting_changed)
        self.form_layout.addRow("Tamanho da fonte:", self.font_size_spin)
        
        # Diretório de instalação padrão
        self.install_dir_btn = QPushButton("Selecionar diretório...")
        self.install_dir_btn.setProperty('class', 'browse-button')
        self.install_dir_btn.clicked.connect(self._select_install_dir)
        self.install_dir_label = QLabel()
        self.install_dir_label.setWordWrap(True)
        self.form_layout.addRow("Diretório de instalação:", self.install_dir_btn)
        self.form_layout.addRow("", self.install_dir_label)
        
        self.layout.addLayout(self.form_layout)
        
        # Botões de ação
        self.button_layout = QVBoxLayout()
        self.button_layout.setSpacing(10)
        
        # Botão Salvar
        self.save_btn = QPushButton("Salvar configurações")
        self.save_btn.setProperty('class', 'primary-button')
        self.save_btn.setEnabled(False)
        self.save_btn.clicked.connect(self._save_settings)
        
        # Botão Padrão
        self.default_btn = QPushButton("Restaurar padrões")
        self.default_btn.setProperty('class', 'secondary-button')
        self.default_btn.clicked.connect(self._restore_defaults)
        
        self.button_layout.addWidget(self.save_btn)
        self.button_layout.addWidget(self.default_btn)
        self.button_layout.addStretch()
        
        self.layout.addLayout(self.button_layout)
        self.layout.addStretch()
    
    def _load_settings(self) -> None:
        """Carrega as configurações atuais nos controles."""
        try:
            # Armazena as configurações atuais para comparação
            self.original_settings = {
                'theme': settings.get('ui.theme', 'dark'),
                'fullscreen': settings.get('ui.fullscreen', False),
                'font_size': settings.get('ui.font_size', 12),
                'install_dir': settings.get('game.default_install_dir', str(Path.home() / 'Games'))
            }
            
            # Aplica as configurações aos controles
            theme_map = {'dark': 0, 'light': 1, 'system': 2}
            self.theme_combo.setCurrentIndex(theme_map.get(self.original_settings['theme'], 0))
            self.fullscreen_check.setChecked(self.original_settings['fullscreen'])
            self.font_size_spin.setValue(self.original_settings['font_size'])
            self.install_dir_label.setText(self.original_settings['install_dir'])
            
            # Reseta a flag de alteração
            self.settings_changed = False
            self.save_btn.setEnabled(False)
            
        except Exception as e:
            logger.error(f"Erro ao carregar configurações: {e}")
            QMessageBox.critical(
                self,
                "Erro",
                f"Não foi possível carregar as configurações:\n{str(e)}"
            )
    
    def _on_setting_changed(self, _=None) -> None:
        """Método chamado quando uma configuração é alterada."""
        self.settings_changed = True
        self.save_btn.setEnabled(True)
    
    def _select_install_dir(self) -> None:
        """Abre um diálogo para selecionar o diretório de instalação."""
        current_dir = self.install_dir_label.text() or str(Path.home())
        dir_path = QFileDialog.getExistingDirectory(
            self,
            "Selecionar diretório de instalação",
            current_dir,
            QFileDialog.ShowDirsOnly | QFileDialog.DontResolveSymlinks
        )
        
        if dir_path:
            self.install_dir_label.setText(dir_path)
            self._on_setting_changed()
    
    def _save_settings(self) -> None:
        """Salva as configurações alteradas."""
        try:
            # Mapeia o índice do tema para o valor correspondente
            theme_map = {0: 'dark', 1: 'light', 2: 'system'}
            
            # Atualiza as configurações
            settings.set('ui.theme', theme_map.get(self.theme_combo.currentIndex(), 'dark'))
            settings.set('ui.fullscreen', self.fullscreen_check.isChecked())
            settings.set('ui.font_size', self.font_size_spin.value())
            settings.set('game.default_install_dir', self.install_dir_label.text())
            
            # Atualiza as configurações originais
            self.original_settings = {
                'theme': settings.get('ui.theme'),
                'fullscreen': settings.get('ui.fullscreen'),
                'font_size': settings.get('ui.font_size'),
                'install_dir': settings.get('game.default_install_dir')
            }
            
            # Desabilita o botão de salvar
            self.settings_changed = False
            self.save_btn.setEnabled(False)
            
            # Mostra mensagem de sucesso
            QMessageBox.information(
                self,
                "Configurações salvas",
                "As configurações foram salvas com sucesso!"
            )
            
        except Exception as e:
            logger.error(f"Erro ao salvar configurações: {e}")
            QMessageBox.critical(
                self,
                "Erro",
                f"Não foi possível salvar as configurações:\n{str(e)}"
            )
    
    def _restore_defaults(self) -> None:
        """Restaura as configurações padrão."""
        try:
            from config.settings import DEFAULT_SETTINGS
            
            # Pede confirmação ao usuário
            reply = QMessageBox.question(
                self,
                "Restaurar padrões",
                "Tem certeza que deseja restaurar as configurações padrão?\n"
                "Todas as suas personalizações serão perdidas.",
                QMessageBox.Yes | QMessageBox.No,
                QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                # Restaura as configurações padrão
                settings.clear()
                
                # Recarrega as configurações
                self._load_settings()
                
                # Marca como alterado para forçar o salvamento
                self.settings_changed = True
                self._save_settings()
                
        except Exception as e:
            logger.error(f"Erro ao restaurar configurações padrão: {e}")
            QMessageBox.critical(
                self,
                "Erro",
                f"Não foi possível restaurar as configurações padrão:\n{str(e)}"
            )
