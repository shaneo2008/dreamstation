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
    <div className="fixed inset-0 z-50 bg-[#0b0705]/70 backdrop-blur-md flex flex-col justify-end">

      {/* Overlay tap to close */}
      <div className="flex-1" onClick={onCollapse} />

      {/* Panel */}
      <div className="bg-[#1b120c]/96 rounded-t-[32px] border-t border-white/10 shadow-dream max-h-[85vh] flex flex-col animate-slide-up backdrop-blur-xl overflow-hidden">
        {/* Drag handle + collapse */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <button onClick={onCollapse} className="p-1.5 rounded-full text-cream-400/70 hover:text-cream-100 hover:bg-white/5 transition-colors">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="px-6 pb-3 text-center">
          <div className="text-[11px] uppercase tracking-[0.16em] text-cream-400/55 font-body mb-1">Now Playing</div>
          <h2 className="text-lg font-display font-bold text-cream-100 truncate">{title || 'Now Playing'}</h2>
        </div>

        {/* Progress */}
        <div className="px-6 mb-4">
          <div
            className="w-full h-2.5 bg-white/10 rounded-full cursor-pointer overflow-hidden border border-white/5"
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
          <div className="flex justify-between text-[10px] text-cream-400/60 mt-1 font-body">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-5 mb-4">
          <button onClick={skipBack} className="p-2.5 rounded-2xl bg-[#2b1d13]/88 hover:bg-[#342318] text-cream-200 border border-white/10 active:scale-[0.95] transition-all">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlayPause}
            className="p-4 rounded-full bg-dream-glow hover:bg-dream-aurora text-white shadow-glow-sm active:scale-[0.95]"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button onClick={skipFwd} className="p-2.5 rounded-2xl bg-[#2b1d13]/88 hover:bg-[#342318] text-cream-200 border border-white/10 active:scale-[0.95] transition-all">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume + Speed */}
        <div className="flex items-center justify-between px-6 mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="p-1 text-cream-400/65 hover:text-dream-glow transition-colors">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min="0" max="1" step="0.1" value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-white/10 rounded-full appearance-none accent-dream-glow"
            />
            <span className="text-[10px] text-cream-400/60 w-8 font-body">{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-cream-400/60 font-body">Speed:</span>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-[#24170f]/90 text-cream-100 rounded-xl px-2.5 py-1.5 text-xs font-display font-semibold border border-white/10 focus:outline-none focus:border-dream-glow/40"
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
          <div className="mx-6 p-3 bg-dream-stardust/12 rounded-2xl border border-dream-glow/20 mb-3 shadow-glow-sm">
            <div className="text-[10px] text-dream-aurora mb-1 flex items-center font-display font-semibold">
              <div className="w-2 h-2 bg-dream-glow rounded-full mr-2 animate-pulse" />
              Now Playing — {scriptLines[currentLineIndex].speaker || scriptLines[currentLineIndex].speaker_name}
            </div>
            <div className="text-sm text-cream-100 leading-relaxed font-body">
              {scriptLines[currentLineIndex].text || scriptLines[currentLineIndex].text_content}
            </div>
          </div>
        )}

        {/* Script lines list */}
        {scriptLines.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-6 border-t border-white/10 pt-3 bg-[#140e0a]/48">
            <h4 className="text-xs font-display font-bold text-cream-300/80 mb-2">📝 Story Lines ({scriptLines.length})</h4>
            <div className="space-y-1.5">
              {scriptLines.map((line, i) => (
                <div
                  key={line.id || i}
                  onClick={() => handleLineClick(i)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all ${i === currentLineIndex
                    ? 'bg-dream-stardust/18 border border-dream-glow/30 text-cream-100 shadow-glow-sm'
                    : 'bg-[#24170f]/78 hover:bg-[#2b1d13]/88 text-cream-300 border border-white/8'
                    }`}
                >
                  <div className="text-[10px] text-cream-400/60 mb-0.5 font-display font-semibold">{line.speaker || line.speaker_name}</div>
                  <div className="text-xs font-body leading-relaxed">{line.text || line.text_content}</div>
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
