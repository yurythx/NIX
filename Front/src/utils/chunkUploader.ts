/**
 * Utilitário para upload de arquivos em chunks
 */

import { getAccessToken } from '../services/api/auth.service';
import { API_BASE_URL } from '../services/api/config';

// Tamanho padrão do chunk em bytes (5MB)
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

// Interface para as opções de upload
export interface ChunkUploadOptions {
  file: File;
  endpoint: string;
  chunkSize?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (response: any) => void;
  onError?: (error: Error) => void;
  additionalData?: Record<string, any>;
}

// Interface para o estado de upload
interface UploadState {
  uploadId?: string;
  currentChunk: number;
  totalChunks: number;
  isUploading: boolean;
  isComplete: boolean;
  error?: Error;
}

/**
 * Faz upload de um arquivo em chunks
 */
export async function uploadFileInChunks({
  file,
  endpoint,
  chunkSize = DEFAULT_CHUNK_SIZE,
  onProgress,
  onComplete,
  onError,
  additionalData = {}
}: ChunkUploadOptions): Promise<void> {
  const token = getAccessToken();

  if (!token) {
    const error = new Error('Usuário não autenticado');
    if (onError) onError(error);
    throw error;
  }

  // Calcular o número total de chunks
  const totalChunks = Math.ceil(file.size / chunkSize);

  // Estado inicial do upload
  const state: UploadState = {
    currentChunk: 0,
    totalChunks,
    isUploading: true,
    isComplete: false
  };

  try {
    // Gerar um ID de upload único
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    state.uploadId = uploadId;

    // Não precisamos fazer uma chamada de inicialização separada, pois o backend espera receber diretamente os chunks

    // Função para fazer upload de um chunk
    const uploadChunk = async (chunkIndex: number): Promise<void> => {
      // Calcular o início e o fim do chunk
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Criar FormData para o chunk
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('fileName', file.name);
      formData.append('uploadId', state.uploadId as string);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());

      // Enviar o chunk
      const isFullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
      const chunkEndpoint = isFullUrl ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      const response = await fetch(`${chunkEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar chunk ${chunkIndex}: ${response.status} ${response.statusText}`);
      }

      // Atualizar o estado
      state.currentChunk = chunkIndex + 1;

      // Calcular o progresso
      const progress = Math.round((state.currentChunk / state.totalChunks) * 100);
      if (onProgress) onProgress(progress);

      // Verificar se todos os chunks foram enviados
      if (state.currentChunk < state.totalChunks) {
        // Continuar com o próximo chunk
        await uploadChunk(state.currentChunk);
      } else {
        // O último chunk foi enviado, o backend já finaliza o upload automaticamente

        // Marcar como completo
        state.isComplete = true;
        state.isUploading = false;

        // Chamar o callback de conclusão com a resposta do último chunk
        if (onComplete) {
          const responseData = await response.json();
          onComplete(responseData);
        }
      }
    };

    // Iniciar o upload do primeiro chunk
    await uploadChunk(0);
  } catch (error) {
    // Atualizar o estado em caso de erro
    state.isUploading = false;
    state.error = error as Error;

    // Chamar o callback de erro
    if (onError) onError(error as Error);

    // Não há endpoint de cancelamento no backend, então apenas registramos o erro

    throw error;
  }
}

export default {
  uploadFileInChunks
};
