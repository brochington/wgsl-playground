import { appState, saveSettings } from './storage.js';
import {
  SHADERS,
  loadShader,
  deleteShader,
  updateSavedShadersList,
  getSavedShaders,
  saveShader,
  EXAMPLE_SHADERS,
} from './shaders.js';
import { updateURL, generateShareableURL } from './url-manager.js';
import {
  addCustomUniform,
  removeCustomUniform,
  updateCustomUniform,
  getAllCustomUniforms,
  uniformValueToString,
  parseUniformValue,
} from './custom-uniforms.js';
import { textureManager } from './texture-manager.js';
import {
  addCustomInput,
  removeCustomInput,
  getAllCustomInputs,
  customInputsManager,
  loadInteractiveDemoInputs,
  clearInteractiveDemoInputs,
  clearAllCustomInputs,
} from './custom-inputs.js';
import { INPUT_TYPES } from './constants.js';

// DOM element cache
let elements = {};

// Initialize DOM elements cache
function cacheElements() {
  elements = {
    modeSelect: document.getElementById('mode-select'),
    shareBtn: document.getElementById('share-btn'),
    infoBtn: document.getElementById('info-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    closeModal: document.getElementsByClassName('close-modal')[0],
    infoModal: document.getElementById('info-modal'),
    clearColor: document.getElementById('clear-color'),
    clearColorHex: document.getElementById('clear-color-hex'),
    resolutionScale: document.getElementById('resolution-scale'),
    fontSize: document.getElementById('font-size'),
    wordWrap: document.getElementById('word-wrap'),
    showFPS: document.getElementById('show-fps'),
    modal: document.getElementById('settings-modal'),
    newShaderBtn: document.getElementById('new-shader-btn'),
    saveShaderBtn: document.getElementById('save-shader-btn'),
    updateShaderBtn: document.getElementById('update-shader-btn'),
    loadShaderBtn: document.getElementById('load-shader-btn'),
    deleteShaderBtn: document.getElementById('delete-shader-btn'),
    exportShadersBtn: document.getElementById('export-shaders-btn'),
    importShadersBtn: document.getElementById('import-shaders-btn'),
    importFileInput: document.getElementById('import-file-input'),
    savedShaders: document.getElementById('saved-shaders'),
    shaderName: document.getElementById('shader-name'),
    canvas: document.getElementById('canvas'),
    pauseTimerBtn: document.getElementById('pause-timer-btn'),
    resetTimerBtn: document.getElementById('reset-timer-btn'),
    resizer: document.getElementById('resizer'),

    // Custom data modal
    customDataBtn: document.getElementById('custom-data-btn'),
    customDataModal: document.getElementById('custom-data-modal'),

    // Custom uniforms
    uniformName: document.getElementById('uniform-name'),
    uniformType: document.getElementById('uniform-type'),
    uniformValue: document.getElementById('uniform-value'),
    addUniformBtn: document.getElementById('add-uniform-btn'),
    uniformsList: document.getElementById('uniforms-list'),

    // Textures
    uploadTextureBtn: document.getElementById('upload-texture-btn'),
    textureUpload: document.getElementById('texture-upload'),
    texturesList: document.getElementById('textures-list'),

    // Custom inputs
    toggleInputsBtn: document.getElementById('toggle-inputs-btn'),
    customInputsContainer: document.getElementById('custom-inputs-container'),
    customInputsArea: document.getElementById('custom-inputs-area'),
    inputLabel: document.getElementById('input-label'),
    inputUniform: document.getElementById('input-uniform'),
    inputType: document.getElementById('input-type'),
    addInputBtn: document.getElementById('add-input-btn'),
    inputConfig: document.getElementById('input-config'),
    inputsList: document.getElementById('inputs-list'),
  };
}

// UI State
let currentLoadedShader = null;

// Initialize UI
export function initUI() {
  cacheElements();
  setupEventListeners();
  updateSavedShadersList();
}

// Setup all event listeners
function setupEventListeners() {
  // Mode switching
  elements.modeSelect.addEventListener('change', (e) => handleModeChange(e));

  // Info modal
  elements.shareBtn.onclick = () => handleSharePlayground();
  elements.infoBtn.onclick = () => openInfoModal();
  // Settings modal
  elements.settingsBtn.onclick = () => openSettingsModal();
  // Add event listeners to all close buttons
  const closeButtons = document.getElementsByClassName('close-modal');
  for (let i = 0; i < closeButtons.length; i++) {
    closeButtons[i].onclick = () => closeModals();
  }
  window.onclick = (event) => {
    if (event.target === elements.modal) {
      closeSettingsModal();
    }
    if (event.target === elements.infoModal) {
      closeInfoModal();
    }
  };

  // Shader management
  elements.newShaderBtn.addEventListener('click', () => handleNewShader());
  elements.saveShaderBtn.addEventListener('click', saveCurrentShader);
  elements.updateShaderBtn.addEventListener('click', updateCurrentShader);
  elements.loadShaderBtn.addEventListener('click', () => handleLoadShader());
  elements.deleteShaderBtn.addEventListener('click', () =>
    handleDeleteShader()
  );
  elements.exportShadersBtn.addEventListener('click', () =>
    handleExportShaders()
  );
  elements.importShadersBtn.addEventListener('click', () =>
    handleImportShaders()
  );

  // Shader name input
  elements.shaderName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (currentLoadedShader) {
        updateCurrentShader();
      } else {
        saveCurrentShader();
      }
    }
  });

  // Import file handling
  elements.importFileInput.addEventListener('change', (e) =>
    handleImportFile(e)
  );

  // Timer controls
  elements.pauseTimerBtn.addEventListener('click', () => handlePauseTimer());
  elements.resetTimerBtn.addEventListener('click', () => handleResetTimer());

  // Split pane resizer
  setupSplitPaneResizer();

  // Custom data modal
  elements.customDataBtn.addEventListener('click', () => openCustomDataModal());
  elements.customDataModal.addEventListener('click', (event) => {
    if (event.target === elements.customDataModal) {
      closeCustomDataModal();
    }
  });
  elements.customDataModal
    .querySelector('.close-modal')
    .addEventListener('click', () => closeCustomDataModal());

  // Custom uniforms
  elements.addUniformBtn.addEventListener('click', () => handleAddUniform());
  elements.uniformName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddUniform();
  });
  elements.uniformValue.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddUniform();
  });

  // Textures
  elements.uploadTextureBtn.addEventListener('click', () =>
    elements.textureUpload.click()
  );
  elements.textureUpload.addEventListener('change', (e) =>
    handleTextureUpload(e)
  );

  // Custom inputs
  elements.toggleInputsBtn.addEventListener('click', () =>
    toggleInputsPanel()
  );
  elements.addInputBtn.addEventListener('click', () => handleAddInput());
  elements.inputType.addEventListener('change', () => updateInputConfig());
  elements.inputLabel.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddInput();
  });
  elements.inputUniform.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddInput();
  });

  // Settings controls
  elements.clearColor.addEventListener('input', (e) =>
    handleClearColorChange(e)
  );
  elements.resolutionScale.addEventListener('change', (e) =>
    handleResolutionScaleChange(e)
  );
  elements.fontSize.addEventListener('change', (e) => handleFontSizeChange(e));
  elements.wordWrap.addEventListener('change', (e) => handleWordWrapChange(e));
  elements.showFPS.addEventListener('change', (e) => handleShowFPSChange(e));

  // Mouse tracking
  setupMouseTracking();
}

// Mode switching handler
function handleModeChange(event) {
  const mode = event.target.value;

  // Clear existing custom inputs when switching modes (unless staying on interactive)
  if (appState.currentMode !== mode && appState.currentMode === 'interactive') {
    // Clear interactive demo inputs when leaving interactive mode
    clearInteractiveDemoInputs();
  } else if (appState.currentMode !== mode && mode !== 'interactive') {
    // Clear all custom inputs when switching to non-interactive modes
    clearAllCustomInputs();
  }

  // Load demo inputs for interactive mode BEFORE loading the shader
  if (mode === 'interactive') {
    loadInteractiveDemoInputs();
  }

  // Update current mode and shader
  appState.currentMode = mode;
  appState.editor.setValue(SHADERS[mode]);

  // Update UI for interactive mode
  if (mode === 'interactive') {
    updateCustomInputsDisplay();
    updateInputsList();
  } else {
    // Hide inputs panel for non-interactive modes
    elements.customInputsContainer.style.display = 'none';
    // Update inputs list display
    updateInputsList();
  }

  // Make editor editable (in case it was read-only from example shader)
  appState.editor.setOption('readOnly', false);

  // Clear saved shader selection and update buttons
  elements.savedShaders.value = '';
  updateSaveButtons(null);

  // Update URL with new mode
  updateURL(null, appState.currentMode);

  // Run the shader with the new base to update the output
  if (window.webgpu && window.webgpu.runCurrentShader) {
    window.webgpu.runCurrentShader();
  }
}

// Info modal functions
function openInfoModal() {
  elements.infoModal.style.display = 'block';
}

function closeInfoModal() {
  elements.infoModal.style.display = 'none';
}

// Settings modal functions
function openSettingsModal() {
  elements.modal.style.display = 'block';
}

function closeSettingsModal() {
  elements.modal.style.display = 'none';
}

// Close any open modals
function closeModals() {
  closeSettingsModal();
  closeInfoModal();
}

// Share playground state
function handleSharePlayground() {
  try {
    const shareableURL = generateShareableURL();
    navigator.clipboard.writeText(shareableURL).then(() => {
      // Show temporary success message
      const originalTitle = elements.shareBtn.title;
      elements.shareBtn.title = 'Copied to clipboard!';
      elements.shareBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        elements.shareBtn.title = originalTitle;
        elements.shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: show the URL in a prompt
      window.prompt('Copy this shareable link:', shareableURL);
    });
  } catch (error) {
    console.error('Error generating shareable URL:', error);
    alert('Failed to generate shareable link. Please try again.');
  }
}

// Shader management handlers
function handleNewShader() {
  if (appState.editor.getValue() !== SHADERS[appState.currentMode]) {
    if (
      !confirm(
        'Starting a new shader will discard your current changes. Continue?'
      )
    ) {
      return;
    }
  }

  // Reset to default template for current mode
  appState.editor.setValue(SHADERS[appState.currentMode]);

  // Make editor editable (in case it was read-only from example shader)
  appState.editor.setOption('readOnly', false);

  // Clear inputs and selection
  elements.savedShaders.value = '';
  updateSaveButtons(null);

  // Update URL to remove shader param
  updateURL(null, appState.currentMode);
}

function handleLoadShader() {
  const name = elements.savedShaders.value;

  if (!name) {
    alert('Please select a shader to load');
    return;
  }

  let shader = null;
  let isExample = false;

  // Check if it's an example shader
  if (name.startsWith('example:')) {
    const exampleName = name.substring(8); // Remove 'example:' prefix
    shader = EXAMPLE_SHADERS[exampleName];
    isExample = true;
  } else {
    shader = loadShader(name);
  }

  if (shader) {
    // Switch mode if needed
    if (shader.mode !== appState.currentMode) {
      appState.currentMode = shader.mode;
      updateModeSelect();
    }

    // Clear existing custom inputs unless loading interactive demo
    if (shader.mode !== 'interactive') {
      clearAllCustomInputs();
      // Update inputs list display
      updateInputsList();
    }

    // Load shader code
    appState.editor.setValue(shader.code);

    if (isExample) {
      // Example shaders are read-only
      appState.editor.setOption('readOnly', true);
      updateSaveButtons(null); // Don't show save buttons for examples
      elements.newShaderBtn.style.display = 'inline-block'; // Allow starting new shader
    } else {
      // Regular saved shaders are editable
      appState.editor.setOption('readOnly', false);
      updateSaveButtons(name);
    }

    // Update URL with shader name and mode
    updateURL(isExample ? null : name, appState.currentMode);
  } else {
    alert('Shader not found');
  }
}

function handleDeleteShader() {
  const name = elements.savedShaders.value;

  if (!name) {
    alert('Please select a shader to delete');
    return;
  }

  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    deleteShader(name);

    // If we just deleted the currently loaded shader, clear the state
    if (name === currentLoadedShader) {
      updateSaveButtons(null);
      updateURL(null, appState.currentMode);
    }

    alert(`Shader "${name}" deleted successfully!`);
  }
}

function handleExportShaders() {
  const shaders = getSavedShaders();
  const shaderCount = Object.keys(shaders).length;

  if (shaderCount === 0) {
    alert('No shaders to export');
    return;
  }

  // Create export data with metadata
  const exportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    shaderCount: shaderCount,
    shaders: shaders,
  };

  // Convert to JSON
  const jsonStr = JSON.stringify(exportData, null, 2);

  // Create blob and download
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wgsl-shaders-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert(`Exported ${shaderCount} shader(s) successfully!`);
}

function handleImportShaders() {
  elements.importFileInput.click();
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importData = JSON.parse(event.target.result);

      // Validate import data
      if (!importData.shaders || typeof importData.shaders !== 'object') {
        alert('Invalid shader backup file');
        return;
      }

      const importedShaders = importData.shaders;
      const shaderNames = Object.keys(importedShaders);

      if (shaderNames.length === 0) {
        alert('No shaders found in backup file');
        return;
      }

      // Check for conflicts
      const existingShaders = getSavedShaders();
      const conflicts = shaderNames.filter((name) => existingShaders[name]);

      let shouldProceed = true;
      let mergeMode = 'skip'; // 'skip', 'overwrite', or 'rename'

      if (conflicts.length > 0) {
        const message = `Found ${
          conflicts.length
        } shader(s) with existing names:\n${conflicts.slice(0, 5).join(', ')}${
          conflicts.length > 5 ? '...' : ''
        }\n\nChoose how to handle conflicts:\n- OK: Overwrite existing shaders\n- Cancel: Skip conflicting shaders`;
        shouldProceed = confirm(message);
        mergeMode = shouldProceed ? 'overwrite' : 'skip';
      }

      if (!shouldProceed && conflicts.length === shaderNames.length) {
        alert('Import cancelled');
        e.target.value = ''; // Reset file input
        return;
      }

      // Import shaders
      let importCount = 0;
      let skipCount = 0;

      shaderNames.forEach((name) => {
        const shader = importedShaders[name];

        // Validate shader data
        if (!shader.code || !shader.mode) {
          skipCount++;
          return;
        }

        // Handle conflicts
        if (existingShaders[name] && mergeMode === 'skip') {
          skipCount++;
          return;
        }

        // Save the shader
        saveShader(name, shader.code, shader.mode);
        importCount++;
      });

      // Show results
      let message = `Import complete!\n\nImported: ${importCount} shader(s)`;
      if (skipCount > 0) {
        message += `\nSkipped: ${skipCount} shader(s)`;
      }
      alert(message);
    } catch (error) {
      alert('Error reading backup file: ' + error.message);
    }

    // Reset file input
    e.target.value = '';
  };

  reader.readAsText(file);
}

// Settings handlers
function handleClearColorChange(e) {
  const hex = e.target.value;
  elements.clearColorHex.textContent = hex;
  appState.settings.clearColor = hex;
  saveSettings();
}

function handleResolutionScaleChange(e) {
  appState.settings.resolutionScale = parseFloat(e.target.value);
  saveSettings();
  // Trigger canvas resize if WebGPU is available
  if (window.webgpu && window.webgpu.resizeCanvas) {
    window.webgpu.resizeCanvas();
  }
}

function handleFontSizeChange(e) {
  appState.settings.fontSize = parseInt(e.target.value);
  document.querySelector(
    '.CodeMirror'
  ).style.fontSize = `${appState.settings.fontSize}px`;
  appState.editor.refresh();
  saveSettings();
}

function handleWordWrapChange(e) {
  appState.settings.wordWrap = e.target.checked;
  appState.editor.setOption('lineWrapping', appState.settings.wordWrap);
  saveSettings();
}

function handleShowFPSChange(e) {
  appState.settings.showFPS = e.target.checked;
  saveSettings();
  updateFPSDisplayVisibility();
}

function updateFPSDisplayVisibility() {
  const fpsElement = document.getElementById('fps-display');
  if (fpsElement) {
    fpsElement.style.display = appState.settings.showFPS ? 'inline' : 'none';
  }
}

function updateTimerControlsUI() {
  if (appState.isTimerPaused) {
    elements.pauseTimerBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.pauseTimerBtn.title = 'Resume Timer';
  } else {
    elements.pauseTimerBtn.innerHTML = '<i class="fas fa-pause"></i>';
    elements.pauseTimerBtn.title = 'Pause Timer';
  }
}

// Split pane resizer functionality
let isResizing = false;

function setupSplitPaneResizer() {
  const resizer = elements.resizer;
  const container = document.getElementById('container');

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;

    // Calculate percentage (clamp between 20% and 80%)
    let percentage = (mouseX / containerWidth) * 100;
    percentage = Math.max(20, Math.min(80, percentage));

    // Update split position
    updateSplitPosition(percentage);
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

function updateSplitPosition(percentage) {
  const editorPanel = document.getElementById('editor-panel');
  const canvasPanel = document.getElementById('canvas-panel');

  editorPanel.style.flex = `${percentage} 0 0`;
  canvasPanel.style.flex = `${100 - percentage} 0 0`;

  // Save the setting
  appState.settings.splitPosition = percentage;
  saveSettings();
}

// Timer control handlers
function handlePauseTimer() {
  if (appState.isTimerPaused) {
    // Resume timer
    appState.isTimerPaused = false;
    appState.totalPausedTime += Date.now() - appState.pausedTime;
    appState.pausedTime = 0;
    elements.pauseTimerBtn.innerHTML = '<i class="fas fa-pause"></i>';
    elements.pauseTimerBtn.title = 'Pause Timer';
  } else {
    // Pause timer
    appState.isTimerPaused = true;
    appState.pausedTime = Date.now();
    elements.pauseTimerBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.pauseTimerBtn.title = 'Resume Timer';
  }
}

function handleResetTimer() {
  appState.startTime = Date.now();
  appState.frameCount = 0;
  appState.isTimerPaused = false;
  appState.pausedTime = 0;
  appState.totalPausedTime = 0;
  elements.pauseTimerBtn.innerHTML = '<i class="fas fa-pause"></i>';
  elements.pauseTimerBtn.title = 'Pause Timer';

  // Reset FPS counter
  if (window.webgpu && window.webgpu.resetFPSCounter) {
    window.webgpu.resetFPSCounter();
  }
}

// Mouse tracking setup
function setupMouseTracking() {
  elements.canvas.addEventListener('mousemove', (e) => {
    const rect = elements.canvas.getBoundingClientRect();
    appState.mouseX = e.clientX - rect.left;
    // Invert Y so that 0 is at the bottom (like traditional graphics coordinates)
    appState.mouseY = elements.canvas.height - (e.clientY - rect.top);
  });

  elements.canvas.addEventListener('mousedown', () => {
    appState.mouseDown = 1.0;
  });

  elements.canvas.addEventListener('mouseup', () => {
    appState.mouseDown = 0.0;
  });

  elements.canvas.addEventListener('mouseleave', () => {
    appState.mouseDown = 0.0;
  });
}

// UI update functions
export function updateSaveButtons(shaderName) {
  if (shaderName) {
    currentLoadedShader = shaderName;
    elements.shaderName.value = shaderName;
    elements.saveShaderBtn.style.display = 'none';
    elements.updateShaderBtn.style.display = 'inline-block';
  } else {
    currentLoadedShader = null;
    elements.shaderName.value = '';
    elements.saveShaderBtn.style.display = 'inline-block';
    elements.updateShaderBtn.style.display = 'none';
  }
}

function updateModeSelect() {
  elements.modeSelect.value = appState.currentMode;
}

export function initializeSettingsUI() {
  elements.clearColor.value = appState.settings.clearColor;
  elements.clearColorHex.textContent = appState.settings.clearColor;
  elements.resolutionScale.value = appState.settings.resolutionScale;
  elements.fontSize.value = appState.settings.fontSize;
  elements.wordWrap.checked = appState.settings.wordWrap;
  elements.showFPS.checked = appState.settings.showFPS;

  // Initialize mode select
  updateModeSelect();

  // Update FPS display visibility
  updateFPSDisplayVisibility();

  // Initialize timer controls
  updateTimerControlsUI();

  // Initialize split pane position
  updateSplitPosition(appState.settings.splitPosition);

  // Initialize custom inputs
  updateCustomInputsDisplay();
  toggleInputsButtonVisibility();
}

// Shader save/update functions
function saveCurrentShader() {
  const nameInput = elements.shaderName;
  const name = nameInput.value.trim();

  if (!name) {
    alert('Please enter a name for your shader');
    return;
  }

  const shaders = getSavedShaders();
  if (shaders[name]) {
    if (!confirm(`A shader named "${name}" already exists. Overwrite it?`)) {
      return;
    }
  }

  saveShader(name, appState.editor.getValue(), appState.currentMode);
  updateSaveButtons(name);
  document.getElementById('saved-shaders').value = name;
  updateURL(name, appState.currentMode);
  alert(`Shader "${name}" saved successfully!`);
}

function updateCurrentShader() {
  if (!currentLoadedShader) {
    alert('No shader loaded to update');
    return;
  }

  saveShader(
    currentLoadedShader,
    appState.editor.getValue(),
    appState.currentMode
  );
  alert(`Shader "${currentLoadedShader}" updated successfully!`);
}

export function updateModeUI(mode) {
  appState.currentMode = mode;
  updateModeSelect();
}

// Custom data modal functions
function openCustomDataModal() {
  elements.customDataModal.style.display = 'block';
  updateUniformsList();
  updateTexturesList();
  updateInputsList();
  updateInputConfig();
}

function closeCustomDataModal() {
  elements.customDataModal.style.display = 'none';
}

// Custom uniforms functions
function handleAddUniform() {
  const name = elements.uniformName.value.trim();
  const type = elements.uniformType.value;
  const valueInput = elements.uniformValue.value.trim();

  if (!name) {
    alert('Please enter a uniform name');
    return;
  }

  let value;
  try {
    value = valueInput ? parseUniformValue(valueInput, type) : undefined;
  } catch (error) {
    alert(`Invalid value format: ${error.message}`);
    return;
  }

  if (addCustomUniform(name, type, value)) {
    elements.uniformName.value = '';
    elements.uniformValue.value = '';
    updateUniformsList();
    // Trigger shader re-run to use new uniforms
    if (window.webgpu && window.webgpu.runCurrentShader) {
      window.webgpu.runCurrentShader();
    }
  } else {
    alert('Uniform name already exists or invalid');
  }
}

function updateUniformsList() {
  const list = elements.uniformsList;
  list.innerHTML = '';

  const uniforms = getAllCustomUniforms();
  uniforms.forEach((uniform) => {
    const item = document.createElement('div');
    item.className = 'uniform-item';

    const info = document.createElement('div');
    info.className = 'uniform-info';
    info.innerHTML = `
      <span class="uniform-name">${uniform.name}</span>
      <span class="uniform-type">${uniform.type}</span>
    `;

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.value = uniformValueToString(uniform.value, uniform.type);
    valueInput.placeholder = 'Value';
    valueInput.addEventListener('change', () => {
      try {
        const newValue = parseUniformValue(valueInput.value, uniform.type);
        if (updateCustomUniform(uniform.name, newValue)) {
          // Trigger shader re-run to use updated value
          if (window.webgpu && window.webgpu.runCurrentShader) {
            window.webgpu.runCurrentShader();
          }
        }
      } catch (error) {
        alert(`Invalid value: ${error.message}`);
        valueInput.value = uniformValueToString(uniform.value, uniform.type);
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      if (confirm(`Remove uniform "${uniform.name}"?`)) {
        removeCustomUniform(uniform.name);
        updateUniformsList();
        // Trigger shader re-run to remove uniform
        if (window.webgpu && window.webgpu.runCurrentShader) {
          window.webgpu.runCurrentShader();
        }
      }
    });

    item.appendChild(info);
    item.appendChild(valueInput);
    item.appendChild(removeBtn);
    list.appendChild(item);
  });
}

// Texture functions
async function handleTextureUpload(event) {
  const files = event.target.files;
  if (!files.length) return;

  for (const file of files) {
    try {
      await textureManager.loadTextureFromFile(file);
    } catch (error) {
      alert(`Failed to load texture "${file.name}": ${error.message}`);
    }
  }

  textureManager.saveTextureUploads();
  updateTexturesList();

  // Trigger shader re-run to use new textures
  if (window.webgpu && window.webgpu.runCurrentShader) {
    window.webgpu.runCurrentShader();
  }

  // Reset file input
  event.target.value = '';
}

function updateTexturesList() {
  const list = elements.texturesList;
  list.innerHTML = '';

  const textures = textureManager.getAllTextures();
  textures.forEach((textureData) => {
    const item = document.createElement('div');
    item.className = 'texture-item';

    const preview = document.createElement('div');
    preview.className = 'texture-preview';

    // Create a small preview image
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    // For preview, we'll create a simple colored rectangle since we can't easily
    // read back from WebGPU texture. In a real implementation, you might want
    // to store the original image data.
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 40, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${textureData.width}x${textureData.height}`, 20, 25);

    img.src = canvas.toDataURL();
    preview.appendChild(img);

    const info = document.createElement('div');
    info.className = 'texture-info';
    info.innerHTML = `
      <div class="texture-name">${textureData.name}</div>
      <div class="texture-size">${textureData.width} × ${textureData.height}</div>
    `;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      if (confirm(`Remove texture "${textureData.name}"?`)) {
        await textureManager.removeTexture(textureData.name);
        updateTexturesList();
        // Trigger shader re-run to remove texture
        if (window.webgpu && window.webgpu.runCurrentShader) {
          window.webgpu.runCurrentShader();
        }
      }
    });

    item.appendChild(preview);
    item.appendChild(info);
    item.appendChild(removeBtn);
    list.appendChild(item);
  });
}

// Custom inputs functions
function toggleInputsPanel() {
  const isVisible = elements.customInputsContainer.style.display !== 'none';
  elements.customInputsContainer.style.display = isVisible ? 'none' : 'block';
  elements.toggleInputsBtn.innerHTML = isVisible
    ? '<i class="fas fa-sliders-h"></i>'
    : '<i class="fas fa-times"></i>';
  elements.toggleInputsBtn.title = isVisible ? 'Show Custom Inputs' : 'Hide Custom Inputs';

  if (!isVisible) {
    updateCustomInputsDisplay();
  }
}

function handleAddInput() {
  const label = elements.inputLabel.value.trim();
  const uniformName = elements.inputUniform.value.trim();
  const type = elements.inputType.value;

  if (!label || !uniformName) {
    alert('Please enter both label and uniform name');
    return;
  }

  // Get config from the dynamic config section
  const config = getInputConfigFromUI(type);

  if (addCustomInput(type, label, uniformName, config)) {
    elements.inputLabel.value = '';
    elements.inputUniform.value = '';
    updateInputsList();
    updateCustomInputsDisplay();
    toggleInputsButtonVisibility();
  } else {
    alert('Failed to add input');
  }
}

function getInputConfigFromUI(type) {
  const config = {};

  switch (type) {
    case INPUT_TYPES.SLIDER:
      config.min = parseFloat(document.getElementById('slider-min')?.value) || 0;
      config.max = parseFloat(document.getElementById('slider-max')?.value) || 1;
      config.step = parseFloat(document.getElementById('slider-step')?.value) || 0.01;
      config.defaultValue = parseFloat(document.getElementById('slider-default')?.value) || config.min;
      break;
    case INPUT_TYPES.NUMBER:
      config.min = parseFloat(document.getElementById('number-min')?.value) || 0;
      config.max = parseFloat(document.getElementById('number-max')?.value) || 100;
      config.step = parseFloat(document.getElementById('number-step')?.value) || 1;
      config.defaultValue = parseFloat(document.getElementById('number-default')?.value) || config.min;
      break;
    case INPUT_TYPES.BUTTON:
      config.defaultValue = document.getElementById('button-default')?.checked || false;
      break;
    case INPUT_TYPES.TEXT:
      config.defaultValue = document.getElementById('text-default')?.value || '';
      config.maxLength = parseInt(document.getElementById('text-maxlength')?.value) || 50;
      break;
  }

  return config;
}

function updateInputConfig() {
  const type = elements.inputType.value;
  const configDiv = elements.inputConfig;

  let html = '';

  switch (type) {
    case INPUT_TYPES.SLIDER:
      html = `
        <div class="input-config-row">
          <label>Min:</label>
          <input type="number" id="slider-min" value="0" step="any">
        </div>
        <div class="input-config-row">
          <label>Max:</label>
          <input type="number" id="slider-max" value="1" step="any">
        </div>
        <div class="input-config-row">
          <label>Step:</label>
          <input type="number" id="slider-step" value="0.01" step="any">
        </div>
        <div class="input-config-row">
          <label>Default:</label>
          <input type="number" id="slider-default" value="0" step="any">
        </div>
      `;
      break;
    case INPUT_TYPES.NUMBER:
      html = `
        <div class="input-config-row">
          <label>Min:</label>
          <input type="number" id="number-min" value="0" step="any">
        </div>
        <div class="input-config-row">
          <label>Max:</label>
          <input type="number" id="number-max" value="100" step="any">
        </div>
        <div class="input-config-row">
          <label>Step:</label>
          <input type="number" id="number-step" value="1" step="any">
        </div>
        <div class="input-config-row">
          <label>Default:</label>
          <input type="number" id="number-default" value="0" step="any">
        </div>
      `;
      break;
    case INPUT_TYPES.BUTTON:
      html = `
        <div class="input-config-row">
          <label>Default:</label>
          <input type="checkbox" id="button-default">
        </div>
      `;
      break;
    case INPUT_TYPES.TEXT:
      html = `
        <div class="input-config-row">
          <label>Default:</label>
          <input type="text" id="text-default" value="">
        </div>
        <div class="input-config-row">
          <label>Max Length:</label>
          <input type="number" id="text-maxlength" value="50" min="1">
        </div>
      `;
      break;
  }

  configDiv.innerHTML = html;
  configDiv.style.display = html ? 'block' : 'none';
}

function updateInputsList() {
  const list = elements.inputsList;
  list.innerHTML = '';

  const inputs = getAllCustomInputs();
  inputs.forEach(input => {
    const item = document.createElement('div');
    item.className = 'input-definition-item';

    const info = document.createElement('div');
    info.className = 'input-definition-info';
    info.innerHTML = `
      <div class="input-definition-name">${input.label}</div>
      <div class="input-definition-details">${input.type} → ${input.uniformName}</div>
    `;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      if (confirm(`Remove input "${input.label}"?`)) {
        removeCustomInput(input.id);
        updateInputsList();
        updateCustomInputsDisplay();
        toggleInputsButtonVisibility();
      }
    });

    item.appendChild(info);
    item.appendChild(removeBtn);
    list.appendChild(item);
  });
}

function updateCustomInputsDisplay() {
  const hasInputs = getAllCustomInputs().length > 0;
  elements.toggleInputsBtn.style.display = hasInputs ? 'inline-block' : 'none';

  if (hasInputs) {
    customInputsManager.renderInputs(elements.customInputsArea);
  }
}

function toggleInputsButtonVisibility() {
  const hasInputs = getAllCustomInputs().length > 0;
  elements.toggleInputsBtn.style.display = hasInputs ? 'inline-block' : 'none';
}
