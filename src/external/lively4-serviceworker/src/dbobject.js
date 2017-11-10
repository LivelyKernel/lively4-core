export class DbObject {
   /**
   * Gets the objectStore from IndexedDB
   * @return ObjectStore
   */
  _getObjectStore() {
    var transaction = this.db.transaction([this._storeName], "readwrite");
    var objectStore = transaction.objectStore(this._storeName);
    return objectStore;
  }
}