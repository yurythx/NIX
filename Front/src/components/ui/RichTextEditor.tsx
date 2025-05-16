'use client';

import { useState, useEffect } from 'react';

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

  // Atualizar o conteúdo quando o valor mudar
  useEffect(() => {
    setContent(value);
  }, [value]);

  // Manipular a mudança no conteúdo
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange(newValue);
  };

  // Manipular a colagem de conteúdo
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Prevenir o comportamento padrão para poder processar o conteúdo
    e.preventDefault();

    // Obter o conteúdo HTML do clipboard se disponível
    const clipboardData = e.clipboardData;
    let pastedData = clipboardData.getData('text/html') || clipboardData.getData('text');

    // Se for HTML, tentar preservar a formatação básica
    if (clipboardData.getData('text/html')) {
      try {
        // Limpar tags potencialmente perigosas ou indesejadas
        pastedData = pastedData
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/<meta\b[^<]*(?:(?!>))<[^<]*>/gi, '')
          .replace(/<link\b[^<]*(?:(?!>))<[^<]*>/gi, '')
          .replace(/<!DOCTYPE[^>]*>/gi, '');

        // Extrair o conteúdo do body se existir
        const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(pastedData);
        if (bodyMatch && bodyMatch[1]) {
          pastedData = bodyMatch[1];
        }

        // Remover atributos de estilo inline que podem causar problemas
        pastedData = pastedData.replace(/style="[^"]*"/gi, '');

        // Preservar tags comuns de formatação
        const allowedTags = [
          'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del',
          'ol', 'ul', 'li', 'blockquote', 'pre', 'code',
          'a', 'img', 'br', 'hr', 'table', 'tr', 'td', 'th', 'thead', 'tbody'
        ];

        // Criar um elemento temporário para processar o HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pastedData;

        // Função para limpar nós recursivamente
        const cleanNode = (node: Node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();

            // Se não for uma tag permitida, substituir pelo seu conteúdo
            if (!allowedTags.includes(tagName)) {
              // Criar um fragmento para conter os filhos
              const fragment = document.createDocumentFragment();
              while (element.firstChild) {
                // Limpar cada filho recursivamente antes de movê-lo
                const child = element.firstChild;
                element.removeChild(child);
                cleanNode(child);
                fragment.appendChild(child);
              }

              // Substituir o elemento pelo fragmento
              if (element.parentNode) {
                element.parentNode.replaceChild(fragment, element);
              }
              return;
            }

            // Para tags permitidas, limpar seus filhos
            Array.from(element.childNodes).forEach(cleanNode);
          }
        };

        // Limpar o conteúdo
        Array.from(tempDiv.childNodes).forEach(cleanNode);

        // Extrair o conteúdo formatado
        pastedData = tempDiv.innerHTML;
      } catch (error) {
        console.error('Erro ao processar HTML colado:', error);
        // Em caso de erro, usar o texto simples
        pastedData = clipboardData.getData('text');
      }
    }

    // Inserir o conteúdo no ponto de seleção atual
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = content.substring(0, start) + pastedData + content.substring(end);

    setContent(newText);
    onChange(newText);
  };

  return (
    <div className="relative">
      <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
        {/* Barra de ferramentas básica */}
        <div className="bg-gray-100 dark:bg-gray-800 p-2 border-b border-gray-300 dark:border-gray-700 flex flex-wrap gap-2">
          {/* Grupo de formatação de texto */}
          <div className="flex gap-1">
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Negrito"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = content.substring(0, start) + '<strong>' + content.substring(start, end) + '</strong>' + content.substring(end);
                setContent(newText);
                onChange(newText);
              }}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Itálico"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = content.substring(0, start) + '<em>' + content.substring(start, end) + '</em>' + content.substring(end);
                setContent(newText);
                onChange(newText);
              }}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Sublinhado"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = content.substring(0, start) + '<u>' + content.substring(start, end) + '</u>' + content.substring(end);
                setContent(newText);
                onChange(newText);
              }}
            >
              <u>U</u>
            </button>
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Grupo de cabeçalhos */}
          <div className="flex gap-1">
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Título 1"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = content.substring(0, start) + '<h1>' + content.substring(start, end) + '</h1>' + content.substring(end);
                setContent(newText);
                onChange(newText);
              }}
            >
              H1
            </button>
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Título 2"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = content.substring(0, start) + '<h2>' + content.substring(start, end) + '</h2>' + content.substring(end);
                setContent(newText);
                onChange(newText);
              }}
            >
              H2
            </button>
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Título 3"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = content.substring(0, start) + '<h3>' + content.substring(start, end) + '</h3>' + content.substring(end);
                setContent(newText);
                onChange(newText);
              }}
            >
              H3
            </button>
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Grupo de parágrafos e listas */}
          <div className="flex gap-1">
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Parágrafo"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = content.substring(0, start) + '<p>' + content.substring(start, end) + '</p>' + content.substring(end);
                setContent(newText);
                onChange(newText);
              }}
            >
              P
            </button>
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Lista não ordenada"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = content.substring(start, end);

                // Se houver texto selecionado, transformar cada linha em um item de lista
                if (selectedText) {
                  const lines = selectedText.split('\n');
                  const listItems = lines.map(line => `<li>${line}</li>`).join('');
                  const newText = content.substring(0, start) + '<ul>\n' + listItems + '\n</ul>' + content.substring(end);
                  setContent(newText);
                  onChange(newText);
                } else {
                  const newText = content.substring(0, start) + '<ul>\n<li>Item da lista</li>\n</ul>' + content.substring(end);
                  setContent(newText);
                  onChange(newText);
                }
              }}
            >
              UL
            </button>
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Lista ordenada"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = content.substring(start, end);

                // Se houver texto selecionado, transformar cada linha em um item de lista
                if (selectedText) {
                  const lines = selectedText.split('\n');
                  const listItems = lines.map(line => `<li>${line}</li>`).join('');
                  const newText = content.substring(0, start) + '<ol>\n' + listItems + '\n</ol>' + content.substring(end);
                  setContent(newText);
                  onChange(newText);
                } else {
                  const newText = content.substring(0, start) + '<ol>\n<li>Item da lista</li>\n</ol>' + content.substring(end);
                  setContent(newText);
                  onChange(newText);
                }
              }}
            >
              OL
            </button>
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Grupo de links e imagens */}
          <div className="flex gap-1">
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Link"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const url = prompt('Digite a URL do link:', 'https://');

                if (url) {
                  const newText = content.substring(0, start) + `<a href="${url}" target="_blank">` + content.substring(start, end) + '</a>' + content.substring(end);
                  setContent(newText);
                  onChange(newText);
                }
              }}
            >
              Link
            </button>
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Imagem"
              onClick={() => {
                const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const url = prompt('Digite a URL da imagem:', 'https://');
                const alt = prompt('Digite a descrição da imagem:', '');

                if (url) {
                  const newText = content.substring(0, start) + `<img src="${url}" alt="${alt || ''}" style="max-width: 100%; height: auto;" />` + content.substring(start);
                  setContent(newText);
                  onChange(newText);
                }
              }}
            >
              Img
            </button>
          </div>

          {/* Separador */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Grupo de ações especiais */}
          <div className="flex gap-1">
            <button
              type="button"
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Colar conteúdo formatado"
              onClick={async () => {
                try {
                  // Solicitar permissão para acessar a área de transferência
                  const clipboardItems = await navigator.clipboard.read();

                  // Processar cada item da área de transferência
                  for (const clipboardItem of clipboardItems) {
                    // Verificar se há conteúdo HTML
                    if (clipboardItem.types.includes('text/html')) {
                      const blob = await clipboardItem.getType('text/html');
                      const html = await blob.text();

                      // Simular um evento de colagem
                      const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                      const fakeEvent = {
                        preventDefault: () => {},
                        clipboardData: {
                          getData: (type: string) => type === 'text/html' ? html : '',
                        },
                        currentTarget: textarea,
                      } as unknown as React.ClipboardEvent<HTMLTextAreaElement>;

                      handlePaste(fakeEvent);
                      return;
                    }
                  }

                  // Se não houver conteúdo HTML, tentar obter texto simples
                  const text = await navigator.clipboard.readText();
                  const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const newText = content.substring(0, start) + text + content.substring(end);
                  setContent(newText);
                  onChange(newText);
                } catch (err) {
                  console.error('Erro ao acessar a área de transferência:', err);
                  alert('Não foi possível acessar a área de transferência. Por favor, use Ctrl+V para colar o conteúdo.');
                }
              }}
            >
              Colar formatado
            </button>
          </div>
        </div>

        {/* Área de edição */}
        <textarea
          id="rich-editor"
          value={content}
          onChange={handleChange}
          onPaste={handlePaste}
          style={{ height: `${height}px` }}
          className="w-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={placeholder}
        />
      </div>

      {/* Visualização HTML */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visualização HTML:</h3>
        <div
          className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
