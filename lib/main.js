import { StorageProvider } from "./StorageProvider.js";
import { StorageWrapper } from "./StorageWrapper.js";

import { DropboxStorageProvider } from "./providers/dropbox.js";
import { FileSystemStorageProvider } from "./providers/filesystem.js";
import { GoogleDriveStorageProvider } from "./providers/gdrive.js";

const defaultProviders = {
  DROPBOX: DropboxStorageProvider,
  FILE_SYSTEM: FileSystemStorageProvider,
  GOOGLE_DRIVE: GoogleDriveStorageProvider,
};

class DecentStorage {
  #store;
  #authStore;

  prefix = "dS.";

  defaultProviders = defaultProviders;

  constructor() {
    this.data = new Map();
    this.providers = new Set([...Object.values(defaultProviders)]);
    this.activeProviders = new Set();

    this.store = localStorage;
    this.authStore = localStorage;
  }

  /**
   * Always uses prefixed sessionStorage in contrast to the configurable .store
   */
  get sessionStore() {
    return new StorageWrapper(this, null, sessionStorage);
  }

  get store() {
    return this.#store;
  }

  /**
   * Set the internally used store for data caching and offline access.
   * * localStorage (default): persisted through sessions, but limited to 5 MB
   * * sessionStorage
   */
  set store(newStore) {
    if (newStore instanceof Storage) {
      // @TODO: sync data when changing store
      this.#store = new StorageWrapper(this, null, newStore);
    } else {
      throw new Error(
        "Store must be an instance of Storage (localStorage or sessionStorage)"
      );
    }
  }

  get authStore() {
    return this.#authStore;
  }

  /**
   * Set the internally used store for auth tokens
   * * localStorage (default): persisted through sessions
   * * sessionStorage: will require re-authentication for each session
   */
  set authStore(newStore) {
    if (newStore instanceof Storage) {
      // @TODO: sync data when changing store
      this.#authStore = new StorageWrapper(this, "auth", newStore);
    } else {
      throw new Error(
        "Store must be an instance of Storage (localStorage or sessionStorage)"
      );
    }
  }

  /**
   * Check if there is an active provider or log a warning
   */
  #checkProviders() {
    if (!this.activeProviders.size) {
      console.warn("No provider has been activated, data will not be synced.");
    }
  }

  /**
   * Add a provider of type StorageProvider to the list of available providers
   */
  addProvider(provider) {
    if (
      provider instanceof StorageProvider ||
      provider.prototype instanceof StorageProvider
    ) {
      this.providers.add(provider);
    } else {
      throw new Error("Provider must be an instance of StorageProvider");
    }
  }

  /**
   * Remove a provider from the list of available providers
   */
  removeProvider(provider) {
    this.providers.delete(provider);
    this.deactivateProvider(provider);
  }

  /**
   * Activate and initialize a provider to be used for data storage
   */
  activateProvider(provider, options) {
    const foundProvider = this.findProvider(provider);

    if (foundProvider) {
      throw new Error("This provider is already activated");
    }

    this.addProvider(provider);

    if (this.activeProviders.size > 0) {
      throw new Error("Multiple providers are currently not supported");
    }

    this.activeProviders.add(new provider(this, options));
  }

  /**
   * Deactivate a currently activated provider
   */
  deactivateProvider(provider) {
    const foundProvider = this.findProvider(provider);
    if (foundProvider) {
      this.activeProviders.delete(foundProvider);
    }
  }

  findProvider(provider) {
    return Array.from(this.activeProviders).find((p) => {
      return p instanceof provider;
    });
  }

  setItem(key, value) {
    this.#checkProviders();

    // @TODO update provider
    this.store.setItem(key, value);
  }

  getItem(key) {
    this.#checkProviders();

    // @TODO: fetch from provider
    return this.store.getItem(key);
  }

  removeItem(key) {
    this.#checkProviders();

    // @TODO: fetch from provider
    this.store.removeItem(key);

    // @TODO: update provider
  }

  clear() {
    this.#checkProviders();

    // @TODO: only clear our own keys
    this.store.clear();
    // @TODO: update provider
  }

  key(index) {
    return this.store.key(index);
  }

  handleAuth() {
    this.activeProviders.forEach((provider) => {
      provider.handleAuth();
    });
  }
}

Object.setPrototypeOf(DecentStorage.prototype, Storage.prototype);

Object.defineProperty(DecentStorage.prototype, "length", {
  get: function () {
    return this.store.length;
  },
});

const decentStorage = new DecentStorage();

export { decentStorage };
