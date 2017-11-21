export class DbObject {
  constructor(storeName) {
    this._dbName = "lively-sw-cache";
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
  
  /**
   * Connects to the database and creates schema, if needed
   */
  _connect() {  
    var request = indexedDB.open(this._dbName, 1);
    
    request.onupgradeneeded = this._createDbSchema.bind(this);
    
    request.onsuccess = function (e) {
      this._db = e.target.result;
    }
  }
  
  /**
   * Creates database schema
   */
  _createDbSchema(event) {
    this._db = event.target.result;
    
    this._db.createObjectStore("dictionary");
    this._db.createObjectStore("queue", {
      keyPath: 'id',
      autoIncrement: true
    });
    this._db.createObjectStore("favorits");
  };
}