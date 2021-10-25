
import EventTarget from '../utils/event-target.js';
import Preferences from 'src/client/preferences.js';

  
function normalizeLocation(url) {
  if(!url || !url.indexOf) return url;
  return url.substring(url.indexOf("/src/"));
}

class LocationCache {
   
  constructor() {
    this.unknownLocations = { counter: 0, aes: [] };
    this.files = new Map();
  }

  // adds an AE into the cache and returns an unique identifier for this AE.
  add(ae) {
    if (ae.meta().has('location')) {
      let location = ae.meta().get('location');
      let file = normalizeLocation(location.file);
      let locationArray = this._getColumn(file, location.start.line, location.start.column);
      locationArray.aes.push(ae);
      return file + '@' + location.start.line + ':' + location.start.column + "#" + ++locationArray.counter;
    } else {
      this.unknownLocations.aes.push(ae);
      return 'unknown_location#' + ++this.unknownLocations.counter;
    }
  }

  remove(ae) {
    if (ae.meta().has('location')) {
      let location = ae.meta().get('location');
      const aesInLocation = this.getAEsInLocation(location);
      aesInLocation.splice(aesInLocation.indexOf(ae));
    } else {
      this.unknownLocations.aes.splice(this.unknownLocations.aes.indexOf(ae));
    }
  }
  
  clear() {
    this.files.clear();
    this.unknownLocations = { counter: 0, aes: [] };
  }
  
  getLoggingMode(file, line = undefined) {
    if(line) {
      if(this._getLine(file, line).loggingMode !== LoggingModes.DEFAULT) {
        return this._getLine(file, line).loggingMode;
      }
    }
    return this._getFile(file).loggingMode;
  }
  
  setLoggingModeIfDefault(file) {
    const fileObj = this._getFile(file);
    if(fileObj.loggingMode === LoggingModes.DEFAULT) {
      fileObj.loggingMode = LoggingModes.ALL;
    }
  }
  
  setLoggingMode(mode, file, line = undefined) {
    if(line) {
      this._getLine(file, line).loggingMode = mode;
    } else {
      this._getFile(file).loggingMode = mode;
    }
  }

  getAEsInLocation(location) {
    let file = normalizeLocation(location.file);
    return this.getAEsInColumn(file, location.start.line, location.start.column);
  }

  getAEsInFile(file) {
    return this.extractAEsRecursive(this._getFile(file));
  }

  getAEsInLine(file, line) {
    return this.extractAEsRecursive(this._getLine(file, line));
  }

  getAEsInColumn(file, line, column) {
    return this.extractAEsRecursive(this._getColumn(file, line, column));
  }
  
  _getFile(file) {
    let fileID = normalizeLocation(file);
    return this.files.getOrCreate(fileID, () => {return {loggingMode: LoggingModes.DEFAULT, lines: new Map()}});
  }
  
  _getLine(file, line) {
    return this._getFile(file).lines.getOrCreate(line, () => {return {loggingMode: LoggingModes.DEFAULT, columns: new Map()}})
  }
  
  _getColumn(file, line, column) {
    return this._getLine(file, line).columns.getOrCreate(column, () => {return {counter: 0, aes: []}});
  }
  
  extractAEsRecursive(map) {
    if(!map) return [];
    if(map.lines) return this.extractAEsRecursive(map.lines);
    if(map.columns) return this.extractAEsRecursive(map.columns);
    if (map instanceof Map) {
      return [...map.values()].flatMap((v) => this.extractAEsRecursive(v));
    } else {
      return map.aes;
    }
  }
}


export const LoggingModes = {
  ALL: "ALL",
  SMART: "SMART",
  NONE: "NONE",
  DEFAULT: "DEFAULT",
}
/*MD ## Registry of Active Expressions MD*/
class AExprRegistryClass {
  
  constructor(oldRegistry) {
    if(oldRegistry) {
      this.aexprs = oldRegistry.aexprs;
      this.aesPerLocation = oldRegistry.aesPerLocation;
      this.eventTarget = oldRegistry.eventTarget;
      this.callbackStack = oldRegistry.callbackStack;
      this.evaluationStack = oldRegistry.evaluationStack;
    } else {
      this.aexprs = new Set();
      this.aesPerLocation = new LocationCache();
      this.eventTarget = new EventTarget();
      this.callbackStack = [];
      this.evaluationStack = [];
    }
    this.loggingMode = Preferences.get("EnableAEDebugging") ? (Preferences.get("SmartAELogging") ? LoggingModes.SMART : LoggingModes.ALL) : LoggingModes.NONE;
  }

  /**
   * Handling membership
   */
  addAExpr(aexpr) {
    this.aexprs.add(aexpr);
    this.buildIdFor(aexpr);
    this.eventTarget.dispatchEvent('add', aexpr);
  }
  
  removeAExpr(aexpr) {
    const deleted = this.aexprs.delete(aexpr);
    this.aesPerLocation.remove(aexpr);
    if (deleted) {
      this.eventTarget.dispatchEvent('remove', aexpr);
    }
  }
  
  updateAExpr(aexpr) {
    this.eventTarget.dispatchEvent('update', aexpr);
  }
  

  on(type, callback) {
    return this.eventTarget.addEventListener(type, callback);
  }
  
  off(type, callback) {
    return this.eventTarget.removeEventListener(type, callback);
  }

  addToCallbackStack(ae, callback) {
    this.callbackStack.push({ ae, callback });
  }

  popCallbackStack() {
    this.callbackStack.pop();
  }

  addToEvaluationStack(ae) {
    this.evaluationStack.push(ae);
  }

  popEvaluationStack() {
    this.evaluationStack.pop();
  }

  evaluationStack() {
    return this.evaluationStack;
  }

  buildIdFor(ae) {
    let locationId = this.aesPerLocation.add(ae);
    ae.meta({ id: locationId });
  }

  /**
   * For Development purpose if the registry gets into inconsistent state
   */
  purge() {
    for (let each of this.aexprs) {
      each._isDisposed = true;
    }
    this.eventTarget.callbacks.clear();
    this.aexprs.clear();
    this.aesPerLocation.clear();
  }

  /**
   * Access
   */
  allAsArray() {
    return Array.from(this.aexprs);
  }
  
  getLocationCache() {
    return this.aesPerLocation;
  }

  addEventListener(reference, callback) {
    if (!this.listeners) this.listeners = [];
    this.listeners.push({ reference, callback });
  }

  removeEventListener(reference) {
    if (!this.listeners) return;
    this.listeners = this.listeners.filter(listener => listener.reference !== reference);
  }

  eventListeners() {
    if (!this.listeners) return [];
    return this.listeners;
  }
  
  fileSaved(url) {
    if(this.loggingMode === LoggingModes.SMART) {
      this.aesPerLocation.setLoggingModeIfDefault(url);
    }
  }
  
  toggleLoggingLocation(url, line = undefined) {
    this.setLoggingLocation(!this.shouldLog(url, line), url, line);
  }
  
  setLoggingLocation(enable, url, line = undefined) {
    this.aesPerLocation.setLoggingMode(enable ? LoggingModes.ALL : LoggingModes.NONE, url, line);
  }
  
  shouldLog(url, line = undefined) {
    let mode = this.aesPerLocation.getLoggingMode(url, line);
    mode = mode === LoggingModes.DEFAULT ? this.loggingMode : mode;
    switch(mode) {
      case LoggingModes.ALL:
        return true;
      case LoggingModes.NONE:
        return false;
      case LoggingModes.SMART:
        return this.isInteresting(url);
      default:
        return false;
    }
  }
  
  isInteresting(url) {
    //is currently open
    url = normalizeLocation(url);
    const openURLs = new Set((Array.from(document.body.querySelectorAll('lively-container')).map(c => normalizeLocation(c.getAttribute('src')))));
    return openURLs.has(url);
  }
}
self.__aeRegistry__ = new AExprRegistryClass(self.__aeRegistry__);
export const AExprRegistry = self.__aeRegistry__;