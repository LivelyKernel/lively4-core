## lib/collection.js

Methods to make working with arrays more convenient and collection-like
abstractions for groups, intervals, grids.


- [arrNative](#arrNative)
  - [sort](#arrNative-sort)
  - [filter](#arrNative-filter)
  - [forEach](#arrNative-forEach)
  - [some](#arrNative-some)
  - [every](#arrNative-every)
  - [map](#arrNative-map)
  - [reduce](#arrNative-reduce)
  - [reduceRight](#arrNative-reduceRight)
- [arr](#arr)
  - [range](#arr-range)
  - [from](#arr-from)
  - [withN](#arr-withN)
  - [genN](#arr-genN)
  - [filter](#arr-filter)
  - [detect](#arr-detect)
  - [filterByKey](#arr-filterByKey)
  - [grep](#arr-grep)
  - [mask](#arr-mask)
  - [reject](#arr-reject)
  - [rejectByKey](#arr-rejectByKey)
  - [without](#arr-without)
  - [withoutAll](#arr-withoutAll)
  - [uniq](#arr-uniq)
  - [uniqBy](#arr-uniqBy)
  - [compact](#arr-compact)
  - [mutableCompact](#arr-mutableCompact)
  - [forEach](#arr-forEach)
  - [zip](#arr-zip)
  - [flatten](#arr-flatten)
  - [interpose](#arr-interpose)
  - [map](#arr-map)
  - [invoke](#arr-invoke)
  - [pluck](#arr-pluck)
  - [reduce](#arr-reduce)
  - [reduceRight](#arr-reduceRight)
  - [include](#arr-include)
  - [some](#arr-some)
  - [every](#arr-every)
  - [equals](#arr-equals)
  - [sort](#arr-sort)
  - [sortBy](#arr-sortBy)
  - [sortByKey](#arr-sortByKey)
  - [reMatches](#arr-reMatches)
  - [intersect](#arr-intersect)
  - [union](#arr-union)
  - [pushAt](#arr-pushAt)
  - [removeAt](#arr-removeAt)
  - [remove](#arr-remove)
  - [pushAll](#arr-pushAll)
  - [pushAllAt](#arr-pushAllAt)
  - [pushIfNotIncluded](#arr-pushIfNotIncluded)
  - [replaceAt](#arr-replaceAt)
  - [clear](#arr-clear)
  - [doAndContinue](#arr-doAndContinue)
  - [nestedDelay](#arr-nestedDelay)
  - [swap](#arr-swap)
  - [rotate](#arr-rotate)
  - [groupBy](#arr-groupBy)
  - [groupByKey](#arr-groupByKey)
  - [partition](#arr-partition)
  - [batchify](#arr-batchify)
  - [toTuples](#arr-toTuples)
  - [shuffle](#arr-shuffle)
  - [max](#arr-max)
  - [min](#arr-min)
  - [sum](#arr-sum)
  - [clone](#arr-clone)
  - [mapAsyncSeries](#arr-mapAsyncSeries)
  - [mapAsync](#arr-mapAsync)
- [Group](#Group)
  - [fromArray](#Group-fromArray)
- [Group.prototype](#Group.prototype)
  - [toArray](#Group.prototype-toArray)
  - [forEach](#Group.prototype-forEach)
  - [forEachGroup](#Group.prototype-forEachGroup)
  - [map](#Group.prototype-map)
  - [mapGroups](#Group.prototype-mapGroups)
  - [keys](#Group.prototype-keys)
  - [reduceGroups](#Group.prototype-reduceGroups)
  - [count](#Group.prototype-count)
- [grid](#grid)
  - [create](#grid-create)
  - [mapCreate](#grid-mapCreate)
  - [forEach](#grid-forEach)
  - [map](#grid-map)
  - [toObjects](#grid-toObjects)
  - [tableFromObjects](#grid-tableFromObjects)
- [interval](#interval)
  - [isInterval](#interval-isInterval)
  - [sort](#interval-sort)
  - [compare](#interval-compare)
  - [coalesce](#interval-coalesce)
  - [coalesceOverlapping](#interval-coalesceOverlapping)
  - [intervalsInRangeDo](#interval-intervalsInRangeDo)
  - [intervalsInbetween](#interval-intervalsInbetween)
  - [mapToMatchingIndexes](#interval-mapToMatchingIndexes)
- [arrayProjection](#arrayProjection)
  - [create](#arrayProjection-create)
  - [toArray](#arrayProjection-toArray)
  - [originalToProjectedIndex](#arrayProjection-originalToProjectedIndex)
  - [projectedToOriginalIndex](#arrayProjection-projectedToOriginalIndex)
  - [transformToIncludeIndex](#arrayProjection-transformToIncludeIndex)

### <a name="arrNative"></a>arrNative

 Pure JS implementations of native Array methods.

#### <a name="arrNative-sort"></a>arrNative.sort(sortFunc)



#### <a name="arrNative-filter"></a>arrNative.filter(iterator, context)



#### <a name="arrNative-forEach"></a>arrNative.forEach(iterator, context)



#### <a name="arrNative-some"></a>arrNative.some(iterator, context)



#### <a name="arrNative-every"></a>arrNative.every(iterator, context)



#### <a name="arrNative-map"></a>arrNative.map(iterator, context)



#### <a name="arrNative-reduce"></a>arrNative.reduce(iterator, memo, context)



#### <a name="arrNative-reduceRight"></a>arrNative.reduceRight(iterator, memo, context)



### <a name="arr"></a>arr

 variety of functions for Arrays

#### <a name="arr-range"></a>arr.range(begin, end, step)

 

```js
arr.range(0,5) // => [0,1,2,3,4,5]
  arr.range(0,10,2) // => [0,2,4,6,8,10]
```

#### <a name="arr-from"></a>arr.from(iterable)

 Makes JS arrays out of array like objects like `arguments` or DOM `childNodes`

#### <a name="arr-withN"></a>arr.withN(n, obj)

 

```js
arr.withN(3, "Hello") // => ["Hello","Hello","Hello"]
```

#### <a name="arr-genN"></a>arr.genN(n, generator)


 Takes a generator function that is called for each `n`.
 

```js
arr.genN(3, num.random) // => [46,77,95]
```

#### <a name="arr-filter"></a>arr.filter(array, iterator, context)


 Calls `iterator` for each element in `array` and returns a subset of it
 including the elements for which `iterator` returned a truthy value.
 Like `Array.prototype.filter`.

#### <a name="arr-detect"></a>arr.detect(arr, iterator, context)


 returns the first occurrence of an element in `arr` for which iterator
 returns a truthy value

#### <a name="arr-filterByKey"></a>arr.filterByKey(arr, key)


 

```js
var objects = [{x: 3}, {y: 4}, {x:5}]
  arr.filterByKey(objects, "x") // => [{x: 3},{x: 5}]
```

#### <a name="arr-grep"></a>arr.grep(arr, filter, context)

 [a] -> String|RegExp -> [a]
 `filter` can be a String or RegExp. Will stringify each element in
 

```js
["Hello", "World", "Lively", "User"].grep("l") // => ["Hello","World","Lively"]
```

#### <a name="arr-mask"></a>arr.mask(array, mask)

 select every element in array for which array's element is truthy
 

```js
[1,2,3].mask([false, true, false]) => [2]
```

#### <a name="arr-reject"></a>arr.reject(array, func, context)



#### <a name="arr-rejectByKey"></a>arr.rejectByKey(array, key)



#### <a name="arr-without"></a>arr.without(array, elem)

 non-mutating
 

```js
arr.without([1,2,3,4,5,6], 3) // => [1,2,4,5,6]
```

#### <a name="arr-withoutAll"></a>arr.withoutAll(array, otherArr)

 non-mutating
 

```js
arr.withoutAll([1,2,3,4,5,6], [3,4]) // => [1,2,5,6]
```

#### <a name="arr-uniq"></a>arr.uniq(array, sorted)

 non-mutating
 Removes duplicates from array.

#### <a name="arr-uniqBy"></a>arr.uniqBy(array, comparator, context)

 like `arr.uniq` but with custom equality: `comparator(a,b)` returns
 BOOL. True if a and be should be regarded equal, false otherwise.

#### <a name="arr-compact"></a>arr.compact(array)

 removes falsy values
 

```js
arr.compact([1,2,undefined,4,0]) // => [1,2,4]
```

#### <a name="arr-mutableCompact"></a>arr.mutableCompact(array)

 fix gaps that were created with 'delete'

#### <a name="arr-forEach"></a>arr.forEach(array, iterator, context)


 `iterator` is called on each element in `array` for side effects. Like
 `Array.prototype.forEach`.

#### <a name="arr-zip"></a>arr.zip()

 Takes any number of lists as arguments. Combines them elment-wise.
 

```js
arr.zip([1,2,3], ["a", "b", "c"], ["A", "B"])
// => [[1,"a","A"],[2,"b","B"],[3,"c",undefined]]
```

#### <a name="arr-flatten"></a>arr.flatten(array)

 Turns a nested collection into a flat one.
 

```js
arr.flatten([1, [2, [3,4,5], [6]], 7,8])
// => [1,2,3,4,5,6,7,8]
```

#### <a name="arr-interpose"></a>arr.interpose(array, delim)

 Injects delim between elements of array
 

```js
lively.lang.arr.interpose(["test", "abc", 444], "aha"));
// => ["test","aha","abc","aha",444]
```

#### <a name="arr-map"></a>arr.map(array, iterator, context)


 Applies `iterator` to each element of `array` and returns a new Array
 with the results of those calls. Like `Array.prototype.some`.

#### <a name="arr-invoke"></a>arr.invoke(array, method, arg1, arg2, arg3, arg4, arg5, arg6)

 Calls `method` on each element in `array`, passing all arguments. Often
 a handy way to avoid verbose `map` calls.
 

```js
arr.invoke(["hello", "world"], "toUpperCase") // => ["HELLO","WORLD"]
```

#### <a name="arr-pluck"></a>arr.pluck(array, property)

 Returns `property` or undefined from each element of array. For quick
 `map`s and similar to `invoke`.
 

```js
arr.pluck(["hello", "world"], 0) // => ["h","w"]
```

#### <a name="arr-reduce"></a>arr.reduce(array, iterator, memo, context)


 Applies `iterator` to each element of `array` and returns a new Array
 with the results of those calls. Like `Array.prototype.some`.

#### <a name="arr-reduceRight"></a>arr.reduceRight(array, iterator, memo, context)



#### <a name="arr-include"></a>arr.include(array, object)

 

```js
arr.include([1,2,3], 2) // => true
```

#### <a name="arr-some"></a>arr.some(array, iterator, context)


 Returns true if there is at least one abject in `array` for which
 `iterator` returns a truthy result. Like `Array.prototype.some`.

#### <a name="arr-every"></a>arr.every(array, iterator, context)


 Returns true if for all abjects in `array` `iterator` returns a truthy
 result. Like `Array.prototype.every`.

#### <a name="arr-equals"></a>arr.equals(array, otherArray)

 Returns true iff each element in `array` is equal (`==`) to its
 corresponding element in `otherArray`

#### <a name="arr-sort"></a>arr.sort(array, sortFunc)


 Just `Array.prototype.sort`

#### <a name="arr-sortBy"></a>arr.sortBy(array, iterator, context)

 

```js
arr.sortBy(["Hello", "Lively", "User"], function(ea) {
  return ea.charCodeAt(ea.length-1); }) // => ["Hello","User","Lively"]
```

#### <a name="arr-sortByKey"></a>arr.sortByKey(array, key)

 

```js
lively.lang.arr.sortByKey([{x: 3}, {x: 2}, {x: 8}], "x")
// => [{x: 2},{x: 3},{x: 8}]
```

#### <a name="arr-reMatches"></a>arr.reMatches(arr, re, stringifier)

 convert each element in arr into a string and apply re to match it.
 result might include null items if re did not match (usful for masking)
 

```js
var morphs = $world.withAllSubmorphsDo(function(x) { return x; ;
  morphs.mask(morphs.reMatches(/code/i))
```

#### <a name="arr-intersect"></a>arr.intersect(array1, array2)

 set-like intersection

#### <a name="arr-union"></a>arr.union(array1, array2)

 set-like union

#### <a name="arr-pushAt"></a>arr.pushAt(array, item, index)

 inserts `item` at `index`, mutating

#### <a name="arr-removeAt"></a>arr.removeAt(array, index)

 inserts item at `index`, mutating

#### <a name="arr-remove"></a>arr.remove(array, item)

 removes first occurrence of item in `array`, mutating

#### <a name="arr-pushAll"></a>arr.pushAll(array, items)

 appends all `items`, mutating

#### <a name="arr-pushAllAt"></a>arr.pushAllAt(array, items, idx)

 inserts all `items` at `idx`, mutating

#### <a name="arr-pushIfNotIncluded"></a>arr.pushIfNotIncluded(array, item)

 only appends `item` if its not already in `array`, mutating

#### <a name="arr-replaceAt"></a>arr.replaceAt(array, item, index)

 mutating

#### <a name="arr-clear"></a>arr.clear(array)

 removes all items, mutating

#### <a name="arr-doAndContinue"></a>arr.doAndContinue(array, iterator, endFunc, context)

 Iterates over array but instead of consecutively calling iterator,
 iterator gets passed in the invocation for the next iteration step
 as a function as first parameter. This allows to wait arbitrarily
 between operation steps, great for managing dependencies between tasks.
 Related is [`fun.composeAsync`]().
 

```js
arr.doAndContinue([1,2,3,4], function(next, n) {
  alert("At " + n);
  setTimeout(next, 100);
}, function() { alert("Done"); })
// If the elements are functions you can leave out the iterator:
arr.doAndContinue([
  function(next) { alert("At " + 1); next(); },
  function(next) { alert("At " + 2); next(); }
], null, function() { alert("Done"); });
```

#### <a name="arr-nestedDelay"></a>arr.nestedDelay(array, iterator, waitSecs, endFunc, context, optSynchronChunks)

 Calls `iterator` for every element in `array` and waits between iterator
 calls `waitSecs`. Eventually `endFunc` is called. When passing a number n
 as `optSynchronChunks`, only every nth iteration is delayed.

#### <a name="arr-swap"></a>arr.swap(array, index1, index2)

 mutating
 

```js
var a = [1,2,3,4];
arr.swap(a, 3, 1);
a // => [1,4,3,2]
```

#### <a name="arr-rotate"></a>arr.rotate(array, times)

 non-mutating
 

```js
arr.rotate([1,2,3]) // => [2,3,1]
```

#### <a name="arr-groupBy"></a>arr.groupBy(array, iterator, context)

 Applies `iterator` to each element in `array`, and puts the return value
 into a collection (the group) associated to it's stringified representation
 (the "hash").
 See [`Group.prototype`] for available operations on groups.
 

```js
Example 1: Groups characters by how often they occur in a string:
var chars = arr.from("Hello World");
arr.groupBy(arr.uniq(chars), function(c) {
  return arr.count(chars, c); })
// => {
//   "1": ["H","e"," ","W","r","d"],
//   "2": ["o"],
//   "3": ["l"]
// }
// Example 2: Group numbers by a custom qualifier:
arr.groupBy([3,4,1,7,4,3,8,4], function(n) {
  if (n <= 3) return "small";
  if (n <= 7) return "medium";
  return "large";
});
// => {
//   large: [8],
//   medium: [4,7,4,4],
//   small: [3,1,3]
// }
```

#### <a name="arr-groupByKey"></a>arr.groupByKey(array, key)

 var objects = [{x: }]
 arr.groupBy(arr.uniq(chars), function(c) {
   return arr.count(chars, c); })
 // => {
 //   "1": ["H","e"," ","W","r","d"],
 //   "2": ["o"],
 //   "3": ["l"]
 // }

#### <a name="arr-partition"></a>arr.partition(array, iterator, context)

 

```js
var array = [1,2,3,4,5,6];
arr.partition(array, function(ea) { return ea > 3; })
// => [[1,2,3,4],[5,6]]
```

#### <a name="arr-batchify"></a>arr.batchify(array, constrainedFunc, context)

 Takes elements and fits them into subarrays (= batches) so that for
 each batch constrainedFunc returns true. Note that contrained func
 should at least produce 1-length batches, otherwise an error is raised
 

```js
// Assume you have list of things that have different sizes and you want to
// create sub-arrays of these things, with each sub-array having if possible
// less than a `batchMaxSize` of combined things in it:
var sizes = [
  Math.pow(2, 15), // 32KB
  Math.pow(2, 29), // 512MB
  Math.pow(2, 29), // 512MB
  Math.pow(2, 27), // 128MB
  Math.pow(2, 26), // 64MB
  Math.pow(2, 26), // 64MB
  Math.pow(2, 24), // 16MB
  Math.pow(2, 26)] // 64MB
var batchMaxSize = Math.pow(2, 28)/*256MB*/;
function batchConstrained(batch) {
  return batch.length == 1 || batch.sum() < batchMaxSize;
}
var batches = sizes.batchify(batchConstrained);
batches.pluck('length') // => [4,1,1,2]
batches.map(arr.sum).map(num.humanReadableByteSize) // => ["208.03MB","512MB","512MB","128MB"]
```

#### <a name="arr-toTuples"></a>arr.toTuples(array, tupleLength)

 Creates sub-arrays with length `tupleLength`
 

```js
arr.toTuples(["H","e","l","l","o"," ","W","o","r","l","d"], 4)
// => [["H","e","l","l"],["o"," ","W","o"],["r","l","d"]]
```

#### <a name="arr-shuffle"></a>arr.shuffle(array)

 Ramdomize the order of elements of array. Does not mutate array.
 

```js
arr.shuffle([1,2,3,4,5]) // => [3,1,2,5,4]
```

#### <a name="arr-max"></a>arr.max(array, iterator, context)

 

```js
var array = [{x:3,y:2}, {x:5,y:1}, {x:1,y:5}];
  arr.max(array, function(ea) { return ea.x; }) // => {x: 5, y: 1}
```

#### <a name="arr-min"></a>arr.min(array, iterator, context)

 Similar to `arr.max`.

#### <a name="arr-sum"></a>arr.sum(array)



#### <a name="arr-clone"></a>arr.clone(array)

 shallow copy

#### <a name="arr-mapAsyncSeries"></a>arr.mapAsyncSeries(array, iterator, callback)

 Apply `iterator` over `array`. Unlike `mapAsync` the invocation of
 the iterator happens step by step in the order of the items of the array
 and not concurrently.

#### <a name="arr-mapAsync"></a>arr.mapAsync(array, options, iterator, callback)

 Apply `iterator` over `array`. In each iterator gets a callback as third
 argument that should be called when the iteration is done. After all
 iterators have called their callbacks, the main `callback` function is
 invoked with the result array.
 

```js
lively.lang.arr.mapAsync([1,2,3,4],
  function(n, i, next) { setTimeout(function() { next(null, n + i); }, 20); },
  function(err, result) { /* result => [1,3,5,7] */ });
```

### <a name="Group"></a>Group

A Grouping is created by arr.groupBy and maps keys to Arrays.

#### <a name="Group-fromArray"></a>Group.fromArray(array, hashFunc, context)

 

```js
Group.fromArray([1,2,3,4,5,6], function(n) { return n % 2; })
// => {"0": [2,4,6], "1": [1,3,5]}
```

#### <a name="Group.prototype-toArray"></a>Group>>toArray()

 

```js
var group = arr.groupBy([1,2,3,4,5], function(n) { return n % 2; })
group.toArray(); // => [[2,4],[1,3,5]]
```

#### <a name="Group.prototype-forEach"></a>Group>>forEach(iterator, context)

 Iteration for each item in each group, called like `iterator(groupKey, groupItem)`

#### <a name="Group.prototype-forEachGroup"></a>Group>>forEachGroup(iterator, context)

 Iteration for each group, called like `iterator(groupKey, group)`

#### <a name="Group.prototype-map"></a>Group>>map(iterator, context)

 Map for each item in each group, called like `iterator(groupKey, group)`

#### <a name="Group.prototype-mapGroups"></a>Group>>mapGroups(iterator, context)

 Map for each group, called like `iterator(groupKey, group)`

#### <a name="Group.prototype-keys"></a>Group>>keys()



#### <a name="Group.prototype-reduceGroups"></a>Group>>reduceGroups(iterator, carryOver, context)

 Reduce/fold for each group, called like `iterator(carryOver, groupKey, group)`

#### <a name="Group.prototype-count"></a>Group>>count()

 counts the elements of each group

### <a name="grid"></a>grid

A grid is a two-dimaensional array, representing a table-like data

#### <a name="grid-create"></a>grid.create(rows, columns, initialObj)

 

```js
grid.create(3, 2, "empty")
// => [["empty","empty"],
//     ["empty","empty"],
//     ["empty","empty"]]
```

#### <a name="grid-mapCreate"></a>grid.mapCreate(rows, cols, func, context)

 like `grid.create` but takes generator function for cells

#### <a name="grid-forEach"></a>grid.forEach(grid, func, context)

 iterate, `func` is called as `func(cellValue, i, j)`

#### <a name="grid-map"></a>grid.map(grid, func, context)

 map, `func` is called as `func(cellValue, i, j)`

#### <a name="grid-toObjects"></a>grid.toObjects(grid)

 The first row of the grid defines the propNames
 for each following row create a new object with those porperties
 mapped to the cells of the row as values
 

```js
grid.toObjects([['a', 'b'],[1,2],[3,4]])
// => [{a:1,b:2},{a:3,b:4}]
```

#### <a name="grid-tableFromObjects"></a>grid.tableFromObjects(objects, valueForUndefined)

 Reverse operation to `grid.toObjects`. Useful for example to convert objectified
 SQL result sets into tables that can be printed via Strings.printTable.
 Objects are key/values like [{x:1,y:2},{x:3},{z:4}]. Keys are interpreted as
 column names and objects as rows.
 

```js
grid.tableFromObjects([{x:1,y:2},{x:3},{z:4}])
// => [["x","y","z"],
//    [1,2,null],
//    [3,null,null],
//    [null,null,4]]
```

### <a name="interval"></a>interval

Intervals are arrays whose first two elements are numbers and the
 first element should be less or equal the second element, see
 [`interval.isInterval`](). This abstraction is useful when working with text
 ranges in rich text, for example.

#### <a name="interval-isInterval"></a>interval.isInterval(object)

 

```js
interval.isInterval([1,12]) // => true
interval.isInterval([1,12, {property: 23}]) // => true
interval.isInterval([1]) // => false
interval.isInterval([12, 1]) // => false
```

#### <a name="interval-sort"></a>interval.sort(intervals)

 Sorts intervals according to rules defined in [`interval.compare`]().

#### <a name="interval-compare"></a>interval.compare(a, b)

 How [`interval.sort`]() compares.
 We assume that `a[0] <= a[1] and b[0] <= b[1]` according to `isInterval`
 ```
 -3: a < b and non-overlapping, e.g [1,2] and [3,4]
 -2: a < b and intervals border at each other, e.g [1,3] and [3,4]
 -1: a < b and overlapping, e.g, [1,3] and [2,4] or [1,3] and [1,4]
  0: a = b, e.g. [1,2] and [1,2]
  1: a > b and overlapping, e.g. [2,4] and [1,3]
  2: a > b and share border, e.g [1,4] and [0,1]
  3: a > b and non-overlapping, e.g [2,4] and [0,1]
 ```

#### <a name="interval-coalesce"></a>interval.coalesce(interval1, interval2, optMergeCallback)

 Turns two interval into one iff compare(interval1, interval2) ∈ [-2,
 -1,0,1, 2] (see [`inerval.compare`]()).
 Otherwise returns null. Optionally uses merge function.
 

```js
interval.coalesce([1,4], [5,7]) // => null
  interval.coalesce([1,2], [1,2]) // => [1,2]
  interval.coalesce([1,4], [3,6]) // => [1,6]
  interval.coalesce([3,6], [4,5]) // => [3,6]
```

#### <a name="interval-coalesceOverlapping"></a>interval.coalesceOverlapping(intervals, mergeFunc)

 Like `coalesce` but accepts an array of intervals.
 

```js
interval.coalesceOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]])
  // => [[1,8],[9,10],[14,21]]
```

#### <a name="interval-intervalsInRangeDo"></a>interval.intervalsInRangeDo(start, end, intervals, iterator, mergeFunc, context)

 Merges and iterates through sorted intervals. Will "fill up"
 intervals. This is currently used for computing text chunks in
 lively.morphic.TextCore.
 

```js
interval.intervalsInRangeDo(
  2, 10, [[0, 1], [5,8], [2,4]],
  function(i, isNew) { i.push(isNew); return i; })
// => [[2,4,false],[4,5,true],[5,8,false],[8,10,true]]
```

#### <a name="interval-intervalsInbetween"></a>interval.intervalsInbetween(start, end, intervals)

 Computes "free" intervals between the intervals given in range start - end
 currently used for computing text chunks in lively.morphic.TextCore
 

```js
interval.intervalsInbetween(0, 10,[[1,4], [5,8]])
// => [[0,1],[4,5],[8,10]]
```

#### <a name="interval-mapToMatchingIndexes"></a>interval.mapToMatchingIndexes(intervals, intervalsToFind)

 Returns an array of indexes of the items in intervals that match
 items in `intervalsToFind`.
 Note: We expect intervals and intervals to be sorted according to [`interval.compare`]()!
 This is the optimized version of:
 ```
 return intervalsToFind.collect(function findOne(toFind) {
    var startIdx, endIdx;
    var start = intervals.detect(function(ea, i) {
       startIdx = i; return ea[0] === toFind[0]; });
    if (start === undefined) return [];
    var end = intervals.detect(function(ea, i) {
       endIdx = i; return ea[1] === toFind[1]; });
    if (end === undefined) return [];
    return Array.range(startIdx, endIdx);
 });
 ```

### <a name="arrayProjection"></a>arrayProjection

Accessor to sub-ranges of arrays. This is used, for example, for rendering
 large lists or tables in which only a part of the items should be used for
 processing or rendering. An array projection provides convenient access and
 can apply operations to sub-ranges.

#### <a name="arrayProjection-create"></a>arrayProjection.create(array, length, optStartIndex)

 

```js
arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 1)
// => { array: [/*...*/], from: 1, to: 5 }
```

#### <a name="arrayProjection-toArray"></a>arrayProjection.toArray(projection)



#### <a name="arrayProjection-originalToProjectedIndex"></a>arrayProjection.originalToProjectedIndex(projection, index)

 Maps index from original Array to projection.
 

```js
var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
  arrayProjection.originalToProjectedIndex(proj, 1) // => null
  arrayProjection.originalToProjectedIndex(proj, 3) // => 0
  arrayProjection.originalToProjectedIndex(proj, 5) // => 2
```

#### <a name="arrayProjection-projectedToOriginalIndex"></a>arrayProjection.projectedToOriginalIndex(projection, index)

 Inverse to `originalToProjectedIndex`.
 

```js
var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
  arrayProjection.projectedToOriginalIndex(proj, 1) // => 4
```

#### <a name="arrayProjection-transformToIncludeIndex"></a>arrayProjection.transformToIncludeIndex(projection, index)

 Computes how the projection needs to shift minimally (think "scroll"
 down or up) so that index becomes "visible" in projection.
 

```js
var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
arrayProjection.transformToIncludeIndex(proj, 1)
// => { array: [/*...*/], from: 1, to: 5 }
```