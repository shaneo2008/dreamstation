import React, { useEffect, useRef } from 'react';
import { Clock, User } from 'lucide-react';

const ScriptSync = ({ 
  scriptLines = [], 
  currentLineIndex = -1,
  timingMetadata = null,
  onLineClick = () => {},
  className = ""
}) => {
  const currentLineRef = useRef(null);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineIndex >= 0 && currentLineRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex]);

  // Get timing info for a line
  const getLineTimingInfo = (lineIndex) => {
    if (!timingMetadata || !timingMetadata.lines) return null;
    return timingMetadata.lines[lineIndex];
  };

  // Format time for display
  const formatTime = (time) => {
    if (typeof time !== 'number' || isNaN(time)) return '--:--';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle line click
  const handleLineClick = (lineIndex) => {
    const timingInfo = getLineTimingInfo(lineIndex);
    if (timingInfo) {
      onLineClick(lineIndex, timingInfo.start_time);
    }
  };

  // Get line type styling
  const getLineTypeStyle = (line) => {
    switch (line.type) {
      case 'dialogue':
        return 'border-l-4 border-blue-500 pl-4';
      case 'narration':
        return 'border-l-4 border-purple-500 pl-4';
      case 'sound_effect':
        return 'border-l-4 border-green-500 pl-4';
      case 'music':
        return 'border-l-4 border-yellow-500 pl-4';
      default:
        return 'border-l-4 border-gray-500 pl-4';
    }
  };

  // Get speaker color
  const getSpeakerColor = (speaker) => {
    const colors = {
      'Narrator': 'text-purple-400',
      'Evelyn': 'text-blue-400',
      'Marcus': 'text-green-400',
      'Aria': 'text-pink-400',
      'Malakar': 'text-red-400'
    };
    return colors[speaker] || 'text-gray-400';
  };

  if (!scriptLines || scriptLines.length === 0) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">No Script Available</div>
          <div className="text-sm">Load a script to see synchronized playback</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Clock size={20} className="mr-2" />
            Script Synchronization
          </h3>
          <div className="text-sm text-gray-400">
            {scriptLines.length} lines
          </div>
        </div>
      </div>

      {/* Script Lines */}
      <div className="max-h-96 overflow-y-auto">
        {scriptLines.map((line, index) => {
          const isCurrentLine = index === currentLineIndex;
          const timingInfo = getLineTimingInfo(index);
          const isClickable = timingInfo !== null;

          return (
            <div
              key={line.id || index}
              ref={isCurrentLine ? currentLineRef : null}
              className={`
                p-4 border-b border-gray-800/50 transition-all duration-300
                ${isCurrentLine 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50' 
                  : 'hover:bg-gray-800/30'
                }
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                ${getLineTypeStyle(line)}
              `}
              onClick={() => isClickable && handleLineClick(index)}
            >
              {/* Line Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User size={14} className={getSpeakerColor(line.speaker)} />
                  <span className={`text-sm font-medium ${getSpeakerColor(line.speaker)}`}>
                    {line.speaker}
                  </span>
                  <span className="text-xs text-gray-500 uppercase">
                    {line.type}
                  </span>
                  {isCurrentLine && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      PLAYING
                    </span>
                  )}
                </div>
                
                {/* Timing Info */}
                {timingInfo && (
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <span>{formatTime(timingInfo.start_time)}</span>
                    <span>→</span>
                    <span>{formatTime(timingInfo.end_time)}</span>
                    <span className="text-gray-500">
                      ({formatTime(timingInfo.end_time - timingInfo.start_time)})
                    </span>
                  </div>
                )}
              </div>

              {/* Line Text */}
              <div className={`
                text-sm leading-relaxed transition-all duration-300
                ${isCurrentLine ? 'text-white font-medium' : 'text-gray-300'}
              `}>
                {line.text}
              </div>

              {/* Emotion/Annotation Info */}
              {line.annotations && line.annotations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {line.annotations.map((annotation, annotationIndex) => (
                    <span
                      key={annotationIndex}
                      className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded"
                    >
                      {annotation.emotion || annotation.type}: {annotation.intensity || annotation.value}
                    </span>
                  ))}
                </div>
              )}

              {/* Click hint for non-current lines */}
              {isClickable && !isCurrentLine && (
                <div className="mt-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to jump to this line
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            {currentLineIndex >= 0 
              ? `Line ${currentLineIndex + 1} of ${scriptLines.length}` 
              : 'Ready to play'
            }
          </div>
          {timingMetadata && (
            <div>
              Total duration: {formatTime(timingMetadata.total_duration)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptSync;
