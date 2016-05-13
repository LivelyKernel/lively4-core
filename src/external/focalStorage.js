(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.focalStorage = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
/* globals indexedDB */
/**
 * focalStorage
 *
 * A Promise-based, localStorage-like wrapper around IndexedDB.
 *
 * -
 *
 * Borrowed lots of code from
 *
 * https://github.com/mozilla/localForage/blob/080f665/src/drivers/indexeddb.js and
 * https://github.com/mozilla-b2g/gaia/blob/12d71f3/shared/js/async_storage.js
 *
 * -
 *
 * This file defines an asynchronous version of the localStorage API, backed by
 * an IndexedDB database. It creates a focalStorage object that has methods
 * like the localStorage object's.
 *
 * To store a value use setItem:
 *
 *   focalStorage.setItem('key', 'value');
 *
 * If you want confirmation that the value has been stored, pass a callback
 * function as the third argument:
 *
 *  focalStorage.setItem('key', 'newvalue').then(function () {
 *    console.log('new value stored');
 *  });
 *
 * To read a value, call getItem(), but note that you must supply a callback
 * function that the value will be passed to asynchronously:
 *
 *  focalStorage.getItem('key').then(function (value) {
 *    console.log('The value of key is:', value);
 *  });
 *
 * Note that unlike localStorage, focalStorage does not allow you to store and
 * retrieve values by setting and querying properties directly. You cannot just
 * write focalStorage.key; you have to explicitly call setItem() or getItem().
 *
 * removeItem(), clear(), length(), and key() are like the same-named methods of
 * localStorage, but, like getItem() and setItem() they take a callback
 * argument.
 *
 * The asynchronous nature of getItem() makes it tricky to retrieve multiple
 * values. But unlike localStorage, focalStorage does not require the values you
 * store to be strings. So if you need to save multiple values and want to
 * retrieve them together, in a single asynchronous operation, just group the
 * values into a single object. The properties of this object may not include
 * DOM elements, but they may include things like Blobs and typed arrays.
 */

'use strict';

var db = null;

function openDatabase() {
  return new Promise(function (resolve, reject) {
    if (db) {
      resolve(db);
      return;
    }

    var openreq = indexedDB.open(focalStorage.settings.name, focalStorage.settings.version);

    openreq.onsuccess = function () {
      db = openreq.result;
      resolve(db);
    };

    openreq.onupgradeneeded = function () {
      // First time setup: create an empty object store.
      openreq.result.createObjectStore(focalStorage.settings.storeName);
    };

    openreq.onerror = function () {
      reject(openreq.error);
    };
  });
}

function openStore(type) {
  return openDatabase().then(function () {
    var transaction = db.transaction(focalStorage.settings.storeName, type);

    return transaction.objectStore(focalStorage.settings.storeName);
  });
}

function openTransaction(type) {
  return openDatabase().then(function () {
    return db.transaction(focalStorage.settings.storeName, type);
  });
}

function getItem(key) {
  return new Promise(function (resolve, reject) {
    return openStore('readonly').then(function (store) {
      var req = store.get(key);

      req.onsuccess = function () {
        var value = req.result;
        if (value === undefined) {
          value = null;
        }

        resolve(value);
      };

      req.onerror = function () {
        reject(req.error);
      };
    })['catch'](reject);
  });
}

function setItem(key, value) {
  return new Promise(function (resolve, reject) {
    return openTransaction('readwrite').then(function (transaction) {

      var store = transaction.objectStore(focalStorage.settings.storeName);

      // Cast the key to a string, as that's all we can set as a key.
      if (typeof key !== 'string') {
        console.warn(key + ' used as a key, but it is not a string');
        key = String(key);
      }

      // The reason we don't _save_ null is because IE 10 does
      // not support saving the `null` type in IndexedDB.
      if (value === null) {
        value = undefined;
      }

      var req = store.put(value, key);

      transaction.oncomplete = function () {
        // Cast to undefined so the value passed to
        // callback/promise is the same as what one would get out
        // of `getItem()` later. This leads to some weirdness
        // (setItem('foo', undefined) will return `null`), but
        // it's not my fault localStorage is our baseline and that
        // it's weird.
        if (value === undefined) {
          value = null;
        }

        resolve(value);
      };

      transaction.onabort = transaction.onerror = function () {
        reject(req.error ? req.error : req.transaction.error);
      };
    })['catch'](reject);
  });
}

function removeItem(key) {
  return new Promise(function (resolve, reject) {
    return openTransaction('readwrite').then(function (transaction) {
      var store = transaction.objectStore(focalStorage.settings.storeName);

      // Cast the key to a string, as that's all we can set as a key.
      if (typeof key !== 'string') {
        console.warn(key + ' used as a key, but it is not a string');
        key = String(key);
      }

      var req = store['delete'](key);

      transaction.oncomplete = function () {
        resolve();
      };

      transaction.onerror = function () {
        reject(req.error);
      };

      // The request will also be aborted if storage space is exceeded.
      transaction.onabort = function () {
        reject(req.error ? req.error : req.transaction.error);
      };
    })['catch'](reject);
  });
}

function clear() {
  return new Promise(function (resolve, reject) {
    return openTransaction('readwrite').then(function (transaction) {
      var store = transaction.objectStore(focalStorage.settings.storeName);

      var req = store.clear();

      transaction.oncomplete = function () {
        resolve();
      };

      transaction.onabort = transaction.onerror = function () {
        reject(req.error ? req.error : req.transaction.error);
      };
    })['catch'](reject);
  });
}

function length(callback) {
  return new Promise(function (resolve, reject) {
    openStore('readonly').then(function (store) {
      var req = store.count();

      req.onsuccess = function () {
        resolve(req.result);
      };

      req.onerror = function () {
        reject(req.error);
      };
    })['catch'](reject);
  });
}

function key(n) {
  return new Promise(function (resolve, reject) {
    if (n < 0) {
      resolve(null);
      return;
    }

    return openStore('readonly').then(function (store) {
      var advanced = false;
      var req = store.openCursor();

      req.onsuccess = function () {
        var cursor = req.result;

        if (!cursor) {
          // This means there weren't enough keys.
          resolve(null);
          return;
        }

        if (n === 0) {
          // We have the first key; return it if that's what they wanted.
          resolve(cursor.key);
        } else {
          if (!advanced) {
            // Otherwise, ask the cursor to skip ahead `n` records.
            advanced = true;
            cursor.advance(n);
          } else {
            // When we get here, we've got the nth key.
            resolve(cursor.key);
          }
        }
      };

      req.onerror = function () {
        reject(req.error);
      };
    })['catch'](reject);
  });
}

function keys() {
  return new Promise(function (resolve, reject) {
    return openStore('readonly').then(function (store) {
      var req = store.openCursor();
      var keys = [];

      req.onsuccess = function () {
        var cursor = req.result;

        if (!cursor) {
          resolve(keys);
          return;
        }

        keys.push(cursor.key);
        cursor['continue']();
      };

      req.onerror = function () {
        reject(req.error);
      };
    })['catch'](reject);
  });
}

/**
 * Assigns configurations.
 * @param {Object} settings Options object to use for `focalStorage` instance.
 */
function config(settings) {
  focalStorage.settings = Object.assign({}, DEFAULT_SETTINGS, settings || {});
}

var focalStorage = {
  INDEXEDDB: 0,
  LOCALSTORAGE: 1,
  getItem: getItem,
  setItem: setItem,
  removeItem: removeItem,
  clear: clear,
  length: length,
  key: key,
  keys: keys
};

var DEFAULT_SETTINGS = {
  driver: focalStorage.indexedDB,
  name: 'focalStorage',
  version: 1,
  storeName: 'keyvaluepairs' };

focalStorage.settings = DEFAULT_SETTINGS;

exports['default'] = focalStorage;
module.exports = exports['default'];

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _libFocalStorageJs = require('./lib/focalStorage.js');

var _libFocalStorageJs2 = _interopRequireDefault(_libFocalStorageJs);

exports['default'] = _libFocalStorageJs2['default'];
module.exports = exports['default'];

},{"./lib/focalStorage.js":1}]},{},[2])(2)
});
