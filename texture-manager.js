import { appState } from './storage.js';

// Texture management system
class TextureManager {
  constructor() {
    this.device = null;
    this.textureCounter = 0;
  }

  setDevice(device) {
    this.device = device;
  }

  // Load texture from image file
  async loadTextureFromFile(file, name = null) {
    if (!this.device) {
      throw new Error('WebGPU device not initialized');
    }

    if (!name) {
      name = `texture_${++this.textureCounter}`;
    }

    // Clean up existing texture with same name
    this.removeTexture(name);

    try {
      // Create image bitmap
      const bitmap = await createImageBitmap(file);

      // Create WebGPU texture
      const texture = this.device.createTexture({
        size: [bitmap.width, bitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });

      // Copy image data to texture
      this.device.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture: texture },
        [bitmap.width, bitmap.height]
      );

      // Create sampler
      const sampler = this.device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
      });

      // Create texture view
      const view = texture.createView();

      // Store texture data
      const textureData = {
        texture,
        sampler,
        view,
        width: bitmap.width,
        height: bitmap.height,
        name,
        file,
      };

      appState.textures.set(name, textureData);
      appState.textureUploads.set(name, file);

      return textureData;
    } catch (error) {
      console.error('Failed to load texture:', error);
      throw error;
    }
  }

  // Remove texture
  removeTexture(name) {
    const textureData = appState.textures.get(name);
    if (textureData) {
      textureData.texture.destroy();
      appState.textures.delete(name);
      appState.textureUploads.delete(name);
    }
  }

  // Get texture by name
  getTexture(name) {
    return appState.textures.get(name);
  }

  // Get all textures
  getAllTextures() {
    return Array.from(appState.textures.values());
  }

  // Get texture names
  getTextureNames() {
    return Array.from(appState.textures.keys());
  }

  // Check if texture exists
  hasTexture(name) {
    return appState.textures.has(name);
  }

  // Clear all textures
  clearAllTextures() {
    for (const name of appState.textures.keys()) {
      this.removeTexture(name);
    }
    this.textureCounter = 0;
  }

  // Get texture binding for bind group
  getTextureBindings() {
    const bindings = [];
    let bindingIndex = 2; // 0 and 1 are reserved for uniform buffers

    for (const [name, textureData] of appState.textures) {
      bindings.push({
        name,
        textureData,
        binding: bindingIndex,
        samplerBinding: bindingIndex + 1,
      });
      bindingIndex += 2; // Each texture uses 2 bindings (texture + sampler)
    }

    return bindings;
  }

  // Save texture uploads to persist across sessions
  saveTextureUploads() {
    // Note: We can't directly save File objects to localStorage
    // Instead, we'll store metadata and require re-uploading
    const textureMetadata = {};
    for (const [name, file] of appState.textureUploads) {
      textureMetadata[name] = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
    }
    localStorage.setItem('wgsl-playground-textures', JSON.stringify(textureMetadata));
  }

  // Load texture metadata (files need to be re-uploaded)
  loadTextureMetadata() {
    try {
      const stored = localStorage.getItem('wgsl-playground-textures');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading texture metadata', e);
      return {};
    }
  }
}

// Create singleton instance
export const textureManager = new TextureManager();
