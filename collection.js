;(function(exports) {
"use strict";

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// pure JS implementations of native Array methods
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

exports.arrNative = {

    sort: function(sortFunc) {
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
        var results = [];
        for (var i = 0; i < this.length; i++) {
            if (!this.hasOwnProperty(i)) continue;
            var value = this[i];
            if (iterator.call(context, value, i)) results.push(value);
        }
        return results;
    },

    forEach: function(iterator, context) {
        for (var i = 0, len = this.length; i < len; i++) {
            iterator.call(context, this[i], i, this); }
    },

    some: function(iterator, context) {
        return this.detect(iterator, context) !== undefined;
    },

    every: function(iterator, context) {
        var result = true;
        for (var i = 0, len = this.length; i < len; i++) {
            result = result && !! iterator.call(context, this[i], i);
            if (!result) break;
        }
        return result;
    },

    map: function(iterator, context) {
        // if (typeof iterator !== 'function')
            // throw new TypeError(arguments[0] + ' is not a function');
        var results = [];
        this.forEach(function(value, index) {
            results.push(iterator.call(context, value, index));
        });
        return results;
    },

    reduce: function(iterator, memo, context) {
        var start = 0;
        if (!arguments.hasOwnProperty(1)) { start = 1; memo = this[0]; }
        for (var i = start; i < this.length; i++)
            memo = iterator.call(context, memo, this[i], i, this);
        return memo;
    },

    reduceRight: function(iterator, memo, context) {
        var start = this.length-1;
        if (!arguments.hasOwnProperty(1)) { start--; memo = this[this.length-1]; }
        for (var i = start; i >= 0; i--)
            memo = iterator.call(context, memo, this[i], i, this);
        return memo;
    }

};

exports.arr = {

    isArray: function(val) {
        return val && val.constructor.name === 'Array';
    },

    // -=-=-=-=-=-=-=-
    // array creations
    // -=-=-=-=-=-=-=-

    range: function(begin, end, step) {
        step = step || 1
        var result = [];
        for (var i = begin; i <= end; i += step)
            result.push(i);
        return result;
    },

    from: function(iterable) {
        if (!iterable) return [];
        if (iterable.toArray) return iterable.toArray();
        var length = iterable.length,
            results = new Array(length);
        while (length--) results[length] = iterable[length];
        return results;
    },

    withN: function(n, obj) {
        var result = new Array(n);
        while (n > 0) result[--n] = obj;
        return result;
    },

    genN: function(n, generator) {
        var result = new Array(n);
        while (n > 0) result[--n] = generator(n);
        return result;
    },

    // -=-=-=-=-=-=-=-
    // array methods
    // -=-=-=-=-=-=-=-

    sort: function(arr, sortFunc) {
        return arr.sort(sortFunc);
    },

    filter: function(arr, iterator, context) {
        return arr.filter(iterator, context);
    },

    forEach: function(arr, iterator, context) {
        return arr.forEach(iterator, context);
    },

    some: function(arr, iterator, context) {
        return arr.some(iterator, context);
    },

    every: function(arr, iterator, context) {
        return arr.every(iterator, context);
    },

    map: function(arr, iterator, context) {
        return arr.map(iterator, context);
    },

    reduce: function(arr, iterator, memo, context) {
        return arr.reduce(iterator, memo, context);
    },

    reduceRight: function(arr, iterator, memo, context) {
        return arr.reduceRight(iterator, memo, context);
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    detect: function(arr,iterator, context) {
        for (var value, i = 0, len = arr.length; i < len; i++) {
            value = arr[i];
            if (iterator.call(context, value, i)) return value;
        }
        return undefined;
    },

    filterByKey: function(arr, key) {
        return arr.filter(function(ea) { return !!ea[key]; });
    },

    grep: function(arr, filter, iterator, context) {
        iterator = iterator || function(x) { return x; };
        var results = [];
        if (Object.isString(filter)) filter = new RegExp(filter, 'i');
        arr.forEach(function(value, index) {
            if (filter.test(value)) results.push(iterator.call(context, value, index));
        });
        return results;
    },

    reMatches: function(arr, re, stringifier) {
        // convert each element in arr into a string and apply re to match it.
        // result might include null items if re did not match (usful for masking)
        // Example:
        //   var morphs = $world.withAllSubmorphsDo(function(x) { return x; ;
        //   morphs.mask(morphs.reMatches(/code/i))
        stringifier = stringifier || String
        return arr.map(function(ea) { return stringifier(ea).match(re); });
    },

    include: function(arr, object) { return arr.indexOf(object) !== -1 },

    inject: function(arr, memo, iterator, context) {
        if (context) iterator = iterator.bind(context);
        return arr.reduce(iterator, memo);
    },

    invoke: function(arr, method, arg1, arg2, arg3, arg4, arg5, arg6) {
        var result = new Array(arr.length);
        for (var i = 0, len = arr.length; i < len; i++) {
            result[i] = arr[i][method].call(arr[i], arg1, arg2, arg3, arg4, arg5, arg6);
        }
        return result;
    },

    max: function(a, iterator, context) {
        iterator = iterator || function(x) { return x; };
        var result;
        a.reduce(function(max, ea, i) {
            var val = iterator.call(context, ea, i);
            if (typeof val !== "number" || val <= max) return max;
            result = ea; return val;
        }, -Infinity);
        return result;
    },

    min: function(a, iterator, context) {
        iterator = iterator || function(x) { return x; };
        return exports.arr.max(a, function(ea, i) {
            return -iterator.call(context, ea, i); });
    },

    partition: function(arr, iterator, context) {
        iterator = iterator || function(x) { return x; };
        var trues = [], falses = [];
        arr.forEach(function(value, index) {
            (iterator.call(context, index) ? trues : falses).push(value);
        });
        return [trues, falses];
    },

    pluck: function(arr, property) {
        var result = new Array(arr.length);
        for (var i = 0; i < arr.length; i++) {
            result[i] = arr[i][property]; }
        return result;
    },

    reject: function(arr, func, context) {
        function iterator(val, i) { return !func.call(context, val, i); }
        return arr.filter(iterator);
    },

    rejectByKey: function(arr, key) {
        return arr.filter(function(ea) { return !ea[key]; });
    },

    sortBy: function(arr, iterator, context) {
        return arr.map(function(value, index) {
            return {
                value: value,
                criteria: iterator.call(context, value, index)
            };
        }).sort(function(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
    },

    sortByKey: function(arr, key) {
        return exports.Array.sortBy(arr, function(ea) { return ea[key]; });
    },

    toArray: function(arr) { return arr; },

    zip: function(/*arr, arr2, arr3*/) {
        var iterator = function(x) { return x; },
            args = Array.from(arguments),
            arr = args.shift();
        if (Object.isFunction(args.last())) iterator = args.pop();
        var collections = [arr].concat(args).map(Array.from);
        return arr.map(function(value, index) {
            return iterator(collections.pluck(index)); });
    },

    clear: function(arr) { arr.length = 0; return arr; },

    first: function(arr) { return arr[0]; },

    last: function(arr) { return arr[arr.length - 1]; },

    compact: function(arr) { return arr.filter(function(ea) { return !!ea; }); },

    mutableCompact: function(arr) {
        // fix gaps that were created with 'delete'
        var i = 0, j = 0, len = arr.length;
        while (i < len) {
            if (arr.hasOwnProperty(i)) arr[j++] = arr[i];
            i++;
        }
        while (j++ < len) arr.pop();
        return arr;
    },

    flatten: function flatten(arr) {
        return arr.reduce(function(array, value) {
            return array.concat(
                exports.arr.isArray(value) ?
                    flatten(value) : [value]);
        }, []);
    },

    without: function(arr, elem) {
        return arr.filter(function(value) { return value !== elem; });
    },

    withoutAll: function(arr, otherArr) {
        return arr.filter(function(value) {
            return otherArr.indexOf(value) === -1;
        });
    },

    uniq: function(arr, sorted) {
        return arr.inject([], function(array, value, index) {
            if (0 === index || (sorted ? array.last() != value : !array.include(value))) array.push(value);
            return array;
        });
    },

    uniqBy: function(arr, comparator, context) {
        // comparator(a,b) returns BOOL. True if a and be should be regarded
        // equal, false otherwise
        var result = exports.arr.clone(arr);
        for (var i = 0; i < result.length; i++) {
            var item = arr[i];
            for (var j = i+1; j < result.length; j++) {
                if (comparator.call(context, item, result[j])) {
                    exports.arr.removeAt(result, j); j--;
                }
            }
        }
        return result;
    },

    equals: function(arr, otherArray) {
        var len = arr.length;
        if (!otherArray || len !== otherArray.length) return false;
        for (var i = 0; i < len; i++) {
            if (arr[i] && otherArray[i] && arr[i].equals && otherArray[i].equals) {
                if (!arr[i].equals(otherArray[i])) {
                    return false;
                } else {
                    continue;
                }
            }
            if (arr[i] != otherArray[i]) return false;
        }
        return true;
    },

    intersect: function(arr, array) {
        return exports.Array.uniq(arr).filter(function(item) {
            return array.indexOf(item) > -1;
        });
    },

    union: function(arr, array) {
        var result = exports.Array.clone(arr);
        for (var i = 0; i < array.length; i++) {
            var item = array[i];
            if (result.indexOf(item) === -1) result.push(item);
        }
        return result;
    },

    clone: function(arr) { return [].concat(arr); },

    pushAt: function(arr, item, index) {
        arr.splice(index, 0, item);
    },

    removeAt: function(arr, index) {
        arr.splice(index, 1);
    },

    remove: function(arr, item) {
        var index = arr.indexOf(item);
        if (index >= 0) exports.Array.removeAt(arr, index);
        return item;
    },

    pushAll: function(arr, items) {
        for (var i = 0; i < items.length; i++)
        arr.push(items[i]);
        return arr;
    },

    pushAllAt: function(arr, items, idx) {
        arr.splice.apply(arr, [idx, 0].concat(items))
    },

    pushIfNotIncluded: function(arr, item) {
        if (!exports.Array.include(arr, item)) arr.push(item);
    },

    replaceAt: function(arr, item, index) { arr.splice(index, 1, item); },

    nestedDelay: function(arr, iterator, waitSecs, endFunc, context, optSynchronChunks) {
        // calls iterator for every element in arr and waits between iterator
        // calls waitSecs. eventually endFunc is called. When passing a number n
        // as optSynchronChunks, only every nth iteration is delayed
        endFunc = endFunc || function() {};
        return arr.clone().reverse().inject(endFunc, function(nextFunc, ea, idx) {
            return function() {
                iterator.call(context || Global, ea, idx);
                // only really delay every n'th call optionally
                if (optSynchronChunks && (idx % optSynchronChunks !== 0)) {
                    nextFunc()
                } else {
                    nextFunc.delay(waitSecs);
                }
            }
        })();
    },

    doAndContinue: function(arr, iterator, endFunc, context) {
        // iterates over arr but instead of consecutively calling iterator,
        // iterator gets passed in the invocation for the next iteration step
        // as a function as first parameter. This allows to wait arbitrarily
        // between operation steps, great for synchronous dependent steps
        endFunc = endFunc || Functions.Null;
        context = context || Global;
        iterator = iterator || function(next, ea, idx) { ea.call(context, next, idx); };
        return arr.reduceRight(function(nextFunc, ea, idx) {
            return function() { iterator.call(context, nextFunc, ea, idx); }
        }, endFunc)();
    },

    forEachShowingProgress: function(/*arr, progressBar, iterator, labelFunc, whenDoneFunc, context or spec*/) {
        var args = Array.from(arguments),
            arr = args.shift(),
            steps = arr.length,
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
        if (!context) context = Global;
        if (!labelFunc) labelFunc = function(x) { return x; };

        // init progressbar
        if (!progressBar) {
            progressBarAdded = true;
            var world = Global.lively && lively.morphic && lively.morphic.World.current();
            progressBar = world ? world.addProgressBar() : {
                setValue: function(val) {},
                setLabel: function() {},
                remove: function() {}
            };
        }
        progressBar.setValue(0);

        // nest functions so that the iterator calls the next after a delay
        (arr.reduceRight(function(nextFunc, item, idx) {
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
            if (progressBarAdded) (function() { debugger; progressBar.remove(); }).delay(0);
            if (whenDoneFunc) whenDoneFunc.call(context);
        }))();

        return arr;
    },

    sum: function(arr) {
        var sum = 0;
        for (var i = 0; i < arr.length; i++) sum += arr[i];
        return sum;
    },

    swap: function(array, index1, index2) {
        if (index1 < 0) index1 = array.length + index1;
        if (index2 < 0) index2 = array.length + index2;
        var temp = array[index1];
        array[index1] = array[index2];
        array[index2] = temp;
        return array;
    },

    rotate: function(arr, times) {
        times = times || 1;
        return arr.slice(times).concat(arr.slice(0,times));
    },

    groupBy: function(arr, iterator, context) {
        return exports.group.fromArray(arr, iterator, context);
    },

    groupByKey: function(arr, key) {
        return exports.arr.groupBy(arr, function(ea) { return ea[key]; });
    },

    batchify: function(arr, constrainedFunc, context) {
        // takes elements and fits them into subarrays (=batches) so that for
        // each batch constrainedFunc returns true. Note that contrained func
        // should at least produce 1-length batches, otherwise an error is raised
        // see [$world.browseCode("lively.lang.tests.ExtensionTests.ArrayTest", "testBatchify", "lively.lang.tests.ExtensionTests")]
        // for an example
        function extractBatch(batch, sizes) {
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
        return findBatches([], arr);
    },

    mask: function(arr, mask) {
        // select every element in arr for which arr's element is truthy
        // Example: [1,2,3].mask([false, true, false]) => [2]
        return arr.filter(function(_, i) { return !!mask[i]; });
    },

    toTuples: function(arr, tupleLength) {
        tupleLength = tupleLength || 1;
        return exports.arr.range(0,Math.ceil(arr.length/tupleLength)-1).map(function(n) {
            return arr.slice(n*tupleLength, n*tupleLength+tupleLength);
        }, arr);
    },

    shuffle: function(arr) {
        var unusedIndexes = exports.arr.range(0, arr.length-1);
        return arr.reduce(function(shuffled, ea, i) {
            var shuffledIndex = unusedIndexes.splice(Math.round(Math.random() * (unusedIndexes.length-1)), 1);
            shuffled[shuffledIndex] = ea;
            return shuffled;
        }, Array(arr.length));
    },

    histogram: function(arr, binSpec) {
        var data = arr;

        if (typeof binSpec === 'undefined' || typeof binSpec === 'number') {
            var binNumber = binSpec || (function sturge() {
                return Math.ceil(Math.log(data.length) / Math.log(2) + 1);
            })(data);
            var binSize = Math.ceil(Math.round(data.length / binNumber));
            return exports.arr.range(0, binNumber-1).map(function(i) {
                return data.slice(i*binSize, (i+1)*binSize);
            });
        } else if (binSpec instanceof Array) {
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
            }, exports.arr.range(1,thresholds.length).map(function() { return []; }))
        }
    }

}

// // alias
// Object.extend(Array.prototype, {

//     each: Array.prototype.forEach || NativeArrayFunctions.forEach,

//     all: Array.prototype.every || NativeArrayFunctions.every,

//     any: Array.prototype.some || NativeArrayFunctions.some,

//     collect: Array.prototype.map || NativeArrayFunctions.map,

//     findAll: Array.prototype.filter || NativeArrayFunctions.filter,

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Grouping
// A Grouping is created by Array>>groupBy and maps keys
// to Arrays
exports.group = function Group(arr, hashFunc, context) {}

exports.group.by = exports.arr.groupBy;

exports.group.fromArray = function(arr, hashFunc, context) {
    var grouping = new exports.group();
    for (var i = 0, len = arr.length; i < len; i++) {
        var hash = hashFunc.call(context, arr[i], i);
        if (!grouping[hash]) grouping[hash] = [];
        grouping[hash].push(arr[i]);
    }
    return grouping;
}

exports.group.prototype.toArray = function() {
    return this.reduceGroups(function(all, _, group) {
        return all.concat([group]); }, []);
}


exports.group.prototype.forEach = function(iterator, context) {
    var groups = this;
    Object.keys(groups).forEach(function(groupName) {
        groups[groupName].forEach(iterator.curry(groupName, context));
    });
    return groups;
}

exports.group.prototype.forEachGroup = function(iterator, context) {
    var groups = this;
    Object.keys(groups).forEach(function(groupName) {
        iterator.call(context, groupName, groups[groupName]);
    });
    return groups;
}

exports.group.prototype.map = function(iterator, context) {
    var result = new exports.group();
    this.forEachGroup(function(groupName, group) {
        result[groupName] = group.map(iterator.bind(context, groupName));
    });
    return result;
}

exports.group.prototype.mapGroups = function(iterator, context) {
    var result = new exports.group();
    this.forEachGroup(function(groupName, group) {
        result[groupName] = iterator.call(context, groupName, group);
    });
    return result;
}

exports.group.prototype.keys = function() { return Object.keys(this); }

exports.group.prototype.reduceGroups = function(iterator, carryOver, context) {
    this.forEachGroup(function(groupName, group) {
        carryOver = iterator.call(context, carryOver, groupName, group); });
    return carryOver;
}

exports.group.prototype.count = function() {
    return this.reduceGroups(function(groupCount, groupName, group) {
        groupCount[groupName] = group.length;
        return groupCount;
    }, {});
}

// ///////////////////////////////////////////////////////////////////////////////
// // Global Helper - Arrays
// ///////////////////////////////////////////////////////////////////////////////

// Global.Arrays = {
//     equal: function(firstArray, secondArray) {
//         // deprecated, use anArray.equals
//         return firstArray.equals(secondArray);
//     }
// }

// Global.Grid = {

//     create: function(rows, columns, initialObj) {
//         var result = new Array(rows);
//         while (rows > 0) result[--rows] = Array.withN(columns, initialObj);
//         return result;
//     },

//     mapCreate: function(rows, cols, func, context) {
//         var result = new Array(rows);
//         for (var i = 0; i < rows; i++) {
//             result[i] = new Array(cols);
//             for (var j = 0; j < cols; j ++) {
//                 result[i][j] = func.call(context || this, i, j);
//             }
//         }
//         return result;
//     },

//     forEach: function(grid, func, context) {
//         grid.forEach(function(row, i) {
//             row.forEach(function(val, j) {
//                 func.call(context || this, val, i, j);
//             });
//         })
//     },

//     map: function(grid, func, context) {
//         var result = new Array(grid.length);
//         grid.forEach(function(row, i) {
//             result[i] = new Array(row.length);
//             row.forEach(function(val, j) {
//                 result[i][j] = func.call(context || this, val, i, j);
//             });
//         });
//         return result;
//     },

//     toObjects: function(grid) {
//         // the first row of the grid defines the propNames
//         // for each following row create a new object with those porperties
//         // mapped to the cells of the row as values
//         // Grid.toObjects([['a', 'b'],[1,2],[3,4]])
//         //   --> [{a:1,b:2},{a:3,b:4}]
//         var props = grid[0], objects = new Array(grid.length-1);
//         for (var i = 1; i < grid.length; i++) {
//             var obj = objects[i-1] = {};
//             for (var j = 0; j < props.length; j++) obj[props[j]] = grid[i][j];
//         }
//         return objects;
//     },

//     tableFromObjects: function(objects, valueForUndefined) {
//         // reverse of Grid.toObjects
//         // useful to convert objectified SQL resultset into table that can be
//         // printed via Strings.printTable. objects are key/values like [{x:1,y:2},{x:3},{z:4}]
//         // interpret the keys as column names and add ea objects values as cell
//         // values of a new row. For the example object this would create the
//         // table: [["x","y","z"],[1,2,null],[3,null,null],[null,null,4]]
//         if (!Object.isArray(objects)) objects = [objects];
//         var table = [[]], columns = table[0],
//             rows = objects.inject([], function(rows, ea) {
//                 return rows.concat([Object.keys(ea).inject([], function(row, col) {
//                     var colIdx = columns.indexOf(col);
//                     if (colIdx === -1) { colIdx = columns.length; columns.push(col); }
//                     row[colIdx] = ea[col];
//                     return row;
//                 })]);
//             });
//         valueForUndefined = arguments.length === 1 ? null : valueForUndefined;
//         rows.forEach(function(row) {
//             // fill cells with no value with null
//             for (var i = 0; i < columns.length; i++) if (!row[i]) row[i] = valueForUndefined;
//         });
//         return table.concat(rows);
//     },

//     benchmark: function() {
//         var results = [], t;

//         var grid = Grid.create(1000, 200, 1),
//             addNum = 0;
//         t  = Functions.timeToRunN(function() {
//             Grid.forEach(grid, function(n) { addNum += n; }) }, 10);
//         results.push(Strings.format('Grid.forEach: %ims', t));


//         var mapResult;
//         t  = Functions.timeToRunN(function() {
//             mapResult = Grid.map(grid, function(n, i, j) { return Numbers.random(i+j); });
//         }, 10);
//         results.push(Strings.format('Grid.map: %ims', t));

//         var mapResult2 = Grid.create(1000, 2000);
//         t  = Functions.timeToRunN(function() {
//             mapResult2 = new Array(1000);
//             for (var i = 0; i < 1000; i++) mapResult2[i] = new Array(2000);
//             Grid.forEach(grid, function(n, i, j) { mapResult2[i][j] = Numbers.random(i+j); });
//         }, 10);

//         results.push(Strings.format('Grid.map with forEach: %ims', t));

//         results.push('--= 2012-09-22 =--\n'
//                     + "Grid.forEach: 14.9ms\n"
//                     + "Grid.map: 19.8ms\n"
//                     + "Grid.map with forEach: 38.7ms\n")
//         return results.join('\n');
//     }
// }

// // Intervals are arrays whose first two elements are numbers and the
// // first element should be less or equal the second element, see
// // #isInterval
// var Interval = {

//     isInterval: function(object) {
//         return Object.isArray(object) && object.length >= 2 && object[0] <= object[1];
//     },

//     compare: function(a, b) {
//         // we assume that a[0] <= a[1] and b[0] <= b[1]
//         // -3: a < b and non-overlapping, e.g [1,2] and [3,4]
//         // -2: a < b and intervals border at each other, e.g [1,3] and [3,4]
//         // -1: a < b and overlapping, e.g, [1,3] and [2,4] or [1,3] and [1,4]
//         //  0: a = b, e.g. [1,2] and [1,2]
//         //  1: a > b and overlapping, e.g. [2,4] and [1,3]
//         //  2: a > b and share border, e.g [1,4] and [0,1]
//         //  3: a > b and non-overlapping, e.g [2,4] and [0,1]
//         if (a[0] < b[0]) { // -3 || -2 || -1
//             if (a[1] < b[0]) return -3;
//             if (a[1] === b[0]) return -2;
//             return -1;
//         }
//         if (a[0] === b[0]) { // -1 || 0 || 1
//             if (a[1] === b[1]) return 0;
//             return a[1] < b[1] ? -1 : 1;
//         }
//         // we know a[0] > b[0], 1 || 2 || 3
//         return -1 * Interval.compare(b, a);
//     },

//     sort: function(intervals) { return intervals.sort(Interval.compare); },

//     coalesce: function(interval1, interval2, optMergeCallback) {
//         // turns two arrays into one iff compare(interval1, interval2) ∈ [-2, -1,0,1, 2]
//         // otherwise returns null
//         // optionally uses merge function
//         // [1,4], [5,7] => null
//         // [1,2], [1,2] => [1,2]
//         // [1,4], [3,6] => [1,6]
//         // [3,6], [4,5] => [3,6]
//         var cmpResult = this.compare(interval1, interval2);
//         switch (cmpResult) {
//             case -3:
//             case  3: return null;
//             case  0:
//                 optMergeCallback && optMergeCallback(interval1, interval2, interval1);
//                 return interval1;
//             case  2:
//             case  1: var temp = interval1; interval1 = interval2; interval2 = temp; // swap
//             case -2:
//             case -1:
//                 var coalesced = [interval1[0], Math.max(interval1[1], interval2[1])];
//                 optMergeCallback && optMergeCallback(interval1, interval2, coalesced);
//                 return coalesced;
//             default: throw new Error("Interval compare failed");
//         }
//     },

//     coalesceOverlapping: function(intervals, mergeFunc) {
//         // accepts an array of intervals
//         // [[9,10], [1,8], [3, 7], [15, 20], [14, 21]] => [[1, 8], [9, 10], [14, 21]]
//         var condensed = [], len = intervals.length;
//         while (len > 0) {
//             var interval = intervals.shift(); len--;
//             for (var i = 0; i < len; i++) {
//                 var otherInterval = intervals[i],
//                     coalesced = Interval.coalesce(interval, otherInterval, mergeFunc);
//                 if (coalesced) {
//                     interval = coalesced;
//                     intervals.splice(i, 1);
//                     len--; i--;
//                 }
//             }
//             condensed.push(interval);
//         }
//         return this.sort(condensed);
//     },

//     mergeOverlapping: function(intervalsA, intervalsB, mergeFunc) {
//         var result = [];
//         while (intervalsA.length > 0) {
//             var intervalA = intervalsA.shift();

//             var toMerge = intervalsB.collect(function(intervalB) {
//                 var cmp = Interval.compare(intervalA, intervalB);
//                 return cmp === -1 || cmp === 0 || cmp === 1;
//             });

//             result.push(mergeFunc(intervalA, toMerge[0]))

//             result.push(intervalA);

//         }
//         return result;
//         // intervalsB.forEach(function(intervalB) {
//         //     var overlapping = intervalsA.select(function(intervalA) {
//         //         var cmp = Interval.compare(intervalA, intervalB);
//         //         if (cmp == -1 || cmp == 0 || cmp == 1) {

//         //         }
//         //     });
//         // });

//         return intervalsA;

//         if (!mergeFunc) return intervals;
//         // return intervals.collect(function);

//         var condensed = [], len = intervals.length;
//         while (len > 0) {
//             var interval = intervals.shift(); len--;
//             for (var i = 0; i < len; i++) {
//                 var otherInterval = intervals[i],
//                     overlap = this.compare(otherInterval, interval),
//                     merged;
//                 if (overlap === -1 || overlap === 1 || overlap === 0) {
//                     merged = mergeFunc(interval, otherInterval);
//                     // remove otherInterval and add merged
//                     intervals.splice(i, 1, merged);
//                     len += merged.length - 1;
//                     i--;
//                     interval = merged[i];
//                 } else {
//                     // condensed.push(interval);
//                 }
//                 interval = otherInterval;
//             }
//         }
//         return this.sort(condensed);

//         // // accepts an array of intervals
//         // // [[9,10], [1,8], [3, 7], [15, 20], [14, 21]] => [[1, 8], [9, 10], [14, 21]]
//         var merged = [], len = intervals.length,
//             unshiftAll = merged.splice.bind(merged, 0, 0);
//         while (len > 0) {
//             var interval = intervals.pop(); len--;
//             for (var i = len-1; i >= 0; i--) {
//                 var otherInterval = intervals[i],
//                     overlap = this.compare(otherInterval, interval);
//                 if (overlap === -1 || overlap === 1 || overlap === 0) {
//                     unshiftAll(mergeFunc(otherInterval, interval));
//                 } else {
//                     merged.unshift(interval);
//                 }
//                 if (coalesced) {
//                     interval = coalesced;
//                     intervals.splice(i, 1);
//                     len--; i--;
//                 }
//             }
//             condensed.push(interval);
//         }
//         return this.sort(condensed);
//     },

//     intervalsInRangeDo: function(start, end, intervals, iterator, mergeFunc, context) {
//         /*
//          * merges and iterates through sorted intervals. Will "fill up" intervals, example:
//           Strings.print(Interval.intervalsInRangeDo(
//                          2, 10, [[0, 1], [5,8], [2,4]],
//                          function(i, isNew) { i.push(isNew); return i; }));
//          *  => "[[2,4,false],[4,5,true],[5,8,false],[8,10,true]]"
//          * this is currently used for computing text chunks in lively.morphic.TextCore
//          */
//         context = context || Global;
//         // need to be sorted for the algorithm below
//         intervals = this.sort(intervals);
//         var free = [], nextInterval, collected = [];
//         // merged intervals are already sorted, simply "negate" the interval array;
//         while ((nextInterval = intervals.shift())) {
//             if (nextInterval[1] < start) continue;
//             if (nextInterval[0] < start) {
//                 nextInterval = nextInterval.clone();
//                 nextInterval[0] = start;
//             };
//             var nextStart = end < nextInterval[0] ? end : nextInterval[0];
//             if (start < nextStart) {
//                 collected.push(iterator.call(context, [start, nextStart], true));
//             };
//             if (end < nextInterval[1]) {
//                 nextInterval = nextInterval.clone();
//                 nextInterval[1] = end;
//             }
//             // special case, the newly constructed interval has length 0,
//             // happens when intervals contains doubles at the start
//             if (nextInterval[0] === nextInterval[1]) {
//                 var prevInterval;
//                 if (mergeFunc && (prevInterval = collected.last())) {
//                     // arguments: a, b, merged, like in the callback of #merge
//                     mergeFunc.call(context, prevInterval, nextInterval, prevInterval);
//                 }
//             } else {
//                 collected.push(iterator.call(context, nextInterval, false));
//             }
//             start = nextInterval[1];
//             if (start >= end) break;
//         }
//         if (start < end) collected.push(iterator.call(context, [start, end], true));
//         return collected;
//     },

//     intervalsInbetween: function(start, end, intervals) {
//         // computes "free" intervals between the intervals given in range start - end
//         // currently used for computing text chunks in lively.morphic.TextCore
//         // start = 0, end = 10, intervals = [[1,4], [5,8]]
//         // => [[0,1], [4, 5], [8, 10]]
//         //
//         var merged = Interval.coalesceOverlapping(intervals.clone());
//         return this.intervalsInRangeDo(start, end, merged, function(intervall, isNew) {
//             return isNew ? intervall : null
//         }).select(function(ea) { return !!ea });
//     },

//     mapToMatchingIndexes:  function(intervals, intervalsToFind) {
//         // returns an array of indexes of the items in intervals that match
//         // items in intervalsToFind
//         // Note: we expect intervals and intervals to be sorted according to Interval.compare!
//         // This is the optimized version of:
//         // return intervalsToFind.collect(function findOne(toFind) {
//         //     var startIdx, endIdx;
//         //     var start = intervals.detect(function(ea, i) {
//         //         startIdx = i; return ea[0] === toFind[0]; });
//         //     if (start === undefined) return [];
//         //     var end = intervals.detect(function(ea, i) {
//         //         endIdx = i; return ea[1] === toFind[1]; });
//         //     if (end === undefined) return [];
//         //     return Array.range(startIdx, endIdx);
//         // });

//         var startIntervalIndex = 0, endIntervalIndex, currentInterval;
//         return intervalsToFind.collect(function(toFind) {
//             while ((currentInterval = intervals[startIntervalIndex])) {
//                 if (currentInterval[0] < toFind[0]) { startIntervalIndex++; continue };
//                 break;
//             }
//             if (currentInterval && currentInterval[0] === toFind[0]) {
//                 endIntervalIndex = startIntervalIndex;
//                 while ((currentInterval = intervals[endIntervalIndex])) {
//                     if (currentInterval[1] < toFind[1]) { endIntervalIndex++; continue };
//                     break;
//                 }
//                 if (currentInterval && currentInterval[1] === toFind[1]) {
//                     return Array.range(startIntervalIndex, endIntervalIndex);
//                 }
//             }
//             return [];
//         });
//     },

//     benchmark: function() {
//         // Used for developing the code above. If you change the code, please
//         // make sure that you don't worsen the performance!
//         // See also lively.lang.tests.ExtensionTests.IntervallTest
//         function benchmarkFunc(name, args, n) {
//             return Strings.format(
//                 '%s: %sms',
//                 name,
//                 Functions.timeToRunN(function() { Interval[name].apply(Interval, args, 100000) }, n));
//         }
//         return [
//             "Friday, 20. July 2012:",
//             "coalesceOverlapping: 0.0003ms",
//             "intervalsInbetween: 0.002ms",
//             "mapToMatchingIndexes: 0.02ms",
//             'vs.\n' + new Date() + ":",
//             benchmarkFunc("coalesceOverlapping", [[[9,10], [1,8], [3, 7], [15, 20], [14, 21]]], 100000),
//             benchmarkFunc("intervalsInbetween", [0, 10, [[8, 10], [0, 2], [3, 5]]], 100000),
//             benchmarkFunc("mapToMatchingIndexes", [Array.range(0, 1000).collect(function(n) { return [n, n+1] }), [[4,8], [500,504], [900,1004]]], 1000)
//         ].join('\n');
//     }
// }

// // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// lively.ArrayProjection = {

//     create: function(array, length, optStartIndex) {
//         var startIndex = optStartIndex || 0
//         if (startIndex + length > array.length)
//             startIndex -= startIndex + length - array.length;
//         return {array: array, from: startIndex, to: startIndex+length}
//     },

//     toArray: function(projection) {
//         return projection.array.slice(projection.from, projection.to);
//     },

//     originalToProjectedIndex: function(projection, index) {
//         if (index < projection.from || index >= projection.to) return null;
//         return index - projection.from;
//     },

//     projectedToOriginalIndex: function(projection, index) {
//         if (index < 0  || index > projection.to - projection.from) return null;
//         return projection.from + index;
//     },

//     transformToIncludeIndex: function(projection, index) {
//         if (!(index in projection.array)) return null;
//         var delta = 0;
//         if (index < projection.from) delta = -projection.from+index;
//         if (index >= projection.to) delta = index-projection.to+1;
//         if (delta === 0) return projection;
//         return this.create(
//             projection.array,
//             projection.to-projection.from,
//             projection.from+delta);
//     }
// }

})(typeof jsext !== 'undefined' ? jsext : this);
