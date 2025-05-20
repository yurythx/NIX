'use client';

import { useState, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  height = 500,
  placeholder = 'Digite seu conteúdo aqui...'
}: RichTextEditorProps) {
  const [content, setContent] = useState(value);
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSourceCode, setShowSourceCode] = useState(false);

  // Atualizar o conteúdo quando o valor mudar
  useEffect(() => {
    setContent(value);
  }, [value]);

  // Sincronizar o conteúdo do editor com o estado
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      console.log('Atualizando conteúdo do editor:', content.substring(0, 100) + '...');
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Garantir que o conteúdo inicial seja carregado corretamente
  useEffect(() => {
    if (editorRef.current && value) {
      console.log('Carregando valor inicial no editor');
      editorRef.current.innerHTML = value;
      setContent(value);
    }
  }, [value]);

  // Função para atualizar o conteúdo quando o editor é modificado
  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      console.log('Editor content changed:', newContent.substring(0, 100) + '...');

      // Verificar se o conteúdo realmente mudou para evitar loops
      if (newContent !== content) {
        console.log('Conteúdo alterado, atualizando estado');
        setContent(newContent);
        onChange(newContent);
      }
    }
  };

  // Função para lidar com a colagem de conteúdo
  const handlePaste = () => {
    // Permitir o comportamento padrão do navegador para colar conteúdo
    // O navegador já faz um bom trabalho de preservar a formatação básica

    // Agendar a atualização do estado após a colagem
    setTimeout(() => {
      handleInput();
    }, 0);
  };

  // Função para limpar formatação indesejada
  const handleCleanFormatting = () => {
    if (editorRef.current) {
      // Limpar formatação indesejada que pode ser adicionada pelo navegador
      const cleanHtml = editorRef.current.innerHTML
        .replace(/<span style="[^"]*">/g, '<span>')
        .replace(/<div>/g, '<p>')
        .replace(/<\/div>/g, '</p>');

      editorRef.current.innerHTML = cleanHtml;
      setContent(cleanHtml);
      onChange(cleanHtml);
    }
  };

  // Função para lidar com a mudança no código fonte
  const handleSourceCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Editor de Conteúdo
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSourceCode(!showSourceCode)}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {showSourceCode ? 'Mostrar Editor Visual' : 'Mostrar Código HTML'}
            </button>
            <button
              type="button"
              onClick={handleCleanFormatting}
              className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
              title="Limpar formatação indesejada"
            >
              Limpar Formatação
            </button>
          </div>
        </div>

        {showSourceCode ? (
          <textarea
            value={content}
            onChange={handleSourceCodeChange}
            className="w-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ minHeight: '500px' }}
            placeholder={placeholder}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={true}
            onInput={handleInput}
            onPaste={handlePaste}
            className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md min-h-[400px] overflow-auto focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            style={{ minHeight: '500px' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {showSourceCode
            ? 'Editando código HTML diretamente. Clique em "Mostrar Editor Visual" para voltar ao editor visual.'
            : 'Editor visual ativo. Você pode editar o conteúdo diretamente nesta área ou colar conteúdo de outras fontes.'}
        </div>
      </div>
    </div>
  );
}
