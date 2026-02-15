import { useState, useRef, useEffect, useCallback } from 'react';

const useAudioPlayer = (audioUrl, timingMetadata = null) => {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  // Refs
  const audioRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) {
      setError(null);
      setIsLoading(false);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setError(null);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      console.log('🎵 Audio loaded successfully, duration:', audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateCurrentLine(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentLineIndex(-1);
      console.log('🎵 Audio playback ended');
    };

    const handleError = (e) => {
      const errorMessage = 'Failed to load audio';
      setError(errorMessage);
      setIsLoading(false);
      console.error('🎵 Audio loading error:', e);
    };

    const handleCanPlay = () => {
      console.log('🎵 Audio can start playing');
    };

    const handleLoadStart = () => {
      console.log('🎵 Audio loading started');
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    // Set audio properties
    audio.src = audioUrl;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;
    audio.preload = 'metadata';

    return () => {
      // Cleanup event listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      
      // Pause and reset
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, volume, playbackRate, isMuted, updateCurrentLine]);

  // Update current line based on timing metadata
  const updateCurrentLine = useCallback((time) => {
    if (!timingMetadata || !timingMetadata.lines) return;

    const currentLine = timingMetadata.lines.find(line => 
      time >= line.start_time && time < line.end_time
    );

    if (currentLine) {
      const lineIndex = timingMetadata.lines.indexOf(currentLine);
      if (lineIndex !== currentLineIndex) {
        setCurrentLineIndex(lineIndex);
        console.log('🎵 Current line changed to:', lineIndex, currentLine.text?.substring(0, 50) + '...');
      }
    } else if (currentLineIndex !== -1) {
      // No current line (between lines or before/after script)
      setCurrentLineIndex(-1);
    }
  }, [timingMetadata, currentLineIndex]);

  // Playback controls
  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return false;

    try {
      await audio.play();
      setIsPlaying(true);
      console.log('🎵 Audio playback started');
      return true;
    } catch (error) {
      const errorMessage = 'Playback failed';
      setError(errorMessage);
      console.error('🎵 Playback error:', error);
      return false;
    }
  }, [isLoading]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    console.log('🎵 Audio playback paused');
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || isNaN(time)) return;

    const clampedTime = Math.max(0, Math.min(time, duration));
    audio.currentTime = clampedTime;
    console.log('🎵 Seeked to time:', clampedTime);
  }, [duration]);

  const skipBackward = useCallback((seconds = 10) => {
    seekTo(currentTime - seconds);
  }, [currentTime, seekTo]);

  const skipForward = useCallback((seconds = 10) => {
    seekTo(currentTime + seconds);
  }, [currentTime, seekTo]);

  const jumpToLine = useCallback((lineIndex) => {
    if (!timingMetadata || !timingMetadata.lines[lineIndex]) return;
    
    const line = timingMetadata.lines[lineIndex];
    seekTo(line.start_time);
    console.log('🎵 Jumped to line:', lineIndex, line.text?.substring(0, 50) + '...');
  }, [timingMetadata, seekTo]);

  const setVolumeLevel = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    
    const audio = audioRef.current;
    if (audio && !isMuted) {
      audio.volume = clampedVolume;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const setSpeed = useCallback((newRate) => {
    const clampedRate = Math.max(0.25, Math.min(4, newRate));
    setPlaybackRate(clampedRate);
    
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = clampedRate;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    seekTo(0);
    setCurrentLineIndex(-1);
    setError(null);
  }, [pause, seekTo]);

  // Format time for display
  const formatTime = useCallback((time) => {
    if (isNaN(time) || time < 0) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get current line info
  const getCurrentLineInfo = useCallback(() => {
    if (currentLineIndex < 0 || !timingMetadata || !timingMetadata.lines) return null;
    return timingMetadata.lines[currentLineIndex];
  }, [currentLineIndex, timingMetadata]);

  return {
    // Audio element ref
    audioRef,
    
    // State
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isLoading,
    error,
    currentLineIndex,
    progressPercentage,
    
    // Controls
    play,
    pause,
    togglePlayPause,
    seekTo,
    skipBackward,
    skipForward,
    jumpToLine,
    setVolumeLevel,
    toggleMute,
    setSpeed,
    reset,
    
    // Utilities
    formatTime,
    getCurrentLineInfo,
    
    // Script sync
    updateCurrentLine
  };
};

export default useAudioPlayer;
