import { initUI, initializeSettingsUI, updateModeUI, updateSaveButtons } from './ui.js';
import { initWebGPU, setupWebGPUFeatures } from './webgpu.js';
import { getInitialStateFromURL, updateURL, loadStateFromURL } from './url-manager.js';
import { setupAutosave, loadAutosaveState } from './autosave-manager.js';
import { SHADERS, loadShader } from './shaders.js';
import { appState, saveSettings } from './storage.js';
import { initCustomUniforms, loadCustomUniformsFromData } from './custom-uniforms.js';
import { initCustomInputs, loadCustomInputsFromData } from './custom-inputs.js';
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
    const urlState = loadStateFromURL();

    // Initialize app state based on URL parameters or autosave
    initializeAppState(urlState);

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

function initializeAppState(urlState) {
  let loadedFromURL = false;

  // 1. Try to load full state from URL
  if (urlState.code || urlState.settings || urlState.uniforms.length > 0 || urlState.inputs) {
    // Load mode
    appState.currentMode = urlState.mode;

    // Load shader code
    if (urlState.code) {
      appState.editor.setValue(urlState.code);
    } else {
      appState.editor.setValue(SHADERS[urlState.mode] || SHADERS.triangle);
    }

    // Load settings
    if (urlState.settings) {
      Object.assign(appState.settings, urlState.settings);
      saveSettings();
    }

    // Load custom uniforms
    if (urlState.uniforms.length > 0) {
      loadCustomUniformsFromData(urlState.uniforms);
    }

    // Load custom inputs
    if (urlState.inputs) {
      loadCustomInputsFromData(urlState.inputs);
    }

    updateModeUI(urlState.mode);
    loadedFromURL = true;
  } else {
    // 2. Try to load specific shader from URL (legacy support)
    const { mode, shader } = getInitialStateFromURL();
    if (shader) {
      const shaderData = loadShader(shader);
      if (shaderData) {
        appState.currentMode = shaderData.mode;
        appState.editor.setValue(shaderData.code);
        updateSaveButtons(shader);
        updateModeUI(shaderData.mode);
        return;
      } else {
        // Shader not found, clear the param
        updateURL(null, mode);
      }
    }

    // 3. Try autosave
    const autosaveState = loadAutosaveState();
    if (autosaveState) {
      appState.currentMode = autosaveState.mode;
      appState.editor.setValue(autosaveState.code);
    } else {
      // 4. Fresh start - use default shader for mode
      appState.currentMode = urlState.mode;
      appState.editor.setValue(SHADERS[urlState.mode] || SHADERS.triangle);
    }

    updateModeUI(appState.currentMode);
  }

  // Update URL to reflect current state (without full state for performance)
  updateURL(null, appState.currentMode);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
