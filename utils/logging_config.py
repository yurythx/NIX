"""
Módulo de configuração centralizada de logging para o NIX Launcher.

Este módulo fornece funções para configurar o logging de forma consistente
toda a aplicação.
"""

import logging
import logging.handlers
from pathlib import Path
from typing import Optional, Union, Dict, Any

def setup_logging(
    log_file: Optional[Union[str, Path]] = None,
    console_level: int = logging.INFO,
    file_level: int = logging.DEBUG,
    max_bytes: int = 5 * 1024 * 1024,  # 5 MB
    backup_count: int = 3,
    log_format: Optional[str] = None,
) -> None:
    """Configura o logging para a aplicação.
    
    Args:
        log_file: Caminho para o arquivo de log. Se None, o logging para arquivo é desabilitado.
        console_level: Nível de log para o console.
        file_level: Nível de log para o arquivo.
        max_bytes: Tamanho máximo do arquivo de log em bytes antes de rotacionar.
        backup_count: Número de arquivos de log de backup a manter.
        log_format: Formato personalizado para as mensagens de log.
    """
    if log_format is None:
        log_format = (
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    # Configuração básica
    logging.basicConfig(
        level=min(console_level, file_level) if log_file else console_level,
        format=log_format,
        handlers=[]  # Remove handlers padrão para evitar duplicação
    )
    
    # Configura console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(console_level)
    console_handler.setFormatter(logging.Formatter(log_format))
    
    # Configura file handler se especificado
    handlers = [console_handler]
    if log_file:
        log_file = Path(log_file)
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(file_level)
        file_handler.setFormatter(logging.Formatter(log_format))
        handlers.append(file_handler)
    
    # Aplica os handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    for handler in handlers:
        root_logger.addHandler(handler)
    
    # Configura o nível do logger raiz
    root_logger.setLevel(min(console_level, file_level) if log_file else console_level)
    
    # Configura o nível de log para bibliotecas específicas
    logging.getLogger('PIL').setLevel(logging.WARNING)  # Reduz log do Pillow
    logging.getLogger('urllib3').setLevel(logging.WARNING)  # Reduz log de requisições HTTP

def get_logger(name: str = None) -> logging.Logger:
    """Obtém um logger configurado com o nome do módulo.
    
    Args:
        name: Nome do logger. Se None, retorna o logger raiz.
        
    Returns:
        Uma instância de Logger configurada.
    """
    return logging.getLogger(name)
