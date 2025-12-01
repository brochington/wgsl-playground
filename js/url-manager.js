import { appState } from './storage.js';

// URL parameter management
export function getURLParams() {
  return new URLSearchParams(window.location.search);
}

export function updateURL(shaderName = null, mode = null) {
  const params = new URLSearchParams();
  if (mode) {
    params.set('mode', mode);
  }
  if (shaderName) {
    params.set('shader', shaderName);
  }
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newURL);
}

export function getInitialStateFromURL() {
  const urlParams = getURLParams();
  const mode = urlParams.get('mode') || 'triangle';
  const shader = urlParams.get('shader');

  return {
    mode: mode,
    shader: shader
  };
}

// Generate a shareable URL with full playground state
export function generateShareableURL() {
  const params = new URLSearchParams();

  // Basic state
  params.set('mode', appState.currentMode);
  params.set('code', btoa(encodeURIComponent(appState.editor.getValue())));

  // Settings
  params.set('settings', btoa(JSON.stringify({
    clearColor: appState.settings.clearColor,
    resolutionScale: appState.settings.resolutionScale,
    fontSize: appState.settings.fontSize,
    wordWrap: appState.settings.wordWrap,
    showFPS: appState.settings.showFPS
  })));

  // Custom uniforms
  if (appState.customUniforms.length > 0) {
    params.set('uniforms', btoa(JSON.stringify(appState.customUniforms)));
  }

  // Custom inputs
  if (appState.customInputs.length > 0) {
    params.set('inputs', btoa(JSON.stringify({
      inputs: appState.customInputs,
      values: Object.fromEntries(appState.inputValues)
    })));
  }

  // Note: Textures are intentionally excluded from sharing as they can be large

  const shareableURL = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  return shareableURL;
}

// Load state from URL parameters
export function loadStateFromURL() {
  const urlParams = getURLParams();

  const state = {
    mode: urlParams.get('mode') || 'triangle',
    code: null,
    settings: null,
    uniforms: [],
    inputs: null
  };

  // Decode shader code
  if (urlParams.has('code')) {
    try {
      state.code = decodeURIComponent(atob(urlParams.get('code')));
    } catch (e) {
      console.error('Failed to decode shader code from URL:', e);
    }
  }

  // Decode settings
  if (urlParams.has('settings')) {
    try {
      state.settings = JSON.parse(decodeURIComponent(atob(urlParams.get('settings'))));
    } catch (e) {
      console.error('Failed to decode settings from URL:', e);
    }
  }

  // Decode custom uniforms
  if (urlParams.has('uniforms')) {
    try {
      state.uniforms = JSON.parse(decodeURIComponent(atob(urlParams.get('uniforms'))));
    } catch (e) {
      console.error('Failed to decode uniforms from URL:', e);
    }
  }

  // Decode custom inputs
  if (urlParams.has('inputs')) {
    try {
      state.inputs = JSON.parse(decodeURIComponent(atob(urlParams.get('inputs'))));
    } catch (e) {
      console.error('Failed to decode inputs from URL:', e);
    }
  }

  return state;
}
