/**
 * Exportação centralizada dos serviços de API
 */

// Configuração
export * from './config';

// Serviços
export * as authService from './auth.service';
export * as usersService from './users.service';
export * as categoriesService from './categories.service';
export * as mangasService from './mangas.service';
export * as booksService from './books.service';
export * as commentModerationService from './comment-moderation.service';
export * as settingsService from './settings.service';

// Exportações individuais para compatibilidade
import * as articlesServiceModule from './articles.service';
export { articlesServiceModule };
