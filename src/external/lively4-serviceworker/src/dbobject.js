export class DbObject {
  constructor(dbName, storeName) {
    this._dbName = dbName;
    this._storeName = storeName;
  }
  
   /**
   * Gets the objectStore from IndexedDB
   * @return ObjectStore
   */
  _getObjectStore() {
    var transaction = this._db.transaction([this._storeName], "readwrite");
    var objectStore = transaction.objectStore(this._storeName);
    return objectStore;
  }
}