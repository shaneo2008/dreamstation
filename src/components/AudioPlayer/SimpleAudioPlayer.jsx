import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

const SimpleAudioPlayer = ({
  audioUrl,
  scriptLines = [],
  timingMetadata = null,
  className = "",
  autoPlay = false
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  // Debug script lines data (only log once when scriptLines change)
  useEffect(() => {
    if (scriptLines?.[0]) {
      console.log('🎵 SimpleAudioPlayer script lines DETAILED:', {
        scriptLinesLength: scriptLines?.length || 0,
        hasScriptLines: scriptLines && scriptLines.length > 0,
        firstLineKeys: Object.keys(scriptLines[0]),
        firstLineData: scriptLines[0],
        sampleLines: scriptLines?.slice(0, 2).map(line => ({
          keys: Object.keys(line),
          data: line
        }))
      });
    }
  }, [scriptLines]);

  // Update current line (defined before useEffect to avoid hoisting issues)
  const updateCurrentLine = useCallback((time) => {
    if (!timingMetadata || !timingMetadata.lines) return;

    const currentLine = timingMetadata.lines.find(line =>
      time >= line.start_time && time <= line.end_time
    );

    if (currentLine) {
      const lineIndex = timingMetadata.lines.indexOf(currentLine);
      if (lineIndex !== currentLineIndex) {
        setCurrentLineIndex(lineIndex);
      }
    }
  }, [timingMetadata, currentLineIndex]);

  // Initialize audio (only when audioUrl changes)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
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

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    audio.src = audioUrl;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;

    // Auto-play if requested (only once to prevent duplicate attempts)
    if (autoPlay && !hasAutoPlayed) {
      console.log('🎵 Auto-playing audio in SimpleAudioPlayer');
      setHasAutoPlayed(true);
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Auto-play failed:', error);
      });
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, autoPlay, updateCurrentLine]); // volume, isMuted, playbackRate handled in separate effects to prevent audio reload

  // Handle volume changes separately (without reloading audio)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle playback rate changes separately (without reloading audio)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Controls
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Playback failed:', error);
      }
    }
  };

  const seekTo = (time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, duration));
  };

  const skipBackward = () => seekTo(currentTime - 10);
  const skipForward = () => seekTo(currentTime + 10);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      // Don't change volume if muted, just update the state
      if (!isMuted) {
        audioRef.current.volume = newVolume;
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  const handleSpeedChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleLineClick = (index) => {
    const line = timingMetadata?.lines[index];
    if (line) {
      seekTo(line.start_time);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-cream-300/50 p-5 shadow-card ${className}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-display font-bold text-sleep-900">🎧 Audio Player</h3>
        <div className="text-xs text-sleep-400 font-body">
          {scriptLines.length} lines • {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div
          className="w-full h-2.5 bg-cream-200 rounded-full cursor-pointer relative group overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            seekTo(newTime);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-dream-glow to-dream-aurora rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-sleep-400 mt-1.5 font-body">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 mb-5">
        <button
          onClick={skipBackward}
          className="p-2 rounded-xl bg-cream-200 hover:bg-cream-300 text-sleep-600 transition-all active:scale-[0.95]"
          title="Skip backward 10 seconds"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={togglePlayPause}
          disabled={!audioUrl}
          className="p-3.5 rounded-2xl bg-dream-glow hover:bg-dream-aurora text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-sm active:scale-[0.95]"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <button
          onClick={skipForward}
          className="p-2 rounded-xl bg-cream-200 hover:bg-cream-300 text-sleep-600 transition-all active:scale-[0.95]"
          title="Skip forward 10 seconds"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between text-sm mb-4">
        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-1 rounded-lg text-sleep-400 hover:text-dream-glow transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1.5 bg-cream-200 rounded-full appearance-none accent-dream-glow"
          />
          <span className="text-[10px] text-sleep-400 w-8 font-body">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-sleep-400 font-body">Speed:</span>
          <select
            value={playbackRate}
            onChange={handleSpeedChange}
            className="bg-cream-100/80 text-sleep-900 rounded-lg px-2 py-1 text-xs font-display font-semibold border-2 border-cream-300/60 focus:border-dream-glow/50 focus:outline-none transition-all"
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
        <div className="p-3 bg-dream-stardust/20 rounded-2xl border border-dream-glow/20 mb-4">
          <div className="text-[10px] text-dream-aurora mb-1 flex items-center font-display font-semibold">
            <div className="w-2 h-2 bg-dream-glow rounded-full mr-2 animate-pulse"></div>
            Now Playing — {scriptLines[currentLineIndex].speaker}
          </div>
          <div className="text-sm text-sleep-900 leading-relaxed font-body">
            {scriptLines[currentLineIndex].text}
          </div>
        </div>
      )}

      {/* Script Lines */}
      {scriptLines.length > 0 && (
        <div className="max-h-64 overflow-y-auto border-t-2 border-cream-300/30 pt-4 mt-4">
          <h4 className="text-xs font-display font-bold text-sleep-600 mb-2 flex items-center">
            📝 Script Lines ({scriptLines.length})
          </h4>
          <div className="space-y-1.5">
            {scriptLines.map((line, index) => (
              <div
                key={line.id || index}
                onClick={() => handleLineClick(index)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${index === currentLineIndex
                    ? 'bg-dream-stardust/30 border-2 border-dream-glow/30 text-sleep-900'
                    : 'bg-cream-100/40 hover:bg-cream-100/80 text-sleep-600 border-2 border-transparent'
                  }`}
              >
                <div className="text-[10px] text-sleep-400 mb-0.5 font-display font-semibold">{line.speaker}</div>
                <div className="text-xs font-body">{line.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No audio state */}
      {!audioUrl && (
        <div className="text-center py-8">
          <div className="text-base mb-2 font-display font-bold text-sleep-500">No Audio Loaded</div>
          <div className="text-xs text-sleep-400 font-body">Generate or load an audio production to start playback</div>
        </div>
      )}
    </div>
  );
};

export default SimpleAudioPlayer;
