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

