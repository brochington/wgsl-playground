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

      // Save texture to persistent storage
      this.saveTextureToStorage(name, file);

      return textureData;
    } catch (error) {
      console.error('Failed to load texture:', error);
      throw error;
    }
  }

  // Remove texture
  async removeTexture(name) {
    const textureData = appState.textures.get(name);
    if (textureData) {
      textureData.texture.destroy();
      appState.textures.delete(name);
      appState.textureUploads.delete(name);
      // Remove from persistent storage
      await this.removeTextureFromStorage(name);
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
  async clearAllTextures() {
    const textureNames = Array.from(appState.textures.keys());
    for (const name of textureNames) {
      await this.removeTexture(name);
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

  // Initialize IndexedDB for texture storage
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WGSLPlaygroundTextures', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('textures')) {
          db.createObjectStore('textures');
        }
      };
    });
  }

  // Save texture to IndexedDB
  async saveTextureToStorage(name, file) {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['textures'], 'readwrite');
      const store = transaction.objectStore('textures');

      // Store the file blob
      await new Promise((resolve, reject) => {
        const request = store.put(file, name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.error('Failed to save texture to storage:', error);
    }
  }

  // Load texture from IndexedDB
  async loadTextureFromStorage(name) {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['textures'], 'readonly');
      const store = transaction.objectStore('textures');

      return new Promise((resolve, reject) => {
        const request = store.get(name);
        request.onsuccess = () => {
          db.close();
          resolve(request.result);
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Failed to load texture from storage:', error);
      return null;
    }
  }

  // Remove texture from storage
  async removeTextureFromStorage(name) {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['textures'], 'readwrite');
      const store = transaction.objectStore('textures');

      await new Promise((resolve, reject) => {
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.error('Failed to remove texture from storage:', error);
    }
  }

  // Save texture uploads to persist across sessions
  async saveTextureUploads() {
    // Save all current texture files to IndexedDB
    for (const [name, file] of appState.textureUploads) {
      await this.saveTextureToStorage(name, file);
    }
  }

  // Load and restore textures from storage
  async loadAndRestoreTextures() {
    if (!this.device) {
      console.warn('WebGPU device not initialized, cannot restore textures');
      return;
    }

    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['textures'], 'readonly');
      const store = transaction.objectStore('textures');

      const textureNames = await new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Load and recreate each texture
      for (const name of textureNames) {
        try {
          const file = await this.loadTextureFromStorage(name);
          if (file) {
            await this.loadTextureFromFile(file, name);
          }
        } catch (error) {
          console.error(`Failed to restore texture ${name}:`, error);
        }
      }

      db.close();
    } catch (error) {
      console.error('Failed to load textures from storage:', error);
    }
  }
}

// Create singleton instance
export const textureManager = new TextureManager();
