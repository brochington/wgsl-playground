// Shader storage management
export const STORAGE_KEY = 'wgsl-playground-shaders';
export const AUTOSAVE_KEY = 'wgsl-playground-autosave';
export const SETTINGS_KEY = 'wgsl-playground-settings';
export const CUSTOM_UNIFORMS_KEY = 'wgsl-playground-custom-uniforms';

// Supported uniform types
export const UNIFORM_TYPES = {
  FLOAT: 'f32',
  VEC2: 'vec2<f32>',
  VEC3: 'vec3<f32>',
  VEC4: 'vec4<f32>',
  INT: 'i32',
  IVEC2: 'vec2<i32>',
  IVEC3: 'vec3<i32>',
  IVEC4: 'vec4<i32>',
  UINT: 'u32',
  UVEC2: 'vec2<u32>',
  UVEC3: 'vec3<u32>',
  UVEC4: 'vec4<u32>',
  BOOL: 'bool',
  BVEC2: 'vec2<bool>',
  BVEC3: 'vec3<bool>',
  BVEC4: 'vec4<bool>',
};

// Custom input types for the UI
export const INPUT_TYPES = {
  SLIDER: 'slider',
  BUTTON: 'button',
  NUMBER: 'number',
  TEXT: 'text',
};

// Get the size in floats for each uniform type
export function getUniformTypeSize(type) {
  switch (type) {
    case UNIFORM_TYPES.FLOAT:
    case UNIFORM_TYPES.INT:
    case UNIFORM_TYPES.UINT:
    case UNIFORM_TYPES.BOOL:
      return 1;
    case UNIFORM_TYPES.VEC2:
    case UNIFORM_TYPES.IVEC2:
    case UNIFORM_TYPES.UVEC2:
    case UNIFORM_TYPES.BVEC2:
      return 2;
    case UNIFORM_TYPES.VEC3:
    case UNIFORM_TYPES.IVEC3:
    case UNIFORM_TYPES.UVEC3:
    case UNIFORM_TYPES.BVEC3:
      return 3;
    case UNIFORM_TYPES.VEC4:
    case UNIFORM_TYPES.IVEC4:
    case UNIFORM_TYPES.UVEC4:
    case UNIFORM_TYPES.BVEC4:
      return 4;
    default:
      return 1;
  }
}

// Get default value for each uniform type
export function getUniformDefaultValue(type) {
  switch (type) {
    case UNIFORM_TYPES.FLOAT:
      return 0.0;
    case UNIFORM_TYPES.VEC2:
      return [0.0, 0.0];
    case UNIFORM_TYPES.VEC3:
      return [0.0, 0.0, 0.0];
    case UNIFORM_TYPES.VEC4:
      return [0.0, 0.0, 0.0, 1.0];
    case UNIFORM_TYPES.INT:
    case UNIFORM_TYPES.UINT:
      return 0;
    case UNIFORM_TYPES.IVEC2:
    case UNIFORM_TYPES.UVEC2:
      return [0, 0];
    case UNIFORM_TYPES.IVEC3:
    case UNIFORM_TYPES.UVEC3:
      return [0, 0, 0];
    case UNIFORM_TYPES.IVEC4:
    case UNIFORM_TYPES.UVEC4:
      return [0, 0, 0, 1];
    case UNIFORM_TYPES.BOOL:
      return false;
    case UNIFORM_TYPES.BVEC2:
      return [false, false];
    case UNIFORM_TYPES.BVEC3:
      return [false, false, false];
    case UNIFORM_TYPES.BVEC4:
      return [false, false, false, true];
    default:
      return 0.0;
  }
}
