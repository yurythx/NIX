import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CacheManager, StorageType } from '../cacheManager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true
    });
    
    // Create a new instance for each test
    cacheManager = new CacheManager({
      keyPrefix: 'test_',
      expirationTime: 1000, // 1 second
      storageType: StorageType.LOCAL_STORAGE
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('localStorage mode', () => {
    it('should store and retrieve data from localStorage', () => {
      const testData = { name: 'Test', value: 123 };
      cacheManager.set('testKey', testData);
      
      // Verify localStorage was called
      expect(localStorage.setItem).toHaveBeenCalled();
      
      const retrieved = cacheManager.get('testKey');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for expired items', async () => {
      const testData = { name: 'Test', value: 123 };
      cacheManager.set('testKey', testData);
      
      // Fast-forward time to expire the cache
      jest.useFakeTimers();
      jest.advanceTimersByTime(1500); // 1.5 seconds
      
      const retrieved = cacheManager.get('testKey');
      expect(retrieved).toBeNull();
      
      jest.useRealTimers();
    });

    it('should remove items from localStorage', () => {
      const testData = { name: 'Test', value: 123 };
      cacheManager.set('testKey', testData);
      
      cacheManager.remove('testKey');
      
      // Verify localStorage.removeItem was called
      expect(localStorage.removeItem).toHaveBeenCalled();
      
      const retrieved = cacheManager.get('testKey');
      expect(retrieved).toBeNull();
    });

    it('should clear all items with the prefix', () => {
      cacheManager.set('testKey1', 'value1');
      cacheManager.set('testKey2', 'value2');
      
      // Add an item with a different prefix
      const otherCacheManager = new CacheManager({
        keyPrefix: 'other_',
        storageType: StorageType.LOCAL_STORAGE
      });
      otherCacheManager.set('testKey3', 'value3');
      
      // Clear only the test_ prefixed items
      cacheManager.clear();
      
      // Our items should be gone
      expect(cacheManager.get('testKey1')).toBeNull();
      expect(cacheManager.get('testKey2')).toBeNull();
      
      // But the other prefix item should remain
      expect(localStorage.getItem('other_testKey3')).not.toBeNull();
    });
  });

  describe('memory mode', () => {
    beforeEach(() => {
      // Create a memory cache instance
      cacheManager = new CacheManager({
        keyPrefix: 'test_',
        expirationTime: 1000, // 1 second
        storageType: StorageType.MEMORY
      });
    });

    it('should store and retrieve data from memory', () => {
      const testData = { name: 'Test', value: 123 };
      cacheManager.set('testKey', testData);
      
      // Verify localStorage was NOT called
      expect(localStorage.setItem).not.toHaveBeenCalled();
      
      const retrieved = cacheManager.get('testKey');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for expired items in memory', async () => {
      const testData = { name: 'Test', value: 123 };
      cacheManager.set('testKey', testData);
      
      // Fast-forward time to expire the cache
      jest.useFakeTimers();
      jest.advanceTimersByTime(1500); // 1.5 seconds
      
      const retrieved = cacheManager.get('testKey');
      expect(retrieved).toBeNull();
      
      jest.useRealTimers();
    });

    it('should remove items from memory', () => {
      const testData = { name: 'Test', value: 123 };
      cacheManager.set('testKey', testData);
      
      cacheManager.remove('testKey');
      
      // Verify localStorage.removeItem was NOT called
      expect(localStorage.removeItem).not.toHaveBeenCalled();
      
      const retrieved = cacheManager.get('testKey');
      expect(retrieved).toBeNull();
    });

    it('should clear all items from memory', () => {
      cacheManager.set('testKey1', 'value1');
      cacheManager.set('testKey2', 'value2');
      
      cacheManager.clear();
      
      expect(cacheManager.get('testKey1')).toBeNull();
      expect(cacheManager.get('testKey2')).toBeNull();
      
      // Verify localStorage.clear was NOT called
      expect(localStorage.clear).not.toHaveBeenCalled();
    });
  });
});
