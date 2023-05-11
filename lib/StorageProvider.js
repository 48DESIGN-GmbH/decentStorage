class StorageProvider {
  /**
   * The decentStorage instance that instantiated this provider
   */
  dS;

  constructor(decentStorageInstance) {
    this.dS = decentStorageInstance;
  }

  /**
   * trigger the auth process, e.g. redirecting to an OAuth process
   */
  auth() {
    throw new Error(`${this.constructor.name} does not implement this method`);
  }

  /**
   * handle the auth response
   */
  handleAuth() {}
}

export { StorageProvider };
