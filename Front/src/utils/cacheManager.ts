/**
 * Sistema de cache unificado
 * 
 * Este utilitário fornece uma interface unificada para gerenciar cache de dados,
 * suportando tanto armazenamento em memória quanto em localStorage.
 */

// Configurações padrão
const DEFAULT_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutos
const DEFAULT_KEY_PREFIX = 'viixen_cache_';

// Tipos de armazenamento
export enum StorageType {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage'
}

// Interface para os itens do cache
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Opções de cache
export interface CacheOptions {
  /** Tempo de expiração em milissegundos */
  expirationTime?: number;
  /** Prefixo para a chave de cache */
  keyPrefix?: string;
  /** Tipo de armazenamento */
  storageType?: StorageType;
}

/**
 * Classe para gerenciar cache de dados
 */
export class CacheManager {
  private expirationTime: number;
  private keyPrefix: string;
  private storageType: StorageType;
  private memoryCache: Map<string, CacheItem<any>>;

  constructor(options: CacheOptions = {}) {
    this.expirationTime = options.expirationTime || DEFAULT_EXPIRATION_TIME;
    this.keyPrefix = options.keyPrefix || DEFAULT_KEY_PREFIX;
    this.storageType = options.storageType || StorageType.LOCAL_STORAGE;
    this.memoryCache = new Map<string, CacheItem<any>>();
  }

  /**
   * Obtém um item do cache
   * @param key Chave do item
   * @returns Dados do cache ou null se não existir ou estiver expirado
   */
  get<T>(key: string): T | null {
    const cacheKey = this.keyPrefix + key;
    
    if (this.storageType === StorageType.MEMORY) {
      return this.getFromMemory<T>(cacheKey);
    } else {
      return this.getFromLocalStorage<T>(cacheKey);
    }
  }

  /**
   * Armazena um item no cache
   * @param key Chave do item
   * @param data Dados a serem armazenados
   * @param customExpiration Tempo de expiração personalizado em milissegundos
   */
  set<T>(key: string, data: T, customExpiration?: number): void {
    const cacheKey = this.keyPrefix + key;
    const now = Date.now();
    const expirationTime = customExpiration || this.expirationTime;
    
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + expirationTime
    };
    
    if (this.storageType === StorageType.MEMORY) {
      this.setInMemory<T>(cacheKey, item);
    } else {
      this.setInLocalStorage<T>(cacheKey, item);
    }
  }

  /**
   * Remove um item do cache
   * @param key Chave do item
   */
  remove(key: string): void {
    const cacheKey = this.keyPrefix + key;
    
    if (this.storageType === StorageType.MEMORY) {
      this.memoryCache.delete(cacheKey);
    } else {
      try {
        localStorage.removeItem(cacheKey);
      } catch (error) {
        console.error('Erro ao remover item do localStorage:', error);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    if (this.storageType === StorageType.MEMORY) {
      this.memoryCache.clear();
    } else {
      try {
        // Obter todas as chaves do localStorage
        const keys = Object.keys(localStorage);
        
        // Filtrar apenas as chaves que começam com o prefixo
        const cacheKeys = keys.filter(key => key.startsWith(this.keyPrefix));
        
        // Remover cada item
        cacheKeys.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('Erro ao limpar cache do localStorage:', error);
      }
    }
  }

  /**
   * Verifica se um item está no cache e não expirou
   * @param key Chave do item
   * @returns true se o item existir e não estiver expirado
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Obtém um item do cache em memória
   */
  private getFromMemory<T>(cacheKey: string): T | null {
    const item = this.memoryCache.get(cacheKey) as CacheItem<T> | undefined;
    
    if (!item) return null;
    
    const now = Date.now();
    
    // Verificar se o item expirou
    if (now > item.expiresAt) {
      this.memoryCache.delete(cacheKey);
      return null;
    }
    
    return item.data;
  }

  /**
   * Obtém um item do cache em localStorage
   */
  private getFromLocalStorage<T>(cacheKey: string): T | null {
    try {
      const itemJson = localStorage.getItem(cacheKey);
      
      if (!itemJson) return null;
      
      const item: CacheItem<T> = JSON.parse(itemJson);
      const now = Date.now();
      
      // Verificar se o item expirou
      if (now > item.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Erro ao obter item do localStorage:', error);
      return null;
    }
  }

  /**
   * Armazena um item no cache em memória
   */
  private setInMemory<T>(cacheKey: string, item: CacheItem<T>): void {
    this.memoryCache.set(cacheKey, item);
  }

  /**
   * Armazena um item no cache em localStorage
   */
  private setInLocalStorage<T>(cacheKey: string, item: CacheItem<T>): void {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.error('Erro ao armazenar item no localStorage:', error);
      
      // Tentar limpar o cache se o erro for de espaço
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clear();
        try {
          localStorage.setItem(cacheKey, JSON.stringify(item));
        } catch (retryError) {
          console.error('Erro ao armazenar item mesmo após limpar cache:', retryError);
        }
      }
    }
  }
}

// Instância padrão do cache
export const defaultCache = new CacheManager({
  expirationTime: DEFAULT_EXPIRATION_TIME,
  keyPrefix: DEFAULT_KEY_PREFIX,
  storageType: StorageType.LOCAL_STORAGE
});

// Instância de cache em memória
export const memoryCache = new CacheManager({
  expirationTime: DEFAULT_EXPIRATION_TIME,
  keyPrefix: DEFAULT_KEY_PREFIX,
  storageType: StorageType.MEMORY
});

/**
 * Função para criar um cache específico para um domínio
 * @param domain Nome do domínio (ex: 'books', 'articles')
 * @param options Opções de cache
 * @returns Instância de CacheManager
 */
export function createDomainCache(domain: string, options: CacheOptions = {}): CacheManager {
  return new CacheManager({
    expirationTime: options.expirationTime || DEFAULT_EXPIRATION_TIME,
    keyPrefix: options.keyPrefix || `${DEFAULT_KEY_PREFIX}${domain}_`,
    storageType: options.storageType || StorageType.LOCAL_STORAGE
  });
}

/**
 * Hook para usar o cache com uma função assíncrona
 * @param fn Função assíncrona que retorna dados
 * @param keyGenerator Função que gera a chave de cache a partir dos argumentos
 * @param options Opções de cache
 * @returns Função que retorna dados do cache ou da função original
 */
export function withCache<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyGenerator: (...args: Args) => string,
  options: CacheOptions = {}
): (...args: Args) => Promise<T> {
  const cache = new CacheManager(options);
  
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
