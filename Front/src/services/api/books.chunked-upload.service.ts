/**
 * Serviço para upload de arquivos em chunks para livros
 */
import { API_BASE_URL, API_ENDPOINTS, handleApiError } from './config';
import { getAccessToken } from './auth.service';

/**
 * Faz upload de um arquivo PDF em chunks para livros
 * 
 * @param file Arquivo PDF a ser enviado
 * @param onProgress Callback para acompanhar o progresso do upload
 * @returns Informações sobre o arquivo enviado
 */
export const uploadPdfInChunks = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ filePath: string; fileUrl: string; fileName: string }> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Tamanho de cada parte (5MB)
    const chunkSize = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;

    // Criar um identificador único para este upload
    const uploadId = Date.now().toString();

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('fileName', file.name);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileType', 'pdf');

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.CHUNKED_UPLOAD}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      await handleApiError(response);
      const result = await response.json();

      uploadedChunks++;
      const progress = Math.round((uploadedChunks / totalChunks) * 100);
      if (onProgress) onProgress(progress);

      // Se for o último chunk, retornar as informações do arquivo
      if (chunkIndex === totalChunks - 1) {
        return {
          filePath: result.filePath,
          fileUrl: result.fileUrl,
          fileName: result.fileName
        };
      }
    }

    throw new Error('Erro ao finalizar o upload');
  } catch (error) {
    console.error('Erro ao fazer upload do PDF em chunks:', error);
    throw error;
  }
};

/**
 * Faz upload de um arquivo de áudio em chunks para livros
 * 
 * @param file Arquivo de áudio a ser enviado
 * @param onProgress Callback para acompanhar o progresso do upload
 * @returns Informações sobre o arquivo enviado
 */
export const uploadAudioInChunks = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ filePath: string; fileUrl: string; fileName: string }> => {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Tamanho de cada parte (5MB)
    const chunkSize = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;

    // Criar um identificador único para este upload
    const uploadId = Date.now().toString();

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('fileName', file.name);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileType', 'audio');

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS.CHUNKED_UPLOAD}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      await handleApiError(response);
      const result = await response.json();

      uploadedChunks++;
      const progress = Math.round((uploadedChunks / totalChunks) * 100);
      if (onProgress) onProgress(progress);

      // Se for o último chunk, retornar as informações do arquivo
      if (chunkIndex === totalChunks - 1) {
        return {
          filePath: result.filePath,
          fileUrl: result.fileUrl,
          fileName: result.fileName
        };
      }
    }

    throw new Error('Erro ao finalizar o upload');
  } catch (error) {
    console.error('Erro ao fazer upload do áudio em chunks:', error);
    throw error;
  }
};

export default {
  uploadPdfInChunks,
  uploadAudioInChunks
};
