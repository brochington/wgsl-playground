import { SETTINGS_KEY } from './constants.js';
import { createEditor } from './editor.js';
import { getSavedShaders, saveShader } from './shaders.js';

// Default settings (Use Hex string for color to match input type="color")
let settings = {
  clearColor: '#1a1a1a',
  resolutionScale: 1.0,
  fontSize: 13,
  wordWrap: false,
  showFPS: true,
  splitPosition: 50, // Percentage (0-100)
};

export function loadSettings() {
  // Load settings from storage
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Ensure clearColor is a string if loaded from old object format
      if (parsed.clearColor && typeof parsed.clearColor === 'object') {
        parsed.clearColor = '#1a1a1a'; // Reset to default if old format found
      }
      settings = { ...settings, ...parsed };
    }
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return settings;
}

export function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

class AppState {
  settings = loadSettings();
  shaders = getSavedShaders();
  editor = null;
  currentMode = 'triangle';
  currentShader = null;
  currentShaderName = null;
  currentShaderCode = null;
  currentShaderMode = null;
  currentShaderTimestamp = null;
  mouseX = 0;
  mouseY = 0;
  mouseDown = 0;
  startTime = Date.now();
  frameCount = 0;
  animationFrameId = null;
  isTimerPaused = false;
  pausedTime = 0; // Time when paused
  totalPausedTime = 0; // Total time spent paused
  currentPipeline = null;
  uniformBuffer = null;
  bindGroup = null;
  uniformData = new Float32Array([
    0,
    0, // resolution (vec2<f32>)
    0, // time (f32)
    0, // frame (u32, but stored as f32)
    0,
    0, // mouse (vec2<f32>)
    0, // mouseDown (f32)
    0, // padding
  ]);

  // Custom uniforms system
  customUniforms = [];
  customUniformBuffer = null;
  customUniformData = new Float32Array(0);

  // Custom inputs system
  customInputs = [];
  inputValues = new Map(); // inputId -> current value

  // Texture system
  textures = new Map(); // name -> {texture, sampler, view}
  textureUploads = new Map(); // name -> File

  constructor() {
    this.settings = loadSettings();
    this.editor = createEditor(this.settings);
    this.shaders = getSavedShaders();
    this.currentMode = 'triangle';
    this.currentShader = null;
    this.currentShaderName = null;
    this.currentShaderCode = null;
    this.currentShaderMode = null;
    this.currentShaderTimestamp = null;

    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = 0;
    this.startTime = Date.now();
    this.frameCount = 0;
  }

  save() {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(this));
  }

  load() {
    const savedState = localStorage.getItem(AUTOSAVE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  }
}

export const appState = new AppState();