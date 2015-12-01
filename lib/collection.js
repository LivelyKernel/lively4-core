
/*
 * Methods to make working with arrays more convenient and collection-like
 * abstractions for groups, intervals, grids.
 */
;(function(exports) {
"use strict";


// Pure JS implementations of native Array methods.
var arrNative = exports.arrNative = {

  sort: function(sortFunc) {
    // show-in-doc
    if (!sortFunc) {
      sortFunc = function(x,y) {
        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
      };
    }
    var len = this.length, sorted = [];
    for (var i = 0; i < this.length; i++) {
      var inserted = false;
      for (var j = 0; j < sorted.length; j++) {
        if (1 === sortFunc(sorted[j], this[i])) {
          inserted = true;
          sorted[j+1] = sorted[j];
          sorted[j] = this[i];
          break;
        }
      }
      if (!inserted) sorted.push(this[i]);
    }
    return sorted;
  },

  filter: function(iterator, context) {
    // show-in-doc
    var results = [];
    for (var i = 0; i < this.length; i++) {
      if (!this.hasOwnProperty(i)) continue;
      var value = this[i];
      if (iterator.call(context, value, i)) results.push(value);
    }
    return results;
  },

  forEach: function(iterator, context) {
    // show-in-doc
    for (var i = 0, len = this.length; i < len; i++) {
      iterator.call(context, this[i], i, this); }
  },

  some: function(iterator, context) {
    // show-in-doc
    return this.detect(iterator, context) !== undefined;
  },

  every: function(iterator, context) {
    // show-in-doc
    var result = true;
    for (var i = 0, len = this.length; i < len; i++) {
      result = result && !! iterator.call(context, this[i], i);
      if (!result) break;
    }
    return result;
  },

  map: function(iterator, context) {
    // show-in-doc
    var results = [];
    this.forEach(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  },

  reduce: function(iterator, memo, context) {
    // show-in-doc
    var start = 0;
    if (!arguments.hasOwnProperty(1)) { start = 1; memo = this[0]; }
    for (var i = start; i < this.length; i++)
      memo = iterator.call(context, memo, this[i], i, this);
    return memo;
  },

  reduceRight: function(iterator, memo, context) {
    // show-in-doc
    var start = this.length-1;
    if (!arguments.hasOwnProperty(1)) { start--; memo = this[this.length-1]; }
    for (var i = start; i >= 0; i--)
      memo = iterator.call(context, memo, this[i], i, this);
    return memo;
  }

};

// variety of functions for Arrays
var arr = exports.arr = {

  // -=-=-=-=-=-=-=-
  // array creations
  // -=-=-=-=-=-=-=-

  range: function(begin, end, step) {
    // Examples:
    //   arr.range(0,5) // => [0,1,2,3,4,5]
    //   arr.range(0,10,2) // => [0,2,4,6,8,10]
    step = step || 1
    var result = [];
    for (var i = begin; i <= end; i += step)
      result.push(i);
    return result;
  },

  from: function(iterable) {
    // Makes JS arrays out of array like objects like `arguments` or DOM `childNodes`
    if (!iterable) return [];
    if (Array.isArray(iterable)) return iterable;
    if (iterable.toArray) return iterable.toArray();
    var length = iterable.length,
        results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  },

  withN: function(n, obj) {
    // Example:
    //   arr.withN(3, "Hello") // => ["Hello","Hello","Hello"]
    var result = new Array(n);
    while (n > 0) result[--n] = obj;
    return result;
  },

  genN: function(n, generator) {
    // Number -> Function -> Array
    // Takes a generator function that is called for each `n`.
    // Example:
    //   arr.genN(3, num.random) // => [46,77,95]
    var result = new Array(n);
    while (n > 0) result[--n] = generator(n);
    return result;
  },

  // -=-=-=-=-
  // filtering
  // -=-=-=-=-

  filter: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> [a]
    // Calls `iterator` for each element in `array` and returns a subset of it
    // including the elements for which `iterator` returned a truthy value.
    // Like `Array.prototype.filter`.
    return array.filter(iterator, context);
  },

  detect: function(arr, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> a
    // returns the first occurrence of an element in `arr` for which iterator
    // returns a truthy value
    for (var value, i = 0, len = arr.length; i < len; i++) {
      value = arr[i];
      if (iterator.call(context, value, i)) return value;
    }
    return undefined;
  },

  filterByKey: function(arr, key) {
    // [a] -> String -> [a]
    // Example:
    //   var objects = [{x: 3}, {y: 4}, {x:5}]
    //   arr.filterByKey(objects, "x") // => [{x: 3},{x: 5}]
    return arr.filter(function(ea) { return !!ea[key]; });
  },

  grep: function(arr, filter, context) {
    // [a] -> String|RegExp -> [a]
    // `filter` can be a String or RegExp. Will stringify each element in
    // Example:
    // ["Hello", "World", "Lively", "User"].grep("l") // => ["Hello","World","Lively"]
    if (typeof filter === 'string') filter = new RegExp(filter, 'i');
    return arr.filter(filter.test.bind(filter))
  },

  mask: function(array, mask) {
    // select every element in array for which array's element is truthy
    // Example: [1,2,3].mask([false, true, false]) => [2]
    return array.filter(function(_, i) { return !!mask[i]; });
  },

  reject: function(array, func, context) {
    // show-in-doc
    function iterator(val, i) { return !func.call(context, val, i); }
    return array.filter(iterator);
  },

  rejectByKey: function(array, key) {
    // show-in-doc
    return array.filter(function(ea) { return !ea[key]; });
  },

  without: function(array, elem) {
    // non-mutating
    // Example:
    // arr.without([1,2,3,4,5,6], 3) // => [1,2,4,5,6]
    return array.filter(function(value) { return value !== elem; });
  },

  withoutAll: function(array, otherArr) {
    // non-mutating
    // Example:
    // arr.withoutAll([1,2,3,4,5,6], [3,4]) // => [1,2,5,6]
    return array.filter(function(value) {
      return otherArr.indexOf(value) === -1;
    });
  },

  uniq: function(array, sorted) {
    // non-mutating
    // Removes duplicates from array.
    return array.reduce(function(a, value, index) {
      if (0 === index || (sorted ? a.last() != value : a.indexOf(value) === -1))
        a.push(value);
      return a;
    }, []);
  },

  uniqBy: function(array, comparator, context) {
    // like `arr.uniq` but with custom equality: `comparator(a,b)` returns
    // BOOL. True if a and be should be regarded equal, false otherwise.
    var result = arr.clone(array);
    for (var i = 0; i < result.length; i++) {
      var item = array[i];
      for (var j = i+1; j < result.length; j++) {
        if (comparator.call(context, item, result[j])) {
          arr.removeAt(result, j); j--;
        }
      }
    }
    return result;
  },

  compact: function(array) {
    // removes falsy values
    // Example:
    // arr.compact([1,2,undefined,4,0]) // => [1,2,4]
    return array.filter(function(ea) { return !!ea; });
  },

  mutableCompact: function(array) {
    // fix gaps that were created with 'delete'
    var i = 0, j = 0, len = array.length;
    while (i < len) {
      if (array.hasOwnProperty(i)) array[j++] = array[i];
      i++;
    }
    while (j++ < len) array.pop();
    return array;
  },

  // -=-=-=-=-
  // iteration
  // -=-=-=-=-

  forEach: function(array, iterator, context) {
    // [a] -> (a -> Undefined) -> c? -> Undefined
    // `iterator` is called on each element in `array` for side effects. Like
    // `Array.prototype.forEach`.
    return array.forEach(iterator, context);
  },

  zip: function(/*arr, arr2, arr3*/) {
    // Takes any number of lists as arguments. Combines them elment-wise.
    // Example:
    // arr.zip([1,2,3], ["a", "b", "c"], ["A", "B"])
    // // => [[1,"a","A"],[2,"b","B"],[3,"c",undefined]]
    var args = arr.from(arguments),
        array = args.shift(),
        iterator = typeof arr.last(args) === 'function' ?
          args.pop() : function(x) { return x; },
        collections = [array].concat(args).map(arr.from);
    return array.map(function(value, index) {
      return iterator(arr.pluck(collections, index), index); });
  },

  flatten: function flatten(array, optDepth) {
    // Turns a nested collection into a flat one.
    // Example:
    // arr.flatten([1, [2, [3,4,5], [6]], 7,8])
    // // => [1,2,3,4,5,6,7,8]
    if (typeof optDepth === "number") {
      if (optDepth <= 0) return array;
      optDepth--;
    }
    return array.reduce(function(flattened, value) {
      return flattened.concat(Array.isArray(value) ?
        flatten(value, optDepth) : [value]);
    }, []);
  },

  flatmap: function(array, it, ctx) {
    // the simple version
    // Array.prototype.concat.apply([], array.map(it, ctx));
    // causes stack overflows with really big arrays
    var results = [];
    for (var i = 0; i < array.length; i++) {
      results.push.apply(results, it.call(ctx, array[i], i));
    }
    return results;
  },

  interpose: function(array, delim) {
    // Injects delim between elements of array
    // Example:
    // lively.lang.arr.interpose(["test", "abc", 444], "aha"));
    // // => ["test","aha","abc","aha",444]
    return array.reduce(function(xs, x) {
      if (xs.length > 0) xs.push(delim)
      xs.push(x); return xs;
    }, []);
  },

  delimWith: function(array, delim) {
    // ignore-in-doc
    return arr.interpose(array, delim);
  },

  // -=-=-=-=-
  // mapping
  // -=-=-=-=-

  map: function(array, iterator, context) {
    // [a] -> (a -> b) -> c? -> [b]
    // Applies `iterator` to each element of `array` and returns a new Array
    // with the results of those calls. Like `Array.prototype.some`.
    return array.map(iterator, context);
  },

  invoke: function(array, method, arg1, arg2, arg3, arg4, arg5, arg6) {
    // Calls `method` on each element in `array`, passing all arguments. Often
    // a handy way to avoid verbose `map` calls.
    // Example: arr.invoke(["hello", "world"], "toUpperCase") // => ["HELLO","WORLD"]
    return array.map(function(ea) {
      return ea[method](arg1, arg2, arg3, arg4, arg5, arg6);
    });
  },

  pluck: function(array, property) {
    // Returns `property` or undefined from each element of array. For quick
    // `map`s and similar to `invoke`.
    // Example: arr.pluck(["hello", "world"], 0) // => ["h","w"]
    return array.map(function(ea) { return ea[property]; });
  },

  // -=-=-=-=-
  // folding
  // -=-=-=-=-

  reduce: function(array, iterator, memo, context) {
    // Array -> Function -> Object? -> Object? -> Object?
    // Applies `iterator` to each element of `array` and returns a new Array
    // with the results of those calls. Like `Array.prototype.some`.
    return array.reduce(iterator, memo, context);
  },

  reduceRight: function(array, iterator, memo, context) {
    // show-in-doc
    return array.reduceRight(iterator, memo, context);
  },

  // -=-=-=-=-
  // testing
  // -=-=-=-=-

  isArray: Array.isArray,

  include: function(array, object) {
    // Example: arr.include([1,2,3], 2) // => true
    return array.indexOf(object) !== -1;
  },

  some: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> Boolean
    // Returns true if there is at least one abject in `array` for which
    // `iterator` returns a truthy result. Like `Array.prototype.some`.
    return array.some(iterator, context);
  },

  every: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> Boolean
    // Returns true if for all abjects in `array` `iterator` returns a truthy
    // result. Like `Array.prototype.every`.
    return array.every(iterator, context);
  },

  equals: function(array, otherArray) {
    // Returns true iff each element in `array` is equal (`==`) to its
    // corresponding element in `otherArray`
    var len = array.length;
    if (!otherArray || len !== otherArray.length) return false;
    for (var i = 0; i < len; i++) {
      if (array[i] && otherArray[i] && array[i].equals && otherArray[i].equals) {
        if (!array[i].equals(otherArray[i])) {
          return false;
        } else {
          continue;
        }
      }
      if (array[i] != otherArray[i]) return false;
    }
    return true;
  },

  // -=-=-=-=-
  // sorting
  // -=-=-=-=-

  sort: function(array, sortFunc) {
    // [a] -> (a -> Number)? -> [a]
    // Just `Array.prototype.sort`
    return array.sort(sortFunc);
  },

  sortBy: function(array, iterator, context) {
    // Example:
    // arr.sortBy(["Hello", "Lively", "User"], function(ea) {
    //   return ea.charCodeAt(ea.length-1); }) // => ["Hello","User","Lively"]
    return arr.pluck(
      array.map(function(value, index) {
        return {value: value,criteria: iterator.call(context, value, index)};
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }), 'value');
  },

  sortByKey: function(array, key) {
    // Example:
    // lively.lang.arr.sortByKey([{x: 3}, {x: 2}, {x: 8}], "x")
    // // => [{x: 2},{x: 3},{x: 8}]
    return arr.sortBy(array, function(ea) { return ea[key]; });
  },

  reverse: function(array) { return array.reverse(); },

  reversed: function(array) { return arr.clone(array).reverse(); },

  // -=-=-=-=-=-=-=-=-=-=-=-=-
  // RegExp / String matching
  // -=-=-=-=-=-=-=-=-=-=-=-=-

  reMatches: function(arr, re, stringifier) {
    // convert each element in arr into a string and apply re to match it.
    // result might include null items if re did not match (usful for masking)
    // Example:
    //   var morphs = $world.withAllSubmorphsDo(function(x) { return x; ;
    //   morphs.mask(morphs.reMatches(/code/i))
    stringifier = stringifier || String
    return arr.map(function(ea) { return stringifier(ea).match(re); });
  },

  // -=-=-=-=-=-
  // accessors
  // -=-=-=-=-=-

  first: function(array) { return array[0]; },

  last: function(array) { return array[array.length - 1]; },

  // -=-=-=-=-=-=-=-
  // Set operations
  // -=-=-=-=-=-=-=-

  intersect: function(array1, array2) {
    // set-like intersection
    return arr.uniq(array1).filter(function(item) {
      return array2.indexOf(item) > -1; });
  },

  union: function(array1, array2) {
    // set-like union
    var result = arr.clone(array1);
    for (var i = 0; i < array2.length; i++) {
      var item = array2[i];
      if (result.indexOf(item) === -1) result.push(item);
    }
    return result;
  },

  pushAt: function(array, item, index) {
    // inserts `item` at `index`, mutating
    array.splice(index, 0, item);
  },

  removeAt: function(array, index) {
    // inserts item at `index`, mutating
    array.splice(index, 1);
  },

  remove: function(array, item) {
    // removes first occurrence of item in `array`, mutating
    var index = array.indexOf(item);
    if (index >= 0) arr.removeAt(array, index);
    return item;
  },

  pushAll: function(array, items) {
    // appends all `items`, mutating
    for (var i = 0; i < items.length; i++)
      array.push(items[i]);
    return array;
  },

  pushAllAt: function(array, items, idx) {
    // inserts all `items` at `idx`, mutating
    array.splice.apply(array, [idx, 0].concat(items))
  },

  pushIfNotIncluded: function(array, item) {
    // only appends `item` if its not already in `array`, mutating
    if (!arr.include(array, item)) array.push(item);
  },

  replaceAt: function(array, item, index) {
    // mutating
    array.splice(index, 1, item); },

  clear: function(array) {
    // removes all items, mutating
    array.length = 0; return array;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-
  // asynchronous iteration
  // -=-=-=-=-=-=-=-=-=-=-=-
  doAndContinue: function(array, iterator, endFunc, context) {
    // Iterates over array but instead of consecutively calling iterator,
    // iterator gets passed in the invocation for the next iteration step
    // as a function as first parameter. This allows to wait arbitrarily
    // between operation steps, great for managing dependencies between tasks.
    // Related is [`fun.composeAsync`]().
    // Example:
    // arr.doAndContinue([1,2,3,4], function(next, n) {
    //   alert("At " + n);
    //   setTimeout(next, 100);
    // }, function() { alert("Done"); })
    // // If the elements are functions you can leave out the iterator:
    // arr.doAndContinue([
    //   function(next) { alert("At " + 1); next(); },
    //   function(next) { alert("At " + 2); next(); }
    // ], null, function() { alert("Done"); });
    endFunc = endFunc || Functions.Null;
    context = context || (typeof window !== 'undefined' ? window : global);
    iterator = iterator || function(next, ea, idx) { ea.call(context, next, idx); };
    return array.reduceRight(function(nextFunc, ea, idx) {
      return function() { iterator.call(context, nextFunc, ea, idx); }
    }, endFunc)();
  },

  nestedDelay: function(array, iterator, waitSecs, endFunc, context, optSynchronChunks) {
    // Calls `iterator` for every element in `array` and waits between iterator
    // calls `waitSecs`. Eventually `endFunc` is called. When passing a number n
    // as `optSynchronChunks`, only every nth iteration is delayed.
    endFunc = endFunc || function() {};
    return array.clone().reverse().reduce(function(nextFunc, ea, idx) {
      return function() {
        iterator.call(context || (typeof window !== 'undefined' ? window : global), ea, idx);
        // only really delay every n'th call optionally
        if (optSynchronChunks && (idx % optSynchronChunks !== 0)) {
          nextFunc()
        } else {
          nextFunc.delay(waitSecs);
        }
      }
    }, endFunc)();
  },

  forEachShowingProgress: function(/*array, progressBar, iterator, labelFunc, whenDoneFunc, context or spec*/) {
    // ignore-in-doc
    var args = Array.from(arguments),
      array = args.shift(),
      steps = array.length,
      progressBar, iterator, labelFunc, whenDoneFunc, context,
      progressBarAdded = false;

    // init args
    if (args.length === 1) {
      progressBar = args[0].progressBar;
      iterator = args[0].iterator;
      labelFunc = args[0].labelFunction;
      whenDoneFunc = args[0].whenDone;
      context = args[0].context;
    } else {
      progressBar = args[0];
      iterator = args[1];
      labelFunc = args[2];
      whenDoneFunc = args[3];
      context = args[4];
    }
    if (!context) context = typeof window !== 'undefined' ? window : global;
    if (!labelFunc) labelFunc = function(x) { return x; };

    // init progressbar
    if (!progressBar) {
      progressBarAdded = true;
      var Global = typeof window !== 'undefined' ? window : global;
      var world = Global.lively && lively.morphic && lively.morphic.World.current();
      progressBar = world ? world.addProgressBar() : {
        setValue: function(val) {},
        setLabel: function() {},
        remove: function() {}
      };
    }
    progressBar.setValue(0);

    // nest functions so that the iterator calls the next after a delay
    (array.reduceRight(function(nextFunc, item, idx) {
      return function() {
        try {
          progressBar.setValue(idx / steps);
          if (labelFunc) progressBar.setLabel(labelFunc.call(context, item, idx));
          iterator.call(context, item, idx);
        } catch (e) {
          console.error(
            'Error in forEachShowingProgress at %s (%s)\n%s\n%s',
            idx, item, e, e.stack);
        }
        nextFunc.delay(0);
      };
    }, function() {
      progressBar.setValue(1);
      if (progressBarAdded) (function() { progressBar.remove(); }).delay(0);
      if (whenDoneFunc) whenDoneFunc.call(context);
    }))();

    return array;
  },

  swap: function(array, index1, index2) {
    // mutating
    // Example:
    // var a = [1,2,3,4];
    // arr.swap(a, 3, 1);
    // a // => [1,4,3,2]
    if (index1 < 0) index1 = array.length + index1;
    if (index2 < 0) index2 = array.length + index2;
    var temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
    return array;
  },

  rotate: function(array, times) {
    // non-mutating
    // Example:
    // arr.rotate([1,2,3]) // => [2,3,1]
    times = times || 1;
    return array.slice(times).concat(array.slice(0,times));
  },

  // -=-=-=-=-
  // grouping
  // -=-=-=-=-

  groupBy: function(array, iterator, context) {
    // Applies `iterator` to each element in `array`, and puts the return value
    // into a collection (the group) associated to it's stringified representation
    // (the "hash").
    // See [`Group.prototype`] for available operations on groups.
    // Example:
    // Example 1: Groups characters by how often they occur in a string:
    // var chars = arr.from("Hello World");
    // arr.groupBy(arr.uniq(chars), function(c) {
    //   return arr.count(chars, c); })
    // // => {
    // //   "1": ["H","e"," ","W","r","d"],
    // //   "2": ["o"],
    // //   "3": ["l"]
    // // }
    // // Example 2: Group numbers by a custom qualifier:
    // arr.groupBy([3,4,1,7,4,3,8,4], function(n) {
    //   if (n <= 3) return "small";
    //   if (n <= 7) return "medium";
    //   return "large";
    // });
    // // => {
    // //   large: [8],
    // //   medium: [4,7,4,4],
    // //   small: [3,1,3]
    // // }
    return Group.fromArray(array, iterator, context);
  },

  groupByKey: function(array, key) {
    // var objects = [{x: }]
    // arr.groupBy(arr.uniq(chars), function(c) {
    //   return arr.count(chars, c); })
    // // => {
    // //   "1": ["H","e"," ","W","r","d"],
    // //   "2": ["o"],
    // //   "3": ["l"]
    // // }
    return arr.groupBy(array, function(ea) { return ea[key]; });
  },

  partition: function(array, iterator, context) {
    // Example:
    // var array = [1,2,3,4,5,6];
    // arr.partition(array, function(ea) { return ea > 3; })
    // // => [[1,2,3,4],[5,6]]
    iterator = iterator || function(x) { return x; };
    var trues = [], falses = [];
    array.forEach(function(value, index) {
      (iterator.call(context, value, index) ? trues : falses).push(value);
    });
    return [trues, falses];
  },

  batchify: function(array, constrainedFunc, context) {
    // Takes elements and fits them into subarrays (= batches) so that for
    // each batch constrainedFunc returns true. Note that contrained func
    // should at least produce 1-length batches, otherwise an error is raised
    // Example:
    // // Assume you have list of things that have different sizes and you want to
    // // create sub-arrays of these things, with each sub-array having if possible
    // // less than a `batchMaxSize` of combined things in it:
    // var sizes = [
    //   Math.pow(2, 15), // 32KB
    //   Math.pow(2, 29), // 512MB
    //   Math.pow(2, 29), // 512MB
    //   Math.pow(2, 27), // 128MB
    //   Math.pow(2, 26), // 64MB
    //   Math.pow(2, 26), // 64MB
    //   Math.pow(2, 24), // 16MB
    //   Math.pow(2, 26)] // 64MB
    // var batchMaxSize = Math.pow(2, 28)/*256MB*/;
    // function batchConstrained(batch) {
    //   return batch.length == 1 || batch.sum() < batchMaxSize;
    // }
    // var batches = sizes.batchify(batchConstrained);
    // batches.pluck('length') // => [4,1,1,2]
    // batches.map(arr.sum).map(num.humanReadableByteSize) // => ["208.03MB","512MB","512MB","128MB"]

    return findBatches([], array);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function extractBatch(batch, sizes) {
      // ignore-in-doc
      // Array -> Array -> Array[Array,Array]
      // case 1: no sizes to distribute, we are done
      if (!sizes.length) return [batch, []];
      var first = sizes[0], rest = sizes.slice(1);
      // if batch is empty we have to take at least one
      // if batch and first still fits, add first
      var candidate = batch.concat([first]);
      if (constrainedFunc.call(context, candidate)) return extractBatch(candidate, rest);
      // otherwise leave first out for now
      var batchAndSizes = extractBatch(batch, rest);
      return [batchAndSizes[0], [first].concat(batchAndSizes[1])];
    }

    function findBatches(batches, sizes) {
      if (!sizes.length) return batches;
      var extracted = extractBatch([], sizes);
      if (!extracted[0].length)
        throw new Error('Batchify constrained does not ensure consumption '
                + 'of at least one item per batch!');
      return findBatches(batches.concat([extracted[0]]), extracted[1]);
    }
  },

  toTuples: function(array, tupleLength) {
    // Creates sub-arrays with length `tupleLength`
    // Example:
    // arr.toTuples(["H","e","l","l","o"," ","W","o","r","l","d"], 4)
    // // => [["H","e","l","l"],["o"," ","W","o"],["r","l","d"]]
    tupleLength = tupleLength || 1;
    return arr.range(0,Math.ceil(array.length/tupleLength)-1).map(function(n) {
      return array.slice(n*tupleLength, n*tupleLength+tupleLength);
    }, array);
  },

  permutations: (function() {
    function computePermutations(values, restArray) {
      if (!restArray.length) return [values];
      return lively.lang.arr.flatmap(restArray,
        (ea, i) => computePermutations(
          values.concat([ea]),
          restArray.slice(0, i).concat(restArray.slice(i+1))))
    }
    return computePermutations.bind(null, []);
  })(),

  take: function(arr, n) { return arr.slice(0, n); },

  drop: function(arr, n) { return arr.slice(n); },

  takeWhile: function(arr, fun, context) {
    var i = 0;;
    for (; i < arr.length; i++)
      if (!fun.call(context, arr[i], i)) break;
    return arr.slice(0, i);
  },

  dropWhile: function(arr, fun, context) {
    var i = 0;;
    for (; i < arr.length; i++)
      if (!fun.call(context, arr[i], i)) break;
    return arr.slice(i);
  },

  // -=-=-=-=-=-
  // randomness
  // -=-=-=-=-=-

  shuffle: function(array) {
    // Ramdomize the order of elements of array. Does not mutate array.
    // Example:
    // arr.shuffle([1,2,3,4,5]) // => [3,1,2,5,4]
    var unusedIndexes = arr.range(0, array.length-1);
    return array.reduce(function(shuffled, ea, i) {
      var shuffledIndex = unusedIndexes.splice(Math.round(Math.random() * (unusedIndexes.length-1)), 1);
      shuffled[shuffledIndex] = ea;
      return shuffled;
    }, Array(array.length));
  },

  // -=-=-=-=-=-=-=-
  // Number related
  // -=-=-=-=-=-=-=-

  max: function(array, iterator, context) {
    // Example:
    //   var array = [{x:3,y:2}, {x:5,y:1}, {x:1,y:5}];
    //   arr.max(array, function(ea) { return ea.x; }) // => {x: 5, y: 1}
    iterator = iterator || function(x) { return x; };
    var result;
    array.reduce(function(max, ea, i) {
      var val = iterator.call(context, ea, i);
      if (typeof val !== "number" || val <= max) return max;
      result = ea; return val;
    }, -Infinity);
    return result;
  },

  min: function(array, iterator, context) {
    // Similar to `arr.max`.
    iterator = iterator || function(x) { return x; };
    return arr.max(array, function(ea, i) {
      return -iterator.call(context, ea, i); });
  },

  sum: function(array) {
    // show-in-doc
    var sum = 0;
    for (var i = 0; i < array.length; i++) sum += array[i];
    return sum;
  },

  count: function(array, item) {
    return array.reduce(function(count, ea) {
      return ea === item ? count + 1 : count; }, 0);
  },

  size: function(array) { return array.length; },

  histogram: function(data, binSpec) {
    // ignore-in-doc
    // Without a `binSpec` argument partition the data
    // var numbers = arr.genN(10, num.random);
    // var numbers = arr.withN(10, "a");
    // => [65,73,34,94,92,31,27,55,95,48]
    // => [[65,73],[34,94],[92,31],[27,55],[95,48]]
    // => [[82,50,16],[25,43,77],[40,64,31],[51,39,13],[17,34,87],[51,33,30]]
    if (typeof binSpec === 'undefined' || typeof binSpec === 'number') {
      var binNumber = binSpec || (function sturge() {
        return Math.ceil(Math.log(data.length) / Math.log(2) + 1);
      })(data);
      var binSize = Math.ceil(Math.round(data.length / binNumber));
      return arr.range(0, binNumber-1).map(function(i) {
        return data.slice(i*binSize, (i+1)*binSize);
      });
    } else if (binSpec instanceof Array) {
      // ignore-in-doc
      // bins specifies n threshold values that will create n-1 bins.
      // Each data value d is placed inside a bin i if:
      // threshold[i] >= d && threshold[i+1] < d
      var thresholds = binSpec;
      return data.reduce(function(bins, d) {
        if (d < thresholds[1]) { bins[0].push(d); return bins; }
        for (var i = 1; i < thresholds.length; i++) {
          if (d >= thresholds[i] && (!thresholds[i+1] || d <= thresholds[i+1])) {
            bins[i].push(d); return bins;
          }
        }
        throw new Error(Strings.format('Histogram creation: Cannot group data %s into thresholds %o', d, thresholds));
      }, arr.range(1,thresholds.length).map(function() { return []; }))
    }
  },

  // -=-=-=-=-
  // Copying
  // -=-=-=-=-

  clone: function(array) {
    // shallow copy
    return [].concat(array);
  },

  // -=-=-=-=-=-
  // conversion
  // -=-=-=-=-=-

  toArray: function(array) { return arr.from(array); },

  // -=-=-=-=-=-
  // DEPRECATED
  // -=-=-=-=-=-

  each: function(arr, iterator, context) {
    return arr.forEach(iterator, context);
  },

  all: function(arr, iterator, context) {
    return arr.every(iterator, context);
  },

  any: function(arr, iterator, context) {
    return arr.some(iterator, context);
  },

  collect: function(arr, iterator, context) {
    return arr.map(iterator, context);
  },

  findAll: function(arr, iterator, context) {
    return arr.filter(iterator, context);
  },

  inject: function(array, memo, iterator, context) {
    if (context) iterator = iterator.bind(context);
    return array.reduce(iterator, memo);
  },

  // asynch methods
  mapAsyncSeries: function(array, iterator, callback) {
    // Apply `iterator` over `array`. Unlike `mapAsync` the invocation of
    // the iterator happens step by step in the order of the items of the array
    // and not concurrently.

    // ignore-in-doc
    // Could simply be:
    // return exports.arr.mapAsync(array, {parallel: 1}, iterator, callback);
    // but the version below is 2x faster

    var result = [], callbackTriggered = false;
    return array.reduceRight(function(nextFunc, ea, idx) {
      if (callbackTriggered) return;
      return function(err, eaResult) {
        if (err) return maybeDone(err);
        if (idx > 0) result.push(eaResult);
        try {
          iterator(ea, idx, exports.fun.once(nextFunc));
        } catch (e) { maybeDone(e); }
      }
    }, function(err, eaResult) {
      result.push(eaResult);
      maybeDone(err, true);
    })();

    function maybeDone(err, finalCall) {
      if (callbackTriggered || (!err && !finalCall)) return;
      callbackTriggered = true;
      try { callback(err, result); } catch (e) {
        console.error("Error in mapAsyncSeries - callback invocation error:\n" + (e.stack || e));
      }
    }
  },

  mapAsync: function(array, options, iterator, callback) {
    // Apply `iterator` over `array`. In each iterator gets a callback as third
    // argument that should be called when the iteration is done. After all
    // iterators have called their callbacks, the main `callback` function is
    // invoked with the result array.
    // Example:
    // lively.lang.arr.mapAsync([1,2,3,4],
    //   function(n, i, next) { setTimeout(function() { next(null, n + i); }, 20); },
    //   function(err, result) { /* result => [1,3,5,7] */ });

    if (typeof options === "function") {
      callback = iterator;
      iterator = options;
      options = null;
    }
    options = options || {};

    if (!array.length) return callback && callback(null, []);

    if (!options.parallel) options.parallel = Infinity;

    var results = [], completed = [],
        callbackTriggered = false,
        lastIteratorIndex = 0,
        nActive = 0;

    var iterators = array.map(function(item, i) {
      return function() {
        nActive++;
        try {
          iterator(item, i, exports.fun.once(function(err, result) {
            results[i] = err || result;
            maybeDone(i, err);
          }));
        } catch (e) { maybeDone(i, e); }
      }
    });

    return activate();

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function activate() {
      while (nActive < options.parallel && lastIteratorIndex < array.length)
        iterators[lastIteratorIndex++]();
    }

    function maybeDone(idx, err) {
      if (completed.indexOf(idx) > -1) return;
      completed.push(idx);
      nActive--;
      if (callbackTriggered) return;
      if (!err && completed.length < array.length) { activate(); return; }
      callbackTriggered = true;
      try { callback && callback(err, results); } catch (e) {
        console.error("Error in mapAsync - main callback invocation error:\n" + (e.stack || e));
      }
    }
  },
}

// show-in-doc
// A Grouping is created by arr.groupBy and maps keys to Arrays.
var Group = exports.Group = function Group() {}

Group.by = exports.arr.groupBy;

Group.fromArray = function(array, hashFunc, context) {
  // Example:
  // Group.fromArray([1,2,3,4,5,6], function(n) { return n % 2; })
  // // => {"0": [2,4,6], "1": [1,3,5]}
  var grouping = new Group();
  for (var i = 0, len = array.length; i < len; i++) {
    var hash = hashFunc.call(context, array[i], i);
    if (!grouping[hash]) grouping[hash] = [];
    grouping[hash].push(array[i]);
  }
  return grouping;
}

Group.prototype.toArray = function() {
  // Example:
  // var group = arr.groupBy([1,2,3,4,5], function(n) { return n % 2; })
  // group.toArray(); // => [[2,4],[1,3,5]]
  return this.reduceGroups(function(all, _, group) {
    return all.concat([group]); }, []);
}

Group.prototype.forEach = function(iterator, context) {
  // Iteration for each item in each group, called like `iterator(groupKey, groupItem)`
  var groups = this;
  Object.keys(groups).forEach(function(groupName) {
    groups[groupName].forEach(iterator.bind(context, groupName));
  });
  return groups;
}

Group.prototype.forEachGroup = function(iterator, context) {
  // Iteration for each group, called like `iterator(groupKey, group)`
  var groups = this;
  Object.keys(groups).forEach(function(groupName) {
    iterator.call(context, groupName, groups[groupName]);
  });
  return groups;
}

Group.prototype.map = function(iterator, context) {
  // Map for each item in each group, called like `iterator(groupKey, group)`
  var result = new Group();
  this.forEachGroup(function(groupName, group) {
    result[groupName] = group.map(iterator.bind(context, groupName));
  });
  return result;
}

Group.prototype.mapGroups = function(iterator, context) {
  // Map for each group, called like `iterator(groupKey, group)`
  var result = new Group();
  this.forEachGroup(function(groupName, group) {
    result[groupName] = iterator.call(context, groupName, group);
  });
  return result;
}

Group.prototype.keys = function() {
  // show-in-docs
  return Object.keys(this);
}

Group.prototype.reduceGroups = function(iterator, carryOver, context) {
  // Reduce/fold for each group, called like `iterator(carryOver, groupKey, group)`
  this.forEachGroup(function(groupName, group) {
    carryOver = iterator.call(context, carryOver, groupName, group); });
  return carryOver;
}

Group.prototype.count = function() {
  // counts the elements of each group
  return this.reduceGroups(function(groupCount, groupName, group) {
    groupCount[groupName] = group.length;
    return groupCount;
  }, {});
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// show-in-doc
// A grid is a two-dimaensional array, representing a table-like data
var grid = exports.grid = {

  get: function(grid, nRow, nCol) {
    var row = grid[nRow];
    return row ? row[nCol] : undefined;
  },

  set: function(grid, nRow, nCol, obj) {
    var row = grid[nRow];
    if (row) row[nCol] = obj;
    return obj;
  },

  getRow: function(grid, nRow) {
    return grid[nRow];
  },

  setRow: function(grid, nRow, newRow) {
    return grid[nRow] = newRow;
  },


  getCol: function(grid, nCol) {
    return grid.reduce(function(col, row) {
      col.push(row[nCol]); return col; }, []);
  },

  setCol: function(grid, nCol, newCol) {
    return grid.map(function(row, i) {
      return row[nCol] ? row[nCol] = newCol[i] : undefined;
    });
  },

  create: function(rows, columns, initialObj) {
    // Example:
    // grid.create(3, 2, "empty")
    // // => [["empty","empty"],
    // //     ["empty","empty"],
    // //     ["empty","empty"]]
    var result = new Array(rows);
    while (rows > 0) result[--rows] = arr.withN(columns, initialObj);
    return result;
  },

  mapCreate: function(rows, cols, func, context) {
    // like `grid.create` but takes generator function for cells
    var result = new Array(rows);
    for (var i = 0; i < rows; i++) {
      result[i] = new Array(cols);
      for (var j = 0; j < cols; j ++) {
        result[i][j] = func.call(context || this, i, j);
      }
    }
    return result;
  },

  forEach: function(grid, func, context) {
    // iterate, `func` is called as `func(cellValue, i, j)`
    grid.forEach(function(row, i) {
      row.forEach(function(val, j) {
        func.call(context || this, val, i, j);
      });
    })
  },

  map: function(grid, func, context) {
    // map, `func` is called as `func(cellValue, i, j)`
    var result = new Array(grid.length);
    grid.forEach(function(row, i) {
      result[i] = new Array(row.length);
      row.forEach(function(val, j) {
        result[i][j] = func.call(context || this, val, i, j);
      });
    });
    return result;
  },

  toObjects: function(grid) {
    // The first row of the grid defines the propNames
    // for each following row create a new object with those porperties
    // mapped to the cells of the row as values
    // Example:
    // grid.toObjects([['a', 'b'],[1,2],[3,4]])
    // // => [{a:1,b:2},{a:3,b:4}]
    var props = grid[0], objects = new Array(grid.length-1);
    for (var i = 1; i < grid.length; i++) {
      var obj = objects[i-1] = {};
      for (var j = 0; j < props.length; j++) obj[props[j]] = grid[i][j];
    }
    return objects;
  },

  tableFromObjects: function(objects, valueForUndefined) {
    // Reverse operation to `grid.toObjects`. Useful for example to convert objectified
    // SQL result sets into tables that can be printed via Strings.printTable.
    // Objects are key/values like [{x:1,y:2},{x:3},{z:4}]. Keys are interpreted as
    // column names and objects as rows.
    // Example:
    // grid.tableFromObjects([{x:1,y:2},{x:3},{z:4}])
    // // => [["x","y","z"],
    // //    [1,2,null],
    // //    [3,null,null],
    // //    [null,null,4]]

    if (!Array.isArray(objects)) objects = [objects];
    var table = [[]], columns = table[0],
      rows = objects.reduce(function(rows, ea) {
        return rows.concat([Object.keys(ea).reduce(function(row, col) {
          var colIdx = columns.indexOf(col);
          if (colIdx === -1) { colIdx = columns.length; columns.push(col); }
          row[colIdx] = ea[col];
          return row;
        }, [])]);
      }, []);
    valueForUndefined = arguments.length === 1 ? null : valueForUndefined;
    rows.forEach(function(row) {
      // fill cells with no value with null
      for (var i = 0; i < columns.length; i++)
        if (!row[i]) row[i] = valueForUndefined;
    });
    return table.concat(rows);
  },

  benchmark: function() {
    // ignore-in-doc
    var results = [], t;

    var g = grid.create(1000, 200, 1),
        addNum = 0;
        t = lively.lang.fun.timeToRunN(function() {
    grid.forEach(g, function(n) { addNum += n; }) }, 10);
    results.push(exports.string.format('grid.forEach: %ims', t));

    var mapResult;
    t  = Functions.timeToRunN(function() {
      mapResult = grid.map(grid, function(n, i, j) {
        return i+j + Math.round(Math.random() * 100); });
    }, 10);
    results.push(exports.string.format('grid.map: %ims', t));

    var mapResult2 = grid.create(1000, 2000);
    t  = Functions.timeToRunN(function() {
      mapResult2 = new Array(1000);
      for (var i = 0; i < 1000; i++) mapResult2[i] = new Array(2000);
      grid.forEach(g, function(n, i, j) { mapResult2[i][j] = i+j + Math.round(Math.random() * 100); });
    }, 10);

    results.push('grid.map with forEach: ' + t + 'ms');

    results.push('--= 2012-09-22 =--\n'
          + "grid.forEach: 14.9ms\n"
          + "grid.map: 19.8ms\n"
          + "grid.map with forEach: 38.7ms\n");
    return results.join('\n');
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// show-in-doc
// Intervals are arrays whose first two elements are numbers and the
// first element should be less or equal the second element, see
// [`interval.isInterval`](). This abstraction is useful when working with text
// ranges in rich text, for example.
var interval = exports.interval = {

  isInterval: function(object) {
    // Example:
    // interval.isInterval([1,12]) // => true
    // interval.isInterval([1,12, {property: 23}]) // => true
    // interval.isInterval([1]) // => false
    // interval.isInterval([12, 1]) // => false
    return Array.isArray(object)
        && object.length >= 2
        && object[0] <= object[1];
  },

  sort: function(intervals) {
    // Sorts intervals according to rules defined in [`interval.compare`]().
    return intervals.sort(interval.compare);
  },

  compare: function(a, b) {
    // How [`interval.sort`]() compares.
    // We assume that `a[0] <= a[1] and b[0] <= b[1]` according to `isInterval`
    // ```
    // -3: a < b and non-overlapping, e.g [1,2] and [3,4]
    // -2: a < b and intervals border at each other, e.g [1,3] and [3,4]
    // -1: a < b and overlapping, e.g, [1,3] and [2,4] or [1,3] and [1,4]
    //  0: a = b, e.g. [1,2] and [1,2]
    //  1: a > b and overlapping, e.g. [2,4] and [1,3]
    //  2: a > b and share border, e.g [1,4] and [0,1]
    //  3: a > b and non-overlapping, e.g [2,4] and [0,1]
    // ```
    if (a[0] < b[0]) { // -3 || -2 || -1
      if (a[1] < b[0]) return -3;
      if (a[1] === b[0]) return -2;
      return -1;
    }
    if (a[0] === b[0]) { // -1 || 0 || 1
      if (a[1] === b[1]) return 0;
      return a[1] < b[1] ? -1 : 1;
    }
    // we know a[0] > b[0], 1 || 2 || 3
    return -1 * interval.compare(b, a);
  },

  coalesce: function(interval1, interval2, optMergeCallback) {
    // Turns two interval into one iff compare(interval1, interval2) ∈ [-2,
    // -1,0,1, 2] (see [`inerval.compare`]()).
    // Otherwise returns null. Optionally uses merge function.
    // Examples:
    //   interval.coalesce([1,4], [5,7]) // => null
    //   interval.coalesce([1,2], [1,2]) // => [1,2]
    //   interval.coalesce([1,4], [3,6]) // => [1,6]
    //   interval.coalesce([3,6], [4,5]) // => [3,6]
    var cmpResult = this.compare(interval1, interval2);
    switch (cmpResult) {
      case -3:
      case  3: return null;
      case  0:
        optMergeCallback && optMergeCallback(interval1, interval2, interval1);
        return interval1;
      case  2:
      case  1: var temp = interval1; interval1 = interval2; interval2 = temp; // swap
      case -2:
      case -1:
        var coalesced = [interval1[0], Math.max(interval1[1], interval2[1])];
        optMergeCallback && optMergeCallback(interval1, interval2, coalesced);
        return coalesced;
      default: throw new Error("Interval compare failed");
    }
  },

  coalesceOverlapping: function(intervals, mergeFunc) {
    // Like `coalesce` but accepts an array of intervals.
    // Example:
    //   interval.coalesceOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]])
    //   // => [[1,8],[9,10],[14,21]]
    var condensed = [], len = intervals.length;
    while (len > 0) {
      var ival = intervals.shift(); len--;
      for (var i = 0; i < len; i++) {
        var otherInterval = intervals[i],
            coalesced = interval.coalesce(ival, otherInterval, mergeFunc);
        if (coalesced) {
          ival = coalesced;
          intervals.splice(i, 1);
          len--; i--;
        }
      }
      condensed.push(ival);
    }
    return this.sort(condensed);
  },

  mergeOverlapping: function(intervalsA, intervalsB, mergeFunc) {
    var result = [];
    while (intervalsA.length > 0) {
      var intervalA = intervalsA.shift();

      var toMerge = intervalsB.map(function(intervalB) {
        var cmp = interval.compare(intervalA, intervalB);
        return cmp === -1 || cmp === 0 || cmp === 1;
      });

      result.push(mergeFunc(intervalA, toMerge[0]))

      result.push(intervalA);

    }
    return result;
  },

  intervalsInRangeDo: function(start, end, intervals, iterator, mergeFunc, context) {
      // Merges and iterates through sorted intervals. Will "fill up"
      // intervals. This is currently used for computing text chunks in
      // lively.morphic.TextCore.
      // Example:
      // interval.intervalsInRangeDo(
      //   2, 10, [[0, 1], [5,8], [2,4]],
      //   function(i, isNew) { i.push(isNew); return i; })
      // // => [[2,4,false],[4,5,true],[5,8,false],[8,10,true]]

    context = context || (typeof window !== 'undefined' ? window : global);
    // need to be sorted for the algorithm below
    intervals = this.sort(intervals);
    var free = [], nextInterval, collected = [];
    // merged intervals are already sorted, simply "negate" the interval array;
    while ((nextInterval = intervals.shift())) {
      if (nextInterval[1] < start) continue;
      if (nextInterval[0] < start) {
        nextInterval = Array.prototype.slice.call(nextInterval);
        nextInterval[0] = start;
      };
      var nextStart = end < nextInterval[0] ? end : nextInterval[0];
      if (start < nextStart) {
        collected.push(iterator.call(context, [start, nextStart], true));
      };
      if (end < nextInterval[1]) {
        nextInterval = Array.prototype.slice.call(nextInterval);
        nextInterval[1] = end;
      }
      // special case, the newly constructed interval has length 0,
      // happens when intervals contains doubles at the start
      if (nextInterval[0] === nextInterval[1]) {
        var prevInterval;
        if (mergeFunc && (prevInterval = collected.slice(-1)[0])) {
          // arguments: a, b, merged, like in the callback of #merge
          mergeFunc.call(context, prevInterval, nextInterval, prevInterval);
        }
      } else {
        collected.push(iterator.call(context, nextInterval, false));
      }
      start = nextInterval[1];
      if (start >= end) break;
    }
    if (start < end) collected.push(iterator.call(context, [start, end], true));
    return collected;
  },

  intervalsInbetween: function(start, end, intervals) {
    // Computes "free" intervals between the intervals given in range start - end
    // currently used for computing text chunks in lively.morphic.TextCore
    // Example:
    // interval.intervalsInbetween(0, 10,[[1,4], [5,8]])
    // // => [[0,1],[4,5],[8,10]]
    return interval
      .intervalsInRangeDo(start, end,
        interval.coalesceOverlapping(Array.prototype.slice.call(intervals)),
        function(interval, isNew) { return isNew ? interval : null })
      .filter(function(ea) { return !!ea });
  },

  mapToMatchingIndexes:  function(intervals, intervalsToFind) {
    // Returns an array of indexes of the items in intervals that match
    // items in `intervalsToFind`.
    // Note: We expect intervals and intervals to be sorted according to [`interval.compare`]()!
    // This is the optimized version of:
    // ```
    // return intervalsToFind.collect(function findOne(toFind) {
    //    var startIdx, endIdx;
    //    var start = intervals.detect(function(ea, i) {
    //       startIdx = i; return ea[0] === toFind[0]; });
    //    if (start === undefined) return [];
    //    var end = intervals.detect(function(ea, i) {
    //       endIdx = i; return ea[1] === toFind[1]; });
    //    if (end === undefined) return [];
    //    return Array.range(startIdx, endIdx);
    // });
    // ```

    var startIntervalIndex = 0, endIntervalIndex, currentInterval;
    return intervalsToFind.map(function(toFind) {
      while ((currentInterval = intervals[startIntervalIndex])) {
        if (currentInterval[0] < toFind[0]) { startIntervalIndex++; continue };
        break;
      }
      if (currentInterval && currentInterval[0] === toFind[0]) {
        endIntervalIndex = startIntervalIndex;
        while ((currentInterval = intervals[endIntervalIndex])) {
          if (currentInterval[1] < toFind[1]) { endIntervalIndex++; continue };
          break;
        }
        if (currentInterval && currentInterval[1] === toFind[1]) {
          return arr.range(startIntervalIndex, endIntervalIndex);
        }
      }
      return [];
    });
  },

  benchmark: function() {
    // ignore-in-doc
    // Used for developing the code above. If you change the code, please
    // make sure that you don't worsen the performance!
    // See also lively.lang.tests.ExtensionTests.IntervallTest
    function benchmarkFunc(name, args, n) {
      return Strings.format(
        '%s: %sms',
        name,
        Functions.timeToRunN(function() { interval[name].apply(interval, args, 100000) }, n));
    }
    return [
      "Friday, 20. July 2012:",
      "coalesceOverlapping: 0.0003ms",
      "intervalsInbetween: 0.002ms",
      "mapToMatchingIndexes: 0.02ms",
      'vs.\n' + new Date() + ":",
      benchmarkFunc("coalesceOverlapping", [[[9,10], [1,8], [3, 7], [15, 20], [14, 21]]], 100000),
      benchmarkFunc("intervalsInbetween", [0, 10, [[8, 10], [0, 2], [3, 5]]], 100000),
      benchmarkFunc("mapToMatchingIndexes", [Array.range(0, 1000).collect(function(n) { return [n, n+1] }), [[4,8], [500,504], [900,1004]]], 1000)
    ].join('\n');
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// show-in-doc
// Accessor to sub-ranges of arrays. This is used, for example, for rendering
// large lists or tables in which only a part of the items should be used for
// processing or rendering. An array projection provides convenient access and
// can apply operations to sub-ranges.
var arrayProjection = exports.arrayProjection = {

  create: function(array, length, optStartIndex) {
    // Example:
    // arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 1)
    // // => { array: [/*...*/], from: 1, to: 5 }
    var startIndex = optStartIndex || 0
    if (startIndex + length > array.length)
      startIndex -= startIndex + length - array.length;
    return {array: array, from: startIndex, to: startIndex+length}
  },

  toArray: function(projection) {
    // show-in-doc
    return projection.array.slice(projection.from, projection.to);
  },

  originalToProjectedIndex: function(projection, index) {
    // Maps index from original Array to projection.
    // Example:
    //   var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    //   arrayProjection.originalToProjectedIndex(proj, 1) // => null
    //   arrayProjection.originalToProjectedIndex(proj, 3) // => 0
    //   arrayProjection.originalToProjectedIndex(proj, 5) // => 2
    if (index < projection.from || index >= projection.to) return null;
    return index - projection.from;
  },

  projectedToOriginalIndex: function(projection, index) {
    // Inverse to `originalToProjectedIndex`.
    // Example:
    //   var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    //   arrayProjection.projectedToOriginalIndex(proj, 1) // => 4
    if (index < 0  || index > projection.to - projection.from) return null;
    return projection.from + index;
  },

  transformToIncludeIndex: function(projection, index) {
    // Computes how the projection needs to shift minimally (think "scroll"
    // down or up) so that index becomes "visible" in projection.
    // Example:
    // var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    // arrayProjection.transformToIncludeIndex(proj, 1)
    // // => { array: [/*...*/], from: 1, to: 5 }
    if (!(index in projection.array)) return null;
    var delta = 0;
    if (index < projection.from) delta = -projection.from+index;
    if (index >= projection.to) delta = index-projection.to+1;
    if (delta === 0) return projection;
    return arrayProjection.create(
      projection.array,
      projection.to-projection.from,
      projection.from+delta);
  }
}

})(typeof module !== "undefined" && module.require && typeof process !== "undefined" ?
  require('./base') :
  (typeof lively !== "undefined" && lively.lang ?
     lively.lang : {}));
