"""
Módulo que define a classe Game, representando um jogo no NIX Launcher.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Dict, Any, List

@dataclass
class Game:
    """Classe que representa um jogo no NIX Launcher.
    
    Atributos:
        id: Identificador único do jogo
        name: Nome do jogo
        platform: Plataforma do jogo (ex: "PC", "SNES", "PlayStation")
        executable: Caminho para o executável do jogo
        install_dir: Diretório de instalação do jogo
        icon: Caminho para o ícone do jogo
        image: Caminho para a imagem de capa do jogo
        metadata: Metadados adicionais do jogo
    """
    id: str
    name: str
    platform: str
    executable: str
    install_dir: str
    icon: Optional[str] = None
    image: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte o jogo para um dicionário.
        
        Returns:
            Dicionário com os dados do jogo.
        """
        return {
            "id": self.id,
            "name": self.name,
            "platform": self.platform,
            "executable": self.executable,
            "install_dir": self.install_dir,
            "icon": self.icon,
            "image": self.image,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Game':
        """Cria uma instância de Game a partir de um dicionário.
        
        Args:
            data: Dicionário com os dados do jogo.
            
        Returns:
            Instância de Game.
        """
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            platform=data.get("platform", ""),
            executable=data.get("executable", ""),
            install_dir=data.get("install_dir", ""),
            icon=data.get("icon"),
            image=data.get("image"),
            metadata=data.get("metadata", {})
        )
    
    def get_absolute_path(self) -> Path:
        """Retorna o caminho absoluto para o executável do jogo.
        
        Returns:
            Caminho absoluto para o executável.
        """
        if Path(self.executable).is_absolute():
            return Path(self.executable)
        return Path(self.install_dir) / self.executable
    
    def is_installed(self) -> bool:
        """Verifica se o jogo está instalado.
        
        Returns:
            True se o jogo estiver instalado, False caso contrário.
        """
        return self.get_absolute_path().exists()
    
    def __str__(self) -> str:
        return f"{self.name} ({self.platform})"
    
    def __repr__(self) -> str:
        return f"<Game name='{self.name}' platform='{self.platform}'>"
