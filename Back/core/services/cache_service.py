"""
Serviço de cache para otimizar o processamento de arquivos
"""

import os
import hashlib
import json
import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class CacheService:
    """
    Serviço para gerenciar cache de arquivos e dados
    """
    
    def __init__(self):
        """
        Inicializa o serviço de cache
        """
        self.pdf_cache_dir = getattr(settings, 'PDF_CACHE_DIR', os.path.join(settings.MEDIA_ROOT, 'pdf_cache'))
        self.audio_cache_dir = getattr(settings, 'AUDIO_CACHE_DIR', os.path.join(settings.MEDIA_ROOT, 'audio_cache'))
        
        # Criar diretórios de cache se não existirem
        os.makedirs(self.pdf_cache_dir, exist_ok=True)
        os.makedirs(self.audio_cache_dir, exist_ok=True)
    
    def get_file_hash(self, file_path):
        """
        Calcula o hash MD5 de um arquivo
        """
        if not os.path.exists(file_path):
            return None
        
        try:
            with open(file_path, 'rb') as f:
                file_hash = hashlib.md5()
                # Ler o arquivo em chunks para não sobrecarregar a memória
                for chunk in iter(lambda: f.read(4096), b''):
                    file_hash.update(chunk)
                return file_hash.hexdigest()
        except Exception as e:
            logger.error(f"Erro ao calcular hash do arquivo {file_path}: {str(e)}")
            return None
    
    def get_cache_path(self, file_path, cache_type='pdf', suffix=''):
        """
        Retorna o caminho para o arquivo de cache
        """
        file_hash = self.get_file_hash(file_path)
        if not file_hash:
            return None
        
        # Determinar o diretório de cache com base no tipo
        if cache_type == 'pdf':
            cache_dir = self.pdf_cache_dir
        elif cache_type == 'audio':
            cache_dir = self.audio_cache_dir
        else:
            cache_dir = os.path.join(settings.MEDIA_ROOT, f'{cache_type}_cache')
            os.makedirs(cache_dir, exist_ok=True)
        
        # Criar subdiretório baseado nos primeiros caracteres do hash para evitar muitos arquivos em um único diretório
        subdir = os.path.join(cache_dir, file_hash[:2])
        os.makedirs(subdir, exist_ok=True)
        
        # Retornar o caminho completo do arquivo de cache
        filename = f"{file_hash}{suffix}"
        return os.path.join(subdir, filename)
    
    def get_cached_data(self, key, default=None, timeout=None):
        """
        Obtém dados do cache
        """
        return cache.get(key, default)
    
    def set_cached_data(self, key, data, timeout=None):
        """
        Armazena dados no cache
        """
        cache.set(key, data, timeout=timeout)
    
    def get_cached_file(self, file_path, cache_type='pdf', suffix=''):
        """
        Verifica se existe um arquivo em cache e retorna seu caminho
        """
        cache_path = self.get_cache_path(file_path, cache_type, suffix)
        if cache_path and os.path.exists(cache_path):
            return cache_path
        return None
    
    def save_to_cache(self, file_path, data, cache_type='pdf', suffix=''):
        """
        Salva dados em um arquivo de cache
        """
        cache_path = self.get_cache_path(file_path, cache_type, suffix)
        if not cache_path:
            return None
        
        try:
            # Se os dados forem um dicionário ou lista, salvar como JSON
            if isinstance(data, (dict, list)):
                with open(cache_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            # Se for bytes, salvar como binário
            elif isinstance(data, bytes):
                with open(cache_path, 'wb') as f:
                    f.write(data)
            # Caso contrário, salvar como texto
            else:
                with open(cache_path, 'w', encoding='utf-8') as f:
                    f.write(str(data))
            
            return cache_path
        except Exception as e:
            logger.error(f"Erro ao salvar no cache {cache_path}: {str(e)}")
            return None
    
    def clear_cache(self, cache_type=None):
        """
        Limpa o cache de um tipo específico ou todo o cache
        """
        try:
            if cache_type == 'pdf':
                self._clear_directory(self.pdf_cache_dir)
            elif cache_type == 'audio':
                self._clear_directory(self.audio_cache_dir)
            elif cache_type is None:
                # Limpar todos os caches
                self._clear_directory(self.pdf_cache_dir)
                self._clear_directory(self.audio_cache_dir)
            else:
                cache_dir = os.path.join(settings.MEDIA_ROOT, f'{cache_type}_cache')
                if os.path.exists(cache_dir):
                    self._clear_directory(cache_dir)
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {str(e)}")
    
    def _clear_directory(self, directory):
        """
        Limpa um diretório removendo todos os arquivos e subdiretórios
        """
        if not os.path.exists(directory):
            return
        
        for root, dirs, files in os.walk(directory, topdown=False):
            for file in files:
                os.remove(os.path.join(root, file))
            for dir in dirs:
                os.rmdir(os.path.join(root, dir))

# Instância global do serviço de cache
cache_service = CacheService()
