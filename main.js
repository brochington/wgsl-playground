// Shader templates for different modes
const SHADERS = {
  triangle: `// Uniforms available in all shaders
struct Uniforms {
    resolution: vec2<f32>,  // Canvas width and height
    time: f32,              // Time in seconds
    frame: u32,             // Frame count
    mouse: vec2<f32>,       // Mouse position in pixels
    mouseDown: f32,         // 1.0 if mouse is down, 0.0 otherwise
    _padding: f32,          // Padding for alignment
}

@group(0) @binding(0) var<uniform> u: Uniforms;

@vertex
fn vs_main(@builtin(vertex_index) in_vertex_index: u32) -> @builtin(position) vec4<f32> {
    let pos = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>(0.5, -0.5)
    );

    return vec4<f32>(pos[in_vertex_index], 0.0, 1.0);
}

@fragment
fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    // Animated color using time
    let r = sin(u.time) * 0.5 + 0.5;
    let g = sin(u.time * 0.7) * 0.5 + 0.5;
    let b = 0.8;
    
    return vec4<f32>(r, g, b, 1.0);
}`,
  
  quad: `// Uniforms available in all shaders
struct Uniforms {
    resolution: vec2<f32>,  // Canvas width and height
    time: f32,              // Time in seconds
    frame: u32,             // Frame count
    mouse: vec2<f32>,       // Mouse position in pixels
    mouseDown: f32,         // 1.0 if mouse is down, 0.0 otherwise
    _padding: f32,          // Padding for alignment
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) in_vertex_index: u32) -> VertexOutput {
    var out: VertexOutput;
    
    // Full-screen quad (2 triangles = 6 vertices)
    let x = f32((in_vertex_index & 1u) << 1u);
    let y = f32((in_vertex_index & 2u));
    
    out.position = vec4<f32>(x * 2.0 - 1.0, y * 2.0 - 1.0, 0.0, 1.0);
    out.uv = vec2<f32>(x, 1.0 - y);
    
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // Aspect-corrected coordinates
    let aspect = u.resolution.x / u.resolution.y;
    let uv = (in.uv * 2.0 - 1.0) * vec2<f32>(aspect, 1.0);
    
    // Mouse position in normalized coordinates
    let mouseUV = (u.mouse / u.resolution) * 2.0 - 1.0;
    let mousePosAspect = mouseUV * vec2<f32>(aspect, -1.0);
    
    // Animated circle - pulsing with time
    let pulse = sin(u.time * 2.0) * 0.1;
    let circle = length(uv) - (0.5 + pulse);
    
    // Interactive circle at mouse position
    let mouseCircle = length(uv - mousePosAspect) - 0.2;
    
    // Combine shapes
    let sdf = min(circle, mouseCircle);
    
    // Color based on distance and time
    let hue = u.time * 0.5;
    let col = select(
        vec3<f32>(0.1 + sin(hue) * 0.3, 0.6, 1.0),
        vec3<f32>(0.0, 0.0, 0.0),
        sdf > 0.0
    );
    
    // Smooth edge with glow
    let edge = 1.0 - smoothstep(0.0, 0.02, abs(sdf));
    let glow = exp(-abs(sdf) * 8.0) * 0.3;
    let final_col = mix(col, vec3<f32>(1.0), edge) + glow;
    
    // Highlight on mouse down
    let highlight = select(0.0, 0.3, u.mouseDown > 0.5);
    
    return vec4<f32>(final_col + highlight, 1.0);
}`
};

// CodeMirror is loaded as a global from the CDN
const editor = CodeMirror.fromTextArea(
  document.getElementById('shader-editor'),
  {
    lineNumbers: true,
    mode: 'rust',
    theme: 'dracula',
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: false,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
  }
);

// Force a refresh to ensure theme is applied
setTimeout(() => {
  editor.refresh();
}, 100);

// Set initial shader and mode from URL params or defaults
const urlParams = new URLSearchParams(window.location.search);
let currentMode = urlParams.get('mode') || 'triangle';
const shaderParam = urlParams.get('shader');

// Track currently loaded shader
let currentLoadedShader = null;

// Validate mode
if (!SHADERS[currentMode]) {
  currentMode = 'triangle';
}

editor.setValue(SHADERS[currentMode]);

// Shader storage management
const STORAGE_KEY = 'wgsl-playground-shaders';

function getSavedShaders() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveShader(name, code, mode) {
  const shaders = getSavedShaders();
  shaders[name] = {
    code: code,
    mode: mode,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shaders));
  updateSavedShadersList();
}

function loadShader(name) {
  const shaders = getSavedShaders();
  return shaders[name] || null;
}

function deleteShader(name) {
  const shaders = getSavedShaders();
  delete shaders[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shaders));
  updateSavedShadersList();
}

function updateSavedShadersList() {
  const shaders = getSavedShaders();
  const select = document.getElementById('saved-shaders');
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">-- Select saved shader --</option>';
  
  // Add saved shaders sorted by timestamp (newest first)
  const sortedNames = Object.keys(shaders).sort((a, b) => {
    return shaders[b].timestamp - shaders[a].timestamp;
  });
  
  sortedNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = `${name} (${shaders[name].mode})`;
    select.appendChild(option);
  });
}

// Initialize saved shaders list
updateSavedShadersList();

// Update URL parameters
function updateURL(shaderName = null, mode = currentMode) {
  const params = new URLSearchParams();
  params.set('mode', mode);
  if (shaderName) {
    params.set('shader', shaderName);
  }
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newURL);
}

// Function to show/hide update button
function updateSaveButtons(shaderName) {
  const saveBtn = document.getElementById('save-shader-btn');
  const updateBtn = document.getElementById('update-shader-btn');
  const nameInput = document.getElementById('shader-name');
  
  if (shaderName) {
    currentLoadedShader = shaderName;
    nameInput.value = shaderName;
    saveBtn.style.display = 'none';
    updateBtn.style.display = 'inline-block';
  } else {
    currentLoadedShader = null;
    nameInput.value = '';
    saveBtn.style.display = 'inline-block';
    updateBtn.style.display = 'none';
  }
}

// Load shader from URL parameter if present
if (shaderParam) {
  const shader = loadShader(shaderParam);
  if (shader) {
    currentMode = shader.mode;
    editor.setValue(shader.code);
    document.getElementById('saved-shaders').value = shaderParam;
    updateSaveButtons(shaderParam);
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === currentMode);
    });
  } else {
    // Shader not found, clear the param
    updateURL(null, currentMode);
  }
} else {
  // No shader in URL, just set the mode param
  updateURL(null, currentMode);
}

// Create new shader button
document.getElementById('new-shader-btn').addEventListener('click', () => {
  if (editor.getValue() !== SHADERS[currentMode]) {
    if (!confirm('Starting a new shader will discard your current changes. Continue?')) {
      return;
    }
  }
  
  // Reset to default template for current mode
  editor.setValue(SHADERS[currentMode]);
  
  // Clear inputs and selection
  document.getElementById('saved-shaders').value = '';
  updateSaveButtons(null);
  
  // Update URL to remove shader param
  updateURL(null, currentMode);
  
  // Run the shader if WebGPU is initialized
  if (webgpu) {
    runShader(
      webgpu.device,
      webgpu.context,
      webgpu.presentationFormat,
      SHADERS[currentMode],
      currentMode
    );
  }
});

// Save shader function (for new shaders)
function saveCurrentShader() {
  const nameInput = document.getElementById('shader-name');
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
  
  saveShader(name, editor.getValue(), currentMode);
  updateSaveButtons(name);
  document.getElementById('saved-shaders').value = name;
  updateURL(name, currentMode);
  alert(`Shader "${name}" saved successfully!`);
}

// Update shader function (for existing shaders)
function updateCurrentShader() {
  if (!currentLoadedShader) {
    alert('No shader loaded to update');
    return;
  }
  
  saveShader(currentLoadedShader, editor.getValue(), currentMode);
  alert(`Shader "${currentLoadedShader}" updated successfully!`);
}

// Save shader button
document.getElementById('save-shader-btn').addEventListener('click', saveCurrentShader);

// Update shader button
document.getElementById('update-shader-btn').addEventListener('click', updateCurrentShader);

// Allow Enter key to save or update
document.getElementById('shader-name').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    if (currentLoadedShader) {
      updateCurrentShader();
    } else {
      saveCurrentShader();
    }
  }
});

// Load shader button
document.getElementById('load-shader-btn').addEventListener('click', () => {
  const select = document.getElementById('saved-shaders');
  const name = select.value;
  
  if (!name) {
    alert('Please select a shader to load');
    return;
  }
  
  const shader = loadShader(name);
  if (shader) {
    // Switch mode if needed
    if (shader.mode !== currentMode) {
      currentMode = shader.mode;
      document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === currentMode);
      });
    }
    
    // Load shader code
    editor.setValue(shader.code);
    
    // Update save buttons to show Update instead of Save
    updateSaveButtons(name);
    
    // Update URL with shader name and mode
    updateURL(name, currentMode);
    
    // Run the shader if WebGPU is initialized
    if (webgpu) {
      runShader(
        webgpu.device,
        webgpu.context,
        webgpu.presentationFormat,
        shader.code,
        currentMode
      );
    }
  } else {
    alert('Shader not found');
  }
});

// Delete shader button
document.getElementById('delete-shader-btn').addEventListener('click', () => {
  const select = document.getElementById('saved-shaders');
  const name = select.value;
  
  if (!name) {
    alert('Please select a shader to delete');
    return;
  }
  
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    deleteShader(name);
    
    // If we just deleted the currently loaded shader, clear the state
    if (name === currentLoadedShader) {
      updateSaveButtons(null);
      updateURL(null, currentMode);
    }
    
    alert(`Shader "${name}" deleted successfully!`);
  }
});

// Export all shaders button
document.getElementById('export-shaders-btn').addEventListener('click', () => {
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
    shaders: shaders
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
});

// Import shaders button
document.getElementById('import-shaders-btn').addEventListener('click', () => {
  document.getElementById('import-file-input').click();
});

// Handle file import
document.getElementById('import-file-input').addEventListener('change', (e) => {
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
      const conflicts = shaderNames.filter(name => existingShaders[name]);
      
      let shouldProceed = true;
      let mergeMode = 'skip'; // 'skip', 'overwrite', or 'rename'
      
      if (conflicts.length > 0) {
        const message = `Found ${conflicts.length} shader(s) with existing names:\n${conflicts.slice(0, 5).join(', ')}${conflicts.length > 5 ? '...' : ''}\n\nChoose how to handle conflicts:\n- OK: Overwrite existing shaders\n- Cancel: Skip conflicting shaders`;
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
      
      shaderNames.forEach(name => {
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
});


// Global state for uniforms
const uniformData = new Float32Array([
  0, 0,      // resolution (vec2<f32>)
  0,         // time (f32)
  0,         // frame (u32, but stored as f32)
  0, 0,      // mouse (vec2<f32>)
  0,         // mouseDown (f32)
  0,         // padding
]);

// Mouse tracking
let mouseX = 0;
let mouseY = 0;
let mouseDown = 0;
let startTime = Date.now();
let frameCount = 0;

async function initWebGPU() {
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

  // Resize canvas to match display size
  function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      return true; // Canvas was resized
    }
    return false;
  }

  resizeCanvas();

  context.configure({
    device,
    format: presentationFormat,
  });

  return { device, context, presentationFormat, canvas, resizeCanvas };
}

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

let animationFrameId = null;
let currentPipeline = null;
let uniformBuffer = null;
let bindGroup = null;

async function runShader(device, context, presentationFormat, shaderCode, mode = 'triangle') {
  try {
    clearError();
    
    // Cancel any ongoing animation
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    const shaderModule = device.createShaderModule({
      code: shaderCode,
    });

    // Check for shader compilation errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    if (compilationInfo.messages.length > 0) {
      const errors = compilationInfo.messages
        .filter(msg => msg.type === 'error')
        .map(msg => `Line ${msg.lineNum}: ${msg.message}`)
        .join('\n');
      
      if (errors) {
        showError('Shader compilation errors:\n' + errors);
        return;
      }
    }

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    // Create uniform buffer (32 bytes for our uniform struct)
    if (uniformBuffer) {
      uniformBuffer.destroy();
    }
    uniformBuffer = device.createBuffer({
      size: 32, // 8 floats * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create bind group
    bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
      ],
    });

    currentPipeline = pipeline;
    startTime = Date.now();
    frameCount = 0;

    // Animation loop
    function render() {
      const canvas = context.canvas;
      
      // Update uniforms
      uniformData[0] = canvas.width;
      uniformData[1] = canvas.height;
      uniformData[2] = (Date.now() - startTime) / 1000; // time in seconds
      uniformData[3] = frameCount;
      uniformData[4] = mouseX;
      uniformData[5] = mouseY;
      uniformData[6] = mouseDown;
      uniformData[7] = 0; // padding
      
      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      const renderPassDescriptor = {
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      };
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(currentPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      
      // Draw 3 vertices for triangle mode, 6 for quad mode
      const vertexCount = mode === 'quad' ? 6 : 3;
      passEncoder.draw(vertexCount, 1, 0, 0);
      passEncoder.end();

      device.queue.submit([commandEncoder.finish()]);
      
      frameCount++;
      animationFrameId = requestAnimationFrame(render);
    }

    render();
  } catch (error) {
    console.error('Failed to run shader:', error);
    showError('Error: ' + error.message);
  }
}

// Mode switching
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode');
    
    // Update active state
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update current mode and shader
    currentMode = mode;
    editor.setValue(SHADERS[mode]);
    
    // Clear saved shader selection and update buttons
    document.getElementById('saved-shaders').value = '';
    updateSaveButtons(null);
    
    // Update URL with new mode
    updateURL(null, currentMode);
    
    // Run the new shader if WebGPU is initialized
    if (webgpu) {
      runShader(
        webgpu.device,
        webgpu.context,
        webgpu.presentationFormat,
        editor.getValue(),
        currentMode
      );
    }
  });
});

// Setup mouse tracking
const canvas = document.getElementById('canvas');
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  // Invert Y so that 0 is at the bottom (like traditional graphics coordinates)
  mouseY = canvas.height - (e.clientY - rect.top);
});

canvas.addEventListener('mousedown', () => {
  mouseDown = 1.0;
});

canvas.addEventListener('mouseup', () => {
  mouseDown = 0.0;
});

canvas.addEventListener('mouseleave', () => {
  mouseDown = 0.0;
});

let webgpu;
initWebGPU()
  .then((result) => {
    webgpu = result;
    
    const runCurrentShader = function (cm) {
      const shaderCode = cm.getValue();
      runShader(
        webgpu.device,
        webgpu.context,
        webgpu.presentationFormat,
        shaderCode,
        currentMode
      );
    };

    editor.setOption('extraKeys', {
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
    });

    // Handle window resize - re-render shader
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (webgpu.resizeCanvas()) {
          runShader(
            webgpu.device,
            webgpu.context,
            webgpu.presentationFormat,
            editor.getValue(),
            currentMode
          );
        }
      }, 100);
    });

    // Initial run
    runShader(
      webgpu.device,
      webgpu.context,
      webgpu.presentationFormat,
      editor.getValue(),
      currentMode
    );
  })
  .catch((error) => {
    const errorDisplay = document.getElementById('error-display');
    errorDisplay.textContent = 'WebGPU Initialization Error: ' + error.message;
    errorDisplay.classList.add('visible');
    console.error('WebGPU initialization failed:', error);
  });
