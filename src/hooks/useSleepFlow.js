/**
 * 🌙 useSleepFlow — Zustand-powered state machine for the bedtime ritual
 *
 * States (strict linear progression):
 *   PREP   → Parent checklist (device, environment, mood)
 *   SYNC   → Creature appears, parent calm-level mirroring
 *   FEED   → Child completes up to 3 bedtime tasks (feeds creature)
 *   SEED   → Collects story input and sends payload to n8n
 *   STORY  → Audio playback of generated bedtime story
 *   SLEEP  → App locks: black screen, no navigation, goodnight
 *
 * Key behaviours:
 *   • FEED is capped at exactly 3 tasks max
 *   • SEED stores child/parent input and exposes a `sendToN8N()` action
 *   • STORY tracks audio playback progress
 *   • Once SLEEP is reached, `isLocked` becomes true and all
 *     navigation actions (advance, goBack, jumpTo) are frozen.
 *     UI should read `isLocked` / `showNavigation` to conditionally
 *     hide every nav button.
 *   • `resetFlow()` is the ONLY way out of SLEEP (parent long-press, etc.)
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */

export const PHASES = Object.freeze({
    PREP: 'prep',
    SYNC: 'sync',
    FEED: 'feed',
    SEED: 'seed',
    STORY: 'story',
    SLEEP: 'sleep',
});

/** Ordered phase sequence */
const PHASE_ORDER = [
    PHASES.PREP,
    PHASES.SYNC,
    PHASES.FEED,
    PHASES.SEED,
    PHASES.STORY,
    PHASES.SLEEP,
];

/** Max number of tasks allowed in the FEED phase */
const MAX_FEED_TASKS = 3;

/* ─────────────────────────────────────────────
   Default Tasks
   ───────────────────────────────────────────── */

const DEFAULT_PREP_TASKS = [
    { id: 'screen-time', label: 'Screens off 30 mins before bed', completed: false },
    { id: 'room-ready', label: 'Bedroom dark & cool', completed: false },
    { id: 'calm-yourself', label: 'Take 3 deep breaths yourself', completed: false },
];

const DEFAULT_FEED_TASKS = [
    { id: 'brush-teeth', label: 'Brush teeth', completed: false },
    { id: 'put-on-pjs', label: 'Put on pyjamas', completed: false },
    { id: 'tidy-up', label: 'Tidy up toys', completed: false },
];

/* ─────────────────────────────────────────────
   Helper: deep-clone a task array
   ───────────────────────────────────────────── */

function cloneTasks(tasks) {
    return tasks.map((t) => ({ ...t }));
}

/* ─────────────────────────────────────────────
   Zustand Store
   ───────────────────────────────────────────── */

export const useSleepFlowStore = create(
    subscribeWithSelector((set, get) => ({
        /* ── Phase state ── */
        currentPhase: PHASES.PREP,
        phaseIndex: 0,

        /* ── Lock state (SLEEP) ── */
        isLocked: false,

        /* ── Task lists ── */
        prepTasks: cloneTasks(DEFAULT_PREP_TASKS),
        feedTasks: cloneTasks(DEFAULT_FEED_TASKS),

        /* ── SYNC data ── */
        creatureId: null,      // chosen creature identifier
        parentCalmLevel: 0.5,  // 0–1 float, drives creature speed

        /* ── SEED data (n8n input) ── */
        seedInput: {
            childName: '',
            childId: null,       // uuid from child_profiles.id
            theme: '',           // e.g. 'space adventure', 'underwater'
            extras: '',          // free-text extras for the story
            parentNote: '',      // optional parent observation for session record
        },
        seedSubmitted: false,
        seedLoading: false,
        seedError: null,

        /* ── STORY data ── */
        story: null,           // { title, description, audioUrl }
        storyProgress: 0,      // 0–1 audio progress
        storyPlaying: false,
        storyComplete: false,

        /* ── Flow timing ── */
        flowStartedAt: Date.now(),
        phaseStartedAt: Date.now(),

        /* ── Derived / computed (exposed as getters via selectors below) ── */

        /* ═══════════════════════════════════════════
           ACTIONS
           ═══════════════════════════════════════════ */

        // ─── Navigation ───

        /**
         * Advance to the next phase.
         * Blocked if: current phase isn't ready, or already at SLEEP.
         * @returns {boolean} whether the advance succeeded
         */
        advancePhase: () => {
            const state = get();
            if (state.isLocked) return false;
            if (!isPhaseReady(state)) return false;

            const nextIndex = state.phaseIndex + 1;
            if (nextIndex >= PHASE_ORDER.length) return false;

            const nextPhase = PHASE_ORDER[nextIndex];
            const entering_sleep = nextPhase === PHASES.SLEEP;

            set({
                currentPhase: nextPhase,
                phaseIndex: nextIndex,
                phaseStartedAt: Date.now(),
                // Lock everything the moment we enter SLEEP
                isLocked: entering_sleep,
            });

            return true;
        },

        /**
         * Go back one phase.
         * Blocked in SLEEP (locked) or if already at PREP.
         */
        goBack: () => {
            const state = get();
            if (state.isLocked) return false;
            if (state.phaseIndex <= 0) return false;

            const prevIndex = state.phaseIndex - 1;
            set({
                currentPhase: PHASE_ORDER[prevIndex],
                phaseIndex: prevIndex,
                phaseStartedAt: Date.now(),
            });
            return true;
        },

        /**
         * Jump directly to a specific phase (parent override).
         * Blocked in SLEEP.
         */
        jumpToPhase: (phase) => {
            const state = get();
            if (state.isLocked) return false;
            const idx = PHASE_ORDER.indexOf(phase);
            if (idx === -1) return false;
            // Cannot jump to SLEEP — you must advance into it naturally
            if (phase === PHASES.SLEEP) return false;

            set({
                currentPhase: phase,
                phaseIndex: idx,
                phaseStartedAt: Date.now(),
            });
            return true;
        },

        // ─── Task Actions (PREP + FEED) ───

        togglePrepTask: (taskId) => {
            const state = get();
            if (state.isLocked) return;
            set({
                prepTasks: state.prepTasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                ),
            });
        },

        toggleFeedTask: (taskId) => {
            const state = get();
            if (state.isLocked) return;
            set({
                feedTasks: state.feedTasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                ),
            });
        },

        completeFeedTask: (taskId) => {
            const state = get();
            if (state.isLocked) return;
            set({
                feedTasks: state.feedTasks.map((t) =>
                    t.id === taskId ? { ...t, completed: true } : t
                ),
            });
        },

        /**
         * Replace the FEED task list.
         * Enforces the MAX_FEED_TASKS cap (silently truncates).
         */
        setFeedTasks: (tasks) => {
            const capped = tasks.slice(0, MAX_FEED_TASKS).map((t) => ({
                id: t.id,
                label: t.label,
                completed: !!t.completed,
            }));
            set({ feedTasks: capped });
        },

        // ─── SYNC Actions ───

        setCreatureId: (id) => set({ creatureId: id }),

        setParentCalmLevel: (level) =>
            set({ parentCalmLevel: Math.min(1, Math.max(0, level)) }),

        // ─── SEED Actions (n8n input) ───

        setSeedInput: (patch) =>
            set((state) => ({
                seedInput: { ...state.seedInput, ...patch },
            })),

        /**
         * Send the seed payload to n8n.
         * Accepts an async handler so the consuming component can
         * inject the actual fetch/webhook logic.
         *
         * @param {(payload: Object) => Promise<Object>} handler
         *   Receives { childName, theme, extras } → should return { title, description, audioUrl }
         */
        sendToN8N: async (handler) => {
            const state = get();
            if (state.isLocked || state.seedSubmitted) return;

            set({ seedLoading: true, seedError: null });

            try {
                const result = await handler(state.seedInput);
                set({
                    seedSubmitted: true,
                    seedLoading: false,
                    story: result || null,
                });
            } catch (err) {
                set({
                    seedLoading: false,
                    seedError: err?.message || 'Failed to generate story',
                });
            }
        },

        // ─── STORY Actions ───

        setStory: (story) => set({ story }),

        setStoryProgress: (progress) =>
            set({ storyProgress: Math.min(1, Math.max(0, progress)) }),

        setStoryPlaying: (playing) => set({ storyPlaying: playing }),

        markStoryComplete: () =>
            set({ storyComplete: true, storyPlaying: false, storyProgress: 1 }),

        // ─── Full Reset ───

        /**
         * The ONLY way to exit SLEEP.
         * Resets the entire flow back to PREP.
         */
        resetFlow: () =>
            set({
                currentPhase: PHASES.PREP,
                phaseIndex: 0,
                isLocked: false,

                prepTasks: cloneTasks(DEFAULT_PREP_TASKS),
                feedTasks: cloneTasks(DEFAULT_FEED_TASKS),

                creatureId: null,
                parentCalmLevel: 0.5,

                seedInput: { childName: '', childId: null, theme: '', extras: '', parentNote: '' },
                seedSubmitted: false,
                seedLoading: false,
                seedError: null,

                story: null,
                storyProgress: 0,
                storyPlaying: false,
                storyComplete: false,

                flowStartedAt: Date.now(),
                phaseStartedAt: Date.now(),
            }),
    }))
);

/* ─────────────────────────────────────────────
   Pure helpers (used by selectors & actions)
   ───────────────────────────────────────────── */

/**
 * Determines whether the current phase's requirements are met
 * so the user can advance to the next phase.
 */
function isPhaseReady(state) {
    switch (state.currentPhase) {
        case PHASES.PREP:
            return state.prepTasks.every((t) => t.completed);

        case PHASES.SYNC:
            // Creature must be chosen
            return state.creatureId !== null;

        case PHASES.FEED:
            return state.feedTasks.every((t) => t.completed);

        case PHASES.SEED:
            // Must have submitted to n8n successfully
            return state.seedSubmitted;

        case PHASES.STORY:
            // Story must have finished playing
            return state.storyComplete;

        case PHASES.SLEEP:
            // No advancing past SLEEP
            return false;

        default:
            return false;
    }
}

/* ─────────────────────────────────────────────
   Selector-based hook (convenience wrapper)

   Components import this instead of the raw store:
     const { currentPhase, advancePhase, ... } = useSleepFlow();
   ───────────────────────────────────────────── */

export function useSleepFlow() {
    // Pull everything from the store + compute derived values
    const store = useSleepFlowStore();

    /* ── Derived selectors ── */

    const currentPhase = store.currentPhase;
    const phaseIndex = store.phaseIndex;

    // Current phase's task list (for PREP and FEED only)
    const currentTasks =
        currentPhase === PHASES.PREP ? store.prepTasks :
            currentPhase === PHASES.FEED ? store.feedTasks :
                [];

    // Phase progress 0–1
    const phaseProgress = (() => {
        switch (currentPhase) {
            case PHASES.PREP:
                return store.prepTasks.filter((t) => t.completed).length / store.prepTasks.length;
            case PHASES.SYNC:
                return store.creatureId ? 1 : 0;
            case PHASES.FEED:
                return store.feedTasks.filter((t) => t.completed).length / store.feedTasks.length;
            case PHASES.SEED:
                return store.seedSubmitted ? 1 : 0;
            case PHASES.STORY:
                return store.storyProgress;
            case PHASES.SLEEP:
                return 1;
            default:
                return 0;
        }
    })();

    // Overall progress across all phases
    const overallProgress = (phaseIndex + phaseProgress) / PHASE_ORDER.length;

    // Is the current phase complete enough to advance?
    const ready = isPhaseReady(store);

    // Can we navigate?
    const canAdvance = ready && !store.isLocked && phaseIndex < PHASE_ORDER.length - 1;
    const canGoBack = phaseIndex > 0 && !store.isLocked;

    // SLEEP removes ALL navigation
    const showNavigation = !store.isLocked;

    return {
        // ── Phase identity ──
        currentPhase,
        phaseIndex,
        phases: PHASE_ORDER,
        PHASES,

        // ── Lock / Navigation visibility ──
        isLocked: store.isLocked,
        showNavigation,
        canAdvance,
        canGoBack,

        // ── Tasks ──
        currentTasks,
        prepTasks: store.prepTasks,
        feedTasks: store.feedTasks,

        // ── Progress ──
        phaseProgress,
        overallProgress,
        isPhaseReady: ready,

        // ── SYNC data ──
        creatureId: store.creatureId,
        parentCalmLevel: store.parentCalmLevel,

        // ── SEED data ──
        seedInput: store.seedInput,
        childId: store.seedInput.childId,
        parentNote: store.seedInput.parentNote,
        seedSubmitted: store.seedSubmitted,
        seedLoading: store.seedLoading,
        seedError: store.seedError,

        // ── STORY data ──
        story: store.story,
        storyProgress: store.storyProgress,
        storyPlaying: store.storyPlaying,
        storyComplete: store.storyComplete,

        // ── Timing ──
        flowStartedAt: store.flowStartedAt,
        phaseStartedAt: store.phaseStartedAt,

        // ── Actions ──
        advancePhase: store.advancePhase,
        goBack: store.goBack,
        jumpToPhase: store.jumpToPhase,

        togglePrepTask: store.togglePrepTask,
        toggleFeedTask: store.toggleFeedTask,
        completeFeedTask: store.completeFeedTask,
        setFeedTasks: store.setFeedTasks,

        setCreatureId: store.setCreatureId,
        setParentCalmLevel: store.setParentCalmLevel,

        setSeedInput: store.setSeedInput,
        sendToN8N: store.sendToN8N,

        setStory: store.setStory,
        setStoryProgress: store.setStoryProgress,
        setStoryPlaying: store.setStoryPlaying,
        markStoryComplete: store.markStoryComplete,

        resetFlow: store.resetFlow,
    };
}

export default useSleepFlow;
