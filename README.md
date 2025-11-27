# WGSL Playground

A WebGPU shader playground for experimenting with WGSL (WebGPU Shading Language) in real-time.

## Features

- **Live Code Editor**: Powered by CodeMirror with syntax highlighting (Rust mode, close to WGSL)
- **Real-time Rendering**: Continuous animation loop with automatic re-rendering
- **Two Modes**:
  - **Triangle Mode**: Simple geometry for basic shader experiments
  - **Full-Screen Quad Mode**: Perfect for SDF (Signed Distance Functions) and fragment shader art
- **Shader Uniforms**: Access to resolution, time, mouse position, and more
- **Interactive**: Mouse tracking and click detection
- **Save & Load**: Store your shader experiments in browser localStorage
- **Error Display**: Shader compilation errors shown in the UI
- **Keyboard Shortcuts**: Press `Cmd+Enter` or `Cmd+S` (Mac) / `Ctrl+Enter` or `Ctrl+S` (Windows/Linux) to run shaders
- **Dark Theme**: Beautiful Dracula theme for comfortable coding

## Requirements

- A modern browser with WebGPU support:
  - Chrome/Edge 113+ (Windows, macOS, Linux)
  - Safari 18+ (macOS, iOS)
  
To check WebGPU availability, visit: https://webgpureport.org/

## Getting Started

1. Open `index.html` in a WebGPU-supported browser
2. Choose a mode (Triangle or Full-Screen Quad) from the header
3. Edit the WGSL shader code in the left panel
4. Press `Cmd+Enter`, `Ctrl+Enter`, or `Cmd+S`, `Ctrl+S` to run the shader
5. See the rendered output on the right panel

## Saving & Loading Shaders

Your shader experiments are automatically saved in your browser's local storage:

- **New**: Start a fresh shader with the default template for the current mode
- **Save**: Enter a name and click "Save" (or press Enter) to save a new shader
- **Update**: When a shader is loaded, the "Save" button changes to "Update" - click it to save changes to the existing shader
- **Load**: Select a shader from the dropdown and click "Load"
- **Delete**: Select a shader and click "Delete"

Saved shaders remember which mode they were created in (Triangle or Quad) and will automatically switch modes when loaded.

### Backup & Restore

You can backup and restore your entire shader collection:

- **Export All**: Downloads a JSON file containing all your saved shaders with metadata. The filename includes a timestamp for easy organization.
- **Import**: Uploads and restores shaders from a previously exported JSON backup file. If any shader names conflict with existing shaders, you'll be prompted to either overwrite them or skip the conflicting shaders.

This feature is useful for:
- Creating backups of your work
- Transferring shaders between different browsers or computers
- Sharing collections of shaders with others

### URL Parameters & Sharing

The playground stores the current state in URL parameters:
- `?mode=quad` - Sets the mode (triangle or quad)
- `?shader=MyShader&mode=quad` - Loads a specific saved shader

This means you can:
- **Bookmark** specific shaders by saving the URL
- **Refresh** the page and return to the same shader
- **Share** URLs with others (note: shaders are stored locally, so shared URLs only work if the recipient has the same shader saved)

## Modes

### Triangle Mode
The default mode with a simple triangle shader that demonstrates:
- Vertex shader with built-in position output
- Fragment shader with solid color output
- Basic array usage and indexing

### Full-Screen Quad Mode (SDF)
A full-screen quad perfect for:
- **Signed Distance Functions (SDFs)**: Create shapes using mathematical distance fields
- **Fragment Shader Art**: Experiment with procedural graphics, ray marching, and effects
- **UV Coordinate-based Graphics**: Work with normalized coordinates

The quad mode includes a sample SDF circle shader with smooth edges to get you started!

## Shader Uniforms

All shaders have access to these uniforms via the `u` variable:

```wgsl
struct Uniforms {
    resolution: vec2<f32>,  // Canvas width and height in pixels
    time: f32,              // Elapsed time in seconds
    frame: u32,             // Frame count since shader started
    mouse: vec2<f32>,       // Mouse position in pixels (from top-left)
    mouseDown: f32,         // 1.0 if mouse button is down, 0.0 otherwise
    _padding: f32,          // Padding for alignment (ignore)
}

@group(0) @binding(0) var<uniform> u: Uniforms;
```

### Usage Examples

```wgsl
// Aspect-correct coordinates
let aspect = u.resolution.x / u.resolution.y;
let uv = fragCoord.xy / u.resolution.xy;

// Animated effects with time
let pulse = sin(u.time * 2.0) * 0.5 + 0.5;

// Mouse interaction
let mousePos = u.mouse / u.resolution;
let dist = distance(uv, mousePos);

// Frame-based effects
let pattern = f32(u.frame % 60) / 60.0;
```

## WGSL Syntax

WGSL is the shader language for WebGPU. Key features:

```wgsl
// Vertex shader - processes vertices
@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
    // Your vertex logic here
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

// Fragment shader - determines pixel colors
@fragment
fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    // Use uniforms for interactive effects
    let color = vec3<f32>(sin(u.time), 0.5, 1.0);
    return vec4<f32>(color, 1.0);
}
```

## Tips

- Entry points must be named `vs_main` (vertex) and `fs_main` (fragment)
- Colors are in RGBA format with values from 0.0 to 1.0
- The coordinate system uses normalized device coordinates (-1 to 1)
- Errors will be displayed at the bottom of the editor panel
- Use `u.resolution` to correct for aspect ratio and avoid stretched shapes
- The shader runs in a continuous animation loop - use `u.time` for animations
- Mouse coordinates are in pixel space - divide by `u.resolution` to normalize
- In quad mode, use the `uv` coordinates to create position-dependent effects
- SDF functions return the distance to a shape (negative = inside, positive = outside)

## SDF Examples

Here are some useful SDF functions you can use in quad mode:

```wgsl
// Circle
fn sdf_circle(p: vec2<f32>, radius: f32) -> f32 {
    return length(p) - radius;
}

// Box
fn sdf_box(p: vec2<f32>, size: vec2<f32>) -> f32 {
    let d = abs(p) - size;
    return length(max(d, vec2<f32>(0.0))) + min(max(d.x, d.y), 0.0);
}

// Combining SDFs (union)
let shape1 = sdf_circle(uv, 0.3);
let shape2 = sdf_box(uv, vec2<f32>(0.2));
let combined = min(shape1, shape2);
```

## Project Structure

```
wgsl-playground/
├── index.html    # Main HTML file with UI layout
├── main.js       # JavaScript for WebGPU and editor setup
└── README.md     # This file
```

## Customization

You can easily modify:
- Canvas size in `index.html` (canvas width/height attributes)
- Editor theme by changing the theme in `main.js`
- Default shader code in `main.js`

## Resources

- [WGSL Specification](https://www.w3.org/TR/WGSL/)
- [WebGPU Fundamentals](https://webgpufundamentals.org/)
- [WebGPU Samples](https://webgpu.github.io/webgpu-samples/)

## License

Free to use and modify for your projects!

