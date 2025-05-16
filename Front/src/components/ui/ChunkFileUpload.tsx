'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { uploadFileInChunks } from '../../utils/chunkUploader';

interface ChunkFileUploadProps {
  endpoint: string;
  accept?: string;
  maxSize?: number; // em bytes
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  onUploadComplete?: (response: any) => void;
  onUploadError?: (error: Error) => void;
  additionalData?: Record<string, any>;
}

export default function ChunkFileUpload({
  endpoint,
  accept = '*/*',
  maxSize = 100 * 1024 * 1024, // 100MB por padrão
  label = 'Selecionar arquivo',
  icon = <Upload className="w-5 h-5" />,
  className = '',
  onUploadComplete,
  onUploadError,
  additionalData = {}
}: ChunkFileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipular seleção de arquivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Verificar tamanho do arquivo
    if (selectedFile.size > maxSize) {
      setError(`O arquivo é muito grande. O tamanho máximo é ${formatFileSize(maxSize)}.`);
      return;
    }
    
    // Limpar estados anteriores
    setFile(selectedFile);
    setProgress(0);
    setError(null);
    setIsComplete(false);
    
    // Iniciar upload automaticamente
    handleUpload(selectedFile);
  };

  // Iniciar upload
  const handleUpload = async (selectedFile: File) => {
    if (!selectedFile || isUploading) {
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      await uploadFileInChunks({
        file: selectedFile,
        endpoint,
        onProgress: (p) => setProgress(p),
        onComplete: (response) => {
          setIsComplete(true);
          if (onUploadComplete) onUploadComplete(response);
        },
        onError: (err) => {
          setError(err.message);
          if (onUploadError) onUploadError(err);
        },
        additionalData
      });
    } catch (err) {
      console.error('Erro no upload:', err);
      setError((err as Error).message || 'Erro ao fazer upload do arquivo');
      if (onUploadError) onUploadError(err as Error);
    } finally {
      setIsUploading(false);
    }
  };

  // Cancelar upload
  const handleCancel = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setProgress(0);
    setError(null);
    setIsComplete(false);
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Input de arquivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      
      {/* Botão de upload */}
      {!file && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {icon}
          <span>{label}</span>
        </button>
      )}
      
      {/* Informações do arquivo e progresso */}
      {file && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium truncate max-w-xs">
                {file.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </div>
            </div>
            
            {!isComplete && !isUploading && (
              <button
                type="button"
                onClick={handleCancel}
                className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {isComplete && (
              <div className="text-green-600 dark:text-green-400">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>
          
          {/* Barra de progresso */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                isComplete
                  ? 'bg-green-600 dark:bg-green-500'
                  : error
                  ? 'bg-red-600 dark:bg-red-500'
                  : 'bg-indigo-600 dark:bg-indigo-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Status */}
          <div className="mt-2 text-xs">
            {isUploading && (
              <div className="text-indigo-600 dark:text-indigo-400">
                Enviando... {progress}%
              </div>
            )}
            
            {error && (
              <div className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {isComplete && (
              <div className="text-green-600 dark:text-green-400">
                Upload concluído com sucesso!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
