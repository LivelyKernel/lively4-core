"disable deepeval"

import { extend } from './utils.js';
import * as _ from 'src/external/lodash/lodash.js';

// ensure global variable 'that'
self.that = self.that;

function extendFromLodash(obj, propNames) {
  function genFunc(name) {
    const args = _[name].toString().split(/\r?\n/)[0].replace(/.*\((.*)\).*/,"$1").split(/, /)
    args.shift();
    const argsString = args.join(', ');
    
    return new Function('_', `return {
  ${name}(${argsString}) {
    return _.${name}(this, ${argsString});
  }
};`)(_);
  }

  const definitionParts = propNames.map(propName => genFunc(propName));
  const definition = Object.assign({}, ...definitionParts);

  return extend(obj, definition);
}


function pairComparator(pair1, pair2) {
  return pair1.first === pair2.first && pair1.second === pair2.second;
}

/**
 * utility function used to compute turn Objects and
 */
function pairsDiff(obj1, obj2) {
  const pairs1 = obj1.toPairs();
  const pairs2 = obj2.toPairs();

  const onlyLeft = _.differenceWith(pairs1, pairs2, pairComparator);
  const both = _.intersectionWith(pairs1, pairs2, pairComparator);
  const onlyRight = _.differenceWith(pairs2, pairs1, pairComparator);

  return [onlyLeft, both, onlyRight];
}

/*MD
## OBJECT
MD*/
extendFromLodash(Object.prototype, [
  'clone',
  'cloneDeep',
  'omit',
  'toPairs'
]);

function mapEntries(object, iterator) {
  const entries = Object.entries(object);
  const mapped = entries.map(iterator);
  return Object.fromEntries(mapped);
}

extend(Object.prototype, {
  deepProperty(paths) {
    if (Array.isArray(paths)) {
      return _.at(this, paths);
    } else {
      return _.get(this, paths);
    }
  },

  // `pick` clashes with the code mirror event "pick"
  pickProps(paths) {
    return _.pick(this, paths);
  },

  /**
   * Computes a more fine-grained difference with a second Object (@link(other)).
   * @param other (Object/Map) the Object to be compared to.
   * @returns {Array} [onlyLeft, both, onlyRight] the three Objects corresponding to the respective side of comparison.
   */
  computeDiff(other) {
    return pairsDiff(this, other).map(arr => _.fromPairs(arr));
  },

  /**
   * Migrate the instance to the given class by adapting its prototype chain.
   * @param newClass (Object) the class to migrate to.
   */
  migrateTo(NewClass) {
    this.constructor === NewClass;
    this.__proto__ = NewClass.prototype;
  },

  mapKeys(iterator) {
    return mapEntries(this, ([key, value]) => [iterator(key, value, this), value]);
  },
  
  mapValues(iterator) {
    return mapEntries(this, ([key, value]) => [key, iterator(value, key, this)]);
  },
  
  mapEntries(iterator) {
    return mapEntries(this, ([key, value]) => iterator([key, value], this));
  },
  
  mapKeysToEntries(iterator) {
    return mapEntries(this, ([key, value]) => iterator(key, value, this));
  },
  
  mapValuesToEntries(iterator) {
    return mapEntries(this, ([key, value]) => iterator(value, key, this));
  },
  
});

/*MD
## FUNCTION
MD*/
extendFromLodash(Function.prototype, [
  'debounce',
  'defer',
  /**
   * @example <caption>Simple Memoization.</caption>
   * // only consider second argument as key for memoization
   * var sum = ((x, y) => x + y).memoize((x, y) => y);
   * sum(1, 2);
   * // => 3
   * sum(2, 2);
   * // => 3, same second argument
   * sum(1, 3);
   * // => 4, different second argument
   */
  'memoize',
  'once',
  'throttle'
]);

extend(Function.prototype, {

  delay(wait, ...args) {
    return _.delay(this, wait, args);
  }

});

extend(Function, {

  noop() { return void 0; },
  identity(value) { return value; }

});


/*MD
## GENERATOR
MD*/

const generatorPrototype = (function*() {}).prototype.constructor;

extend(generatorPrototype, {

  toArray(...args) {
    const result = [];

    for (let item of this(...args)) {
      result.push(item)
    }

    return result;
  }

});


// #TODO: only written in this weird manner due to tooling not supporting async generators (parse error) #Tooling #Tools
const asyncGeneratorPrototype = (new Function(`return async function*() {};`))().prototype.constructor;

extend(asyncGeneratorPrototype, new Function(`return {

  async toArray(...args) {
    const result = [];

    for await (let item of this(...args)) {
      result.push(item)
    }

    return result;
  }

};`)());

/*MD
## HTMLElement
MD*/
if (self.HTMLElement) {
  extend(HTMLElement.prototype, {
    getJSONAttribute(name) {
      let str = this.getAttribute(name);
      if(str) { return JSON.parse(str); }
      return null;
    },

    setJSONAttribute(name, json) {
      this.setAttribute(name, JSON.stringify(json));
      return json;
    }
  })  
}

/*MD
## DATE
MD*/
extend(Date.prototype, {
  
  dayInWeek(offset) {
    let day = this.getDay()
    if (day === 0) { day = 7; } // sunday is the end of the week
    
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
    function toStringWithTrailingZero(number) {
      return (number < 10 ? "0" : "") + number;
    }

    const yyyy = this.getFullYear();
    const yy = yyyy.toString().substr(-2);
    const MM = toStringWithTrailingZero(this.getMonth() + 1);
    const dd = toStringWithTrailingZero(this.getDate());
    const hh = toStringWithTrailingZero(this.getHours());
    const mm = toStringWithTrailingZero(this.getMinutes());
    const ss = toStringWithTrailingZero(this.getSeconds());
    
    return format
      .replace(/yyyy/g, yyyy)
      .replace(/yy/g, yy)
      .replace(/MM/g, MM)
      .replace(/dd/g, dd)
      .replace(/hh/g, hh)
      .replace(/mm/g, mm)
      .replace(/ss/g, ss);
  }
  
});


/*MD
# SET
MD*/
extend(Set.prototype, {

  /**
   * Computes a more fine-grained difference with a second Set (@link(other)).
   * @param other (Set) the Set to be compared to.
   * @returns {Array} [onlyLeft, both, onlyRight] the three Sets corresponding to the respective side of comparison.
   */
  computeDiff(other) {
    const arrs = Array.from(this).computeDiff(other);
    return arrs.map(arr => new Set(arr));
  },

  union(iterable) {
    if (typeof this !== "object") {
      throw new TypeError("Must be of object type");
    }
    const Species = this.constructor[Symbol.species];
    const newSet = new Species(this);
    if (typeof newSet.add !== "function") {
      throw new TypeError("add method on new set species is not callable");
    }
    for (let item of iterable) {
      newSet.add(item);
    }
    return newSet;
  }
});


/*MD
## MAP/WEAKMAP
MD*/
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
  
};

extend(Map.prototype, mapExtensions);
extend(WeakMap.prototype, mapExtensions);

extend(Map.prototype, {

  /**
   * Computes a more fine-grained difference with a second Map (@link(other)).
   * @param other (Object/Map) the Set to be compared to.
   * @returns {Array} [onlyLeft, both, onlyRight] the three Maps corresponding to the respective side of comparison.
   */
  computeDiff(other) {
    return pairsDiff(this, other).map(arr => new Map(arr));
  },

});


/*MD
## ARRAY
MD*/
extendFromLodash(Array.prototype, [
  'compact',
  'difference',
  'groupBy',
  'countBy',
  'isEmpty',
  'max',
  'min',
  'maxBy',
  'minBy',
  'meanBy',
  'sample',
  'sampleSize',
  'shuffle',
  'sum',
  'sumBy',
  'uniq',
  'uniqBy',
  'uniqWith',
]);

extend(Array.prototype, {

  sortBy(iteratee, ascending = true) {
    return _.orderBy(this, [iteratee], [ascending ? 'asc' : 'desc']);
  },
  
  average() {
    if (this.length === 0) {
      return NaN;
    } else {
      return this.sum() / this.length;
    }
  },

  get first() { return this[0]; },
  set first(value) { return this[0] = value; },

  get second() { return this[1]; },
  set second(value) { return this[1] = value; },

  get third() { return this[2]; },
  set third(value) { return this[2] = value; },

  get last() { return this[this.length - 1]; },
  set last(value) { return this[this.length - 1] = value; },

  intersect(...arrays) {
    return _.intersection(this, ...arrays);
  },

  /**
   * Computes a more fine-grained difference with a second Array.
   * @param other (Array/Set) the Array to be compared to.
   * @returns {Array} [onlyLeft, both, onlyRight].
   */
  computeDiff(other) {
    const otherArray = Array.from(other);
    
    const onlyLeft = _.difference(this, otherArray);
    const both = _.intersection(this, otherArray);
    const onlyRight = _.difference(otherArray, this);

    return [onlyLeft, both, onlyRight];
  },

  /**
   * Removes the element 'item' from array (mutates!). Remove all occurences if 'all' is true.
   * @param item (any) the element to remove.
   * @param all (Boolean) whether to remove all occurences of 'item'.
   * @returns {Array} this array.
   */
  removeItem(item, all = false) {
    if (all) {
      let i = 0;
      while (i < this.length) {
        if (this[i] === item) {
          this.splice(i, 1);
        } else {
          ++i;
        }
      }
    } else {
      const index = this.indexOf(item);
      if (index > -1) {
        this.splice(index, 1);
      }
    }

    return this;
  },

  /**
   * Removes all elements from array (mutates!) that predicate returns truthy for and returns an array of the removed elements.
   * @param predicate (Function<value, index, array -> Boolean>) return true to remove given element.
   * @returns {Array} The removed elements.
   */
  removeAll(predicate) {
    return _.remove(this, predicate);
  },

  zip(...arrays) {
    return _.zip(this, ...arrays);
  },
  
  /**
   * A generator yielding all items in this array. For propagating.
   * @example <caption>Propagating yield* statements to items.</caption>
   * function* example(arr) {
   *   yield* arr.yieldAll();
   * }
   *
   * for (let item of example([1,2,3])) {
   *   lively.notify(item);
   * }
   */
  *yieldAll() {
    for (let item of this) {
      yield item;
    }
  },

  /**
   *
   */
  joinElements(builder) {
    const result = [];
    let lastItem;
    let index = 0;
    for (let item of this) {
      // not the first item
      if (result.length > 0) {
        result.push(builder(lastItem, item, index++, this));
      }
      result.push(item);
      lastItem = item;
    }
    return result;
  },

  /**
   * Counts the number of items that satisfy the given condition.
   * @param predicate (Function<value, index, array -> Boolean>) return true count the element.
   * @returns {Number} Counted number of elements.
   */
  count(predicate) {
    return this.filter(predicate).length;
  },
  
  /**
   * Randomly selects an item, considering the given weight function.
   * @param weightMapper (Function<value, index, array -> Number>) standard mapping callback to calculate the weight of each item.
   * @returns {any} The selected item from the Array.
   */
  weightedSample(weightMapper = () => 1, ...rest) {
    const weights = this.map(weightMapper, ...rest);
    
    let totalWeight = weights.sum();
    let random = Math.random() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return this[i];
      }

      random -= weights[i];
    }

    return undefined;
  },
  
  getItem(index) {
    const length = this.length;
    const i = ((index % length) + length) % length;
    return this[i];
  },

  /**
   * Splits the array into two arrays, first contains all items that evaluated the predicate to `true`, the second all that evaluated to false.
   * @param predicate (Function<value, index, array -> Boolean>) standard mapping callback to calculate the weight of each item.
   * @returns {<Array, Array>} The two Arrays as Array.
   */
  partition(predicate=_.identity) {
    predicate = _.iteratee(predicate);
    const groups = this.groupBy((...args) => !!predicate(...args));
    return [groups[true] || [], groups[false] || []];
  },

  /**
   * Map all items to the specified @property.
   * @param property (String) the property to be applied.
   * @returns {Array<any>} The extracted properties.
   */
  pluck(property=_.identity) {
    return this.map(_.iteratee(property))
  },

  /**
   * Get first, last, and all element in between from the array
   * @returns {Array<any>} A tuple of first element, in between elements, and last element.
   */
  firstMiddleLast() {
    return [this.first, this.slice(1, -1), this.length > 1 ? this.last : undefined]
  },

  /**
   * get lowest property in the array
   * @returns {<any>} the lowest property among elements in the array
   *
   * @example <caption>access highest property.</caption>
   * const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
   * expect(arr.minProp('a')).to.eql(1);
   */
  minProp(iteratee) {
    const iter = _.iteratee(iteratee, 3);
    return this.map(iter).min();
  },

  /**
   * get highest property in the array
   * @returns {<any>} the highest property among elements in the array
   *
   * @example <caption>access highest property.</caption>
   * const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];
   * expect(arr.maxProp('a')).to.eql(3);
   */
  maxProp(iteratee) {
    const iter = _.iteratee(iteratee, 3);
    return this.map(iter).max();
  },

});

/*MD # Array-like MD*/
if (self.NodeList) {
  extendFromLodash(NodeList.prototype, [
    'map',
    'filter',
    'reduce',
    'find'
  ]);
}
/*MD
## NUMBER
MD*/
extendFromLodash(Number.prototype, [
  'ceil',
  'clamp',
  'floor',
  'inRange',
  'round',
  'times'
]);

extend(Number.prototype, {
  
  to(end, step) {
    return _.range(this, end, step);
  },
  
  remap([domainStart, domainEnd] = [], [rangeStart, rangeEnd] = [], clip = false) {
    if (domainStart === domainEnd) { throw new Error('domain start and end are equal'); }
    
    let input = this;
    if (clip && !this.inRange(domainStart, domainEnd)) {
      const domainLower = domainStart < domainEnd ? domainStart : domainEnd;
      const domainUpper = domainEnd > domainStart ? domainEnd : domainStart;
      input = this.clamp(domainLower, domainUpper);
    }

    const percent = (input - domainStart) / (domainEnd - domainStart);
    let result = percent * (rangeEnd - rangeStart) + rangeStart;
    return result;
  }

});


/*MD
## STRING
MD*/
extendFromLodash(String.prototype, [
  'camelCase',
  'capitalize',
  'kebabCase',
  'lowerCase',
  'lowerFirst',
  'snakeCase',
  'startCase',
  'toLower',
  'toUpper',
  'upperCase',
  'upperFirst',
  'words',
]);

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
  },
  
  /**
   * Get file info for a remote file or directory.
   * @public
   * @example <caption>Get file info of start.html.</caption>
   * const startHTML = lively4url + '/start.html';
   * startHTML.fetchStats();
   */
  fetchStats(options) {
    return this.fetchJSON(Object.assign({ method: 'OPTIONS' }, options));
  },
  
  /**
   * Split the String by line breaks.
   * @public
   * @returns {Array<String>} the resulting lines of the String
   * @example <caption>Split Hello World.</caption>
   * const str = `Hello\nWorld
   * !`;
   * str.lines(); // -> ['Hello', 'World', '!']
   */
  lines() {
    return this.split(/\n/ig);
  },

  /**
   * Repeat the String with delimiter in between.
   * @public
   * @param times (Number) how many times to repeat the string
   * @param delim (String) what to place between each repetition
   * @returns {String} the sequence
   * @example <caption>Repeat a String.</caption>
   * const str = 'auto'
   * str.repeatWithDelimiter(3, ' '); // -> 'auto auto auto'
   */
  repeatWithDelimiter(times, delim = '') {
    return times.times(() => this).join(delim)
  },

  // https://neil.fraser.name/news/2010/11/04/
  /**
   * Get the index/length of the overlap of both strings. That is the postfix of `this` and the prefix of `str`.
   * @public
   * @param str (String) the second string to overlap the start with
   * @returns {Number} how many characters overlap
   * @example <caption>Overlap 2 Strings.</caption>
   * '1234'.overlapIndexWith('3456') // -> 2
   */
  overlapIndexWith(text2) {
    let text1 = this
    
    // Cache the text lengths to prevent multiple calls.
    var text1_length = text1.length;
    var text2_length = text2.length;

    // Eliminate the null case.
    if (text1_length === 0 || text2_length === 0) {
      return 0;
    }

    // Truncate the longer string.
    if (text1_length > text2_length) {
      text1 = text1.slice(-text2_length);
    } else if (text1_length < text2_length) {
      text2 = text2.slice(0, text1_length);
    }

    // Quick check for the worst case.
    if (text1 === text2) {
      return Math.min(text1_length, text2_length);
    }

    // Start by looking for a single character match
    // and increase length until no match is found.
    let best = 0;
    let length = 1;
    while (true) {
      let pattern = text1.slice(-length);
      let found = text2.indexOf(pattern);
      if (found === -1) {
        return best;
      }
      length += found;
      if (text1.slice(-length) === text2.slice(0, length)) {
        best = length;
        length += 1;
      }
    }
  },

  /**
   * Get the overlap of both strings. That is the postfix of `this` and the prefix of `str`.
   * @public
   * @param str (String) the second string to overlap the start with
   * @returns {String} the overlapping string
   * @example <caption>Overlap 2 Strings.</caption>
   * '1234'.overlapWith('3456') // -> '34'
   */
  overlapWith(str) {
    return str.substring(0, this.overlapIndexWith(str))
  }

});


/*MD
## PROMISE
MD*/
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


/*MD
## URL
MD*/
extend(URL.prototype, {

  // hook for rendering the internals of an object in the inspector
  livelyInspect(contentNode, inspector) {
    contentNode.innerHTML = ""
    var entries = lively.allKeys(this);
    for(let key of entries) {
      const node = inspector.display(this[key], true, key)
      if (node) contentNode.appendChild(node);   
    }
  }

});

/*MD
## Animation
MD*/

if(self.Animation) {
  extend(Animation.prototype, {

    /**
     * React to the finish of the animation using a Promise.
     * @param callback (Function) a callback invoked at the end of the animation.
     * @returns {Promise} a Promise resolving when the animation finishes.
     */
    whenFinished(callback = () => {}) {
      return new Promise(resolve => {
        const onFinished = () => {
          callback();
          resolve();
        }

        if (this.playState === "finished") {
          onFinished();
        } else {
          this.addEventListener('finish', onFinished);
        }
      });
    },

  });  
}

/*MD ## HTMLElement MD*/
extend(HTMLElement.prototype, {

  findParent(condition, deep = true) {
    return lively.allParents(this, undefined, deep).find(condition)
  }

});
/*MD ## Strings as Selectors MD*/

/**
 * When using in a tagged template string, create an accessor function
 * for given string
 * @param property (Array<String>) the property to create a function for.
 * @returns {Function<any> -> <any>} an iteratee to access given property.
 * @example <caption>Get All Children of All Top-level Divs.</caption>
 * const topLevelDivs = [...document.querySelectorAll('body > div')]
 * topLevelDivs.flatMap(g`children`)
 * // instead of topLevelDivs.flatMap(div => div.children)
 */
self.g = function get([property] = []) {
  return new Function('obj', `return obj.${property}`);
}

/**
 * When using in a tagged template string, create an accessor function
 * the calls and returns the method for given string
 * @param property (Array<String>) the property to create a function for.
 * @returns {Function<any> -> <any>} an iteratee to access given property.
 * @example <caption>Remove All Top-level Divs.</caption>
 * const topLevelDivs = [...document.querySelectorAll('body > div')]
 * topLevelDivs.forEach(c`remove`)
 * // instead of topLevelDivs.forEach(div => div.remove())
 */
self.c = function call([property] = []) {
  return new Function('obj', `return obj.${property}()`);
}

/*MD ## Hacks MD*/
if (self.originalGetComputedStyle) {

  // #TODO poor man's COP: #ContextJS is not suited to layer functions #TODO
  if (!window.originalGetComputedStyle) {
    window.originalGetComputedStyle = window.getComputedStyle  
  }

  // #Hack #drawio 
  // drawio tries to get the style of the shadow root... which fails
  window.getComputedStyle = function(...args) {
    var element = args[0]
    if (element && !(element instanceof HTMLElement)) {
      // console.log("ERROR on getComputedStyle ON ", element)

      // silent fail...
      return undefined
    }
    return window.originalGetComputedStyle(...args)
  }  
}
