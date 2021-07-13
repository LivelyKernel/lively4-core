import 'lang';

/*HTML 
<img src="https://lively-kernel.org/lively4/lively4-core/media/lively4_logo_smooth_100.png"></img>'s Implementation of AExprs
HTML*/

import { BaseActiveExpression } from 'active-expression';
import * as frameBasedAExpr from "active-expression-frame-based";

import Stack from './../utils/stack.js';
import CompositeKey from './composite-key.js';
import InjectiveMap from './injective-map.js';
import BidirectionalMultiMap from './bidirectional-multi-map.js';
import DualKeyMap from './dual-key-map.js';
import { isFunction } from 'utils';
import lively from "src/client/lively.js";
import _ from 'src/external/lodash/lodash.js';
import diff from 'src/external/diff-match-patch.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';

/*MD # Dependency Analysis MD*/

const analysisStack = new Stack();

let expressionAnalysisMode = false;
window.__expressionAnalysisMode__ = false;

class ExpressionAnalysis {

  static recalculateDependencies(aexpr) {
    if (analysisStack.findUp(({ currentAExpr }) => currentAExpr === aexpr)) {
      throw new Error('Attempt to recalculate an Active Expression while it is already recalculating dependencies');
    }

    try {
      expressionAnalysisMode = true;
      window.__expressionAnalysisMode__ = expressionAnalysisMode;

      // Do the function execution in ExpressionAnalysisMode
      analysisStack.withElement({ currentAExpr: aexpr, dependencies: new Set() }, () => {
        try {
          const { value, isError } = aexpr.evaluateToCurrentValue();
        } catch(e) {
          console.error("Error during AE Dependency Calculation", e.message);
        }finally {
          this.applyDependencies();
        }
      });
    } finally {
      expressionAnalysisMode = !!analysisStack.top();
      window.__expressionAnalysisMode__ = expressionAnalysisMode;
    }
  }

  static associateDependency(dependency) {
    const { dependencies } = analysisStack.top();
    dependencies.add(dependency);
  }

  static applyDependencies() {
    const { currentAExpr, dependencies } = analysisStack.top();
    
    const currentDependencies = currentAExpr.dependencies().all();
    const currentSet = new Set(currentDependencies);
    let removedDependencies = currentDependencies
      .filter(dependency => !dependencies.has(dependency));
    const newDependencies = [...dependencies]
      .filter(dependency => !currentSet.has(dependency));
    
    removedDependencies
      .forEach(dependency => DependenciesToAExprs.disassociate(dependency, currentAExpr));
    dependencies.forEach(dependency => {
      DependenciesToAExprs.associate(dependency, currentAExpr);
    });
    
    const matching = [];
    removedDependencies = removedDependencies.filter((dependency) => {
      const index = newDependencies.findIndex((dependency2 => this.equalish(dependency, dependency2)));
      if(index >= 0) {
        matching.push({removed: dependency.getKey(), added: newDependencies[index].getKey()});
        dependency.currentVersion = newDependencies[index];
        newDependencies.splice(index, 1);
        return false;
      }
      return true;
    });
    if(newDependencies.length > 0 || removedDependencies.length > 0 || matching.length > 0) {
      currentAExpr.logEvent('dependencies changed', { added: newDependencies.map(d => d.getKey()), removed: removedDependencies.map(d => d.getKey()), matching});
    }
  }

  static equalish(d1, d2) {
    if(d1.type() !== d2.type()) return false;
    return _.isEqual(d1.getKey(), d2.getKey());
  }
  
}

class Dependency {
  static getOrCreateFor(context, identifier, type) {
    return ContextAndIdentifierToDependencies.getOrCreate(context, identifier, () => new Dependency(context, identifier, type));
  }
  
  // Generates a key for this dependency. This allows this dependency to be found again at a later time, after the originial dependency might have already been deleted.
  getKey() {
    return new DependencyKey(this.context, this.identifier);
  }

  // #TODO: compute and cache isGlobal
  constructor(context, identifier, type) {
    this._type = type;
    this.classFilePath = context.__classFilePath__;
    this.isTracked = false;
    this.hooks = [];
    this.context = context;
    this.identifier = identifier;
  }

  updateTracking() {
    if (this.isTracked === DependenciesToAExprs.hasAExprsForDep(this)) {
      return;
    }
    if (this.isTracked) {
      this.untrack();
    } else {
      this.track();
    }
    for (const hook of this.getHooks()) {
      hook.getLocations().then(locations => DebuggingCache.updateFiles(locations.map(loc => loc.file)));
    }
    for (const ae of DependenciesToAExprs.getAExprsForDep(this)) {
      if (ae.meta().has("location")) {
        DebuggingCache.updateFiles([ae.meta().get("location").file]);
      }
    }
  }

  track() {
    this.isTracked = true;

    const [context, identifier, value] = this.contextIdentifierValue();
    const isGlobal = this.isGlobalDependency();

    /*HTML <span style="font-weight: bold;">Source Code Hook</span>: for anything <span style="color: green; font-weight: bold;">members or locals</span> HTML*/
    // always employ the source code hook
    this.sourceCodeHook = new SourceCodeHook(context, identifier);
    this.associateWithHook(this.sourceCodeHook);

    /*HTML <span style="font-weight: bold;">Data Structure Hook</span>: for <span style="color: green; font-weight: bold;">Sets, Arrays, Maps</span> HTML*/
    let dataStructure;
    if (this._type === 'member') {
      dataStructure = context;
    } else if (this._type === 'local') {
      dataStructure = value;
    }
    if (dataStructure instanceof Array || dataStructure instanceof Set || dataStructure instanceof Map) {
      this.associateWithHook(DataStructureHook.getOrCreateForDataStructure(dataStructure));
    }

    /*HTML <span style="font-weight: bold;">Wrapping Hook</span>: only for <span style="color: green; font-weight: bold;">"that"</span> HTML*/
    if (isGlobal && identifier === 'that') {
      const wrappingHook = PropertyWrappingHook.getOrCreateForProperty(identifier);
      this.associateWithHook(wrappingHook);
    }

    /*HTML <span style="font-weight: bold;">Mutation Observer Hook</span>: handling <span style="color: green; font-weight: bold;">HTMLElements</span> HTML*/
    if (this._type === 'member' && context instanceof HTMLElement) {
      // #HACK #TODO: for now, ignore Knotview if unused for Mutations -> need to better separate those hooks, e.g. do not recursively check ALL attribute change, etc.
      if (context.tagName !== 'LIVELY-TABLE' && !(context.tagName === 'KNOT-VIEW' && (identifier === 'knot' || identifier === 'knotLabel')) && !context.tagName.endsWith('-rp19')) {
        // TODO: the member also influences what kind of observer we want to use!
        this.associateWithHook(MutationObserverHook.getOrCreateForElement(context));
      }
    }

    /*HTML <span style="font-weight: bold;">Event-based Change Hook</span>: handling <span style="color: green; font-weight: bold;">HTMLElements</span> HTML*/
    if (this._type === 'member' && context instanceof HTMLElement) {
      // #TODO: we have to acknowledge that different properties require different events to listen on
      //  e.g. code-mirror might have 'value' (so need to listen for 'change') or 'getCursor' (so need to listen for 'cursorActivity')
      // eventBasedHook.listenFor(identifier);
      this.associateWithHook(EventBasedHook.getOrCreateForElement(context));
    }

    /*HTML <span style="font-weight: bold;">Frame-based Change Hook</span>: handling <span style="color: green; font-weight: bold;">Date</span> HTML*/
    // -    if ((this._type === 'member' && context === Date && identifier === 'now') ||
    if (isGlobal && identifier === 'Date') {
      //TODO: This violates the each Hook belongs to one Dependency Rule
      this.associateWithHook(FrameBasedHook.instance);
    }
  }

  associateWithHook(hook) {
    this.hooks.push(hook);
    hook.addDependency(this);
  }

  untrack() {
    this.isTracked = false;
    ContextAndIdentifierToDependencies.removeSecondary(this.context, this.identifier);

    // Track affected files
    for (const hook of this.hooks) {
      hook.removeDependency(this);
      hook.getLocations().then(locations => DebuggingCache.updateFiles(locations.map(loc => loc.file)));
    }
    for (const ae of DependenciesToAExprs.getAExprsForDep(this)) {
      if (ae.meta().has("location")) {
        DebuggingCache.updateFiles([ae.meta().get("location").file]);
      }
    }
  }

  //Todo: Replace
  contextIdentifierValue() {
    const value = this.context !== undefined ? this.context[this.identifier] : undefined;

    return [this.context, this.identifier, value];
  }

  notifyAExprs(location, hook) {
    const aexprs = DependenciesToAExprs.getAExprsForDep(this);
    DependencyManager.checkAndNotifyAExprs(aexprs, location, this, hook);
  }

  type() {
    if (this.isGlobal()) return "global";
    return this._type;
  }

  isMemberDependency() {
    return this._type === 'member' && !this.isGlobal();
  }
  isGlobalDependency() {
    return this._type === 'member' && this.isGlobal();
  }
  isLocalDependency() {
    return this._type === 'local';
  }
  isGlobal() {
    return this.context === self;
  }

  getHooks() {
    return this.hooks;
  }

  getName() {
    const [context, identifier] = this.contextIdentifierValue();

    if (this.isGlobalDependency()) {
      return identifier.toString();
    }
    return (context ? context.constructor.name : "") + "." + identifier;
  }

  getAsDependencyDescription() {
    const [context, identifier, value] = this.contextIdentifierValue();

    if (this.isMemberDependency()) {
      return {
        object: context,
        property: identifier,
        value
      };
    }

    if (this.isGlobalDependency()) {
      return {
        name: identifier,
        value
      };
    }

    if (this.isLocalDependency()) {
      return {
        scope: context,
        name: identifier,
        value
      };
    }

    throw new Error('Dependency is neighter local, member, nor global.');
  }

}
/*MD # Debugging Cache MD*/

export class AEDebuggingCache {

  constructor() {
    this.registeredDebuggingViews = [];
    this.debouncedUpdateDebuggingViews = _.debounce(this.updateDebggingViews, 100);
    this.changedFiles = new Set();
  }
  /*MD ## Registration MD*/
  async registerFileForAEDebugging(url, context, triplesCallback) {
    const callback = async () => {
      if (context && (!context.valid || context.valid())) {
        triplesCallback((await this.getDependencyTriplesForFile(url)));
        return true;
      }
      return false;
    };
    this.registeredDebuggingViews.push({ callback, url });

    triplesCallback((await this.getDependencyTriplesForFile(url)));
  }

  getTripletsForAE(ae) {
    const result = [];
    for (const dependency of DependenciesToAExprs.getDepsForAExpr(ae)) {
      for (const hook of dependency.getHooks()) {
        result.push({ hook, dependency: dependency.getKey(), ae });
      }
    }
    return result;
  }

  /*MD ## Caching MD*/

  /*MD ## Code Change API MD*/
  async updateFile(url, oldCode, newCode) {
    try {
      const lineMapping = this.calculateMapping(oldCode, newCode);
      for (const ae of DependenciesToAExprs.getAEsInFile(url)) {
        const location = ae.meta().get("location");
        this.remapLocation(lineMapping, location);
      }
      for (const hook of await this.getHooksInFile(url)) {
        hook.getLocations().then(locations => {
          for (const location of locations) {
            this.remapLocation(lineMapping, location);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  remapLocation(lineMapping, location) {
    let [diff, lineChanged] = lineMapping[location.start.line];

    if (diff === -1) {
      location.start.line = 0;
    } else {
      location.start.line = diff;
    }

    let [diff2, lineChanged2] = lineMapping[location.end.line];

    if (diff2 === -1) {
      location.end.line = 0;
    } else {
      location.end.line = diff2;
    }
    if (lineChanged || lineChanged2) {
      lively.notify("Changed AE code for existing AE. There are outdated expressions in the system");
      //ToDo: Check if the content is similar enough, mark AEs as outdated
    }
  }

  calculateMapping(oldCode, newCode) {
    const mapping = []; //For each line of oldCode: new Line in newCode if existing, changedContent if the line no longer exists but can be mapped to a newCode line
    var dmp = new diff.diff_match_patch();
    var a = dmp.diff_linesToChars_(oldCode, newCode);
    var lineText1 = a.chars1;
    var lineText2 = a.chars2;
    var lineArray = a.lineArray;
    var diffs = dmp.diff_main(lineText1, lineText2, false);

    let originalLine = 0;
    let newLine = 0;
    let recentDeletions = 0;
    let recentAdditions = 0;
    for (let [type, data] of diffs) {
      if (type === 0) {
        recentDeletions = 0;
        recentAdditions = 0;
        for (let i = 0; i < data.length; i++) {
          mapping[originalLine] = [newLine, false];
          originalLine++;
          newLine++;
        }
      } else if (type === 1) {
        if (recentDeletions > 0) {
          const matchingLines = Math.max(recentDeletions, data.length);
          for (let i = 0; i < matchingLines; i++) {
            mapping[originalLine - matchingLines + i] = [newLine, true];
            newLine++;
          }
          data = data.substring(matchingLines);
        }
        if (data.length > 0) {
          newLine += data.length;
          recentAdditions += data.length;
        }
      } else {
        if (recentAdditions > 0) {
          const matchingLines = Math.max(recentAdditions, data.length);
          for (let i = 0; i < matchingLines; i++) {
            mapping[originalLine] = [newLine - matchingLines + i, true];
            originalLine++;
          }
          data = data.substring(matchingLines);
        }
        recentDeletions += data.length;
        for (let i = 0; i < data.length; i++) {
          mapping[originalLine] = [-1, false];
          originalLine++;
        }
      }
    }

    dmp.diff_charsToLines_(diffs, lineArray);

    return mapping;
  }
  /*MD ## Rewriting API MD*/
  updateFiles(files) {
    if (!files) return;
    files.forEach(file => {
      if(file) {
        this.changedFiles.add(file)
      }
    });
    this.debouncedUpdateDebuggingViews();
  }

  async updateDebggingViews() {
    for (let i = 0; i < this.registeredDebuggingViews.length; i++) {
      if (![...this.changedFiles].some(file => file.includes(this.registeredDebuggingViews[i].url))) continue;
      if (!(await this.registeredDebuggingViews[i].callback())) {
        this.registeredDebuggingViews.splice(i, 1);
        i--;
      }
    }
    this.changedFiles = new Set();
  }

  async getDependencyTriplesForFile(url) {
    let result = [];
    for (const ae of DependenciesToAExprs.getAEsInFile(url)) {
      result = result.concat(this.getTripletsForAE(ae));
    }
    for (const hook of await this.getHooksInFile(url)) {
      for(const dependency of hook.getDependencies()) {
        for (const ae of DependenciesToAExprs.getAExprsForDep(dependency)) {
          const location = ae.meta().get("location").file;
          // if the AE is also in this file, we already covered it with the previous loop
          if (!location.includes(url)) {
            result.push({ hook, dependency: dependency.getKey(), ae });
          }
        }
      }
    }
    return result;
  }

  async getHooksInFile(url) {
    const allHooks = ContextAndIdentifierToDependencies.allValues().flatMap(dep => dep.getHooks());
    const hooksWithLocations = await Promise.all(allHooks.map(hook => {
      return hook.getLocations().then(locations => {
        return { hook, locations };
      });
    }));
    return hooksWithLocations.filter(({ hook, locations }) => {
      return locations.some(loc => loc && loc.file && loc.file.includes(url));
    }).map(({ hook, locations }) => hook);
  }

}

async function relatedFiles(dependencies, aexprs) {}

export const DebuggingCache = new AEDebuggingCache();

const DependenciesToAExprs = {
  _depsToAExprs: new BidirectionalMultiMap(),
  _AEsPerFile: new Map(),

  associate(dep, aexpr) {
    if(this._depsToAExprs.has(dep, aexpr)) return;
    const location = aexpr.meta().get("location");
    if (location && location.file) {
      DebuggingCache.updateFiles([location.file]);
      this._AEsPerFile.getOrCreate(location.file, () => new Set()).add(aexpr);
    } 
    this._depsToAExprs.associate(dep, aexpr);
    dep.updateTracking();

    // Track affected files
    for (const hook of dep.getHooks()) {
      hook.getLocations().then(locations => DebuggingCache.updateFiles(locations.map(loc => loc.file)));
    }
  },
  
  disassociate(dep, aexpr) {
    this._depsToAExprs.remove(dep, aexpr);
    dep.updateTracking();
    for (const hook of dep.getHooks()) {
      hook.getLocations().then(locations => DebuggingCache.updateFiles(locations.map(loc => loc.file)));
    }
    //TODO: Remove AE from assiciated file, if it was the last dependency?
  },

  disconnectAllForAExpr(aexpr) {
    const location = aexpr.meta().get("location");
    if (location && location.file) {
      DebuggingCache.updateFiles([location.file]);
      if (this._AEsPerFile.has(location.file)) {
        this._AEsPerFile.get(location.file).delete(aexpr);
      }
    }
    const deps = [...this.getDepsForAExpr(aexpr)];
    this._depsToAExprs.removeAllLeftFor(aexpr);
    deps.forEach(dep => {      
      dep.updateTracking()
    });
    if(deps.length > 0) {
      aexpr.logEvent('dependencies changed', { added: [], removed: deps.map(d => d.getKey()), matching: []});
    }

    // Track affected files
    for (const dep of deps) {
      for (const hook of dep.getHooks()) {
        hook.getLocations().then(locations => DebuggingCache.updateFiles(locations.map(loc => loc.file)));
      }
    }
  },

  getAEsInFile(url) {
    for (const [location, aes] of this._AEsPerFile.entries()) {
      if (location.includes(url)) return aes;
    }
    return [];
  },

  getAExprsForDep(dep) {
    if (!this._depsToAExprs.hasLeft(dep)) return [];
    return Array.from(this._depsToAExprs.getRightsFor(dep));
  },
  getDepsForAExpr(aexpr) {
    if (!this._depsToAExprs.hasRight(aexpr)) return [];
    return Array.from(this._depsToAExprs.getLeftsFor(aexpr));
  },

  hasAExprsForDep(dep) {
    return this.getAExprsForDep(dep).length >= 1;
  },
  hasDepsForAExpr(aexpr) {
    return this.getDepsForAExpr(aexpr).length >= 1;
  },

  /*
   * Removes all associations.
   */
  clear() {
    this._depsToAExprs.clear();
    this._depsToAExprs.getAllLeft().forEach(dep => dep.updateTracking());
  }
};

export class DependencyKey {
  constructor(context, identifier) {
    this.context = context;
    this.identifier = identifier;
  }
  
  getDependency() {    
    return ContextAndIdentifierToDependencies.get(this.context, this.identifier);
  }
  
  equals(other) {
    if(other.context === this.context) {
      // Handle weird edgecase to deal with array[0] being the same as array["0"]
      if(Array.isArray(this.context)) {
        if(typeof this.identifier !== typeof other.identifier) {
          if(typeof this.identifier === "string") {
            return this.identifier === (other.identifier + "");
          }
          if(typeof other.identifier === "string") {
            return other.identifier === (this.identifier + "");
          }
        }
      }
      return other.identifier === this.identifier;
    }
    return false;
  }
  
  getCurrentVersion() {
    if(!this.currentVersion) {
      return this;
    } else {
      this.currentVersion = this.currentVersion.getCurrentVersion();
    }
    return this.currentVersion;
  }
  
  getValue() {
    if(this.context instanceof Map) {
      return this.context.get(this.identifier);      
    } else if (this.context instanceof Set) {
      return [...this.context][this.identifer];
    } else {
      return this.context[this.identifier];
    }
  }
}

// 1. Two step map with (obj|scope) as primary key and (prop|name) as secondary key mapping to the dependencies
const ContextAndIdentifierToDependencies = new DualKeyMap();

//const ContextToIdentifier = new MultiMap();
//const IdentifierToDependency = new InjectiveMap();
// 1. (obj, prop) or (scope, name) -> ContextAndIdentifierCompositeKey
// - given via ContextAndIdentifierCompositeKey

// 2.1. ContextAndIdentifierCompositeKey 1<->1 Dependency
// - CompositeKeyToDependencies
//const CompositeKeyToDependencies = new InjectiveMap();
// 2.2. Dependency *<->* AExpr
// - DependenciesToAExprs

/** Source Code Hooks */
// 3.1. ContextAndIdentifierCompositeKey 1<->1 SourceCodeHook
// - CompositeKeyToSourceCodeHook
//const CompositeKeyToSourceCodeHook = new InjectiveMap();
// 3.2. SourceCodeHook *<->* Dependency
// - HooksToDependencies

/** Data Structure Hooks */
// 4.1 DataStructureHookByDataStructure
const DataStructureHookByDataStructure = new WeakMap(); // WeakMap<(Set/Array/Map), DataStructureHook>
/** Wrapping Hooks */
// 4.2 PropertyWrappingHookByProperty
const PropertyWrappingHookByProperty = new Map(); // Map<(String/Symbol), PropertyWrappingHook>
/** Mutation Observer Hooks */
// 4.3 DataStructureHookByDataStructure
const MutationObserverHookByHTMLElement = new WeakMap(); // WeakMap<HTMLElement, MutationObserverHook>
/** XXX */
// 4.4 XXX
const EventBasedHookByHTMLElement = new WeakMap(); // WeakMap<HTMLElement, EventBasedHook>

class Hook {
  constructor() {
    this.dependencies = new Set();
    this.installed = false;
    this.locations = [];
    this.locationPromises = new Set();
  }

  addLocation(location) {
    if (!location) return;
    const addToMember = (l) => {
      if (l && !this.locations.some(loc => _.isEqual(loc, l))) {
        this.locations.push(l);
      }
    };
    if(location.then) {
      this.locationPromises.add(location);
      location.then((resolved) => {
        this.locationPromises.delete(location);
        addToMember(resolved);
      });
    } else {
      addToMember(location);
    }
  }
  
  getDependencies() {
    return this.dependencies;
  }

  addDependency(dependency) {
    this.dependencies.add(dependency);
  }

  removeDependency(dependency) {
    this.dependencies.delete(dependency);
  }

  async getLocations() {
    await Promise.all(this.locationPromises);
    return this.locations;
  }

  informationString() {
    return "Generic Hook";
  }

  notifyDependencies(location) {
    const loc = location || TracingHandler.findRegistrationLocation();
    this.addLocation(loc);

    this.getLocations().then(locations => DebuggingCache.updateFiles(locations.map(loc => loc.file)));
    for(const dep of [...this.dependencies]) {
      for (const ae of DependenciesToAExprs.getAExprsForDep(dep)) {
        if (ae.meta().has("location")) {
          DebuggingCache.updateFiles([ae.meta().get("location").file]);
        }
      }      
      dep.notifyAExprs(loc, this);
    }
  }
}

class SourceCodeHook extends Hook {

  informationString() {
    return "SourceCodeHook: " + this.context + "." + this.identifier;
  }

  constructor(context, identifier) {
    super();

    this.context = context;
    this.identifier = identifier;
  }

  install() {}
  uninstall() {}
}

class DataStructureHook extends Hook {
  static getOrCreateForDataStructure(dataStructure) {
    return DataStructureHookByDataStructure.getOrCreate(dataStructure, () => new DataStructureHook(dataStructure));
  }
  constructor(dataStructure) {
    super();
    this.monitorProperties(dataStructure);

    // set.add = function add(...args) {
    //   const result = Set.prototype.add.call(this, ...args);
    //   hook.notifyDependencies();
    //   return result;
    // }
  }

  getPrototypeDescriptors(obj) {
    const proto = obj.constructor.prototype;

    const descriptors = Object.getOwnPropertyDescriptors(proto);
    return Object.entries(descriptors).map(([key, desc]) => (desc.key = key, desc));
  }

  wrapProperty(obj, descriptor, after) {
    Object.defineProperty(obj, descriptor.key, Object.assign({}, descriptor, {
      value(...args) {
        try {
          return descriptor.value.apply(this, args);
        } finally {
          after.call(this, ...args);
        }
      }
    }));
  }

  monitorProperties(obj) {
    const myself = this;
    const prototypeDescriptors = this.getPrototypeDescriptors(obj);
    Object.entries(Object.getOwnPropertyDescriptors(obj)); // unused -> need for array

    // the property constructor needs to be a constructor if called (as in cloneDeep in lodash);
    // We can also leave out functions that do not change the state
    const ignoredDescriptorKeys = new Set(["at", "get", "constructor", "concat", "entries", "every", "filter", "find", "findIndex", "forEach", "includes", "indexOf", "join", "keys", "lastIndexOf", "reduce", "reduceRight", "slice", "toString", "toLocaleString", "values"]);
    
    prototypeDescriptors
      .filter(descriptor => !ignoredDescriptorKeys.has(descriptor.key))
      .forEach(addDescriptor => {
      // var addDescriptor = prototypeDescriptors.find(d => d.key === 'add')
      if (addDescriptor.value) {
        if (isFunction(addDescriptor.value)) {
          this.wrapProperty(obj, addDescriptor, function () {
            // #HACK #TODO we need an `withoutLayer` equivalent here
            if (window.__compareAExprResults__) {
              return;
            }

            this; // references the modified container
            myself.notifyDependencies();
          });
        } else {
          // console.warn(`Property ${addDescriptor.key} has a value that is not a function, but ${addDescriptor.value}.`)
        }
      } else {
          // console.warn(`Property ${addDescriptor.key} has no value.`)
        }
    });
  }

  informationString() {
    return "DataStructureHook";
  }
}

class PropertyWrappingHook extends Hook {
  static getOrCreateForProperty(property) {
    return PropertyWrappingHookByProperty.getOrCreate(property, () => new PropertyWrappingHook(property));
  }

  constructor(property) {
    super();
    this.property = property;
    this.value = self[property];
    const { configurable, enumerable } = Object.getOwnPropertyDescriptor(self, property);

    // #TODO: keep old property accessors if present (otherwise, we do not interact with COP and ourselves, i.e. other property wrappers)
    Object.defineProperty(self, property, {
      configurable,
      enumerable,

      get: () => this.value,
      set: value => {
        const result = this.value = value;
        this.notifyDependencies();
        return result;
      }
    });
  }

  informationString() {
    return "PropertyWrappingHook: " + this.property;
  }
}

class MutationObserverHook extends Hook {
  static getOrCreateForElement(element) {
    return MutationObserverHookByHTMLElement.getOrCreate(element, () => new MutationObserverHook(element));
  }
  constructor(element) {
    super();

    this._element = element;

    const o = new MutationObserver((mutations, observer) => {
      // const mutationRecords = o.takeRecords();
      // lively.notify(`mutation on ${this._element.tagName}; ${mutations
      //               .filter(m => m.type === "attributes")
      //               .map(m => m.attributeName).join(', ')}.`)
      this.changeHappened();
      // mutations.forEach(mutation => {
      //   if(mutation.type == "attributes") {
      //     lively.notify(
      //       `${mutation.oldValue} -> ${mutation.target.getAttribute(mutation.attributeName)}`,
      //       `attribute: ${mutation.attributeName}`
      //     );
      //   }
      //   if(mutation.type == "characterData") {
      //     lively.notify(
      //       `${mutation.oldValue}}`,
      //       `characterData`
      //     );
      //   }
      //   if(mutation.type == "childList") {
      //     lively.success(
      //       `${mutation.addedNodes.length} added, ${mutation.removedNodes.length} removed`,
      //       `childList`
      //     );
      //   }
      // });
    });

    o.observe(this._element, {
      attributes: true,
      attributeFilter: undefined,
      attributeOldValue: true,

      characterData: true,
      characterDataOldValue: true,

      childList: true,

      subtree: true
    });

    // o.disconnect();
  }

  changeHappened() {
    this.notifyDependencies();
  }

  informationString() {
    return "MutationObserverHook: " + this._element;
  }
}

class EventBasedHook extends Hook {
  static getOrCreateForElement(element) {
    return EventBasedHookByHTMLElement.getOrCreate(element, () => new EventBasedHook(element));
  }
  
  constructor(element) {
    super();

    this._element = element;

    // #TODO: when the type of an input element changes, 'value' or 'checked' become unavailable
    if (this._element.tagName === 'INPUT' || this._element.tagName === 'TEXTAREA') {
      this._element.addEventListener('input', () => {
        this.changeHappened();
      });
    } else if (this._element.tagName === 'LIVELY-CODE-MIRROR') {
      this._element.editor.on('changes', () => {
        this.changeHappened();
      });
    }
  }

  changeHappened() {
    this.notifyDependencies();
  }

  informationString() {
    return "EventBasedHook: " + this._element;
  }
}

class FrameBasedHook extends Hook {
  static get instance() {
    if (!this._instance) {
      this._instance = new FrameBasedHook();
      //Initialization is split to avoid endless recursion
      this._instance.initializeAe();
    }
    return this._instance;
  }

  initializeAe() {
    let x = 0;
    // #TODO: caution, we currently use a side-effect function! How can we mitigate this? E.g. using `Date.now()` as expression
    let ae = frameBasedAExpr.aexpr(() => x++);
    ae.isMeta(true);
    ae.onChange(() => {
      this.changeHappened();
    });
  }

  changeHappened() {
    this.notifyDependencies();
  }

  informationString() {
    return "FrameBasedHook";
  }
}

export class RewritingActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.meta({ strategy: 'Rewriting' });
    this.updateDependencies();
  }

  dispose() {
    DependencyManager.disconnectAllFor(this);
    super.dispose();
  }

  // #TODO: why is this defined here, and not in the superclass?
  asAExpr() {
    return this;
  }

  updateDependencies() {
    if (this.isDisabled()) {
      return;
    }

    ExpressionAnalysis.recalculateDependencies(this);
  }
  supportsDependencies() {
    return true;
  }

  dependencies() {
    return new DependencyAPI(this);
  }
  
  getDataBindingDependencyKey() {
    if(!this.isDataBinding()) return undefined;
    
    if(!this.dataBindingDependencyKey) {
      const context = this.meta().get('dataBindingContext');
      const identifier = this.meta().get('dataBindingIdentifier');
      this.dataBindingDependencyKey = new DependencyKey(context, identifier);
    }
    return this.dataBindingDependencyKey;
  }

  sharedDependenciesWith(otherAExpr) {
    const ownDependencies = this.dependencies().all();
    const otherDependencies = otherAExpr.dependencies().all();
    const [own, shared, other] = ownDependencies.computeDiff(otherDependencies);
    return shared;
  }
}

class DependencyAPI {
  constructor(aexpr) {
    this._aexpr = aexpr;
  }

  getDependencies() {
    return DependenciesToAExprs.getDepsForAExpr(this._aexpr);
  }

  all() {
    return Array.from(this.getDependencies());
  }

  locals() {
    return this.getDependencies().filter(dependency => dependency.isLocalDependency()).map(dependency => dependency.getAsDependencyDescription());
  }

  members() {
    return this.getDependencies().filter(dependency => dependency.isMemberDependency()).map(dependency => dependency.getAsDependencyDescription());
  }

  globals() {
    return this.getDependencies().filter(dependency => dependency.isGlobalDependency()).map(dependency => dependency.getAsDependencyDescription());
  }
}

export function aexpr(func, ...args) {
  return new RewritingActiveExpression(func, ...args);
}

const globalRef = typeof window !== "undefined" ? window : // browser tab
typeof self !== "undefined" ? self : // web worker
global; // node.js

class DependencyManager {
  // #TODO, #REFACTOR: extract into own method; remove from this class
  static disconnectAllFor(aexpr) {
    DependenciesToAExprs.disconnectAllForAExpr(aexpr);
  }

  // #TODO, #REFACTOR: extract into configurable dispatcher class
  static checkAndNotifyAExprs(aexprs, location, dependency, hook) {
    aexprs.forEach(aexpr => {
      if(new Set(AExprRegistry.evaluationStack()).has(aexpr)) return;
      aexpr.updateDependencies();
      aexpr.checkAndNotify(location, dependency.getKey(), hook);
    });
  }

  /**
   * **************************************************************
   * ********************** associate *****************************
   * **************************************************************
   */
  static associateMember(obj, prop) {
    const dependency = Dependency.getOrCreateFor(obj, prop, 'member');
    ExpressionAnalysis.associateDependency(dependency);
  }

  static associateGlobal(globalName) {
    const dependency = Dependency.getOrCreateFor(globalRef, globalName, 'member');
    ExpressionAnalysis.associateDependency(dependency);
  }

  static associateLocal(scope, varName) {
    const dependency = Dependency.getOrCreateFor(scope, varName, 'local');
    ExpressionAnalysis.associateDependency(dependency);
  }

}

class TracingHandler {

  /**
   * **************************************************************
   * ********************** update ********************************
   * **************************************************************
   */
  static memberUpdated(obj, prop, location) {
    const dependency = ContextAndIdentifierToDependencies.get(obj, prop);
    if (!dependency || !dependency.sourceCodeHook) return;
    dependency.sourceCodeHook.notifyDependencies(location);
  }

  static globalUpdated(globalName, location) {
    const dependency = ContextAndIdentifierToDependencies.get(globalRef, globalName);
    if (!dependency || !dependency.sourceCodeHook) return;
    dependency.sourceCodeHook.notifyDependencies(location);
  }

  static localUpdated(scope, varName, location) {
    const dependency = ContextAndIdentifierToDependencies.get(scope, varName);
    if (!dependency || !dependency.sourceCodeHook) return;
    dependency.sourceCodeHook.notifyDependencies(location);
  }

  static async findRegistrationLocation() {
    if (lively === undefined) return undefined;
    const stack = lively.stack();
    const frames = stack.frames;

    for (let frame of frames.slice()) {
      if (!frame.file.includes("active-expression")) {
        return await frame.getSourceLocBabelStyle();
      }
    }

    const notificationFrame = frames.findIndex(frame => frame.func.includes(".notifyDependencies"));
    if(notificationFrame >= 0 && notificationFrame < frames.length - 1) {      
      return await frames[notificationFrame + 1].getSourceLocBabelStyle();
    }
    console.log(stack);
    return undefined;
  }

}

/*
 * Disconnects all associations between active expressions and object properties
 * As a result no currently enable active expression will be notified again,
 * effectively removing them from the system.
 *
 * #TODO: Caution, this might break with some semantics, if we still have references to an aexpr!
 */
export function reset() {
  ContextAndIdentifierToDependencies.clear();
  DependenciesToAExprs.clear();
}

/*MD # Source Code Point Cuts MD*/
/**
 * (C)RUD for member attributes
 */
export function traceMember(obj, prop) {
  if (expressionAnalysisMode) {
    DependencyManager.associateMember(obj, prop);
  }
}

export function getMember(obj, prop) {
  if (expressionAnalysisMode) {
    DependencyManager.associateMember(obj, prop);
  }
  const result = obj[prop];
  return result;
}

export function getAndCallMember(obj, prop, args = []) {
  if (expressionAnalysisMode) {
    DependencyManager.associateMember(obj, prop);
  }
  const result = obj[prop](...args);
  return result;
}

export function setMember(obj, prop, val, location) {
  const result = obj[prop] = val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberAddition(obj, prop, val, location) {
  const result = obj[prop] += val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberSubtraction(obj, prop, val, location) {
  const result = obj[prop] -= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberMultiplication(obj, prop, val, location) {
  const result = obj[prop] *= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberDivision(obj, prop, val, location) {
  const result = obj[prop] /= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberRemainder(obj, prop, val, location) {
  const result = obj[prop] %= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberExponentiation(obj, prop, val, location) {
  const result = obj[prop] **= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberLeftShift(obj, prop, val, location) {
  const result = obj[prop] <<= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberRightShift(obj, prop, val, location) {
  const result = obj[prop] >>= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberUnsignedRightShift(obj, prop, val, location) {
  const result = obj[prop] >>>= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberBitwiseAND(obj, prop, val, location) {
  const result = obj[prop] &= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberBitwiseXOR(obj, prop, val, location) {
  const result = obj[prop] ^= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function setMemberBitwiseOR(obj, prop, val, location) {
  const result = obj[prop] |= val;
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function deleteMember(obj, prop, location) {
  const result = delete obj[prop];
  TracingHandler.memberUpdated(obj, prop, location);
  return result;
}

export function getLocal(scope, varName, value) {
  if (expressionAnalysisMode) {
    scope[varName] = value;
    DependencyManager.associateLocal(scope, varName);
  }
}

export function setLocal(scope, varName, value, location) {
  scope[varName] = value;
  TracingHandler.localUpdated(scope, varName, location);
}

export function getGlobal(globalName) {
  if (expressionAnalysisMode) {
    DependencyManager.associateGlobal(globalName);
  }
}

export function setGlobal(globalName, location) {
  TracingHandler.globalUpdated(globalName, location);
}

export default aexpr;