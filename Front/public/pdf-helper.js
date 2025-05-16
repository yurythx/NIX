/**
 * Script auxiliar para o visualizador de PDF
 * Este script é injetado no iframe do PDF para facilitar a comunicação
 * entre o iframe e a página principal.
 */

(function() {
  // Verificar se o PDF.js está carregado
  if (typeof window.PDFViewerApplication === 'undefined') {
    console.error('PDF.js não está carregado');
    return;
  }

  // Referência para a aplicação PDF.js
  const pdfApp = window.PDFViewerApplication;

  // Função para enviar mensagens para a página principal
  function sendMessage(data) {
    window.parent.postMessage(data, '*');
  }

  // Enviar informações do PDF quando estiver carregado
  pdfApp.eventBus.on('documentloaded', function() {
    if (pdfApp.pdfDocument) {
      sendMessage({
        type: 'pdfInfo',
        totalPages: pdfApp.pagesCount
      });
    }
  });

  // Enviar a página atual quando mudar
  pdfApp.eventBus.on('pagechanging', function(evt) {
    sendMessage({
      type: 'pageChange',
      page: evt.pageNumber
    });
  });

  // Escutar mensagens da página principal
  window.addEventListener('message', function(event) {
    if (!event.data || typeof event.data !== 'object') return;

    // Processar comandos
    switch (event.data.type) {
      case 'nextPage':
        pdfApp.pdfViewer.nextPage();
        break;
      case 'prevPage':
        pdfApp.pdfViewer.previousPage();
        break;
      case 'zoomIn':
        pdfApp.zoomIn();
        break;
      case 'zoomOut':
        pdfApp.zoomOut();
        break;
      case 'resetZoom':
        pdfApp.zoomReset();
        break;
    }
  });

  // Notificar que o script foi carregado
  console.log('PDF Helper carregado com sucesso');
})();
