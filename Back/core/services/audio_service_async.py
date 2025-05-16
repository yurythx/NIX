"""
Extensão do serviço de áudio com suporte a carregamento assíncrono
"""

import os
import logging
from django.core.cache import cache
from core.services.audio_service import AudioService, MUTAGEN_AVAILABLE
from core.services.async_loader import async_loader

# Configurar logging
logger = logging.getLogger(__name__)

class AsyncAudioService(AudioService):
    """
    Serviço para gerenciar operações com arquivos de áudio com suporte a carregamento assíncrono
    """
    
    def __init__(self):
        """
        Inicializa o serviço de áudio assíncrono
        """
        super().__init__()
    
    def preload_audio(self, audio_path, callback=None):
        """
        Pré-carrega um arquivo de áudio em segundo plano
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            callback (callable): Função a ser chamada quando o carregamento for concluído
            
        Returns:
            str: ID da tarefa
        """
        # Verificar se o arquivo existe
        if not os.path.exists(audio_path):
            logger.error(f"Arquivo de áudio não encontrado: {audio_path}")
            return None
        
        # Adicionar tarefa para carregar o áudio
        task_id = async_loader.add_task(
            self._preload_audio_task,
            args=(audio_path,),
            callback=callback
        )
        
        return task_id
    
    def _preload_audio_task(self, audio_path):
        """
        Tarefa para pré-carregar um arquivo de áudio
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            
        Returns:
            dict: Informações sobre o áudio
        """
        try:
            # Obter informações sobre o áudio
            info = self.get_audio_info(audio_path)
            
            # Obter os marcadores
            markers = self.get_audio_markers(audio_path)
            
            return {
                'info': info,
                'markers': markers
            }
        except Exception as e:
            logger.error(f"Erro ao pré-carregar áudio: {str(e)}")
            return None
    
    def preload_audio_chunk(self, audio_path, chunk_size=1024*1024, callback=None):
        """
        Pré-carrega um chunk de um arquivo de áudio em segundo plano
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            chunk_size (int): Tamanho do chunk em bytes
            callback (callable): Função a ser chamada quando o carregamento for concluído
            
        Returns:
            str: ID da tarefa
        """
        # Verificar se o arquivo existe
        if not os.path.exists(audio_path):
            logger.error(f"Arquivo de áudio não encontrado: {audio_path}")
            return None
        
        # Adicionar tarefa para carregar o chunk
        task_id = async_loader.add_task(
            self._preload_audio_chunk_task,
            args=(audio_path, chunk_size),
            callback=callback
        )
        
        return task_id
    
    def _preload_audio_chunk_task(self, audio_path, chunk_size=1024*1024):
        """
        Tarefa para pré-carregar um chunk de um arquivo de áudio
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            chunk_size (int): Tamanho do chunk em bytes
            
        Returns:
            dict: Informações sobre o chunk
        """
        try:
            # Obter o tamanho do arquivo
            file_size = os.path.getsize(audio_path)
            
            # Calcular o número de chunks
            num_chunks = (file_size + chunk_size - 1) // chunk_size
            
            # Ler o primeiro chunk
            with open(audio_path, 'rb') as f:
                first_chunk = f.read(chunk_size)
            
            # Gerar uma chave de cache para o chunk
            cache_key = f"audio_chunk_{os.path.basename(audio_path)}_0"
            
            # Armazenar o chunk em cache
            cache.set(cache_key, first_chunk, timeout=3600)  # Cache por 1 hora
            
            return {
                'file_size': file_size,
                'chunk_size': chunk_size,
                'num_chunks': num_chunks,
                'first_chunk_cached': True
            }
        except Exception as e:
            logger.error(f"Erro ao pré-carregar chunk de áudio: {str(e)}")
            return None
    
    def get_audio_chunk(self, audio_path, chunk_index, chunk_size=1024*1024):
        """
        Obtém um chunk de um arquivo de áudio
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            chunk_index (int): Índice do chunk
            chunk_size (int): Tamanho do chunk em bytes
            
        Returns:
            bytes: Chunk do arquivo de áudio
        """
        try:
            # Verificar se o arquivo existe
            if not os.path.exists(audio_path):
                logger.error(f"Arquivo de áudio não encontrado: {audio_path}")
                return None
            
            # Gerar uma chave de cache para o chunk
            cache_key = f"audio_chunk_{os.path.basename(audio_path)}_{chunk_index}"
            
            # Verificar se o chunk já está em cache
            cached_chunk = cache.get(cache_key)
            if cached_chunk:
                return cached_chunk
            
            # Obter o tamanho do arquivo
            file_size = os.path.getsize(audio_path)
            
            # Calcular o número de chunks
            num_chunks = (file_size + chunk_size - 1) // chunk_size
            
            # Verificar se o índice do chunk é válido
            if chunk_index < 0 or chunk_index >= num_chunks:
                logger.error(f"Índice de chunk inválido: {chunk_index}")
                return None
            
            # Calcular a posição inicial e o tamanho do chunk
            start_pos = chunk_index * chunk_size
            end_pos = min(start_pos + chunk_size, file_size)
            chunk_size_actual = end_pos - start_pos
            
            # Ler o chunk
            with open(audio_path, 'rb') as f:
                f.seek(start_pos)
                chunk = f.read(chunk_size_actual)
            
            # Armazenar o chunk em cache
            cache.set(cache_key, chunk, timeout=3600)  # Cache por 1 hora
            
            return chunk
        except Exception as e:
            logger.error(f"Erro ao obter chunk de áudio: {str(e)}")
            return None
    
    def get_preload_status(self, task_id):
        """
        Obtém o status de uma tarefa de pré-carregamento
        
        Args:
            task_id (str): ID da tarefa
            
        Returns:
            dict: Status da tarefa
        """
        # Obter o resultado da tarefa
        result = async_loader.get_result(task_id)
        
        if result is None:
            return {'status': 'pending'}
        
        return {'status': 'completed', 'result': result}

# Instância singleton do serviço
async_audio_service = AsyncAudioService()
