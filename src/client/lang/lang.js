import { extend } from './utils.js';
import * as _ from 'src/external/lodash/lodash.js';



extend(Date.prototype, {
  
  dayInWeek(offset) {
    const day = this.getDay()
    const d = this.getDate();

    const resultDay = new Date(this);
    resultDay.setDate(d-day + offset);

    return resultDay;
  },

  mondayInWeek(){ return this.dayInWeek(1); },
  tuesdayInWeek(){ return this.dayInWeek(2); },
  wednesdayInWeek(){ return this.dayInWeek(3); },
  thursdayInWeek(){ return this.dayInWeek(4); },
  fridayInWeek(){ return this.dayInWeek(5); },
  saturdayInWeek(){ return this.dayInWeek(6); },
  sundayInWeek(){ return this.dayInWeek(7); },

  toFormattedString(format){
    if (format !== 'yyyy.mm.dd') {
      throw new Error(`Format ${format} not yet supported`);
    }

    function toStringWithTrailingZero(number) {
      return (number < 10 ? "0" : "") + number;
    }

    const year = this.getFullYear();
    const month = toStringWithTrailingZero(this.getMonth() + 1);
    const day = toStringWithTrailingZero(this.getDate());

    return `${year}.${month}.${day}`;
  }
  
});



const mapExtensions = {
  
  /**
   * Tries to get the value stored for the @link(key).
   * If this fails, generate a new value using the povided callback.
   *
   * @public
   * @param key (*) the key to get the value
   * @param createCallback (Function) if no value for @link(key) is available, gets the @link(key) to create a value
   * @returns {*} the value stored for the key
   */
  getOrCreate(key, createCallback) {
    if (!this.has(key)) {
      this.set(key, createCallback(key));
    }

    return this.get(key);
  }
  
}

extend(Map.prototype, mapExtensions);
extend(WeakMap.prototype, mapExtensions);



extend(Array.prototype, {

  get first() { return this[0]; },
  set first(value) { return this[0] = value; },

  get last() { return this[this.length - 1]; },
  set last(value) { return this[this.length - 1] = value; }

});



extend(Number.prototype, {
  
  times(iteratee) {
    return _.times(this, iteratee);
  },
  
  to(end, step) {
    return _.range(this, end, step);
  }

});



extend(String.prototype, {

  /**
   * 
   * @public
   * @param options (*) the optional options object containing any custom settings that you want to apply to the request
   * @returns {Promise<String>} the remote resource as String
   * 
   * @example <caption>Get lively start.html.</caption>
   * (lively4url + "/start.html").fetchText();
   */
  fetchText(options) {
    return fetch(this, options).then(r => r.text());
  },

  /**
   * 
   * @public
   * @param options (*) the optional options object containing any custom settings that you want to apply to the request
   * @returns {Promise<JSON>} the remote resource as JSON
   * 
   * @example <caption>Get d3 flare.json.</caption>
   * (lively4url + "/src/components/demo/flare.json").fetchJSON();
   */
  fetchJSON(options) {
    return fetch(this, options).then(r => r.json());
  }

});



extend(Promise.prototype, {

  /**
   * Awaits the promise, and return a promise after calling func.
   * @example <caption>Example usage on Promises.</caption>
   * fetch("https://lively-kernel.org/lively4/lively4-core/start.html")
   *   .through(lively.notify) // prints the response object
   *   .then(t=>t.text())
   *   .through(lively.notify); // prints the content
   */
  through(func, ...args) {
    return this.then(val => (func(val, ...args), val));
  }

});



