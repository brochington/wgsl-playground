# WGSL Playground

A WebGPU shader playground for experimenting with WGSL (WebGPU Shading Language) in real-time.

## Features

- **Live Code Editor**: Powered by CodeMirror with syntax highlighting and customizable settings
- **Real-time Rendering**: Continuous animation loop with automatic re-rendering
- **Multiple Shader Modes**:
  - **Triangle Mode**: Simple geometry for basic shader experiments
  - **Full-Screen Quad Mode**: Perfect for SDF and fragment shader art
  - **Procedural Pattern Mode**: Template for texture-based shaders
  - **Interactive Controls Mode**: Demo with customizable UI controls
- **Custom Uniforms**: Add your own shader parameters with various data types
- **Custom Inputs**: Create interactive sliders, buttons, and text inputs linked to uniforms
- **Texture Support**: Upload and use image textures in your shaders (persisted across sessions)
- **Shader Uniforms**: Access to resolution, time, mouse position, frame count, and more
- **Interactive Controls**: Mouse tracking, click detection, and timer controls
- **Save & Load System**: Store shader experiments with metadata in browser localStorage
- **Backup & Restore**: Export/import complete shader collections as JSON files
- **Shareable URLs**: Generate links containing full playground state for sharing
- **Error Display**: Shader compilation errors shown in the UI
- **Keyboard Shortcuts**: Multiple shortcuts for running shaders and editor functions
- **Info Panel**: Built-in help with keyboard shortcuts, links, and uniform documentation
- **Responsive Design**: Adapts to different screen sizes and editor panel widths
- **Dark Theme**: Dracula theme for comfortable coding

## Keyboard Shortcuts

- `Cmd/Ctrl + Enter` - Run shader
- `Cmd/Ctrl + S` - Run shader (alternative)
- `Cmd/Ctrl + /` - Toggle line/block comment
- `Enter` (in input fields) - Confirm action or add item

## Requirements

- A modern browser with WebGPU support:
  - Chrome/Edge 113+ (Windows, macOS, Linux)
  - Safari 18+ (macOS, iOS)
  
To check WebGPU availability, visit: https://webgpureport.org/

## Getting Started

1. Open `index.html` in a WebGPU-supported browser
2. Choose a shader mode from the header dropdown
3. Edit the WGSL shader code in the left panel
4. Press `Cmd+Enter`, `Ctrl+Enter`, or `Cmd+S`, `Ctrl+S` to run the shader
5. Use the settings panel to customize rendering options and editor preferences
6. Add custom uniforms, textures, and interactive controls as needed
7. See the rendered output on the right panel

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

The playground supports comprehensive state sharing through URL parameters:

#### Basic Parameters
- `?mode=triangle|quad|texture|interactive` - Sets the shader mode
- `?shader=MyShader` - Loads a specific saved shader

#### Full State Sharing
The share button generates URLs containing complete playground state:
- Shader code, settings, custom uniforms, and custom inputs
- Excludes textures for performance reasons
- Recipients can immediately see and modify the shared configuration

#### Sharing Features
- **Share Button**: Click the share icon to copy a complete state URL to clipboard
- **Bookmark States**: Save URLs containing full playground configurations
- **Refresh Preservation**: Page refreshes maintain current state
- **Cross-Session Persistence**: Textures and saved shaders persist across browser sessions

## Shader Modes

### Triangle Mode
Basic geometry mode demonstrating:
- Vertex shader with built-in position output
- Fragment shader with solid color output
- Array usage and indexing
- Fundamental shader concepts

### Full-Screen Quad Mode (SDF)
Full-screen quad optimized for:
- Signed Distance Functions (SDFs) for mathematical shapes
- Fragment shader art and procedural graphics
- UV coordinate-based effects
- Ray marching and advanced visual effects

Includes a sample SDF circle shader with smooth edges.

### Procedural Pattern Mode
Template for texture-based shaders:
- Pre-configured for texture sampling
- Pattern generation algorithms
- Procedural texture creation

### Interactive Controls Mode
Demonstrates the custom input system:
- Pre-built interactive controls
- Dynamic parameter adjustment
- Real-time shader feedback
- UI integration examples

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

## Custom Uniforms & Inputs

The playground supports extending shaders with custom parameters:

### Custom Uniforms
Add shader parameters of various types through the Custom Data panel:
- Float, integer, and boolean values
- Vectors (2D, 3D, 4D) of different base types
- Automatic buffer management and binding

### Custom Inputs
Create interactive UI controls linked to uniforms:
- **Sliders**: Numeric range inputs for continuous values
- **Buttons**: Toggle boolean uniforms
- **Number Inputs**: Direct numeric entry
- **Text Inputs**: String parameters for shaders

### Texture Support
Upload and use image textures in your shaders:
- Support for common image formats
- Automatic texture binding and sampling
- Persistent storage across browser sessions
- Multiple texture support with binding management

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
- Errors are displayed at the bottom of the editor panel
- Use `u.resolution` to correct for aspect ratio and avoid stretched shapes
- The shader runs in a continuous animation loop - use `u.time` for animations
- Mouse coordinates are in pixel space - divide by `u.resolution` to normalize
- In quad mode, use UV coordinates to create position-dependent effects
- SDF functions return the distance to a shape (negative = inside, positive = outside)
- Custom uniforms are accessible through the `custom` variable in shaders
- Textures are sampled using the `textures` array with binding indices
- The info panel (i) provides keyboard shortcuts and uniform documentation
- Share button generates URLs with complete playground state
- Uploaded textures persist across browser sessions

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
├── index.html          # Main HTML file with UI layout
├── css/
│   └── style.css       # Stylesheets for UI components
├── js/
│   ├── main.js         # Application initialization and WebGPU setup
│   ├── ui.js           # User interface management and event handling
│   ├── webgpu.js       # WebGPU rendering pipeline and shader compilation
│   ├── editor.js       # CodeMirror editor configuration
│   ├── storage.js       # Application state and localStorage management
│   ├── shaders.js      # Shader saving/loading and example management
│   ├── url-manager.js   # URL state serialization and sharing
│   ├── custom-uniforms.js # Custom shader uniform system
│   ├── custom-inputs.js # Interactive UI controls for shaders
│   ├── texture-manager.js # Texture upload and WebGPU texture management
│   ├── constants.js    # Application constants and configuration
│   ├── autosave-manager.js # Automatic state saving
│   └── utils.js        # Utility functions
└── README.md           # This documentation
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

