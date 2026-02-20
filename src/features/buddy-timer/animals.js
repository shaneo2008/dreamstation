/**
 * 🐾 Animal buddy definitions for the bedtime routine
 * Images hosted on CDN — no local assets needed
 */

export const ANIMALS = [
  {
    id: 'hoppy',
    name: 'Hoppy',
    type: 'Bunny',
    trait: 'Energetic & Bouncy',
    emoji: '🐰',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/eaeyoAtwyCRfjTyl.png',
  },
  {
    id: 'snoozy',
    name: 'Snoozy',
    type: 'Bear',
    trait: 'Cuddly & Calm',
    emoji: '🐻',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/vNlIGCzZNMOBxgTN.png',
  },
  {
    id: 'sparky',
    name: 'Sparky',
    type: 'Fox',
    trait: 'Clever & Playful',
    emoji: '🦊',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/OdPrFwfgfHqFtVAN.png',
  },
  {
    id: 'luna',
    name: 'Luna',
    type: 'Cat',
    trait: 'Peaceful & Gentle',
    emoji: '🐱',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/TiFKneGsanGrqRXQ.png',
  },
  {
    id: 'zen',
    name: 'Zen',
    type: 'Panda',
    trait: 'Calm & Wise',
    emoji: '🐼',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/pPUSvHVBFPhJxvAU.png',
  },
  {
    id: 'buddy',
    name: 'Buddy',
    type: 'Dog',
    trait: 'Loyal & Friendly',
    emoji: '🐶',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/DhuQGFkScdQGgWdQ.png',
  },
  {
    id: 'rex',
    name: 'Rex',
    type: 'T-Rex',
    trait: 'Brave & Mighty',
    emoji: '🦖',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/IopnEddXvCPSYtUE.png',
  },
  {
    id: 'snapper',
    name: 'Snapper',
    type: 'Crocodile',
    trait: 'Tough & Silly',
    emoji: '🐊',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/XDsVwdDAxxmDxzMr.png',
  },
  {
    id: 'finn',
    name: 'Finn',
    type: 'Shark',
    trait: 'Cool & Adventurous',
    emoji: '🦈',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/MyPdJhEAYrpbTOYj.png',
  },
  {
    id: 'masha',
    name: 'Masha',
    type: 'Monkey',
    trait: 'Silly & Fun',
    emoji: '🐵',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/UeNpplhfLFpEetXr.png',
  },
  {
    id: 'stella',
    name: 'Stella',
    type: 'Giraffe',
    trait: 'Tall & Kind',
    emoji: '🦒',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/oTnIrPFgjtlQsfHk.png',
  },
  {
    id: 'flutty',
    name: 'Flutty',
    type: 'Butterfly',
    trait: 'Dreamy & Whimsical',
    emoji: '🦋',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/109885302/LVWiYUqaaRvTvnUi.png',
  },
];

export const getAnimalById = (id) => ANIMALS.find((a) => a.id === id);
