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
