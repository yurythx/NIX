/**
 * Utilitário para cache de dados
 */

import { DEFAULT_EXPIRATION_TIME, DEFAULT_KEY_PREFIX } from '../config/cacheConfig';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  /** Tempo de expiração em milissegundos */
  expirationTime?: number;
  /** Prefixo para a chave de cache */
  keyPrefix?: string;
}

/**
 * Classe para gerenciar cache de dados
 */
export class DataCache {
  private expirationTime: number;
  private keyPrefix: string;

  constructor(options: CacheOptions = {}) {
    this.expirationTime = options.expirationTime || DEFAULT_EXPIRATION_TIME;
    this.keyPrefix = options.keyPrefix || DEFAULT_KEY_PREFIX;
  }

  /**
   * Obtém um item do cache
   * @param key Chave do item
   * @returns Dados do cache ou null se não existir ou estiver expirado
   */
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.keyPrefix + key;
      const item = localStorage.getItem(cacheKey);
      
      if (!item) return null;
      
      const parsedItem: CacheItem<T> = JSON.parse(item);
      const now = Date.now();
      
      // Verificar se o item expirou
      if (now - parsedItem.timestamp > this.expirationTime) {
        this.remove(key);
        return null;
      }
      
      return parsedItem.data;
    } catch (error) {
      console.error('Erro ao obter item do cache:', error);
      return null;
    }
  }

  /**
   * Armazena um item no cache
   * @param key Chave do item
   * @param data Dados a serem armazenados
   */
  set<T>(key: string, data: T): void {
    try {
      const cacheKey = this.keyPrefix + key;
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.error('Erro ao armazenar item no cache:', error);
    }
  }

  /**
   * Remove um item do cache
   * @param key Chave do item
   */
  remove(key: string): void {
    this.removeItem(key);
  }

  /**
   * Método otimizado para remover itens do cache
   * @param key Chave do item
   */
  private removeItem(key: string): void {
    try {
      const cacheKey = this.keyPrefix + key;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Erro ao remover item do cache:', error);
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    try {
      // Obter todas as chaves do localStorage
      const keys = Object.keys(localStorage);
      
      // Filtrar apenas as chaves que começam com o prefixo
      const cacheKeys = keys.filter(key => key.startsWith(this.keyPrefix));
      
      // Remover cada item
      cacheKeys.forEach(key => this.removeItem(key.replace(this.keyPrefix, '')));
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
}

// Instância padrão do cache
export const defaultCache = new DataCache({
  expirationTime: DEFAULT_EXPIRATION_TIME,
  keyPrefix: DEFAULT_KEY_PREFIX
});

/**
 * Hook para usar o cache com uma função assíncrona
 * @param fn Função assíncrona que retorna dados
 * @param key Chave para o cache
 * @param options Opções de cache
 * @returns Função que retorna dados do cache ou da função original
 */
export function withCache<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyGenerator: (...args: Args) => string,
  options: CacheOptions = {}
): (...args: Args) => Promise<T> {
  const cache = new DataCache(options);
  
  return async (...args: Args): Promise<T> => {
    const key = keyGenerator(...args);
    const cachedData = cache.get<T>(key);
    
    if (cachedData) {
      return cachedData;
    }
    
    const data = await fn(...args);
    cache.set(key, data);
    return data;
  };
}
