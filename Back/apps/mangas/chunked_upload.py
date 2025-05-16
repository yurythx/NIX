import os
import json
import logging
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)

class ChunkedUploadView(APIView):
    """
    View para lidar com uploads em partes (chunked uploads).
    Permite fazer upload de arquivos grandes dividindo-os em partes menores.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # Obter informações do chunk
            chunk_file = request.FILES.get('file')
            file_name = request.POST.get('fileName')
            upload_id = request.POST.get('uploadId')
            chunk_index = int(request.POST.get('chunkIndex', 0))
            total_chunks = int(request.POST.get('totalChunks', 1))

            if not all([chunk_file, file_name, upload_id]):
                return Response({
                    'error': 'Parâmetros incompletos. Necessário: file, fileName, uploadId'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Criar diretório temporário para os chunks se não existir
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp', upload_id)
            os.makedirs(temp_dir, exist_ok=True)

            # Salvar o chunk em um arquivo temporário
            chunk_path = os.path.join(temp_dir, f'chunk_{chunk_index}')
            with open(chunk_path, 'wb') as f:
                for chunk in chunk_file.chunks():
                    f.write(chunk)

            # Verificar se todos os chunks foram recebidos
            received_chunks = os.listdir(temp_dir)

            logger.info(f"Recebido chunk {chunk_index + 1} de {total_chunks} para {file_name}")

            # Se todos os chunks foram recebidos, combinar em um único arquivo
            if len(received_chunks) == total_chunks:
                logger.info(f"Todos os chunks recebidos para {file_name}. Combinando...")

                # Determinar o caminho final do arquivo
                file_extension = os.path.splitext(file_name)[1]
                final_filename = f"{upload_id}{file_extension}"
                # Usar caminho com barras normais (/) em vez de barras invertidas (\)
                final_path = 'chapters/pdf/' + final_filename

                # Combinar os chunks em um único arquivo
                with default_storage.open(final_path, 'wb') as final_file:
                    for i in range(total_chunks):
                        chunk_path = os.path.join(temp_dir, f'chunk_{i}')
                        with open(chunk_path, 'rb') as f:
                            final_file.write(f.read())

                # Limpar os arquivos temporários
                for chunk_file in received_chunks:
                    os.remove(os.path.join(temp_dir, chunk_file))
                os.rmdir(temp_dir)

                # Retornar a URL do arquivo final
                file_url = default_storage.url(final_path)

                return Response({
                    'status': 'success',
                    'message': 'Upload completo',
                    'fileUrl': file_url,
                    'fileName': file_name,
                    'filePath': final_path
                })

            # Se ainda faltam chunks, retornar status de progresso
            return Response({
                'status': 'progress',
                'message': f'Chunk {chunk_index + 1} de {total_chunks} recebido',
                'receivedChunks': len(received_chunks),
                'totalChunks': total_chunks
            })

        except Exception as e:
            logger.error(f"Erro no upload em partes: {str(e)}")
            return Response({
                'error': f'Erro no processamento do upload: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
