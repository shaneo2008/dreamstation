/**
 * 🐾 useBuddyTimer — Independent Zustand store for the buddy timer feature
 *
 * States: selecting → task → celebrating → complete
 * Does NOT import or depend on useSleepFlow — fully standalone.
 */

import { create } from 'zustand';
import { TASKS } from './tasks';

/**
 * @typedef {'selecting' | 'task' | 'celebrating' | 'complete'} BuddyPhase
 */

const useBuddyTimer = create((set, get) => ({
  // ── State ──
  phase: 'selecting',        // BuddyPhase
  selectedAnimal: null,      // animal object from animals.js
  currentTaskIndex: 0,       // which task we're on (0-3)
  timeLeft: TASKS[0]?.duration ?? 60, // countdown seconds
  completedTasks: [],        // array of completed task IDs
  timerInterval: null,       // interval reference

  // ── Actions ──

  /** Select an animal and move to first task */
  selectAnimal: (animal) => {
    set({
      selectedAnimal: animal,
      phase: 'task',
      currentTaskIndex: 0,
      timeLeft: TASKS[0]?.duration ?? 60,
      completedTasks: [],
    });
  },

  /** Start the countdown timer for current task */
  startTimer: () => {
    const existing = get().timerInterval;
    if (existing) clearInterval(existing);

    const interval = setInterval(() => {
      const { timeLeft } = get();
      if (timeLeft <= 1) {
        // Timer done — auto-complete the task
        get().completeCurrentTask();
      } else {
        set({ timeLeft: timeLeft - 1 });
      }
    }, 1000);

    set({ timerInterval: interval });
  },

  /** Stop the timer */
  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },

  /** Mark current task as done, show celebration or complete */
  completeCurrentTask: () => {
    const { currentTaskIndex, completedTasks, timerInterval } = get();
    const currentTask = TASKS[currentTaskIndex];

    // Stop timer
    if (timerInterval) clearInterval(timerInterval);

    const newCompleted = [...completedTasks, currentTask.id];

    if (currentTaskIndex >= TASKS.length - 1) {
      // All tasks done!
      set({
        completedTasks: newCompleted,
        phase: 'complete',
        timerInterval: null,
      });
    } else {
      // Show celebration before next task
      set({
        completedTasks: newCompleted,
        phase: 'celebrating',
        timerInterval: null,
      });
    }
  },

  /** Skip to next task (parent override) */
  skipTask: () => {
    const { currentTaskIndex, timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);

    if (currentTaskIndex >= TASKS.length - 1) {
      set({ phase: 'complete', timerInterval: null });
    } else {
      set({
        phase: 'celebrating',
        timerInterval: null,
      });
    }
  },

  /** Move from celebration to next task */
  nextTask: () => {
    const { currentTaskIndex } = get();
    const nextIndex = currentTaskIndex + 1;

    if (nextIndex >= TASKS.length) {
      set({ phase: 'complete' });
    } else {
      set({
        currentTaskIndex: nextIndex,
        timeLeft: TASKS[nextIndex]?.duration ?? 60,
        phase: 'task',
      });
    }
  },

  /** Full reset back to animal selection */
  reset: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);

    set({
      phase: 'selecting',
      selectedAnimal: null,
      currentTaskIndex: 0,
      timeLeft: TASKS[0]?.duration ?? 60,
      completedTasks: [],
      timerInterval: null,
    });
  },

  // ── Computed helpers ──
  getCurrentTask: () => TASKS[get().currentTaskIndex],
  getProgress: () => get().completedTasks.length / TASKS.length,
  getAllTasks: () => TASKS,
}));

export default useBuddyTimer;
