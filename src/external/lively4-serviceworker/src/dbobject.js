export class DbObject {
  constructor(storeName) {
<<<<<<< HEAD
    this._dbName = "lively-sw-cache";
=======
    DbObject._dbName = "lively-sw-cache";
>>>>>>> c51e2658fca70ffe8c953edb6c1328279f923c2c
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
<<<<<<< HEAD
  _connect() {  
    var request = indexedDB.open(this._dbName, 1);
=======
  _connect() {
    if (DbObject._db) return;
    
    var request = indexedDB.open(DbObject._dbName, 1);
>>>>>>> c51e2658fca70ffe8c953edb6c1328279f923c2c
    
    request.onupgradeneeded = this._createDbSchema.bind(this);
    
    request.onsuccess = function (e) {
<<<<<<< HEAD
      this._db = e.target.result;
=======
      DbObject._db = e.target.result;
>>>>>>> c51e2658fca70ffe8c953edb6c1328279f923c2c
    }
  }
  
  /**
   * Creates database schema
   */
  _createDbSchema(event) {
<<<<<<< HEAD
    this._db = event.target.result;
    
    this._db.createObjectStore("dictionary");
    this._db.createObjectStore("queue", {
      keyPath: 'id',
      autoIncrement: true
    });
    this._db.createObjectStore("favorits");
=======
    DbObject._db = event.target.result;
    
    DbObject._db.createObjectStore("dictionary");
    DbObject._db.createObjectStore("favorits");
    DbObject._db.createObjectStore("queue", {
      keyPath: 'id',
      autoIncrement: true
    });
>>>>>>> c51e2658fca70ffe8c953edb6c1328279f923c2c
  };
}