'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ChunkedFileUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onUploadProgress: (progress: number) => void;
  onUploadComplete: (fileUrl: string) => void;
  onUploadError: (error: string) => void;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  className?: string;
  uploadUrl: string;
  token: string;
}

const ChunkedFileUploader: React.FC<ChunkedFileUploaderProps> = ({
  file,
  onFileChange,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxSizeMB = 100,
  acceptedFileTypes = ['application/pdf'],
  className = '',
  uploadUrl,
  token
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Limpar o controlador de aborto quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };
  
  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    setSuccess(false);
    
    // Validar tipo de arquivo
    if (acceptedFileTypes.length > 0 && !acceptedFileTypes.includes(selectedFile.type)) {
      setError(`Tipo de arquivo não suportado. Tipos aceitos: ${acceptedFileTypes.join(', ')}`);
      return;
    }
    
    // Validar tamanho do arquivo
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`O arquivo excede o tamanho máximo de ${maxSizeMB}MB`);
      return;
    }
    
    onFileChange(selectedFile);
  };
  
  const uploadFile = async () => {
    if (!file) {
      setError('Nenhum arquivo selecionado');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    
    try {
      // Tamanho de cada parte (5MB)
      const chunkSize = 5 * 1024 * 1024;
      const totalChunks = Math.ceil(file.size / chunkSize);
      let uploadedChunks = 0;
      
      // Criar um identificador único para este upload
      const uploadId = Date.now().toString();
      
      // Criar um novo controlador de aborto
      abortControllerRef.current = new AbortController();
      
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
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao fazer upload da parte ${chunkIndex + 1}: ${response.statusText}`);
        }
        
        uploadedChunks++;
        const progress = Math.round((uploadedChunks / totalChunks) * 100);
        setUploadProgress(progress);
        onUploadProgress(progress);
        
        // Se for a última parte, obter a URL do arquivo completo
        if (chunkIndex === totalChunks - 1) {
          const result = await response.json();
          if (result.fileUrl) {
            setSuccess(true);
            onUploadComplete(result.fileUrl);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        onUploadError(error.message);
      } else {
        setError('Erro desconhecido durante o upload');
        onUploadError('Erro desconhecido durante o upload');
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };
  
  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
  };
  
  const removeFile = () => {
    if (isUploading) {
      cancelUpload();
    }
    onFileChange(null);
    setError(null);
    setSuccess(false);
    
    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={acceptedFileTypes.join(',')}
        className="hidden"
        id="chunked-file-input"
      />
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Arraste e solte um arquivo aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Tamanho máximo: {maxSizeMB}MB
          </p>
          {error && (
            <div className="mt-3 flex items-center text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Arquivo selecionado
            </h3>
            <button
              type="button"
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center mb-3">
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            {success && (
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 ml-2" />
            )}
          </div>
          
          {isUploading && (
            <div className="mb-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                {uploadProgress}%
              </p>
            </div>
          )}
          
          {error && (
            <div className="mb-3 flex items-center text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            {isUploading ? (
              <button
                type="button"
                onClick={cancelUpload}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={uploadFile}
                className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center"
                disabled={success}
              >
                {success ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Concluído
                  </>
                ) : (
                  <>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    Fazer upload
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkedFileUploader;
