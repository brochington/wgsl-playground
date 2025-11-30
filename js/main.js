import { initUI, initializeSettingsUI, updateModeUI, updateSaveButtons } from './ui.js';
import { initWebGPU, setupWebGPUFeatures } from './webgpu.js';
import { getInitialStateFromURL, updateURL } from './url-manager.js';
import { setupAutosave, loadAutosaveState } from './autosave-manager.js';
import { SHADERS, loadShader } from './shaders.js';
import { appState, saveSettings } from './storage.js';
import { initCustomUniforms } from './custom-uniforms.js';
import { initCustomInputs } from './custom-inputs.js';
import { textureManager } from './texture-manager.js';

// Application initialization
async function initApp() {
  try {
    // Initialize UI first
    initUI();

    // Setup autosave
    setupAutosave();

    // Initialize custom uniforms system
    initCustomUniforms();

    // Initialize custom inputs system
    initCustomInputs();

    // Get initial state from URL
    const { mode, shader } = getInitialStateFromURL();

    // Initialize app state based on URL parameters or autosave
    initializeAppState(mode, shader);

    // Initialize settings UI
    initializeSettingsUI();

    // Initialize WebGPU
    await initWebGPU()
      .then(async () => {
        setupWebGPUFeatures();
        // Load and restore textures from persistent storage
        await textureManager.loadAndRestoreTextures();
      })
      .catch((error) => {
        const errorDisplay = document.getElementById('error-display');
        errorDisplay.textContent = 'WebGPU Initialization Error: ' + error.message;
        errorDisplay.classList.add('visible');
        console.error('WebGPU initialization failed:', error);
      });

  } catch (error) {
    console.error('Application initialization failed:', error);
  }
}

function initializeAppState(initialMode, shaderName) {
  let mode = initialMode;
  let loadedFromAutosave = false;

  // 1. Try to load specific shader from URL
  if (shaderName) {
    const shader = loadShader(shaderName);
    if (shader) {
      mode = shader.mode;
      appState.editor.setValue(shader.code);
      updateSaveButtons(shaderName);
      updateModeUI(mode);
      return;
    } else {
      // Shader not found, clear the param
      updateURL(null, mode);
    }
  }

  // 2. Try autosave
  const autosaveState = loadAutosaveState();
  if (autosaveState) {
    mode = autosaveState.mode;
    appState.editor.setValue(autosaveState.code);
    loadedFromAutosave = true;
  } else {
    // 3. Fresh start - use default shader for mode
    if (!SHADERS[mode]) mode = 'triangle';
    appState.editor.setValue(SHADERS[mode]);
  }

  // Update UI
  appState.currentMode = mode;
  updateModeUI(mode);
  updateURL(null, mode);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
