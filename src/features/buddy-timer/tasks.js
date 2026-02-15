/**
 * 🌙 Bedtime routine task definitions
 * Order: PJs → Brush Teeth → Potty → Pick Book
 * Each task has 120 seconds (2 minutes)
 */

export const TASKS = [
  {
    id: 'pajamas',
    label: 'Put on Pajamas',
    emoji: '👕',
    description: 'Time to get cozy in your PJs!',
    encouragement: 'Looking so cozy!',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/tuosbnObmGkvxNJA.png',
    duration: 120, // seconds
    color: '#C4B5E0', // pastel lavender
  },
  {
    id: 'brush-teeth',
    label: 'Brush Teeth',
    emoji: '🪥',
    description: 'Scrub scrub scrub those teeth!',
    encouragement: 'Sparkly clean teeth!',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/HMexLsilDBfaltSi.png',
    duration: 120,
    color: '#A8D8C8', // pastel mint
  },
  {
    id: 'potty',
    label: 'Go Potty',
    emoji: '🚽',
    description: 'Quick potty break before bed!',
    encouragement: 'Great job!',
    image: null, // uses emoji
    duration: 120,
    color: '#A8C8E8', // pastel sky
  },
  {
    id: 'pick-book',
    label: 'Pick a Book',
    emoji: '📚',
    description: 'Choose a story for tonight!',
    encouragement: 'Great choice!',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/oYLoOSjEoixHufze.png',
    duration: 120,
    color: '#F4A7BB', // pastel pink
  },
];

export const getTaskById = (id) => TASKS.find((t) => t.id === id);
export const TOTAL_ROUTINE_TIME = TASKS.reduce((sum, t) => sum + t.duration, 0);
