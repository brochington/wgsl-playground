import { INPUT_TYPES, UNIFORM_TYPES } from './constants.js';
import { appState } from './storage.js';
import { updateCustomUniform, addCustomUniform, getCustomUniform, updateCustomUniformBuffer } from './custom-uniforms.js';

// Custom inputs management system
class CustomInputsManager {
  constructor() {
    this.inputs = [];
    this.inputValues = new Map();
  }

  // Load custom inputs from storage
  loadCustomInputs() {
    try {
      const stored = localStorage.getItem('wgsl-playground-custom-inputs');
      if (stored) {
        const data = JSON.parse(stored);
        this.inputs = data.inputs || [];
        // Restore input values
        data.values = data.values || {};
        this.inputValues = new Map(Object.entries(data.values));
      }
    } catch (e) {
      console.error('Error loading custom inputs', e);
      this.inputs = [];
      this.inputValues = new Map();
    }
    appState.customInputs = this.inputs;
    appState.inputValues = this.inputValues;
  }

  // Save custom inputs to storage
  saveCustomInputs() {
    try {
      const data = {
        inputs: this.inputs,
        values: Object.fromEntries(this.inputValues)
      };
      localStorage.setItem('wgsl-playground-custom-inputs', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving custom inputs', e);
    }
  }

  // Add a new custom input
  addInput(type, label, uniformName, config = {}) {
    const input = {
      id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label,
      uniformName,
      config: { ...config },
    };

    // Set default values based on type
    switch (type) {
      case INPUT_TYPES.SLIDER:
        input.config.min = input.config.min ?? 0;
        input.config.max = input.config.max ?? 1;
        input.config.step = input.config.step ?? 0.01;
        input.config.defaultValue = input.config.defaultValue ?? input.config.min;
        break;
      case INPUT_TYPES.BUTTON:
        input.config.defaultValue = input.config.defaultValue ?? false;
        break;
      case INPUT_TYPES.NUMBER:
        input.config.min = input.config.min ?? 0;
        input.config.max = input.config.max ?? 100;
        input.config.step = input.config.step ?? 1;
        input.config.defaultValue = input.config.defaultValue ?? input.config.min;
        break;
      case INPUT_TYPES.TEXT:
        input.config.defaultValue = input.config.defaultValue ?? '';
        input.config.maxLength = input.config.maxLength ?? 50;
        break;
    }

    // Initialize value if not set
    if (!this.inputValues.has(input.id)) {
      this.inputValues.set(input.id, input.config.defaultValue);
    }

    // Ensure the corresponding custom uniform exists
    const uniformType = this.getUniformTypeForInput(type);
    if (!getCustomUniform(uniformName)) {
      addCustomUniform(uniformName, uniformType, input.config.defaultValue);
    }

    this.inputs.push(input);
    appState.customInputs = this.inputs;
    appState.inputValues = this.inputValues;
    this.saveCustomInputs();
    return input;
  }

  // Get appropriate uniform type for input type
  getUniformTypeForInput(inputType) {
    switch (inputType) {
      case INPUT_TYPES.SLIDER:
      case INPUT_TYPES.NUMBER:
        return UNIFORM_TYPES.FLOAT;
      case INPUT_TYPES.BUTTON:
        return UNIFORM_TYPES.BOOL;
      case INPUT_TYPES.TEXT:
        return UNIFORM_TYPES.FLOAT; // We'll store text length or hash, but for now use float
      default:
        return UNIFORM_TYPES.FLOAT;
    }
  }

  // Remove a custom input
  removeInput(inputId) {
    const index = this.inputs.findIndex(input => input.id === inputId);
    if (index !== -1) {
      this.inputs.splice(index, 1);
      this.inputValues.delete(inputId);
      appState.customInputs = this.inputs;
      appState.inputValues = this.inputValues;
      this.saveCustomInputs();
      return true;
    }
    return false;
  }

  // Clear all custom inputs
  clearAllInputs() {
    this.inputs = [];
    this.inputValues.clear();
    appState.customInputs = this.inputs;
    appState.inputValues = this.inputValues;
    this.saveCustomInputs();
  }

  // Update input value
  updateInputValue(inputId, value) {
    this.inputValues.set(inputId, value);
    appState.inputValues = this.inputValues;
    this.saveCustomInputs();
  }

  // Get input by ID
  getInput(inputId) {
    return this.inputs.find(input => input.id === inputId);
  }

  // Get all inputs
  getAllInputs() {
    return [...this.inputs];
  }

  // Get current value of an input
  getInputValue(inputId) {
    return this.inputValues.get(inputId);
  }

  // Create HTML element for an input
  createInputElement(input) {
    const container = document.createElement('div');
    container.className = 'custom-input-item';
    container.dataset.inputId = input.id;

    const label = document.createElement('label');
    label.textContent = input.label;
    label.className = 'custom-input-label';

    let inputElement;
    switch (input.type) {
      case INPUT_TYPES.SLIDER:
        inputElement = document.createElement('input');
        inputElement.type = 'range';
        inputElement.min = input.config.min;
        inputElement.max = input.config.max;
        inputElement.step = input.config.step;
        inputElement.value = this.getInputValue(input.id);
        break;

      case INPUT_TYPES.BUTTON:
        inputElement = document.createElement('button');
        inputElement.textContent = input.label;
        inputElement.className = this.getInputValue(input.id) ? 'active' : '';
        break;

      case INPUT_TYPES.NUMBER:
        inputElement = document.createElement('input');
        inputElement.type = 'number';
        inputElement.min = input.config.min;
        inputElement.max = input.config.max;
        inputElement.step = input.config.step;
        inputElement.value = this.getInputValue(input.id);
        break;

      case INPUT_TYPES.TEXT:
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.maxLength = input.config.maxLength;
        inputElement.value = this.getInputValue(input.id);
        break;
    }

    inputElement.className = `custom-input-control ${input.type}`;
    inputElement.dataset.inputId = input.id;

    // Add event listener
    inputElement.addEventListener('input', (e) => {
      let value;
      switch (input.type) {
        case INPUT_TYPES.SLIDER:
        case INPUT_TYPES.NUMBER:
          value = parseFloat(e.target.value);
          break;
        case INPUT_TYPES.BUTTON:
          value = !this.getInputValue(input.id);
          e.target.classList.toggle('active', value);
          e.target.textContent = value ? `${input.label} (ON)` : input.label;
          break;
        case INPUT_TYPES.TEXT:
          value = e.target.value;
          break;
      }
      this.updateInputValue(input.id, value);
      this.notifyUniformUpdate(input.uniformName, value);
    });

    // Special handling for button
    if (input.type === INPUT_TYPES.BUTTON) {
      inputElement.addEventListener('click', (e) => {
        const value = !this.getInputValue(input.id);
        this.updateInputValue(input.id, value);
        e.target.classList.toggle('active', value);
        e.target.textContent = value ? `${input.label} (ON)` : input.label;
        this.notifyUniformUpdate(input.uniformName, value);
      });
    }

    // Create value display for slider and number
    if (input.type === INPUT_TYPES.SLIDER || input.type === INPUT_TYPES.NUMBER) {
      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'custom-input-value';
      valueDisplay.textContent = this.getInputValue(input.id);

      inputElement.addEventListener('input', () => {
        valueDisplay.textContent = inputElement.value;
      });

      container.appendChild(label);
      container.appendChild(inputElement);
      container.appendChild(valueDisplay);
    } else {
      container.appendChild(label);
      container.appendChild(inputElement);
    }

    return container;
  }

  // Notify about uniform value updates
  notifyUniformUpdate(uniformName, value) {
    // Update the corresponding custom uniform value
    updateCustomUniform(uniformName, value);

    // Also call the global callback if set
    if (window.customInputs && window.customInputs.onValueChange) {
      window.customInputs.onValueChange(uniformName, value);
    }
  }

  // Render all inputs to a container
  renderInputs(container, position = 'top') {
    container.innerHTML = '';
    const inputs = this.getAllInputs();

    if (inputs.length === 0) {
      container.innerHTML = '<div class="no-inputs">No custom inputs defined. Add some in the Custom Data panel.</div>';
      return;
    }

    inputs.forEach(input => {
      const element = this.createInputElement(input);
      container.appendChild(element);
    });
  }
}

// Create singleton instance
export const customInputsManager = new CustomInputsManager();

// Initialize the system
export function initCustomInputs() {
  customInputsManager.loadCustomInputs();

  // Sync input values with custom uniforms
  syncInputsToUniforms();

  // Make globally available for shader updates
  window.customInputs = {
    manager: customInputsManager,
    onValueChange: null
  };
}

// Load demo inputs for the interactive shader
export function loadInteractiveDemoInputs() {
  // Check if demo inputs already exist
  const existingInputs = customInputsManager.getAllInputs();
  const hasDemoInputs = existingInputs.some(input =>
    input.uniformName === 'speed' ||
    input.uniformName === 'intensity' ||
    input.uniformName === 'radius'
  );

  if (hasDemoInputs) {
    return; // Demo inputs already exist
  }

  // Add demo inputs for the interactive shader
  customInputsManager.addInput(
    INPUT_TYPES.SLIDER,
    'Animation Speed',
    'speed',
    { min: 0, max: 5, step: 0.1, defaultValue: 1.0 }
  );

  customInputsManager.addInput(
    INPUT_TYPES.SLIDER,
    'Effect Intensity',
    'intensity',
    { min: 0, max: 1, step: 0.01, defaultValue: 0.5 }
  );

  customInputsManager.addInput(
    INPUT_TYPES.SLIDER,
    'Circle Radius',
    'radius',
    { min: 0, max: 2, step: 0.01, defaultValue: 0.8 }
  );

  customInputsManager.addInput(
    INPUT_TYPES.SLIDER,
    'Color Shift Speed',
    'colorShift',
    { min: -2, max: 2, step: 0.1, defaultValue: 0.5 }
  );

  customInputsManager.addInput(
    INPUT_TYPES.BUTTON,
    'Enable Pulse',
    'enablePulse',
    { defaultValue: true }
  );

  // Force buffer update after adding inputs
  updateCustomUniformBuffer();
}

// Clear demo inputs for the interactive shader
export function clearInteractiveDemoInputs() {
  const inputsToRemove = customInputsManager.getAllInputs().filter(input =>
    input.uniformName === 'speed' ||
    input.uniformName === 'intensity' ||
    input.uniformName === 'radius' ||
    input.uniformName === 'colorShift' ||
    input.uniformName === 'enablePulse'
  );

  inputsToRemove.forEach(input => {
    customInputsManager.removeInput(input.id);
  });

  // Force buffer update after removing inputs
  updateCustomUniformBuffer();
}

// Sync input values to custom uniforms
function syncInputsToUniforms() {
  const inputs = customInputsManager.getAllInputs();
  inputs.forEach(input => {
    const value = customInputsManager.getInputValue(input.id);
    updateCustomUniform(input.uniformName, value);
  });
}

// Export convenience functions
export function addCustomInput(type, label, uniformName, config) {
  return customInputsManager.addInput(type, label, uniformName, config);
}

export function removeCustomInput(inputId) {
  return customInputsManager.removeInput(inputId);
}

export function getAllCustomInputs() {
  return customInputsManager.getAllInputs();
}

export function clearAllCustomInputs() {
  customInputsManager.clearAllInputs();
  // Force buffer update after clearing inputs
  updateCustomUniformBuffer();
}

export function loadCustomInputsFromData(inputsData) {
  customInputsManager.inputs = inputsData.inputs || [];
  customInputsManager.inputValues = new Map(Object.entries(inputsData.values || {}));
  appState.customInputs = customInputsManager.inputs;
  appState.inputValues = customInputsManager.inputValues;
  customInputsManager.saveCustomInputs();
}
