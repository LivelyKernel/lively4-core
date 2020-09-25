import 'lang';

/*HTML 
<img src="https://lively-kernel.org/lively4/lively4-core/media/lively4_logo_smooth_100.png"></img>'s Implementation of AExprs
HTML*/

import { BaseActiveExpression } from 'active-expression';
import * as frameBasedAExpr from "active-expression-frame-based";

import Stack from 'src/client/reactive/utils/stack.js';
import CompositeKey from './composite-key.js';
import InjectiveMap from './injective-map.js';
import BidirectionalMultiMap from './bidirectional-multi-map.js';
import { using, isFunction } from 'utils';
/*MD # Dependency Analysis MD*/
let expressionAnalysisMode = false;
window.__expressionAnalysisMode__ = false;

const analysisModeManager = {
  __enter__() {
    expressionAnalysisMode = true;
    window.__expressionAnalysisMode__ = expressionAnalysisMode;
  },
  __exit__() {
    expressionAnalysisMode = !!aexprStack.top();
    window.__expressionAnalysisMode__ = expressionAnalysisMode;
  }
}
class ExpressionAnalysis {
  
  static recalculateDependencies(aexpr) {
    // #TODO: compute diff of Dependencies
    DependencyManager.disconnectAllFor(aexpr);
    this.check(aexpr);
  }
  
  static check(aexpr) {
    using([analysisModeManager], () => {
      // Do the function execution in ExpressionAnalysisMode
      aexprStack.withElement(aexpr, () => {
        const { value, isError } = aexpr.evaluateToCurrentValue();
      });
    });
  }

}

class Dependency {
  static getOrCreateFor(context, identifier, type) {
    const key = ContextAndIdentifierCompositeKey.for(context, identifier);
    return CompositeKeyToDependencies.getOrCreateRightFor(key, () => new Dependency(context, identifier, type));
  }

  // #TODO: compute and cache isGlobal
  constructor(context, identifier, type) {
    this._type = type;
    
    this.isTracked = false;
  }

  updateTracking() {
    if (this.isTracked === DependenciesToAExprs.hasAExprsForDep(this)) { return; }
    if (this.isTracked) {
      this.untrack();
    } else {
      this.track();
    }
  }

  track() {
    this.isTracked = true;

    const [context, identifier, value] = this.contextIdentifierValue();
    const isGlobal = this.isGlobalDependency();

    /*HTML <span style="font-weight: bold;">Source Code Hook</span>: for anything <span style="color: green; font-weight: bold;">members or locals</span> HTML*/
    // always employ the source code hook
    this.associateWithHook(SourceCodeHook.getOrCreateFor(context, identifier));

    /*HTML <span style="font-weight: bold;">Data Structure Hook</span>: for <span style="color: green; font-weight: bold;">Sets, Arrays, Maps</span> HTML*/
    var dataStructure;
    if (this._type === 'member') {
      dataStructure = context;
    } else if(this._type === 'local') {
      dataStructure = value;
    }
    if (dataStructure instanceof Array || dataStructure instanceof Set || dataStructure instanceof Map) {
      const dataHook = DataStructureHookByDataStructure.getOrCreate(dataStructure, dataStructure => DataStructureHook.forStructure(dataStructure));
      this.associateWithHook(dataHook);
    }

    /*HTML <span style="font-weight: bold;">Wrapping Hook</span>: only for <span style="color: green; font-weight: bold;">"that"</span> HTML*/
    if (isGlobal && identifier === 'that') {
      const wrappingHook = PropertyWrappingHook.getOrCreateForProperty(identifier);
      this.associateWithHook(wrappingHook);
    }

    /*HTML <span style="font-weight: bold;">Mutation Observer Hook</span>: handling <span style="color: green; font-weight: bold;">HTMLElements</span> HTML*/
    if (this._type === 'member' && context instanceof HTMLElement) {
      // #HACK #TODO: for now, ignore Knotview if unused for Mutations -> need to better separate those hooks, e.g. do not recursively check ALL attribute change, etc.
      if (!(context.tagName === 'KNOT-VIEW' && (identifier === 'knot' || identifier === 'knotLabel')) && !context.tagName.endsWith('-rp19')) {
        // TODO: the member also influences what kind of observer we want to use!
        const mutationObserverHook = MutationObserverHook.getOrCreateForElement(context);
        this.associateWithHook(mutationObserverHook);
      }
    }

    /*HTML <span style="font-weight: bold;">Event-based Change Hook</span>: handling <span style="color: green; font-weight: bold;">HTMLElements</span> HTML*/
    if (this._type === 'member' && context instanceof HTMLElement) {
      const eventBasedHook = EventBasedHook.getOrCreateForElement(context);
      // #TODO: we have to acknowledge that different properties require different events to listen on
      //  e.g. code-mirror might have 'value' (so need to listen for 'change') or 'getCursor' (so need to listen for 'cursorActivity')
      // eventBasedHook.listenFor(identifier);
      this.associateWithHook(eventBasedHook);
    }

    /*HTML <span style="font-weight: bold;">Frame-based Change Hook</span>: handling <span style="color: green; font-weight: bold;">Date</span> HTML*/
// -    if ((this._type === 'member' && context === Date && identifier === 'now') ||
    if (isGlobal && identifier === 'Date') {
      this.associateWithHook(FrameBasedHook.instance);
    }
  }

  associateWithHook(hook) {
    HooksToDependencies.associate(hook, this);
  }

  untrack() {
    this.isTracked = false;
    HooksToDependencies.disconnectAllForDependency(this);
  }

  contextIdentifierValue() {
    const compKey = CompositeKeyToDependencies.getLeftFor(this);
    
    const [context, identifier] = ContextAndIdentifierCompositeKey.keysFor(compKey);
    const value = context !== undefined ? context[identifier] : undefined;
    
    return [context, identifier, value];
  }

  notifyAExprs() {
    const aexprs = DependenciesToAExprs.getAExprsForDep(this);
    DependencyManager.checkAndNotifyAExprs(aexprs);
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
    const compKey = CompositeKeyToDependencies.getLeftFor(this);
    if (!compKey) {
      return false;
    }
    const [object] = ContextAndIdentifierCompositeKey.keysFor(compKey);
    return object === self;
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

const DependenciesToAExprs = {
  _depsToAExprs: new BidirectionalMultiMap(),

  associate(dep, aexpr) {
    this._depsToAExprs.associate(dep, aexpr);
    dep.updateTracking();
  },

  disconnectAllForAExpr(aexpr) {
    const deps = this.getDepsForAExpr(aexpr);
    this._depsToAExprs.removeAllLeftFor(aexpr);
    deps.forEach(dep => dep.updateTracking());
  },

  getAExprsForDep(dep) {
    return Array.from(this._depsToAExprs.getRightsFor(dep));
  },
  getDepsForAExpr(aexpr) {
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
    this._depsToAExprs.getAllLeft()
      .forEach(dep => dep.updateTracking());
  }
};

const HooksToDependencies = {
  _hooksToDeps: new BidirectionalMultiMap(),
  
  associate(hook, dep) {
    this._hooksToDeps.associate(hook, dep);
  },
  remove(hook, dep) {
    this._hooksToDeps.remove(hook, dep);
  },
  
  disconnectAllForDependency(dep) {
    this._hooksToDeps.removeAllLeftFor(dep);
  },
  
  getDepsForHook(hook) {
    return Array.from(this._hooksToDeps.getRightsFor(hook));
  },
  getHooksForDep(dep) {
    return Array.from(this._hooksToDeps.getLeftsFor(dep));
  },
  
  hasDepsForHook(hook) {
    return this.getDepsForHook(hook).length >= 1;
  },
  hasHooksForDep(dep) {
    return this.getHooksForDep(dep).length >= 1;
  },
  
  /*
   * Removes all associations.
   */
  clear() {
    this._hooksToDeps.clear();
  }
};

// 1. (obj, prop) or (scope, name) -> ContextAndIdentifierCompositeKey
// - given via ContextAndIdentifierCompositeKey
const ContextAndIdentifierCompositeKey = new CompositeKey();

// 2.1. ContextAndIdentifierCompositeKey 1<->1 Dependency
// - CompositeKeyToDependencies
const CompositeKeyToDependencies = new InjectiveMap();
// 2.2. Dependency *<->* AExpr
// - DependenciesToAExprs

/** Source Code Hooks */
// 3.1. ContextAndIdentifierCompositeKey 1<->1 SourceCodeHook
// - CompositeKeyToSourceCodeHook
const CompositeKeyToSourceCodeHook = new InjectiveMap();
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
    this.installed = false;
  }
  
  notifyDependencies() {
    HooksToDependencies.getDepsForHook(this).forEach(dep => dep.notifyAExprs())
  }
}

class SourceCodeHook extends Hook {
  static getOrCreateFor(context, identifier) {
    const compKey = ContextAndIdentifierCompositeKey.for(context, identifier);
    return CompositeKeyToSourceCodeHook.getOrCreateRightFor(compKey, key => new SourceCodeHook());
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
  static forStructure(dataStructure) {
    const hook = new DataStructureHook();
    
    function getPrototypeDescriptors(obj) {
      const proto = obj.constructor.prototype;

      const descriptors = Object.getOwnPropertyDescriptors(proto);
      return Object.entries(descriptors).map(([key, desc]) => (desc.key = key, desc))
    }

    function wrapProperty(obj, descriptor, after) {
      Object.defineProperty(obj, descriptor.key, Object.assign({}, descriptor, {
        value(...args) {
          try {
            return descriptor.value.apply(this, args);
          } finally {
            after.call(this, ...args)
          }
        }
      }));
    }

    function monitorProperties(obj) {
      const prototypeDescriptors = getPrototypeDescriptors(obj);
      Object.entries(Object.getOwnPropertyDescriptors(obj)); // unused -> need for array

      prototypeDescriptors
        .filter(descriptor => descriptor.key !== 'constructor') // the property constructor needs to be a constructor if called (as in cloneDeep in lodash); We leave it out explicitly as the constructor does not change any state #TODO
        .forEach(addDescriptor => {
          // var addDescriptor = prototypeDescriptors.find(d => d.key === 'add')
          if (addDescriptor.value) {
            if (isFunction(addDescriptor.value)) {
              wrapProperty(obj, addDescriptor, function() {
                // #HACK #TODO we need an `withoutLayer` equivalent here
                if (window.__compareAExprResults__) { return; }

                this; // references the modified container
                hook.notifyDependencies();
              });
            } else {
              // console.warn(`Property ${addDescriptor.key} has a value that is not a function, but ${addDescriptor.value}.`)
            }
          } else {
            // console.warn(`Property ${addDescriptor.key} has no value.`)
          }
        });
    }

    monitorProperties(dataStructure);
    
    // set.add = function add(...args) {
    //   const result = Set.prototype.add.call(this, ...args);
    //   hook.notifyDependencies();
    //   return result;
    // }
    return hook;
  }
}

class PropertyWrappingHook extends Hook {
  static getOrCreateForProperty(property) {
    return PropertyWrappingHookByProperty.getOrCreate(property, () => new PropertyWrappingHook(property));
  }
  
  constructor(property) {
    super();

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

      subtree: true,
    });
    
    // o.disconnect();
  }

  changeHappened() {
    this.notifyDependencies();
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
}

class FrameBasedHook extends Hook {
  static get instance() {
    if(!this._instance) {
      this._instance = new FrameBasedHook();
      //Initialization is split to avoid endless recursion
      this._instance.initializeAe();
    }
    return this._instance;
  }
  
  initializeAe() {
    let x = 0;
    // #TODO: caution, we currently use a side-effect function! How can we mitigate this? E.g. using `Date.now()` as expression
    let ae = frameBasedAExpr.aexpr(() => x++)
    ae.isMeta(true);
    ae.onChange(() => {
      this.changeHappened();
    })
  }
  
  changeHappened() {
    this.notifyDependencies();
  }
}


const aexprStack = new Stack();

export class RewritingActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.meta({ strategy: 'Rewriting' });
    ExpressionAnalysis.recalculateDependencies(this);

    if (new.target === RewritingActiveExpression) {
      this.addToRegistry();
    }
  }

  dispose() {
    super.dispose();
    DependencyManager.disconnectAllFor(this);
  }
  
  asAExpr() {
    return this;
  }

  supportsDependencies() {
    return true;
  }

  dependencies() {
    return new DependencyAPI(this);
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
    return this.getDependencies()
      .filter(dependency => dependency.isLocalDependency())
      .map(dependency => dependency.getAsDependencyDescription());
  }

  members() {
    return this.getDependencies()
      .filter(dependency => dependency.isMemberDependency())
      .map(dependency => dependency.getAsDependencyDescription());
  }

  globals() {
    return this.getDependencies()
      .filter(dependency => dependency.isGlobalDependency())
      .map(dependency => dependency.getAsDependencyDescription());
  }
}

export function aexpr(func, ...args) {
  return new RewritingActiveExpression(func, ...args);
}

const globalRef = typeof window !== "undefined" ? window : // browser tab
  (typeof self !== "undefined" ? self : // web worker
    global); // node.js

class DependencyManager {
  static get currentAExpr() {
    return aexprStack.top();
  }
  
  // #TODO, #REFACTOR: extract into own method; remove from this class
  static disconnectAllFor(aexpr) {
    DependenciesToAExprs.disconnectAllForAExpr(aexpr);
  }

  // #TODO, #REFACTOR: extract into configurable dispatcher class
  static checkAndNotifyAExprs(aexprs) {
    aexprs.forEach(aexpr => {
      ExpressionAnalysis.recalculateDependencies(aexpr);
    });
    aexprs.forEach(aexpr => aexpr.checkAndNotify());
  }

  /**
   * **************************************************************
   * ********************** associate *****************************
   * **************************************************************
   */
  static associateMember(obj, prop) {
    const dependency = Dependency.getOrCreateFor(obj, prop, 'member');
    DependenciesToAExprs.associate(dependency, this.currentAExpr);
  }

  static associateGlobal(globalName) {
    const dependency = Dependency.getOrCreateFor(globalRef, globalName, 'member');
    DependenciesToAExprs.associate(dependency, this.currentAExpr);
  }

  static associateLocal(scope, varName) {
    const dependency = Dependency.getOrCreateFor(scope, varName, 'local');
    DependenciesToAExprs.associate(dependency, this.currentAExpr);
  }

}

class TracingHandler {

  /**
   * **************************************************************
   * ********************** update ********************************
   * **************************************************************
   */
  static memberUpdated(obj, prop) {
    SourceCodeHook.getOrCreateFor(obj, prop).notifyDependencies();
  }

  static globalUpdated(globalName) {
    SourceCodeHook.getOrCreateFor(globalRef, globalName).notifyDependencies();
  }

  static localUpdated(scope, varName) {
    SourceCodeHook.getOrCreateFor(scope, varName).notifyDependencies();
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
  ContextAndIdentifierCompositeKey.clear();

  CompositeKeyToDependencies.clear();
  DependenciesToAExprs.clear();

  CompositeKeyToSourceCodeHook.clear();
  HooksToDependencies.clear();
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

export function setMember(obj, prop, val) {
  const result = obj[prop] = val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberAddition(obj, prop, val) {
  const result = obj[prop] += val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberSubtraction(obj, prop, val) {
  const result = obj[prop] -= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberMultiplication(obj, prop, val) {
  const result = obj[prop] *= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberDivision(obj, prop, val) {
  const result = obj[prop] /= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberRemainder(obj, prop, val) {
  const result = obj[prop] %= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberExponentiation(obj, prop, val) {
  const result = obj[prop] **= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberLeftShift(obj, prop, val) {
  const result = obj[prop] <<= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberRightShift(obj, prop, val) {
  const result = obj[prop] >>= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberUnsignedRightShift(obj, prop, val) {
  const result = obj[prop] >>>= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberBitwiseAND(obj, prop, val) {
  const result = obj[prop] &= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberBitwiseXOR(obj, prop, val) {
  const result = obj[prop] ^= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function setMemberBitwiseOR(obj, prop, val) {
  const result = obj[prop] |= val;
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function deleteMember(obj, prop) {
  const result = delete obj[prop];
  TracingHandler.memberUpdated(obj, prop);
  return result;
}

export function getLocal(scope, varName, value) {
  if (expressionAnalysisMode) {
    scope[varName] = value;
    DependencyManager.associateLocal(scope, varName);
  }
}

export function setLocal(scope, varName, value) {
  scope[varName] = value;
  TracingHandler.localUpdated(scope, varName);
}

export function getGlobal(globalName) {
  if (expressionAnalysisMode) {
    DependencyManager.associateGlobal(globalName);
  }
}

export function setGlobal(globalName) {
  TracingHandler.globalUpdated(globalName);
}

export default aexpr;
