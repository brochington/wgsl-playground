import { CUSTOM_UNIFORMS_KEY, UNIFORM_TYPES, getUniformTypeSize, getUniformDefaultValue } from './constants.js';
import { appState } from './storage.js';

// Load custom uniforms from storage
export function loadCustomUniforms() {
  try {
    const stored = localStorage.getItem(CUSTOM_UNIFORMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading custom uniforms', e);
    return [];
  }
}

// Save custom uniforms to storage
export function saveCustomUniforms() {
  try {
    localStorage.setItem(CUSTOM_UNIFORMS_KEY, JSON.stringify(appState.customUniforms));
  } catch (e) {
    console.error('Error saving custom uniforms', e);
  }
}

// Add a new custom uniform
export function addCustomUniform(name, type, value = null) {
  if (!name || !type) return false;

  // Check if uniform name already exists
  if (appState.customUniforms.some(u => u.name === name)) {
    return false;
  }

  const uniform = {
    name: name.trim(),
    type: type,
    value: value !== null ? value : getUniformDefaultValue(type),
    binding: appState.customUniforms.length + 1, // binding 0 is reserved for main uniforms
  };

  appState.customUniforms.push(uniform);
  saveCustomUniforms();
  updateCustomUniformBuffer();
  return true;
}

// Remove a custom uniform
export function removeCustomUniform(name) {
  const index = appState.customUniforms.findIndex(u => u.name === name);
  if (index === -1) return false;

  appState.customUniforms.splice(index, 1);
  // Reassign bindings
  appState.customUniforms.forEach((uniform, i) => {
    uniform.binding = i + 1;
  });
  saveCustomUniforms();
  updateCustomUniformBuffer();
  return true;
}

// Update a custom uniform value
export function updateCustomUniform(name, value) {
  const uniform = appState.customUniforms.find(u => u.name === name);
  if (!uniform) return false;

  uniform.value = value;
  saveCustomUniforms();
  updateCustomUniformData();
  return true;
}

// Get custom uniform by name
export function getCustomUniform(name) {
  return appState.customUniforms.find(u => u.name === name);
}

// Get all custom uniforms
export function getAllCustomUniforms() {
  return [...appState.customUniforms];
}

// Calculate the total size needed for custom uniform buffer
function calculateCustomUniformBufferSize() {
  return appState.customUniforms.reduce((total, uniform) => {
    return total + getUniformTypeSize(uniform.type) * 4; // 4 bytes per float
  }, 0);
}

// Update the custom uniform buffer size and data
export function updateCustomUniformBuffer() {
  const bufferSize = Math.max(calculateCustomUniformBufferSize(), 4); // At least 4 bytes (1 float)

  // Clean up old buffer
  if (appState.customUniformBuffer) {
    appState.customUniformBuffer.destroy();
  }

  // Always create a buffer, even if minimal, to avoid bind group errors
  appState.customUniformData = new Float32Array(bufferSize / 4); // Convert bytes to float count
  updateCustomUniformData();
}

// Update the uniform data array from current uniform values
export function updateCustomUniformData() {
  let offset = 0;
  appState.customUniforms.forEach(uniform => {
    const size = getUniformTypeSize(uniform.type);
    const value = uniform.value;

    if (Array.isArray(value)) {
      for (let i = 0; i < size; i++) {
        appState.customUniformData[offset + i] = value[i] || 0;
      }
    } else {
      appState.customUniformData[offset] = value;
      // Fill remaining slots with 0 for vectors
      for (let i = 1; i < size; i++) {
        appState.customUniformData[offset + i] = 0;
      }
    }

    offset += size;
  });
}

// Convert uniform value to display string
export function uniformValueToString(value, type) {
  if (Array.isArray(value)) {
    return `vec${value.length}(${value.map(v => v.toFixed ? v.toFixed(3) : v).join(', ')})`;
  }
  return value.toString();
}

// Parse string input to uniform value
export function parseUniformValue(input, type) {
  const trimmed = input.trim();

  // Handle vector types like "vec3(1.0, 2.0, 3.0)" or "1.0, 2.0, 3.0"
  if (type.startsWith('vec') || type.startsWith('ivec') || type.startsWith('uvec') || type.startsWith('bvec')) {
    const vecMatch = trimmed.match(/vec\d*\(([^)]+)\)|\[([^\]]+)\]|([^,]+)/);
    const content = vecMatch ? (vecMatch[1] || vecMatch[2] || vecMatch[3]) : trimmed;

    const components = content.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const size = getUniformTypeSize(type);

    const parsed = components.slice(0, size).map(comp => {
      if (type.includes('bool') || type.startsWith('bvec')) {
        return comp.toLowerCase() === 'true' || comp === '1';
      } else if (type.includes('i32') || type.startsWith('ivec')) {
        return parseInt(comp) || 0;
      } else if (type.includes('u32') || type.startsWith('uvec')) {
        return Math.max(0, parseInt(comp) || 0);
      } else {
        return parseFloat(comp) || 0.0;
      }
    });

    // Pad with defaults if needed
    while (parsed.length < size) {
      parsed.push(getUniformDefaultValue(type)[parsed.length] || 0);
    }

    return parsed;
  }

  // Handle scalar types
  if (type === UNIFORM_TYPES.BOOL) {
    return trimmed.toLowerCase() === 'true' || trimmed === '1';
  } else if (type === UNIFORM_TYPES.INT || type.startsWith('i')) {
    return parseInt(trimmed) || 0;
  } else if (type === UNIFORM_TYPES.UINT || type.startsWith('u')) {
    return Math.max(0, parseInt(trimmed) || 0);
  } else {
    return parseFloat(trimmed) || 0.0;
  }
}

// Initialize custom uniforms system
export function initCustomUniforms() {
  appState.customUniforms = loadCustomUniforms();
  updateCustomUniformBuffer();
}
