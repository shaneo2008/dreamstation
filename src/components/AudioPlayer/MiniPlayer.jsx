import React, { useState, useEffect } from 'react';
import { Play, Pause, X, ChevronUp } from 'lucide-react';

const MiniPlayer = ({ audioRef, title, onClose, onExpand }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const onMeta = () => setDuration(audio.duration);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Sync initial state
    if (!isNaN(audio.duration)) setDuration(audio.duration);
    setCurrentTime(audio.currentTime);
    setIsPlaying(!audio.paused);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [audioRef]);

  const togglePlayPause = async (e) => {
    e.stopPropagation();
    const audio = audioRef?.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); } catch (err) { console.error('Playback failed:', err); }
    } else {
      audio.pause();
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    onClose?.();
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    const audio = audioRef?.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const fmt = (t) => {
    if (isNaN(t)) return '0:00';
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onExpand}
      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer active:bg-cream-200/50 transition-colors"
    >
      {/* Play / Pause */}
      <button
        onClick={togglePlayPause}
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-dream-glow text-white shadow-glow-sm active:scale-[0.93] transition-transform"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Title + time + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-display font-bold text-sleep-900 truncate mr-2">
            {title || 'Now Playing'}
          </span>
          <span className="text-[10px] text-sleep-400 font-body shrink-0">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        </div>
        <div
          className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-dream-glow to-dream-aurora rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Expand */}
      <button
        onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
        className="shrink-0 p-1.5 text-sleep-400 hover:text-sleep-700 transition-colors"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* Close */}
      <button
        onClick={handleClose}
        className="shrink-0 p-1.5 text-sleep-400 hover:text-danger transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default MiniPlayer;
