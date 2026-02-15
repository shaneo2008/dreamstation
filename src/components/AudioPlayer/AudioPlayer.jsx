import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

const AudioPlayer = ({ 
  audioUrl, 
  scriptLines = [], 
  timingMetadata = null,
  onCurrentLineChange = () => {},
  className = ""
}) => {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Script sync state
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  // Refs
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;

    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setError(null);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateCurrentLine(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentLineIndex(-1);
    };

    const handleError = (e) => {
      setError('Failed to load audio');
      setIsLoading(false);
      console.error('Audio loading error:', e);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Set audio source
    audio.src = audioUrl;
    audio.volume = volume;
    audio.playbackRate = playbackRate;

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, volume, playbackRate, updateCurrentLine]);

  // Update current line based on timing metadata
  const updateCurrentLine = useCallback((time) => {
    if (!timingMetadata || !timingMetadata.lines) return;
    
    const currentLine = timingMetadata.lines.find(line => 
      time >= line.start_time && time <= line.end_time
    );

    if (currentLine) {
      const lineIndex = timingMetadata.lines.indexOf(currentLine);
      if (lineIndex !== currentLineIndex) {
        setCurrentLineIndex(lineIndex);
        onCurrentLineChange(lineIndex, currentLine);
      }
    }
  }, [timingMetadata, currentLineIndex, onCurrentLineChange]);

  // Playback controls
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      setError('Playback failed');
      console.error('Playback error:', error);
    }
  };

  const skipToTime = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(time, duration));
  }, [duration]);

  const skipBackward = () => {
    skipToTime(currentTime - 10);
  };

  const skipForward = () => {
    skipToTime(currentTime + 10);
  };

  const handleProgressClick = (e) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    skipToTime(newTime);
  };

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

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    const audio = audioRef.current;
    if (audio && !isMuted) {
      audio.volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = newRate;
    }
  };

  // Jump to specific line (used by parent components)
  const jumpToLine = useCallback((lineIndex) => {
    if (!timingMetadata || !timingMetadata.lines[lineIndex]) return;
    
    const line = timingMetadata.lines[lineIndex];
    skipToTime(line.start_time);
  }, [timingMetadata, skipToTime]);

  // Expose jumpToLine for parent components
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    jumpToLine
  }), [jumpToLine]);

  // Format time display
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 ${className}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Audio Player</h3>
        {isLoading && (
          <div className="text-sm text-blue-400">Loading audio...</div>
        )}
        {error && (
          <div className="text-sm text-red-400">{error}</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div 
          ref={progressBarRef}
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer relative"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
          {/* Progress handle */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-100"
            style={{ left: `calc(${progressPercentage}% - 8px)` }}
          />
        </div>
        
        {/* Time display */}
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={skipBackward}
          disabled={isLoading}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50"
        >
          <SkipBack size={20} />
        </button>
        
        <button
          onClick={togglePlayPause}
          disabled={isLoading || !audioUrl}
          className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all disabled:opacity-50"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        
        <button
          onClick={skipForward}
          disabled={isLoading}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between text-sm">
        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-1 rounded text-gray-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-gray-700 rounded-full appearance-none slider"
          />
        </div>

        {/* Playback Speed */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Speed:</span>
          <select
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            className="bg-gray-800 text-white rounded px-2 py-1 text-xs border border-gray-700"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>

      {/* Current Line Display */}
      {currentLineIndex >= 0 && scriptLines[currentLineIndex] && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">
            Currently Playing - {scriptLines[currentLineIndex].speaker}
          </div>
          <div className="text-sm text-white">
            {scriptLines[currentLineIndex].text}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
