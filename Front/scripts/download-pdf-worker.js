/**
 * Script para baixar o worker do PDF.js e salvá-lo na pasta public
 * 
 * Este script deve ser executado com:
 * node scripts/download-pdf-worker.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Versão estável do PDF.js disponível no CDN
const PDFJS_VERSION = '3.11.174';
const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
const OUTPUT_PATH = path.join(__dirname, '../public/pdf.worker.min.js');

console.log(`Baixando worker do PDF.js versão ${PDFJS_VERSION}...`);
console.log(`URL: ${WORKER_URL}`);
console.log(`Destino: ${OUTPUT_PATH}`);

// Função para baixar o arquivo
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Falha ao baixar o arquivo. Status: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Arquivo baixado com sucesso para ${outputPath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Remover arquivo parcial
      reject(err);
    });
    
    file.on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Remover arquivo parcial
      reject(err);
    });
  });
}

// Executar o download
downloadFile(WORKER_URL, OUTPUT_PATH)
  .then(() => {
    console.log('Download concluído com sucesso!');
  })
  .catch((error) => {
    console.error('Erro ao baixar o worker do PDF.js:', error);
    process.exit(1);
  });
