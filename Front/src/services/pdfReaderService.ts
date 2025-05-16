/**
 * Serviço para gerenciar a persistência de marcadores e anotações para o leitor de PDF
 */

import { STORAGE_KEYS } from '../config/storageKeys';

// Tipos para marcadores e anotações
export interface PdfBookmark {
  chapterId: number;
  pageNumber: number;
  createdAt: string;
  title?: string;
}

export interface PdfAnnotation {
  chapterId: number;
  pageNumber: number;
  text: string;
  createdAt: string;
  updatedAt?: string;
  id: string;
}

export interface PdfReaderSettings {
  readingMode: 'paged' | 'continuous';
  zoomLevel: number;
  showAnnotations: boolean;
}

/**
 * Gera um ID único para anotações
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Função utilitária para manipular localStorage
const localStorageUtil = {
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Erro ao recuperar item do localStorage (${key}):`, error);
      return null;
    }
  },
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar item no localStorage (${key}):`, error);
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erro ao remover item do localStorage (${key}):`, error);
    }
  },
};

/**
 * Serviço para gerenciar marcadores, anotações e configurações do leitor de PDF
 */
export const pdfReaderService = {
  // Gerenciamento de marcadores
  getBookmarks: (chapterId?: number): PdfBookmark[] => {
    const bookmarks = localStorageUtil.getItem<PdfBookmark[]>(STORAGE_KEYS.BOOKMARKS) || [];
    return chapterId !== undefined
      ? bookmarks.filter(bookmark => bookmark.chapterId === chapterId)
      : bookmarks;
  },

  addBookmark: (chapterId: number, pageNumber: number, title?: string): PdfBookmark => {
    const bookmarks = pdfReaderService.getBookmarks();
    const existingIndex = bookmarks.findIndex(
      b => b.chapterId === chapterId && b.pageNumber === pageNumber
    );
    if (existingIndex !== -1) {
      bookmarks.splice(existingIndex, 1);
      localStorageUtil.setItem(STORAGE_KEYS.BOOKMARKS, bookmarks);
      return bookmarks[existingIndex];
    }
    const newBookmark: PdfBookmark = {
      chapterId,
      pageNumber,
      createdAt: new Date().toISOString(),
      title: title || `Página ${pageNumber}`,
    };
    bookmarks.push(newBookmark);
    localStorageUtil.setItem(STORAGE_KEYS.BOOKMARKS, bookmarks);
    return newBookmark;
  },

  removeBookmark: (chapterId: number, pageNumber: number): boolean => {
    const bookmarks = pdfReaderService.getBookmarks();
    const initialLength = bookmarks.length;

    const filteredBookmarks = bookmarks.filter(
      b => !(b.chapterId === chapterId && b.pageNumber === pageNumber)
    );

    localStorageUtil.setItem(STORAGE_KEYS.BOOKMARKS, filteredBookmarks);

    return filteredBookmarks.length < initialLength;
  },

  // Gerenciamento de anotações
  getAnnotations: (chapterId?: number, pageNumber?: number): PdfAnnotation[] => {
    const annotations = localStorageUtil.getItem<PdfAnnotation[]>(STORAGE_KEYS.ANNOTATIONS) || [];

    if (chapterId !== undefined) {
      const chapterAnnotations = annotations.filter(a => a.chapterId === chapterId);

      if (pageNumber !== undefined) {
        return chapterAnnotations.filter(a => a.pageNumber === pageNumber);
      }

      return chapterAnnotations;
    }

    return annotations;
  },

  addAnnotation: (chapterId: number, pageNumber: number, text: string): PdfAnnotation => {
    const annotations = pdfReaderService.getAnnotations();

    const newAnnotation: PdfAnnotation = {
      id: generateId(),
      chapterId,
      pageNumber,
      text,
      createdAt: new Date().toISOString(),
    };

    annotations.push(newAnnotation);
    localStorageUtil.setItem(STORAGE_KEYS.ANNOTATIONS, annotations);

    return newAnnotation;
  },

  updateAnnotation: (id: string, text: string): PdfAnnotation | null => {
    const annotations = pdfReaderService.getAnnotations();
    const annotationIndex = annotations.findIndex(a => a.id === id);

    if (annotationIndex === -1) {
      return null;
    }

    annotations[annotationIndex] = {
      ...annotations[annotationIndex],
      text,
      updatedAt: new Date().toISOString(),
    };

    localStorageUtil.setItem(STORAGE_KEYS.ANNOTATIONS, annotations);

    return annotations[annotationIndex];
  },

  removeAnnotation: (id: string): boolean => {
    const annotations = pdfReaderService.getAnnotations();
    const initialLength = annotations.length;

    const filteredAnnotations = annotations.filter(a => a.id !== id);

    localStorageUtil.setItem(STORAGE_KEYS.ANNOTATIONS, filteredAnnotations);

    return filteredAnnotations.length < initialLength;
  },

  // Gerenciamento de configurações
  getSettings: (): PdfReaderSettings => {
    const defaultSettings: PdfReaderSettings = {
      readingMode: 'paged',
      zoomLevel: 100,
      showAnnotations: true,
    };

    const storedSettings = localStorageUtil.getItem<PdfReaderSettings>(STORAGE_KEYS.SETTINGS);

    return storedSettings ? { ...defaultSettings, ...storedSettings } : defaultSettings;
  },

  saveSettings: (settings: Partial<PdfReaderSettings>): PdfReaderSettings => {
    const currentSettings = pdfReaderService.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    localStorageUtil.setItem(STORAGE_KEYS.SETTINGS, updatedSettings);

    return updatedSettings;
  },

  // Gerenciamento de progresso de leitura
  saveReadingProgress: (chapterId: number, pageNumber: number): void => {
    const progressKey = `${STORAGE_KEYS.READING_PROGRESS}_${chapterId}`;
    localStorageUtil.setItem(progressKey, pageNumber);
  },

  getReadingProgress: (chapterId: number): number => {
    const progressKey = `${STORAGE_KEYS.READING_PROGRESS}_${chapterId}`;
    const progress = localStorageUtil.getItem<number>(progressKey);

    return progress || 1;
  },
};

export default pdfReaderService;
