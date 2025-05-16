/**
 * Utilitário simples para exibir notificações
 * 
 * Este arquivo fornece uma função simples para exibir notificações
 * sem depender do contexto de notificação.
 */

type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Exibe uma notificação usando o console
 * 
 * @param type Tipo de notificação
 * @param message Mensagem da notificação
 */
export const showNotification = (type: NotificationType, message: string): void => {
  // Exibir no console para depuração
  switch (type) {
    case 'success':
      console.log(`%c✅ ${message}`, 'color: green; font-weight: bold;');
      break;
    case 'error':
      console.error(`❌ ${message}`);
      break;
    case 'warning':
      console.warn(`⚠️ ${message}`);
      break;
    case 'info':
      console.info(`ℹ️ ${message}`);
      break;
  }
  
  // Tentar usar o contexto de notificação se disponível
  try {
    // Verificar se estamos em um ambiente de navegador
    if (typeof window !== 'undefined') {
      // Verificar se há um elemento de notificação na página
      const notificationElement = document.getElementById('notification-container');
      if (notificationElement) {
        // Criar um elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Adicionar ao container
        notificationElement.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
          notification.classList.add('notification-hide');
          setTimeout(() => {
            notificationElement.removeChild(notification);
          }, 300);
        }, 5000);
      }
    }
  } catch (error) {
    // Ignorar erros ao tentar exibir notificação na UI
    console.warn('Erro ao exibir notificação na UI:', error);
  }
};
