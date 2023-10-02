"disable deepeval"

/**
 * All lodash utility functions with this reference bound as first parameter
 * @example <caption>Example using lodash bound.</caption>
 * import {through, last}from "utils"
 * 
 * document.body.querySelectorAll('lively-window')::last(); // return last selected window
 */
export * from './lodash-bound.js';

export function executeAllTestRunners() {
  document.querySelectorAll('lively-testrunner').forEach(runner => runner.onRunButton());
}

export function promisedEvent(eventTarget, type) {
  if (!type || !eventTarget) throw new Error("arguments missing");
  return new Promise(resolve => eventTarget.addEventListener(type, resolve));
}

// #TODO: make this more robust to urlStrings that do not contain a filename, e.g.
// "https://goole.com"::fileName() should not "goole.com"
export function fileName() {
  return this.replace(/.*\//, "");
}

// Example usage: "path/to/a.json"::fileEnding() returns "json"
// #TODO: make this more robust to strings that do not contain a file ending
export function fileEnding() {
  return this.replace(/.*\./, "");
}

// Example usage: "path/to/a.json"::replaceFileEndingWith("xml") returns "path/to/a.xml"
// #TODO: make this more robust to strings that do not contain a file ending
export function replaceFileEndingWith(newEnding) {
  return this.replace(/[^\.]+$/, newEnding);
}

// 2, "egg" -> "2 eggs" | 1, "egg" -> "1 egg" | 2, "life", "lives" -> "2 lives"
export function pluralize(count, name, pluralForm = undefined) {
  if(count == 1) return count + " " + name;
  return count + " " + (pluralForm || (name + "s"));
}

export class PausableLoop {
  constructor(func) {
    this.func = func;
    this.cancelID;
    this.running = false;
  }

  ensureRunning() {
    if (!this.running) {
      this.running = true;

      const loopBody = () => {
        this.func();
        if (this.running) {
          this.cancelID = requestAnimationFrame(loopBody);
        }
      };

      this.cancelID = requestAnimationFrame(loopBody);
    }
  }

  pause() {
    cancelAnimationFrame(this.cancelID);
    this.running = false;
  }
}

export function hintForLabel(label) {
  return <div style="\n    margin: 0.5px 0px;\n    font-size: x-small;\n    background-color: lightgray;\n    border: 1px solid gray;\n    border-radius: 2px;\n    max-width: fit-content;\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n  ">
    {label}
  </div>;
}

// #TODO: chrome does not support dataTransfer.addElement :(
// e.g. dt.addElement(<h1>drop me</h1>);
// Therefore, we have to perform this hack stolen from:
// https://stackoverflow.com/questions/12766103/html5-drag-and-drop-events-and-setdragimage-browser-support
export function asDragImageFor(evt, offsetX = 0, offsetY = 0) {
  const clone = this.cloneNode(true);
  document.body.appendChild(clone);
  clone.style["z-index"] = "10000000";
  clone.style.top = Math.max(0, evt.clientY - offsetY) + "px";
  clone.style.left = Math.max(0, evt.clientX - offsetX) + "px";
  clone.style.position = "absolute";
  clone.style.pointerEvents = "none";

  setTimeout(::clone.remove);
  evt.dataTransfer.setDragImage(clone, offsetX, offsetY);
}

export function listAsDragImage(labels, evt, offsetX, offsetY) {
  const hints = labels.map(textualRepresentation).map(hintForLabel);
  const hintLength = hints.length;
  const maxLength = 5;
  if (hints.length > maxLength) {
    hints.length = maxLength;
    hints.push(hintForLabel(`+ ${hintLength - maxLength} more.`));
  }
  const dragInfo = <div style="width: 151px;">
    {...hints}
  </div>;
  dragInfo::asDragImageFor(evt, offsetX, offsetY);
}

const TEMP_OBJECT_STORAGE = new Map();
export function getTempKeyFor(obj) {
  const tempKey = uuid();
  TEMP_OBJECT_STORAGE.set(tempKey, obj);

  // safety net: remove the key in 10 minutes
  setTimeout(() => removeTempKey(tempKey), 10 * 60 * 1000);

  return tempKey;
}
export function getObjectFor(tempKey) {
  return TEMP_OBJECT_STORAGE.get(tempKey);
}
export function removeTempKey(tempKey) {
  TEMP_OBJECT_STORAGE.delete(tempKey);
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

/**
 * Taken from and modified using:
 * https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
 */
export function copyTextToClipboard(text) {
  const textArea = document.createElement("textarea");

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a flash,
  // so some of these are just precautions. However in IE the element
  // is visible whilst the popup box asking the user for permission for
  // the web page to copy to the clipboard.
  //

  Object.assign(textArea.style, {
    // Place in top-left corner of screen regardless of scroll position.
    position: 'fixed',
    top: 0,
    left: 0,

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    width: '2em',
    height: '2em',

    // We don't need padding, reducing the size if it does flash render.
    padding: 0,

    // Clean up any borders.
    border: 'none',
    outline: 'none',
    boxShadow: 'none',

    // Avoid flash of white box if rendered for any reason.
    background: 'transparent'
  });

  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  let supported;
  try {
    supported = document.queryCommandSupported('copy');
  } catch (err) {
    lively.warn('Copy to clipboard not supported.', err);
    supported = false;
  }
  if (supported) {
    let enabled;
    try {
      enabled = document.queryCommandEnabled('copy');
    } catch (err) {
      lively.warn('Copy to clipboard not enabled.', err);
      enabled = false;
    }
    if (enabled) {
      try {
        if (!document.execCommand('copy')) {
          lively.warn('Copying not successful.');
        }
      } catch (err) {
        lively.warn('Unable to execute copy.');
      }
    }
  }

  document.body.removeChild(textArea);
}

export function functionMetaInfo(functionToCheck) {
  if (functionToCheck === undefined) {
    return {
      isFunction: false,
      isAsync: false,
      isGenerator: false
    };
  }

  const description = {}.toString.call(functionToCheck);
  return {
    isFunction: !!description.match(/\[object (Async)?(Generator)?Function\]/),
    isAsync: !!description.match(/\[object Async(Generator)?Function\]/),
    isGenerator: !!description.match(/\[object (Async)?GeneratorFunction\]/)
  };
}

// #TODO #Issue #Babel7 "export * ..." overwrites this, which worked in babel6, weird behavior 
// taken from https://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
export function isFunction(functionToCheck) {
  if (functionToCheck === undefined) {
    return false;
  }
  let isFunc = {}.toString.call(functionToCheck) === '[object Function]';
  let isAsyncFunc = {}.toString.call(functionToCheck) === '[object AsyncFunction]';
  return isFunc || isAsyncFunc;
}

// #HACK see above
export function isFunctionALT(functionToCheck) {
  return isFunction(functionToCheck)
}


export function cancelEvent(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}

export function textualRepresentation(thing) {
  // primitive falsy value?
  if (!thing) {
    return '' + thing;
  }

  // toString method different from Object?
  if (thing.toString && thing.toString !== Object.prototype.toString) {
    return thing.toString();
  }

  // instance of a named class?
  if (thing.constructor && thing.constructor.name) {
    return 'a ' + thing.constructor.name;
  }

  return 'unprintable object';
}

export function getDeepProperty(obj, pathString) {
  var path = pathString.split(".");
  var next;
  var result = obj;
  while (next = path.shift()) {
    var nextResult = result[next];
    if (!nextResult) return; // could not resolve path
    result = nextResult;
  }
  return result;
}

/*
 * waits for the deep construction of a data structure // object
 * 
 */
export async function waitForDeepProperty(obj, pathString, timeout = 60000 /* one minuete */, step = 10) {
  var path = pathString.split(".");
  var next;
  var result = obj;
  var nextResult;
  while (next = path.shift()) {
    nextResult = result[next];
    while (!nextResult) {
      await wait(step // busy waiting...
      );nextResult = result[next];
    }
    // if (!nextResult) return // could not resolve path
    result = nextResult;
    // console.log("next result " + next + " = " + result )
  }
  return result;
}

// https://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
export function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class CallableObject {}
// #TODO: implement this


/**
 * Executes the given function considering the given context objects.
 * @param {Array<ContextManager>} contexts
 * @param {function} callback
 * @return {Object} result - The callback's evaluation result.
 *
 * @class ContextManager
 * @classdesc Used to specify the setup and teardown of the function call.
 * @method {__enter__} enter callback - called before the function call. Put setup code here.
 * @method {__exit__} exit callback - called after the funciton call. Put teardown code here.

 * @example <caption>Poor mans COP.</caption>
 * import { using }from "utils";
 * 
 * const silentFetch = {
 *   __enter__() {
 *     this.originalFetch = window.fetch;
 *     window.fetch = () => {};
 *   }
 *   __exit__() {
 *     window.fetch = this.originalFetch; // restore the original fetch 
 *   }
 * }
 *
 * using([silentFetch], () => {
 *   lively.notify(fetch('https://lively-kernel.org/lively4/')) // logs nothing
 * });
 */
export function using(contextManagerIterable, callback) {
  let result;
  let error;
  const contextManagers = Array.from(contextManagerIterable);

  contextManagers.forEach(cm => cm.__enter__());
  try {
    result = callback();
  } catch (e) {
    error = e;
  } finally {
    contextManagers.reverse().forEach(cm => cm.__exit__(error));
  }
  if (error !== undefined) {
    throw error;
  }
  return result;
}

/**
 * Get notified, whenever the style attribute of given target changes
 */
export function onStyleChange(target, callback) {
  const styleObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type == "attributes" && mutation.attributeName == "style") {
        callback();
      }
    });
  });
  styleObserver.observe(target, { attributes: true });

  return styleObserver;
}

/**
 * shakes given element using css transformations
 */
export function shake(target) {
  target.animate([{ transform: 'translate(1px, 1px) rotate(0deg)' }, { transform: 'translate(-1px, -2px) rotate(-1deg)' }, { transform: 'translate(-3px, 0px) rotate(1deg)' }, { transform: 'translate(3px, 2px) rotate(0deg)' }, { transform: 'translate(1px, -1px) rotate(1deg)' }, { transform: 'translate(-1px, 2px) rotate(-1deg)' }, { transform: 'translate(-3px, 1px) rotate(0deg)' }, { transform: 'translate(3px, 1px) rotate(-1deg)' }, { transform: 'translate(-1px, -1px) rotate(1deg)' }, { transform: 'translate(1px, 2px) rotate(0deg)' }, { transform: 'translate(1px, -2px) rotate(-1deg)' }], {
    // timing options
    duration: 100,
    iterations: 1
    // easing: 'cubic-bezier(0.42, 0, 0.58, 1)'
  });
}

export function updateEditors(url, excludedEditors = []) {

  url = url.toString().replace(/[#?].*/,"")
  
  const editors = lively.findAllElements(ea => ea.localName == "lively-editor", true)
  const editorsToUpdate = editors.filter(ea => ea.getURLString().replace(/[#?].*/,"") === url && !ea.textChanged && !excludedEditors.includes(ea))

  editorsToUpdate.forEach(ea => {
    var codeMirror = ea.get("lively-code-mirror")
    var scrollInfo = codeMirror.editor.getScrollInfo()
    ea.loadFile()
    // preserve scroll position during updating
    codeMirror.editor.scrollTo(null, scrollInfo.top)
  })
}

/*MD Source Code Locations and Ranges MD*/
function babelToCM(babelPosition) {
  return {
    line: babelPosition.line - 1,
    ch: babelPosition.column
  };
}

function treeSitterToCM(treeSitterPosition) {
  return {
    line: treeSitterPosition.row,
    ch: treeSitterPosition.column
  };
}



function cmToBabel(cmPosition) {
  return {
    line: cmPosition.line + 1,
    column: cmPosition.ch
  };
}

class Location {
  get isLocation() {
    return true;
  }

  constructor(l) {
    this._cmLine = l.line;
    this._cmCharacter = l.ch;
  }

  isEqual(l) {
    const other = loc(l);
    return this._cmLine === other._cmLine && this._cmCharacter === other._cmCharacter;
  }
  isBefore(l) {
    const other = loc(l);
    return this._cmLine < other._cmLine || this._cmLine === other._cmLine && this._cmCharacter <= other._cmCharacter;
  }
  isStrictBefore(l) {
    const other = loc(l);
    return this._cmLine < other._cmLine || this._cmLine === other._cmLine && this._cmCharacter < other._cmCharacter;
  }

  asBabel() {
    return cmToBabel(this.asCM());
  }
  
  asCM() {
    return {
      line: this._cmLine,
      ch: this._cmCharacter
    };
  }
  
  asTreeSitter() {
    return {
      row: this._cmLine,
      column: this._cmCharacter
    };
  }

  innerToString() {
    return `${this._cmLine}:${this._cmCharacter}`;
  }
  toString() {
    return `loc(${this.innerToString()})`;
  }
}

export function loc(l) {
  if (l.isLocation) {
    return l;
  }
  // treesitter style
  if (l.row !== undefined) {
    return new Location(treeSitterToCM(l));
  }
  
  // cm style
  if (l.ch !== undefined) {
    return new Location(l);
  }
  // babel style
  if (l.column !== undefined) {
    return new Location(babelToCM(l));
  }
  throw new Error(`Location value ${l} not recognized.`);
}

class Range {
  get isRange() {
    return true;
  }

  constructor(start, end) {
    this.setRange(start, end);
  }

  setRange(start, end) {
    if (loc(end).isStrictBefore(loc(start))) {
      this.setRange(end, start);
      return;
    }
    this.start = loc(start);
    this.end = loc(end);
  }

  asBabel() {
    throw new Error('asBabel not yet implemented.');
  }

  asCM() {
    // from, to
    return [this.start.asCM(), this.end.asCM()];
  }

  contains(location) {
    if (isRange(location)) {
      return this.containsRange(range(location));
    }
    const ll = loc(location);
    return this.start.isBefore(ll) && ll.isBefore(this.end);
  }

  strictlyContains(location) {
    if (location.isRange) {
      return strictlyContainsRange(location);
    }
    const ll = loc(location);
    return this.start.isStrictBefore(ll) && ll.isStrictBefore(this.end);
  }

  containsRange(range) {
    return this.contains(range.start) && this.contains(range.end);
  }

  strictlyContainsRange(range) {
    if(range.start.isEqual(range.end)) return this.containsRange(range);
    return this.strictlyContains(range.start) || this.strictlyContains(range.end);
  }

  containsPartsOfRange(range) {
    return this.contains(range.start) || this.contains(range.end);
  }

  isEqual(range) {
    return this.start.isEqual(range.start) && this.end.isEqual(range.end);
  }

  isBehind(l) {
    return loc(l).isBefore(this.start);
  }

  isBefore(l) {
    return this.end.isBefore(loc(l));
  }

  selectInCM(cm) {
    cm.setSelection(...this.asCM());
  }

  toString() {
    return `range(${this.start.innerToString()}, ${this.end.innerToString()})`;
  }
}

function isRange(r) {
  if (r.isRange) {
    return true;
  }
  // cm style
  if (Array.isArray(r)) {
    return true;
  }
  if (r.anchor && r.head) {
    return true;
  }
  // babel style
  if (r.start && r.end) {
    return true;
  }
  return false;
}

export function range(r) {
  if (r.isRange) {
    return r;
  }
  // cm style
  if (Array.isArray(r)) {
    return new Range(r.first, r.second);
  }
  if (r.anchor && r.head) {
    return new Range(r.anchor, r.head);
  }
  // babel style
  if (r.start && r.end) {
    return new Range(r.start, r.end);
  }
  throw new Error(`Range value ${r} not recognized.`);
}


export function getQGrams(str, q) {
  let qGrams = [];
  for (let i = 0; i <= str.length - q; i++) {
    qGrams.push(str.substring(i, i + q));
  }
  return qGrams;
}

export function qGramsDifference(str1, str2, q) {
  const qGrams1 = getQGrams(str1, q);
  const qGrams2 = getQGrams(str2, q);

  const union = new Set([...qGrams1, ...qGrams2]);
  const intersection = qGrams1.filter(item => qGrams2.includes(item));

  return (union.size - intersection.length) / union.size;
}

// Usage
//   const str1 = "kitten";
//   const str2 = "sitting";
//   const q = 2;

//   qGramsDifference(str1, str2, q)
