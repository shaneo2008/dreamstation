import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronDown } from 'lucide-react';

const ExpandedPlayer = ({ audioRef, title, scriptLines = [], timingMetadata = null, onCollapse }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const onMeta = () => setDuration(audio.duration);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (timingMetadata?.lines) {
        const idx = timingMetadata.lines.findIndex(
          l => audio.currentTime >= l.start_time && audio.currentTime <= l.end_time
        );
        if (idx !== -1) setCurrentLineIndex(idx);
      }
    };
    const onEnd = () => { setIsPlaying(false); setCurrentTime(0); setCurrentLineIndex(-1); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Sync initial state from the already-playing audio
    if (!isNaN(audio.duration)) setDuration(audio.duration);
    setCurrentTime(audio.currentTime);
    setIsPlaying(!audio.paused);
    setVolume(audio.volume);
    setPlaybackRate(audio.playbackRate);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [audioRef, timingMetadata]);

  useEffect(() => {
    if (audioRef?.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, audioRef]);

  useEffect(() => {
    if (audioRef?.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate, audioRef]);

  const togglePlayPause = async () => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); } catch (e) { console.error('Playback failed:', e); }
    } else {
      audio.pause();
    }
  };

  const seekTo = (t) => { if (audioRef?.current) audioRef.current.currentTime = Math.max(0, Math.min(t, duration)); };
  const skipBack = () => seekTo(currentTime - 10);
  const skipFwd = () => seekTo(currentTime + 10);

  const handleLineClick = (i) => {
    const line = timingMetadata?.lines?.[i];
    if (line) seekTo(line.start_time);
  };

  const fmt = (t) => {
    if (isNaN(t)) return '0:00';
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-sleep-950/40 backdrop-blur-sm flex flex-col justify-end">

      {/* Overlay tap to close */}
      <div className="flex-1" onClick={onCollapse} />

      {/* Panel */}
      <div className="bg-white rounded-t-3xl border-t-2 border-cream-300/50 shadow-dream max-h-[85vh] flex flex-col animate-slide-up">
        {/* Drag handle + collapse */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <button onClick={onCollapse} className="p-1 rounded-full">
            <ChevronDown className="w-5 h-5 text-sleep-400" />
          </button>
        </div>

        {/* Title */}
        <div className="px-6 pb-3 text-center">
          <h2 className="text-lg font-display font-bold text-sleep-900 truncate">{title || 'Now Playing'}</h2>
        </div>

        {/* Progress */}
        <div className="px-6 mb-4">
          <div
            className="w-full h-2.5 bg-cream-200 rounded-full cursor-pointer overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo(((e.clientX - rect.left) / rect.width) * duration);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-dream-glow to-dream-aurora rounded-full transition-all duration-100"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-sleep-400 mt-1 font-body">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-5 mb-4">
          <button onClick={skipBack} className="p-2.5 rounded-xl bg-cream-200 hover:bg-cream-300 text-sleep-600 active:scale-[0.95]">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlayPause}
            className="p-4 rounded-full bg-dream-glow hover:bg-dream-aurora text-white shadow-glow-sm active:scale-[0.95]"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button onClick={skipFwd} className="p-2.5 rounded-xl bg-cream-200 hover:bg-cream-300 text-sleep-600 active:scale-[0.95]">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume + Speed */}
        <div className="flex items-center justify-between px-6 mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="p-1 text-sleep-400 hover:text-dream-glow">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min="0" max="1" step="0.1" value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-cream-200 rounded-full appearance-none accent-dream-glow"
            />
            <span className="text-[10px] text-sleep-400 w-8 font-body">{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sleep-400 font-body">Speed:</span>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-cream-100/80 text-sleep-900 rounded-lg px-2 py-1 text-xs font-display font-semibold border-2 border-cream-300/60 focus:outline-none"
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

        {/* Current line highlight */}
        {currentLineIndex >= 0 && scriptLines[currentLineIndex] && (
          <div className="mx-6 p-3 bg-dream-stardust/20 rounded-2xl border border-dream-glow/20 mb-3">
            <div className="text-[10px] text-dream-aurora mb-1 flex items-center font-display font-semibold">
              <div className="w-2 h-2 bg-dream-glow rounded-full mr-2 animate-pulse" />
              Now Playing — {scriptLines[currentLineIndex].speaker}
            </div>
            <div className="text-sm text-sleep-900 leading-relaxed font-body">
              {scriptLines[currentLineIndex].text}
            </div>
          </div>
        )}

        {/* Script lines list */}
        {scriptLines.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-6 border-t-2 border-cream-300/30 pt-3">
            <h4 className="text-xs font-display font-bold text-sleep-600 mb-2">📝 Story Lines ({scriptLines.length})</h4>
            <div className="space-y-1.5">
              {scriptLines.map((line, i) => (
                <div
                  key={line.id || i}
                  onClick={() => handleLineClick(i)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all ${i === currentLineIndex
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
      </div>
    </div>
  );
};

export default ExpandedPlayer;
