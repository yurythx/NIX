"""
Serviço para gerenciar operações com arquivos de áudio
"""

import os
import re
import logging
from django.http import FileResponse
from django.conf import settings
import json
import hashlib
from django.core.cache import cache

# Configurar logging
logger = logging.getLogger(__name__)

# Importar mutagen com tratamento de erro
try:
    import mutagen
    from mutagen.mp3 import MP3
    from mutagen.mp4 import MP4
    from mutagen.flac import FLAC
    from mutagen.oggvorbis import OggVorbis
    from mutagen.wave import WAVE
    MUTAGEN_AVAILABLE = True
except ImportError:
    logger.warning("Mutagen não encontrado. O processamento de metadados de áudio não estará disponível.")
    MUTAGEN_AVAILABLE = False

class AudioService:
    """
    Serviço para gerenciar operações com arquivos de áudio
    """
    
    def __init__(self):
        """
        Inicializa o serviço de áudio
        """
        # Garantir que o diretório de cache existe
        self.cache_dir = settings.AUDIO_CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Mapear extensões de arquivo para tipos MIME
        self.mime_types = {f'.{ext}': mime for ext, mime in settings.AUDIO_FORMATS.items()}
        
        # Mapear extensões de arquivo para classes Mutagen
        if MUTAGEN_AVAILABLE:
            self.mutagen_classes = {
                '.mp3': MP3,
                '.mp4': MP4,
                '.m4a': MP4,
                '.ogg': OggVorbis,
                '.oga': OggVorbis,
                '.flac': FLAC,
                '.wav': WAVE,
            }
        else:
            self.mutagen_classes = {}
    
    def get_audio_info(self, audio_path):
        """
        Obtém informações sobre um arquivo de áudio
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            
        Returns:
            dict: Informações sobre o áudio (duração, taxa de bits, etc.)
        """
        try:
            # Verificar se as informações já estão em cache
            cache_key = self._get_cache_key(audio_path, 'info')
            cached_info = cache.get(cache_key)
            
            if cached_info:
                return cached_info
            
            # Se não estiver em cache, extrair as informações
            ext = os.path.splitext(audio_path)[1].lower()
            
            # Obter o tipo MIME
            mime_type = self.mime_types.get(ext, 'application/octet-stream')
            
            # Obter o tamanho do arquivo
            file_size = os.path.getsize(audio_path)
            
            # Obter metadados usando Mutagen
            metadata = {}
            duration = 0
            bitrate = 0
            sample_rate = 0
            channels = 0
            
            if MUTAGEN_AVAILABLE and ext in self.mutagen_classes:
                try:
                    audio = self.mutagen_classes[ext](audio_path)
                    
                    # Obter duração
                    if hasattr(audio, 'info') and hasattr(audio.info, 'length'):
                        duration = audio.info.length
                    
                    # Obter taxa de bits
                    bitrate = getattr(audio.info, 'bitrate', 0)
                    
                    # Obter taxa de amostragem
                    sample_rate = getattr(audio.info, 'sample_rate', 0)
                    
                    # Obter canais
                    channels = getattr(audio.info, 'channels', 0)
                    
                    # Obter metadados
                    for key in audio:
                        if isinstance(audio[key], list):
                            metadata[key] = audio[key][0]
                        else:
                            metadata[key] = str(audio[key])
                except Exception as e:
                    logger.error(f"Erro ao extrair metadados do áudio: {str(e)}")
            
            # Criar objeto de informações
            info = {
                'mime_type': mime_type,
                'file_size': file_size,
                'duration': duration,
                'bitrate': bitrate,
                'sample_rate': sample_rate,
                'channels': channels,
                'metadata': metadata,
                'file_name': os.path.basename(audio_path)
            }
            
            # Armazenar em cache
            cache.set(cache_key, info, timeout=3600)  # Cache por 1 hora
            
            return info
        except Exception as e:
            logger.error(f"Erro ao obter informações do áudio: {str(e)}")
            return None
    
    def stream_audio(self, audio_path, range_header=None, speed=1.0):
        """
        Transmite um arquivo de áudio com suporte a streaming parcial
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            range_header (str): Cabeçalho Range para streaming parcial
            speed (float): Velocidade de reprodução (1.0 = normal)
            
        Returns:
            HttpResponse: Resposta HTTP com o conteúdo do áudio
        """
        try:
            # Verificar se o arquivo existe
            if not os.path.exists(audio_path):
                return None
            
            # Obter o tamanho do arquivo
            file_size = os.path.getsize(audio_path)
            
            # Obter o tipo MIME
            ext = os.path.splitext(audio_path)[1].lower()
            content_type = self.mime_types.get(ext, 'application/octet-stream')
            
            # Processar o cabeçalho Range
            start_byte = 0
            end_byte = file_size - 1
            
            if range_header:
                range_match = re.search(r'bytes=(\d+)-(\d*)', range_header)
                if range_match:
                    start_byte = int(range_match.group(1))
                    end_group = range_match.group(2)
                    if end_group:
                        end_byte = int(end_group)
            
            # Calcular o tamanho do conteúdo
            content_length = end_byte - start_byte + 1
            
            # Abrir o arquivo
            file = open(audio_path, 'rb')
            
            # Posicionar no byte inicial
            file.seek(start_byte)
            
            # Criar a resposta
            response = FileResponse(
                file,
                content_type=content_type,
                status=206 if range_header else 200
            )
            
            # Adicionar cabeçalhos
            response['Content-Length'] = content_length
            response['Accept-Ranges'] = 'bytes'
            
            if range_header:
                response['Content-Range'] = f'bytes {start_byte}-{end_byte}/{file_size}'
            
            # Adicionar cabeçalho para velocidade de reprodução
            if speed != 1.0:
                response['X-Audio-Speed'] = speed
            
            return response
        except Exception as e:
            logger.error(f"Erro ao transmitir áudio: {str(e)}")
            return None
    
    def create_audio_markers(self, audio_path, markers):
        """
        Cria marcadores para um arquivo de áudio
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            markers (list): Lista de marcadores (dicionários com 'time' e 'label')
            
        Returns:
            bool: True se os marcadores foram criados com sucesso, False caso contrário
        """
        try:
            # Criar nome de arquivo para os marcadores
            audio_hash = hashlib.md5(audio_path.encode()).hexdigest()
            markers_file = os.path.join(self.cache_dir, f"{audio_hash}_markers.json")
            
            # Salvar os marcadores em um arquivo JSON
            with open(markers_file, 'w') as f:
                json.dump(markers, f)
            
            return True
        except Exception as e:
            logger.error(f"Erro ao criar marcadores de áudio: {str(e)}")
            return False
    
    def get_audio_markers(self, audio_path):
        """
        Obtém os marcadores de um arquivo de áudio
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            
        Returns:
            list: Lista de marcadores
        """
        try:
            # Criar nome de arquivo para os marcadores
            audio_hash = hashlib.md5(audio_path.encode()).hexdigest()
            markers_file = os.path.join(self.cache_dir, f"{audio_hash}_markers.json")
            
            # Verificar se o arquivo existe
            if not os.path.exists(markers_file):
                return []
            
            # Ler os marcadores do arquivo JSON
            with open(markers_file, 'r') as f:
                markers = json.load(f)
            
            return markers
        except Exception as e:
            logger.error(f"Erro ao obter marcadores de áudio: {str(e)}")
            return []
    
    def _get_cache_key(self, audio_path, suffix):
        """
        Gera uma chave de cache para um arquivo de áudio
        
        Args:
            audio_path (str): Caminho para o arquivo de áudio
            suffix (str): Sufixo para a chave
            
        Returns:
            str: Chave de cache
        """
        # Usar o hash MD5 do caminho do arquivo + data de modificação para a chave
        file_hash = hashlib.md5(audio_path.encode()).hexdigest()
        mtime = os.path.getmtime(audio_path)
        
        return f"audio_{file_hash}_{mtime}_{suffix}"

# Instância singleton do serviço
audio_service = AudioService()
