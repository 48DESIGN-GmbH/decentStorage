class StorageWrapper {
  #dS;
  #prefix;
  #store;

  constructor(dS, prefix, store) {
    this.#dS = dS;
    this.#prefix = prefix;
    this.#store = store;
  }

  getPrefix() {
    const subPrefix = this.#prefix ? `${this.#prefix}.` : "";
    return this.#dS.prefix + subPrefix;
  }

  setItem(key, value) {
    const prefixedKey = this.getPrefix() + key;
    this.#store.setItem(prefixedKey, value);
  }

  getItem(key) {
    const prefixedKey = this.getPrefix() + key;
    return this.#store.getItem(prefixedKey);
  }

  removeItem(key) {
    const prefixedKey = this.getPrefix() + key;
    this.#store.removeItem(prefixedKey);
  }

  clear() {
    // Clear all items with the specified prefix
    const keysToRemove = [];
    for (let i = 0; i < this.#store.length; i++) {
      const key = this.#store.key(i);
      if (key.startsWith(this.#dS.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => this.#store.removeItem(key));
  }
}

export { StorageWrapper };
