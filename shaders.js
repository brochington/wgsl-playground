import { STORAGE_KEY } from './constants.js';
import { hexToRGB } from './utils.js';
import { appState } from './storage.js';
import { updateCustomUniformData, getAllCustomUniforms } from './custom-uniforms.js';
import { textureManager } from './texture-manager.js';

// Shader templates for different modes
export const SHADERS = {
  triangle: `// Built-in uniforms (always available)
struct Uniforms {
    resolution: vec2<f32>,  // Canvas width and height
    time: f32,              // Time in seconds
    frame: u32,             // Frame count
    mouse: vec2<f32>,       // Mouse position in pixels
    mouseDown: f32,         // 1.0 if mouse is down, 0.0 otherwise
    _padding: f32,          // Padding for alignment
}

@group(0) @binding(0) var<uniform> u: Uniforms;

// Custom uniforms (add via Custom Data panel)
// @group(0) @binding(1) var<uniform> customUniforms: MyCustomUniforms;

// Textures (add via Custom Data panel)
// @group(0) @binding(2) var myTexture: texture_2d<f32>;
// @group(0) @binding(3) var mySampler: sampler;

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
    // Normalized coordinates (-1 to 1)
    let uv = fragCoord.xy / u.resolution * 2.0 - 1.0;

    // Animated color using time
    let r = sin(u.time + uv.x) * 0.5 + 0.5;
    let g = sin(u.time * 0.7 + uv.y) * 0.5 + 0.5;
    let b = 0.8;

    // Example: Use custom uniform (uncomment when you add one)
    // let intensity = customUniforms.myFloatValue;

    // Example: Sample texture (uncomment when you add a texture)
    // let texColor = textureSample(myTexture, mySampler, uv * 0.5 + 0.5);
    // return texColor;

    return vec4<f32>(r, g, b, 1.0);
}`,

  quad: `// Built-in uniforms (always available)
struct Uniforms {
    resolution: vec2<f32>,  // Canvas width and height
    time: f32,              // Time in seconds
    frame: u32,             // Frame count
    mouse: vec2<f32>,       // Mouse position in pixels
    mouseDown: f32,         // 1.0 if mouse is down, 0.0 otherwise
    _padding: f32,          // Padding for alignment
}

@group(0) @binding(0) var<uniform> u: Uniforms;

// Example custom uniform struct (add via Custom Data panel)
// struct CustomUniforms {
//     circleRadius: f32,
//     color: vec3<f32>,
//     speed: f32,
// }
// @group(0) @binding(1) var<uniform> custom: CustomUniforms;

// Example texture (add via Custom Data panel)
// @group(0) @binding(2) var myTexture: texture_2d<f32>;
// @group(0) @binding(3) var mySampler: sampler;

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
    // Aspect-corrected coordinates (-aspect to aspect, -1 to 1)
    let aspect = u.resolution.x / u.resolution.y;
    let uv = (in.uv * 2.0 - 1.0) * vec2<f32>(aspect, 1.0);

    // Mouse position in aspect-corrected coordinates
    let mouseUV = (u.mouse / u.resolution) * 2.0 - 1.0;
    let mousePosAspect = mouseUV * vec2<f32>(aspect, -1.0);

    // Example: Use custom uniforms (uncomment when you add them)
    // let radius = custom.circleRadius;
    // let speed = custom.speed;
    // let baseColor = custom.color;

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

    // Example: Mix with texture (uncomment when you add a texture)
    // let texColor = textureSample(myTexture, mySampler, in.uv);
    // let finalColor = mix(col, texColor.rgb, texColor.a * 0.5);

    // Smooth edge with glow
    let edge = 1.0 - smoothstep(0.0, 0.02, abs(sdf));
    let glow = exp(-abs(sdf) * 8.0) * 0.3;
    let final_col = mix(col, vec3<f32>(1.0), edge) + glow;

    // Highlight on mouse down
    let highlight = select(0.0, 0.3, u.mouseDown > 0.5);

    return vec4<f32>(final_col + highlight, 1.0);
}`,

  texture: `// Procedural Pattern Shader - Upload textures via Custom Data panel for other shaders
// Built-in uniforms (always available)
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
    // Create a procedural pattern when no texture is available
    let uv = in.uv;

    // Animated checkerboard pattern
    let checkerSize = 20.0;
    let checker = (floor(uv.x * checkerSize) + floor(uv.y * checkerSize)) % 2.0;

    // Color gradient
    let gradient = uv.x * uv.y;
    let r = sin(u.time + uv.x * 6.28) * 0.5 + 0.5;
    let g = cos(u.time * 0.7 + uv.y * 6.28) * 0.5 + 0.5;
    let b = sin(u.time * 0.5 + (uv.x + uv.y) * 3.14) * 0.5 + 0.5;

    // Combine checkerboard and gradient
    let proceduralColor = mix(vec3<f32>(r, g, b), vec3<f32>(0.2, 0.4, 0.6), checker * 0.3);

    // Add some animation
    let wave = sin(uv.x * 10.0 + u.time) * sin(uv.y * 8.0 + u.time * 0.8) * 0.1;
    let animatedColor = proceduralColor + wave;

    // Mouse interaction effect
    let mouseUV = u.mouse / u.resolution;
    let mouseDist = distance(uv, mouseUV);
    let mouseEffect = smoothstep(0.2, 0.0, mouseDist) * u.mouseDown;
    let finalColor = mix(animatedColor, vec3<f32>(1.0, 0.8, 0.6), mouseEffect);

    return vec4<f32>(finalColor, 1.0);
}`,

  interactive: `// Built-in uniforms (always available)
struct Uniforms {
    resolution: vec2<f32>,  // Canvas width and height
    time: f32,              // Time in seconds
    frame: u32,             // Frame count
    mouse: vec2<f32>,       // Mouse position in pixels
    mouseDown: f32,         // 1.0 if mouse is down, 0.0 otherwise
    _padding: f32,          // Padding for alignment
}

@group(0) @binding(0) var<uniform> u: Uniforms;

// Custom uniforms from user-defined inputs
// These are automatically created when you add inputs via Custom Data
struct CustomUniforms {
    speed: f32,
    intensity: f32,
    radius: f32,
    colorShift: f32,
    enablePulse: f32,  // 1.0 or 0.0 from boolean input
}

@group(0) @binding(1) var<uniform> custom: CustomUniforms;

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
    // Convert UV to centered coordinates (-1 to 1)
    let uv = (in.uv - 0.5) * 2.0;
    let dist = length(uv);

    // Create a gentle, flowing animation
    let time = u.time * custom.speed;

    // Smooth radial waves that propagate outward
    let wave1 = sin(dist * 8.0 - time * 3.0) * 0.5 + 0.5;
    let wave2 = sin(dist * 6.0 - time * 2.0 + 1.57) * 0.5 + 0.5;

    // Combine waves for organic movement
    let combinedWave = (wave1 + wave2) * 0.5;

    // Color palette: soft blues and purples with gentle shifts
    let angle = atan2(uv.y, uv.x);
    let colorTime = time * custom.colorShift * 0.5;

    // Create a harmonious color gradient
    let hue1 = sin(colorTime + angle * 2.0) * 0.3 + 0.7;
    let hue2 = sin(colorTime * 0.7 + angle * 3.0 + 2.1) * 0.2 + 0.6;
    let hue3 = sin(colorTime * 0.5 + angle * 4.0 + 4.2) * 0.25 + 0.65;

    let baseColor = vec3<f32>(hue1 * 0.8, hue2 * 0.9, hue3);

    // Apply wave influence to brightness
    let brightness = combinedWave * custom.intensity + (1.0 - custom.intensity);
    let waveColor = baseColor * brightness;

    // Create a central focus circle
    let circleDist = smoothstep(custom.radius, custom.radius + 0.1, dist);
    let circleMask = 1.0 - circleDist;

    // Subtle vignette for depth
    let vignette = 1.0 - smoothstep(0.7, 1.2, dist) * 0.3;
    let vignettedColor = waveColor * vignette;

    // Mouse interaction - gentle highlight
    let mouseUV = (u.mouse / u.resolution - 0.5) * 2.0;
    let mouseDist = distance(uv, mouseUV);
    let mouseHighlight = smoothstep(0.2, 0.0, mouseDist) * u.mouseDown * 0.3;
    let mouseColor = mix(vignettedColor, vec3<f32>(1.0, 0.95, 0.9), mouseHighlight);

    // Pulse effect if enabled (gentle breathing)
    let pulse = custom.enablePulse * (sin(time * 2.0) * 0.1 + 0.95);
    let finalColor = mouseColor * pulse;

    // Add a subtle central glow
    let glow = exp(-dist * dist * 4.0) * 0.1;
    let glowedColor = finalColor + vec3<f32>(glow * 0.5, glow * 0.7, glow * 0.9);

    return vec4<f32>(glowedColor, 1.0);
}`,
};

export function getSavedShaders() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

export function saveShader(name, code, mode) {
  const shaders = getSavedShaders();
  shaders[name] = {
    code: code,
    mode: mode,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shaders));
  updateSavedShadersList();
}

export function loadShader(name) {
  const shaders = getSavedShaders();
  return shaders[name] || null;
}

export function deleteShader(name) {
  const shaders = getSavedShaders();
  delete shaders[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shaders));
  updateSavedShadersList();
}

// Built-in example shaders
export const EXAMPLE_SHADERS = {
  '🎨 Procedural Pattern Example': {
    code: SHADERS.texture,
    mode: 'texture',
    isExample: true
  }
};

export function updateSavedShadersList() {
  const shaders = getSavedShaders();
  const select = document.getElementById('saved-shaders');

  // Clear existing options
  select.innerHTML = '<option value="">-- Select saved shader --</option>';

  // Add built-in example shaders
  Object.keys(EXAMPLE_SHADERS).forEach((name) => {
    const option = document.createElement('option');
    option.value = `example:${name}`;
    option.textContent = name;
    option.style.fontWeight = 'bold';
    option.style.color = '#4CAF50';
    select.appendChild(option);
  });

  // Add separator
  if (Object.keys(EXAMPLE_SHADERS).length > 0 && Object.keys(shaders).length > 0) {
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '───────────────';
    select.appendChild(separator);
  }

  // Add saved shaders sorted by timestamp (newest first)
  const sortedNames = Object.keys(shaders).sort((a, b) => {
    return shaders[b].timestamp - shaders[a].timestamp;
  });

  sortedNames.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = `${name} (${shaders[name].mode})`;
    select.appendChild(option);
  });
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

let currentPipeline = null;
let uniformBuffer = null;
let bindGroup = null;

// FPS tracking
let fpsCounter = 0;
let lastFpsUpdate = Date.now();
let currentFps = 0;

// Global state for uniforms
const uniformData = new Float32Array([
  0,
  0, // resolution (vec2<f32>)
  0, // time (f32)
  0, // frame (u32, but stored as f32)
  0,
  0, // mouse (vec2<f32>)
  0, // mouseDown (f32)
  0, // padding
]);

export async function runShader(
  device,
  context,
  presentationFormat,
  shaderCode,
  settings,
  mode = 'triangle'
) {
  try {
    clearError();

    // Cancel any ongoing animation
    if (appState.animationFrameId) {
      cancelAnimationFrame(appState.animationFrameId);
      appState.animationFrameId = null;
    }

    const shaderModule = device.createShaderModule({
      code: shaderCode,
    });

    // Check for shader compilation errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    if (compilationInfo.messages.length > 0) {
      const errors = compilationInfo.messages
        .filter((msg) => msg.type === 'error')
        .map((msg) => `Line ${msg.lineNum}: ${msg.message}`)
        .join('\n');

      if (errors) {
        showError('Shader compilation errors:\n' + errors);
        return;
      }
    }

    // Create bind group layout entries
    const bindGroupLayoutEntries = [
      // Main uniform buffer (binding 0)
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      },
    ];

    // Add custom uniform buffer if needed (binding 1)
    const customUniforms = getAllCustomUniforms();
    if (customUniforms.length > 0) {
      bindGroupLayoutEntries.push({
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      });
    }

    // Add texture bindings (starting from binding 2)
    const textureBindings = textureManager.getTextureBindings();
    textureBindings.forEach(({ binding, samplerBinding }) => {
      bindGroupLayoutEntries.push(
        // Texture
        {
          binding: binding,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: '2d' },
        },
        // Sampler
        {
          binding: samplerBinding,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
        }
      );
    });

    // Create bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
      entries: bindGroupLayoutEntries,
    });

    // Create pipeline layout
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    const pipeline = device.createRenderPipeline({
      layout: pipelineLayout,
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

    // Create main uniform buffer (32 bytes for our uniform struct)
    if (uniformBuffer) {
      uniformBuffer.destroy();
    }
    uniformBuffer = device.createBuffer({
      size: 32, // 8 floats * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create custom uniform buffer if needed
    if (customUniforms.length > 0) {
      const bufferSize = appState.customUniformData.length * 4; // 4 bytes per float
      if (appState.customUniformBuffer) {
        appState.customUniformBuffer.destroy();
      }
      appState.customUniformBuffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }

    // Create bind group entries
    const bindGroupEntries = [
      // Main uniform buffer (binding 0)
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ];

    // Add custom uniform buffer if needed (binding 1)
    if (customUniforms.length > 0) {
      bindGroupEntries.push({
        binding: 1,
        resource: {
          buffer: appState.customUniformBuffer,
        },
      });
    }

    // Add texture bindings
    textureBindings.forEach(({ binding, samplerBinding, textureData }) => {
      bindGroupEntries.push(
        // Texture
        {
          binding: binding,
          resource: textureData.view,
        },
        // Sampler
        {
          binding: samplerBinding,
          resource: textureData.sampler,
        }
      );
    });

    // Create bind group
    bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: bindGroupEntries,
    });

    currentPipeline = pipeline;
    appState.startTime = Date.now();
    appState.frameCount = 0;
    appState.isTimerPaused = false;
    appState.pausedTime = 0;
    appState.totalPausedTime = 0;

    // Reset FPS counter
    fpsCounter = 0;
    lastFpsUpdate = Date.now();
    currentFps = 0;

    // Animation loop
    function render() {
      const canvas = context.canvas;

      // Update uniforms
      uniformData[0] = canvas.width;
      uniformData[1] = canvas.height;

      // Calculate time accounting for pauses
      let currentTime = Date.now();
      let effectiveTime = currentTime - appState.startTime - appState.totalPausedTime;
      if (appState.isTimerPaused) {
        effectiveTime = appState.pausedTime - appState.startTime - appState.totalPausedTime;
      }
      uniformData[2] = effectiveTime / 1000; // time in seconds

      uniformData[3] = appState.frameCount;
      uniformData[4] = appState.mouseX;
      uniformData[5] = appState.mouseY;
      uniformData[6] = appState.mouseDown;
      uniformData[7] = 0; // padding

      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      // Update custom uniform buffer if it exists
      if (appState.customUniformBuffer && appState.customUniformData.length > 0) {
        updateCustomUniformData();
        device.queue.writeBuffer(appState.customUniformBuffer, 0, appState.customUniformData);
      }

      // Update FPS counter
      fpsCounter++;
      const now = Date.now();
      if (now - lastFpsUpdate >= 1000) {
        currentFps = fpsCounter;
        fpsCounter = 0;
        lastFpsUpdate = now;

        // Update FPS display if enabled
        if (appState.settings.showFPS) {
          updateFPSDisplay(currentFps);
        }
      }

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();

      const renderPassDescriptor = {
        colorAttachments: [
          {
            view: textureView,
            // USE SETTINGS: Convert Hex String -> GPUColor Object here
            clearValue: hexToRGB(settings.clearColor),
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

      appState.frameCount++;
      appState.animationFrameId = requestAnimationFrame(render);
    }

    render();
  } catch (error) {
    console.error('Failed to run shader:', error);
    showError('Error: ' + error.message);
  }
}

// Update FPS display in the UI
function updateFPSDisplay(fps) {
  const fpsElement = document.getElementById('fps-display');
  if (fpsElement) {
    fpsElement.textContent = `FPS: ${fps}`;
  }
}

// Reset FPS counter (called from UI)
function resetFPSCounter() {
  fpsCounter = 0;
  lastFpsUpdate = Date.now();
  currentFps = 0;
  updateFPSDisplay(0);
}

// Make reset function available globally
window.resetFPSCounter = resetFPSCounter;
