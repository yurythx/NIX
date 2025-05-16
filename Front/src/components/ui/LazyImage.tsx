'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  placeholderColor = '#f3f4f6',
  width,
  height,
  objectFit = 'cover',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Usar Intersection Observer para detectar quando a imagem está visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Manipular carregamento da imagem
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Manipular erro de carregamento
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };

  // Estilo para o placeholder
  const placeholderStyle = {
    backgroundColor: placeholderColor,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '100%',
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={placeholderStyle}
        ></div>
      )}

      {/* Imagem real (carregada apenas quando visível) */}
      {isInView && !error && (
        <motion.img
          src={src}
          alt={alt}
          className={`w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectFit }}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Fallback para erro */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {alt || 'Imagem não disponível'}
          </span>
        </div>
      )}
    </div>
  );
}
