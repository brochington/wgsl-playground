import { runShader } from './shaders.js';
import { appState } from './storage.js';
import { textureManager } from './texture-manager.js';

// WebGPU state
let webgpuInstance = null;

// WebGPU initialization
export async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported on this browser.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('No appropriate GPUAdapter found.');
  }

  const device = await adapter.requestDevice();
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('webgpu');
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Calculate target size based on setting
    const targetWidth = Math.max(
      1,
      Math.floor(displayWidth * appState.settings.resolutionScale)
    );
    const targetHeight = Math.max(
      1,
      Math.floor(displayHeight * appState.settings.resolutionScale)
    );

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      return true; // Canvas was resized
    }
    return false;
  }

  resizeCanvas();

  context.configure({
    device,
    format: presentationFormat,
  });

  webgpuInstance = { device, context, presentationFormat, canvas, resizeCanvas };

  // Initialize texture manager with device
  textureManager.setDevice(device);

  return webgpuInstance;
}

// Get WebGPU instance
export function getWebGPU() {
  return webgpuInstance;
}

// Setup WebGPU-dependent features
export function setupWebGPUFeatures() {
  if (!webgpuInstance) return;

  const runCurrentShader = function (cm) {
    const shaderCode = cm.getValue();
    runShader(
      webgpuInstance.device,
      webgpuInstance.context,
      webgpuInstance.presentationFormat,
      shaderCode,
      appState.settings,
      appState.currentMode
    );
  };

  // Setup editor keyboard shortcuts
  appState.editor.setOption('extraKeys', {
    'Cmd-Enter': runCurrentShader,
    'Ctrl-Enter': runCurrentShader,
    'Cmd-S': function (cm) {
      runCurrentShader(cm);
      return false; // Prevent default save dialog
    },
    'Ctrl-S': function (cm) {
      runCurrentShader(cm);
      return false; // Prevent default save dialog
    },
    'Cmd-/': 'toggleComment',
    'Ctrl-/': 'toggleComment',
  });

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (webgpuInstance.resizeCanvas()) {
        runShader(
          webgpuInstance.device,
          webgpuInstance.context,
          webgpuInstance.presentationFormat,
          appState.editor.getValue(),
          appState.settings,
          appState.currentMode
        );
      }
    }, 100);
  });

  // Initial shader run
  runShader(
    webgpuInstance.device,
    webgpuInstance.context,
    webgpuInstance.presentationFormat,
    appState.editor.getValue(),
    appState.settings,
    appState.currentMode
  );
}

// Error display functions
function showError(message) {
  const errorDisplay = document.getElementById('error-display');
  errorDisplay.textContent = message;
  errorDisplay.classList.add('visible');
}

function clearError() {
  const errorDisplay = document.getElementById('error-display');
  errorDisplay.textContent = '';
  errorDisplay.classList.remove('visible');
}

// Make error functions available globally for shaders.js
window.showError = showError;
window.clearError = clearError;

// Make WebGPU functions available globally for UI
window.webgpu = {
  runCurrentShader: () => {
    if (webgpuInstance) {
      setupWebGPUFeatures();
    }
  }
};
