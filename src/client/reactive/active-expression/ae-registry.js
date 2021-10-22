
import EventTarget from '../utils/event-target.js';
import Preferences from 'src/client/preferences.js';

class LocationCache {
  constructor() {
    this.unknownLocations = { counter: 0, aes: [] };
    this.files = new Map();
  }

  // adds an AE into the cache and returns an unique identifier for this AE.
  add(ae) {
    if (ae.meta().has('location')) {
      let location = ae.meta().get('location');
      let file = this.normalizeFileLocation(location.file);
      let locationArray = this.files.getOrCreate(file, () => new Map()).getOrCreate(location.start.line, () => new Map()).getOrCreate(location.start.column, () => {return {counter: 0, aes: []}});
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

  getAEsInLocation(location) {
    let file = this.normalizeFileLocation(location.file);
    return this.getAEsInColumn(file, location.start.line, location.start.column);
  }

  getAEsInFile(file) {
    let fileID = this.normalizeFileLocation(file);
    return this.extractAEsRecursive(this.files.getOrCreate(fileID, () => new Map()));
  }

  getAEsInLine(file, line) {
    let fileID = this.normalizeFileLocation(file);
    return this.extractAEsRecursive(this.files.getOrCreate(fileID, () => new Map()).getOrCreate(line, () => new Map()));
  }

  getAEsInColumn(file, line, column) {
    let fileID = this.normalizeFileLocation(file);
    return this.files.getOrCreate(fileID, () => new Map()).getOrCreate(line, () => new Map()).getOrCreate(column, () => new Map()).aes;
  }
  
  normalizeFileLocation(file) {
    return file.substring(file.indexOf("/src/"));
  }

  extractAEsRecursive(map) {
    if (map instanceof Map) {
      return [...map.values()].flatMap((v) => this.extractAEsRecursive(v));
    } else {
      return map.aes;
    }
  }
}


const LoggingModes = {
  ALL: "ALL",
  SMART: "SMART",
  NONE: "NONE"
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
      this.loggingAELocations = oldRegistry.loggingAELocations;
    } else {
      this.aexprs = new Set();
      this.aesPerLocation = new LocationCache();
      this.eventTarget = new EventTarget();
      this.callbackStack = [];
      this.evaluationStack = [];
      this.loggingAELocations = new Set();
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
  
  toggleLoggingLocation(url) {
    url = this.normalizeLocation(url);
    this.setLoggingLocation(url, !this.loggingAELocations.has(url));
  }
  
  setLoggingLocation(url, addLocation) {
    url = this.normalizeLocation(url);
    if(addLocation) {
      this.loggingAELocations.add(url);
    } else {
      this.loggingAELocations.delete(url);
    }
  }
  
  shouldLog(url) {
    switch(this.loggingMode) {
      case LoggingModes.ALL:
        return true;
      case LoggingModes.NONE:
        return false;
      case LoggingModes.SMART:
      default:
        if(!url) return false;
        url = this.normalizeLocation(url);
        return this.loggingAELocations.has(url);
    }
  }
  
  normalizeLocation(url) {
    if(!url || !url.indexOf) return url;
    return url.substring(url.indexOf("/src/"));
  }
}
self.__aeRegistry__ = new AExprRegistryClass(self.__aeRegistry__);
export const AExprRegistry = self.__aeRegistry__;