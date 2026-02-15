import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import useAudioPlayer from '../../hooks/useAudioPlayer';

const AudioPlayerWithSync = ({ 
  audioUrl, 
  timingMetadata = null
}) => {
  const {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    seekTo,
    setIsPlaying,
    setVolume,
    setPlaybackRate,
    setCurrentTime,
    setDuration
  } = useAudioPlayer(audioUrl, timingMetadata);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePlaybackRateChange = (e) => {
    setPlaybackRate(parseFloat(e.target.value));
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Format time helper function
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      >
        <source src="https://example.com/audio.mp3" type="audio/mp3" />
      </audio>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={handlePlayPause}
          className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between text-sm mb-4">
        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 1)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title={volume > 0 ? "Mute" : "Unmute"}
          >
            {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-slate-700 rounded-full appearance-none slider"
          />
          <span className="text-xs text-slate-400 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Speed:</span>
          <select
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            className="bg-slate-800 text-white rounded px-2 py-1 text-xs border border-slate-700 focus:border-blue-500 focus:outline-none"
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

      {/* Progress Bar */}
      <div className="mb-6">
        <div
          className="w-full h-2 bg-slate-700 rounded-full cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            seekTo(newTime);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerWithSync;
