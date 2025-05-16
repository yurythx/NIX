/**
 * Utilitários para formatação de datas
 * Substitui as funções do date-fns para evitar problemas de importação
 */

/**
 * Formata a distância entre uma data e agora em linguagem natural
 * @param date Data a ser comparada com agora
 * @param options Opções de formatação
 * @returns String formatada (ex: "há 5 minutos")
 */
export function formatDistanceToNow(date: Date | number | string, options: any = {}): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 5) return 'agora mesmo';
  if (diffInSeconds < 60) return `há ${diffInSeconds} segundos`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `há ${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `há ${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}`;
}

/**
 * Objeto que simula o locale pt-BR do date-fns
 */
export const ptBR = {
  code: 'pt-BR',
  formatDistance: {
    lessThanXSeconds: 'menos de {{count}} segundos',
    xSeconds: '{{count}} segundos',
    halfAMinute: 'meio minuto',
    lessThanXMinutes: 'menos de {{count}} minutos',
    xMinutes: '{{count}} minutos',
    aboutXHours: 'cerca de {{count}} horas',
    xHours: '{{count}} horas',
    xDays: '{{count}} dias',
    aboutXWeeks: 'cerca de {{count}} semanas',
    xWeeks: '{{count}} semanas',
    aboutXMonths: 'cerca de {{count}} meses',
    xMonths: '{{count}} meses',
    aboutXYears: 'cerca de {{count}} anos',
    xYears: '{{count}} anos',
    overXYears: 'mais de {{count}} anos',
    almostXYears: 'quase {{count}} anos',
  }
};

/**
 * Formata uma data no formato dd/mm/yyyy
 * @param date Data a ser formatada
 * @returns String formatada (ex: "01/01/2023")
 */
export function format(date: Date | number | string, formatStr: string = 'dd/MM/yyyy', options: any = {}): string {
  const d = new Date(date);
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  // Implementação básica apenas para o formato dd/MM/yyyy
  return `${day}/${month}/${year}`;
}
