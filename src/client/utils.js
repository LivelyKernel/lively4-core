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
  clone.style["z-index"] = "-100000";
  clone.style.top = Math.max(0, evt.clientY - offsetY) + "px";
  clone.style.left = Math.max(0, evt.clientX - offsetX) + "px";
  clone.style.position = "absolute";
  clone.style.pointerEvents = "none";

  setTimeout(::clone.remove);
  evt.dataTransfer.setDragImage(clone, offsetX, offsetY);
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
