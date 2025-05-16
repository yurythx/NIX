'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Bookmark, Clock } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onBookmark?: (time: number) => void;
  bookmarks?: number[];
}

export default function AudioPlayer({
  src,
  title,
  className = '',
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onBookmark,
  bookmarks = []
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Inicializar o áudio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Configurar manipuladores de eventos
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (onTimeUpdate) onTimeUpdate(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onEnded) onEnded();
    };

    const handleError = () => {
      setError('Erro ao carregar o áudio');
      setIsLoading(false);
    };

    // Adicionar event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Limpar event listeners
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onEnded, onTimeUpdate]);

  // Alternar reprodução
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (onPause) onPause();
    } else {
      audio.play();
      setIsPlaying(true);
      if (onPlay) onPlay();
    }
  };

  // Alternar mudo
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Ajustar volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume;
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Avançar 10 segundos
  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
  };

  // Retroceder 10 segundos
  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(audio.currentTime - 10, 0);
  };

  // Atualizar a posição da reprodução
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const audio = audioRef.current;
    if (!progressBar || !audio) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  };

  // Adicionar marcador na posição atual
  const addBookmark = () => {
    if (onBookmark) {
      onBookmark(currentTime);
    }
  };

  // Ir para um marcador
  const goToBookmark = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
  };

  // Alterar a velocidade de reprodução
  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // Formatar tempo (segundos para MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      {/* Elemento de áudio (oculto) */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Título */}
      {title && (
        <div className="mb-3 font-medium text-gray-900 dark:text-white truncate">
          {title}
        </div>
      )}

      {/* Barra de progresso */}
      <div
        ref={progressBarRef}
        className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 cursor-pointer"
        onClick={handleProgressChange}
      >
        <div
          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full relative"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-indigo-700 dark:bg-indigo-400 rounded-full"></div>
        </div>
      </div>

      {/* Tempo */}
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Botão de retroceder */}
          <button
            onClick={skipBackward}
            disabled={isLoading}
            className="p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
            title="Retroceder 10 segundos"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Botão de reprodução/pausa */}
          <button
            onClick={togglePlay}
            disabled={isLoading || !!error}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            title={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          {/* Botão de avançar */}
          <button
            onClick={skipForward}
            disabled={isLoading}
            className="p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
            title="Avançar 10 segundos"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Botão de marcador */}
          {onBookmark && (
            <button
              onClick={addBookmark}
              disabled={isLoading || !!error}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
              title="Adicionar marcador"
            >
              <Bookmark className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Controle de velocidade */}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={playbackRate}
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
              className="bg-gray-100 dark:bg-gray-700 border-none rounded-md text-sm"
              title="Velocidade de reprodução"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>

          {/* Controle de volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              title={isMuted ? "Ativar som" : "Desativar som"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              title="Volume"
            />
          </div>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Lista de marcadores */}
      {bookmarks && bookmarks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marcadores</h4>
          <div className="flex flex-wrap gap-2">
            {bookmarks.map((time, index) => (
              <button
                key={index}
                onClick={() => goToBookmark(time)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
                title={`Ir para ${formatTime(time)}`}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
