class LocalStorage {
  //the class constructor
  /**
   * constructor description
   * @param {String} key [description]
   */
  constructor(key) {
    /** @private */
    this.key = key;
  }

  /**
   *
   * a method to get value by give key from local storage.
   * @param {String} key
   * @returns {any}
   */
  loadState() {
    try {
      const serializedState = localStorage.getItem(this.key);
      if (serializedState === null) {
        return undefined;
      }
      return JSON.parse(serializedState);
    } catch (err) {
      return undefined;
    }
  }

  /**
   *
   * a function to set value by give key to local storage.
   * @param {String} state
   * @returns {any}
   */
  saveState = (state) => {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(this.key, serializedState);
    } catch (err) {
      // ignore
      console.log(err);
    }
  };
}

export default LocalStorage;
