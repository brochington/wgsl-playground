import { AUTOSAVE_KEY } from './constants.js';
import { appState } from './storage.js';

let autoSaveTimeout;

export function setupAutosave() {
  // Setup autosave on editor changes
  appState.editor.on('change', () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveCurrentState();
    }, 1000); // Save after 1 second of inactivity
  });
}

export function saveCurrentState() {
  const state = {
    code: appState.editor.getValue(),
    mode: appState.currentMode,
    timestamp: Date.now(),
  };
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
}

export function loadAutosaveState() {
  const savedState = localStorage.getItem(AUTOSAVE_KEY);
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      return state;
    } catch (e) {
      console.error('Invalid autosave', e);
      return null;
    }
  }
  return null;
}

export function clearAutosave() {
  localStorage.removeItem(AUTOSAVE_KEY);
}
