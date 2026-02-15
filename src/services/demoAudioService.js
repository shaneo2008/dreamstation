// Demo Audio Service for testing the Audio Player
// This provides sample audio and timing data for Phase 1 testing

export const createDemoAudioProduction = (scriptLines) => {
  console.log('🎵 Creating demo audio production for', scriptLines.length, 'lines');

  // Create realistic timing metadata
  let currentTime = 0;
  const lines = scriptLines.map((line) => {
    // Estimate duration based on text length (roughly 150 words per minute)
    const wordCount = line.text.split(' ').length;
    const estimatedDuration = Math.max(2, (wordCount / 150) * 60); // Minimum 2 seconds
    const startTime = currentTime;
    const endTime = currentTime + estimatedDuration;
    
    currentTime = endTime + 0.5; // Add 0.5 second pause between lines
    
    return {
      line_id: line.id,
      start_time: startTime,
      end_time: endTime,
      speaker: line.speaker,
      text: line.text,
      type: line.type
    };
  });

  const timingMetadata = {
    total_duration: currentTime,
    lines: lines,
    created_at: new Date().toISOString(),
    demo: true
  };

  // Use a longer sample audio file for better testing
  // This is a public domain audio file that should work for testing
  const demoAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
  
  // Alternative: Use a text-to-speech demo URL if available
  // const demoAudioUrl = 'https://tts-api-demo.s3.amazonaws.com/sample-narration.wav';

  console.log('✅ Demo audio production created:', {
    duration: timingMetadata.total_duration,
    lines: lines.length,
    audioUrl: demoAudioUrl
  });

  return {
    audioUrl: demoAudioUrl,
    timingMetadata: timingMetadata,
    success: true,
    demo: true
  };
};

export const getDemoAudioUrl = () => {
  // Return a reliable demo audio URL
  return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
};

export const createRealisticTimingData = (scriptLines) => {
  let currentTime = 0;
  
  const lines = scriptLines.map((line) => {
    // More realistic timing calculation
    const wordCount = line.text.split(' ').length;
    
    // Base duration on speaking rate (average 150-200 words per minute)
    let baseDuration = (wordCount / 175) * 60; // 175 WPM average
    
    // Adjust for line type
    switch (line.type) {
      case 'dialogue':
        baseDuration *= 1.1; // Slightly slower for dialogue
        break;
      case 'narration':
        baseDuration *= 1.0; // Normal speed
        break;
      case 'sound_effect':
        baseDuration = Math.min(baseDuration, 3); // Cap sound effects
        break;
      default:
        baseDuration *= 1.0;
    }
    
    // Adjust for emotions/annotations
    if (line.annotations && line.annotations.length > 0) {
      const hasSlowEmotions = line.annotations.some(ann => 
        ['sad', 'thoughtful', 'mysterious'].includes(ann)
      );
      const hasFastEmotions = line.annotations.some(ann => 
        ['excited', 'angry', 'scared'].includes(ann)
      );
      
      if (hasSlowEmotions) baseDuration *= 1.2;
      if (hasFastEmotions) baseDuration *= 0.9;
    }
    
    // Minimum and maximum duration constraints
    const duration = Math.max(1.5, Math.min(baseDuration, 15));
    
    const startTime = currentTime;
    const endTime = currentTime + duration;
    
    // Add natural pause between lines
    const pauseDuration = line.type === 'dialogue' ? 0.8 : 0.5;
    currentTime = endTime + pauseDuration;
    
    return {
      line_id: line.id,
      start_time: Math.round(startTime * 10) / 10, // Round to 1 decimal
      end_time: Math.round(endTime * 10) / 10,
      speaker: line.speaker,
      text: line.text,
      type: line.type,
      duration: Math.round(duration * 10) / 10
    };
  });

  return {
    total_duration: Math.round(currentTime * 10) / 10,
    lines: lines,
    metadata: {
      average_line_duration: lines.reduce((sum, line) => sum + line.duration, 0) / lines.length,
      total_lines: lines.length,
      speakers: [...new Set(lines.map(line => line.speaker))],
      created_at: new Date().toISOString()
    }
  };
};
