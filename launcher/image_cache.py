"""
Módulo para gerenciar o cache de imagens do NIX Launcher.

Este módulo fornece funcionalidades para baixar e armazenar em cache imagens de capas de jogos,
melhorando o desempenho e reduzindo o uso de largura de banda.
"""

import os
import hashlib
import logging
from pathlib import Path
from typing import Optional

import requests
from PyQt5.QtGui import QPixmap

# Configuração de logging
logger = logging.getLogger(__name__)

# Tamanho máximo do cache em bytes (50MB)
MAX_CACHE_SIZE = 50 * 1024 * 1024

class ImageCache:
    """Classe para gerenciar o cache de imagens."""
    
    def __init__(self, cache_dir: Optional[str] = None, max_size: int = MAX_CACHE_SIZE):
        """
        Inicializa o gerenciador de cache de imagens.
        
        Args:
            cache_dir: Diretório para armazenar as imagens em cache. Se None, usa um diretório padrão.
            max_size: Tamanho máximo do cache em bytes.
        """
        self.cache_dir = Path(cache_dir) if cache_dir else Path.home() / ".cache" / "nix_launcher" / "images"
        self.max_size = max_size
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Verifica o tamanho do cache e limpa se necessário
        self._check_cache_size()
    
    def get_image(self, url: str, timeout: int = 10) -> Optional[QPixmap]:
        """
        Obtém uma imagem do cache ou baixa se não estiver em cache.
        
        Args:
            url: URL da imagem a ser baixada.
            timeout: Tempo máximo de espera para o download em segundos.
            
        Returns:
            Um QPixmap com a imagem ou None em caso de erro.
        """
        if not url:
            return None
        
        # Gera um nome de arquivo único para a URL
        file_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
        file_extension = os.path.splitext(url)[1].lower()
        
        # Garante que a extensão seja válida
        if not file_extension or len(file_extension) > 5:
            file_extension = '.jpg'  # Extensão padrão
            
        cache_path = self.cache_dir / f"{file_hash}{file_extension}"
        
        # Tenta carregar do cache
        if cache_path.exists():
            try:
                pixmap = QPixmap(str(cache_path))
                if not pixmap.isNull():
                    logger.debug(f"Imagem carregada do cache: {cache_path}")
                    return pixmap
            except Exception as e:
                logger.warning(f"Erro ao carregar imagem do cache {cache_path}: {e}")
        
        # Se não estiver em cache ou ocorrer erro, baixa a imagem
        return self._download_image(url, cache_path, timeout)
    
    def _download_image(self, url: str, cache_path: Path, timeout: int) -> Optional[QPixmap]:
        """
        Baixa uma imagem e salva no cache.
        
        Args:
            url: URL da imagem.
            cache_path: Caminho para salvar a imagem em cache.
            timeout: Tempo máximo de espera para o download.
            
        Returns:
            Um QPixmap com a imagem ou None em caso de erro.
        """
        try:
            logger.info(f"Baixando imagem: {url}")
            response = requests.get(url, timeout=timeout, stream=True)
            response.raise_for_status()
            
            # Lê o conteúdo em blocos para lidar com imagens grandes
            content = b''
            for chunk in response.iter_content(chunk_size=8192):
                content += chunk
            
            # Carrega a imagem
            pixmap = QPixmap()
            if pixmap.loadFromData(content):
                # Salva a imagem no cache
                with open(cache_path, 'wb') as f:
                    f.write(content)
                logger.debug(f"Imagem salva em cache: {cache_path}")
                return pixmap
            else:
                logger.error(f"Falha ao carregar imagem de dados baixados: {url}")
                
        except requests.RequestException as e:
            logger.error(f"Erro ao baixar imagem {url}: {e}")
        except Exception as e:
            logger.error(f"Erro inesperado ao processar imagem {url}: {e}", exc_info=True)
        
        return None
    
    def clear_cache(self) -> None:
        """Remove todas as imagens do cache."""
        try:
            for file in self.cache_dir.glob("*"):
                if file.is_file():
                    file.unlink()
            logger.info("Cache de imagens limpo com sucesso")
        except Exception as e:
            logger.error(f"Erro ao limpar cache de imagens: {e}")
    
    def _check_cache_size(self) -> None:
        """Verifica o tamanho do cache e limpa se exceder o limite."""
        try:
            total_size = sum(f.stat().st_size for f in self.cache_dir.glob('*') if f.is_file())
            
            if total_size > self.max_size:
                logger.info(f"Tamanho do cache ({total_size/1024/1024:.2f}MB) excedeu o limite de {self.max_size/1024/1024}MB")
                self.clear_cache()
        except Exception as e:
            logger.error(f"Erro ao verificar tamanho do cache: {e}")


# Instância global do cache de imagens
image_cache = ImageCache()

# Função de conveniência para compatibilidade com código legado
def baixar_imagem(url: str, timeout: int = 10) -> Optional[QPixmap]:
    """
    Função de conveniência para compatibilidade com código legado.
    
    Args:
        url: URL da imagem a ser baixada.
        timeout: Tempo máximo de espera para o download em segundos.
        
    Returns:
        Um QPixmap com a imagem ou None em caso de erro.
    """
    return image_cache.get_image(url, timeout)
