import { create } from 'zustand'

/**
 * Onboarding Store — Zustand state for Full Programme intake flow
 * 
 * Screens: welcome → section1 → section2 → section3 → section4 → section5 → completion → baseline
 * Progressive save: each section saves to Supabase on Next, not on final submit.
 */

const SCREENS = ['welcome', 'section1', 'section2', 'section3', 'section4', 'section5', 'completion', 'baseline']

export const useOnboardingStore = create((set, get) => ({
  // Navigation
  currentScreen: 'welcome',
  screenIndex: 0,

  // Child profile fields (Section 1)
  childName: '',
  childAge: '',
  genderPronoun: '',
  parentDescription: '',

  // Nervous system fields (Section 2)
  neuroFlags: [],
  neuroNotes: '',

  // Bedtime fields (Section 3)
  bedtimeDescription: '',
  nightWakingFrequency: '',

  // Fear/stressor fields (Section 4)
  fearFlags: [],
  currentStressors: '',

  // Their world fields (Section 5)
  allies: [{ name: '', relationship: '' }],
  pets: [],
  socialDifficulty: '',

  // Baseline scores (Section 6)
  bedtimeResistance: 5,
  sleepOnsetLatency: 5,
  nightWakingScore: 5,
  parentalStress: 5,
  morningMood: 5,

  // State
  childProfileId: null,
  isSaving: false,
  error: null,

  // Navigation actions
  nextScreen: () => {
    const { screenIndex } = get()
    const nextIndex = Math.min(screenIndex + 1, SCREENS.length - 1)
    set({ currentScreen: SCREENS[nextIndex], screenIndex: nextIndex })
  },

  prevScreen: () => {
    const { screenIndex } = get()
    const prevIndex = Math.max(screenIndex - 1, 0)
    set({ currentScreen: SCREENS[prevIndex], screenIndex: prevIndex })
  },

  goToScreen: (screen) => {
    const index = SCREENS.indexOf(screen)
    if (index !== -1) {
      set({ currentScreen: screen, screenIndex: index })
    }
  },

  // Field setters
  setField: (field, value) => set({ [field]: value }),

  setNeuroFlag: (flag) => {
    const { neuroFlags } = get()
    // "None of these really fit" clears all others
    if (flag === 'None of these really fit') {
      set({ neuroFlags: ['None of these really fit'] })
      return
    }
    // Selecting anything else removes "None of these really fit"
    const filtered = neuroFlags.filter(f => f !== 'None of these really fit')
    if (filtered.includes(flag)) {
      set({ neuroFlags: filtered.filter(f => f !== flag) })
    } else {
      set({ neuroFlags: [...filtered, flag] })
    }
  },

  setFearFlag: (flag) => {
    const { fearFlags } = get()
    // "None of these" clears all others
    if (flag === 'None of these') {
      set({ fearFlags: ['None of these'] })
      return
    }
    const filtered = fearFlags.filter(f => f !== 'None of these')
    if (filtered.includes(flag)) {
      set({ fearFlags: filtered.filter(f => f !== flag) })
    } else {
      set({ fearFlags: [...filtered, flag] })
    }
  },

  // Allies management
  addAlly: () => {
    const { allies } = get()
    set({ allies: [...allies, { name: '', relationship: '' }] })
  },

  removeAlly: (index) => {
    const { allies } = get()
    if (allies.length > 1) {
      set({ allies: allies.filter((_, i) => i !== index) })
    }
  },

  updateAlly: (index, field, value) => {
    const { allies } = get()
    const updated = [...allies]
    updated[index] = { ...updated[index], [field]: value }
    set({ allies: updated })
  },

  // Pets management
  addPet: () => {
    const { pets } = get()
    set({ pets: [...pets, { name: '', type: '' }] })
  },

  removePet: (index) => {
    const { pets } = get()
    set({ pets: pets.filter((_, i) => i !== index) })
  },

  updatePet: (index, field, value) => {
    const { pets } = get()
    const updated = [...pets]
    updated[index] = { ...updated[index], [field]: value }
    set({ pets: updated })
  },

  // Reset
  reset: () => set({
    currentScreen: 'welcome',
    screenIndex: 0,
    childName: '',
    childAge: '',
    genderPronoun: '',
    parentDescription: '',
    neuroFlags: [],
    neuroNotes: '',
    bedtimeDescription: '',
    nightWakingFrequency: '',
    fearFlags: [],
    currentStressors: '',
    allies: [{ name: '', relationship: '' }],
    pets: [],
    socialDifficulty: '',
    bedtimeResistance: 5,
    sleepOnsetLatency: 5,
    nightWakingScore: 5,
    parentalStress: 5,
    morningMood: 5,
    childProfileId: null,
    isSaving: false,
    error: null,
  }),

  // Progress (1-5 for the 5 intake sections)
  get sectionProgress() {
    const { screenIndex } = get()
    if (screenIndex <= 0) return 0
    if (screenIndex >= 6) return 5
    return screenIndex
  }
}))
