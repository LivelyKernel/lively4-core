/**
 * All lodash utility functions with this reference bound as first parameter
 * @example <caption>Example using lodash bound.</caption>
 * import {through, last}from "utils"
 * 
 * document.body.querySelectorAll('lively-window')::last(); // return last selected window
 */
export * from './lodash-bound.js';

/**
 * Calls the given function func with this as a parameter.
 * For Promises: awaits the promise, and return a promise after calling func.
 * @example <caption>Example usage on Promises.</caption>
 * import { through }from "utils";
 * 
 * fetch("https://lively-kernel.org/lively4/lively4-core/start.html")
 *   ::through(lively.notify) // prints the response object
 *   .then(t=>t.text())
 *   ::through(lively.notify); // prints the content
 */
export function through(func, ...args) {
  if(this instanceof Promise) {
    return this.then(val => (func(val, ...args), val));
  } else {
    func(this, ...args);
    return this;
  }
}

export function executeAllTestRunners() {
  document.querySelectorAll('lively-testrunner').forEach(runner => runner.onRunButton());
}

export function promisedEvent(eventTarget, type) {
  if (!type || !eventTarget) throw new Error("arguments missing");
  return new Promise(resolve => eventTarget.addEventListener(type, resolve))
}

// #TODO: make this more robust to urlStrings that do not contain a filename, e.g.
// "https://goole.com"::fileName() should not "goole.com"
export function fileName() {
  return this.replace(/.*\//,"");
}

// Example usage: "path/to/a.json"::fileEnding() returns "json"
// #TODO: make this more robust to strings that do not contain a file ending
export function fileEnding() {
  return this.replace(/.*\./,"");
}

// Example usage: "path/to/a.json"::replaceFileEndingWith("xml") returns "path/to/a.xml"
// #TODO: make this more robust to strings that do not contain a file ending
export function replaceFileEndingWith(newEnding) {
  return this.replace(/[^\.]+$/, newEnding);
}

export class PausableLoop {
  constructor(func) {
    this.func = func;
    this.cancelID;
    this.running = false;
  }
  
  ensureRunning() {
    if(!this.running) {
      this.running = true;

      const loopBody = () => {
        this.func();
        if(this.running) {
          this.cancelID = requestAnimationFrame(loopBody);
        }
      }

      this.cancelID = requestAnimationFrame(loopBody);
    }
  }

  pause() {
    cancelAnimationFrame(this.cancelID);
    this.running = false;
  }
}

export function hintForLabel(label) {
  return <div style="
    margin: 0.5px 0px;
    font-size: x-small;
    background-color: lightgray;
    border: 1px solid gray;
    border-radius: 2px;
    max-width: fit-content;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  ">
    {label}
  </div>
}

// #TODO: chrome does not support dataTransfer.addElement :(
// e.g. dt.addElement(<h1>drop me</h1>);
// Therefore, we have to perform this hack stolen from:
// https://stackoverflow.com/questions/12766103/html5-drag-and-drop-events-and-setdragimage-browser-support
export function asDragImageFor(evt, offsetX=0, offsetY=0) {
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
  const hints = labels
    .map(textualRepresentation)
    .map(hintForLabel);
  const hintLength = hints.length;
  const maxLength = 5;
  if(hints.length > maxLength) {
    hints.length = maxLength;
    hints.push(hintForLabel(`+ ${hintLength - maxLength} more.`))
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
		var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
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
    background: 'transparent',
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
  if(supported) {
    let enabled;
    try {
      enabled = document.queryCommandEnabled('copy');
    } catch (err) {
      lively.warn('Copy to clipboard not enabled.', err);
      enabled = false;
    }
    if(enabled) {
      try {
        if(!document.execCommand('copy')) {
          lively.warn('Copying not successful.');
        }
      } catch (err) {
        lively.warn('Unable to execute copy.');
      }
    }
  }

  document.body.removeChild(textArea);
}

// taken from https://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
export function isFunction(functionToCheck) {
  let isFunc = functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
  let isAsyncFunc = functionToCheck && {}.toString.call(functionToCheck) === '[object AsyncFunction]';
  return isFunc || isAsyncFunc;
}

export function cancelEvent(evt) {
  evt.stopPropagation();
  evt.preventDefault();
}

export function textualRepresentation(thing) {
  // primitive falsy value?
  if(!thing) { return '' + thing}
  
  // toString method different from Object?
  if(thing.toString && thing.toString !== Object.prototype.toString) {
    return thing.toString();
  }
  
  // instance of a named class?
  if(thing.constructor && thing.constructor.name) {
    return 'a ' + thing.constructor.name;
  }
  
  return 'unprintable object';
}


export function getDeepProperty(obj, pathString) {
  var path = pathString.split(".")
  var next
  var result = obj
  while(next = path.shift()) {
    var nextResult = result[next] 
    if (!nextResult) return // could not resolve path
    result = nextResult
  }
  return result
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
