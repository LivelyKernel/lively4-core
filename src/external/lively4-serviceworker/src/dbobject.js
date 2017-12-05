export class DbObject {
  constructor(storeName) {
    const instanceName = lively4url.split("/").pop();
    DbObject._dbName = "lively-sw-cache-" + instanceName;
    this._storeName = storeName;
  }
  
   /**
   * Gets the objectStore from IndexedDB
   * @return ObjectStore
   */
  _getObjectStore() {
    var transaction = DbObject._db.transaction([this._storeName], "readwrite");
    var objectStore = transaction.objectStore(this._storeName);
    return objectStore;
  }
  
  /**
   * Connects to the database and creates schema, if needed
   */
  _connect(onconnect) {
    if (DbObject._db) return;
    
    var request = indexedDB.open(DbObject._dbName, 2);
    
    request.onupgradeneeded = this._createDbSchema.bind(this);
    
    request.onsuccess = function (e) {
      DbObject._db = e.target.result;
      
      if (!onconnect) return;
      
      onconnect();
    }
  }
  
  /**
   * Creates database schema
   */
  _createDbSchema(event) {
    DbObject._db = event.target.result;
    
    DbObject._db.createObjectStore("request-cache");
    DbObject._db.createObjectStore("response-cache");
    DbObject._db.createObjectStore("favorites");
  };
}