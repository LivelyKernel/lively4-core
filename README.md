# *THIS DOCUMENTATION IS CURRENTLY WORK IN PROGRESS!*

# lively.lang [![Build Status](https://travis-ci.org/LivelyKernel/lively.lang.svg?branch=master)](https://travis-ci.org/LivelyKernel/lively.lang)

*What?* This project packages abstractions for JavaScript that proved to be useful in
the [Lively Web](http://lively-web.org) project. On first glance it might seem
to be just another underscore.js library but apart from extensions to existing
JavaScript objects and classes it also provides abstractions for asynchronous
code, new object representations, and functions for inspecting JavaScript
objects.

*Why?* Make it easy to reuse abstractions we found helpful in all kinds of
contexts. All features can be used in browser environments and in node.js.
Actually, one motivation for this library was to have unified interfaces across
JavaScript environments.

*How?* By default the library is non-invasive, i.e. no global objects are
modified. To use provided functions you can either

1. call them directly,
2. use underscore.js-like chain/value wrapping,
3. or install extension methods explicitly in global objects.

## Summary

JavaScript objects and classes that are extended:

- Array
- String
- Number
- Object
- Function
- Date

Abstractions usually not included by default in JavaScript runtimes:

- node.js-like event emitter interface (uses event module on node.js)
- Path (property access in nested objects / arrays)
- Interval
- Grid
- ArrayProjection
- Closure
- Messengers (generic interface for remote-messaging)
- Workers based on the messenger interface


## "Installation"
TODO

### Browsers
TODO

### node.js
TODO


## Usage
TODO


## API

<!---API_GENERATED_START--->
### Contents

#### string.js

- [string](#string)
  - [format](#string-format)
  - [indent](#string-indent)
  - [removeSurroundingWhitespaces](#string-removeSurroundingWhitespaces)
  - [quote](#string-quote)
  - [print](#string-print)
  - [printNested](#string-printNested)
  - [pad](#string-pad)
  - [printTable](#string-printTable)
  - [printTree](#string-printTree)
  - [toArray](#string-toArray)
  - [lines](#string-lines)
  - [paragraphs](#string-paragraphs)
  - [nonEmptyLines](#string-nonEmptyLines)
  - [tokens](#string-tokens)
  - [tableize](#string-tableize)
  - [unescapeCharacterEntities](#string-unescapeCharacterEntities)
  - [toQueryParams](#string-toQueryParams)
  - [newUUID](#string-newUUID)
  - [createDataURI](#string-createDataURI)
  - [hashCode](#string-hashCode)
  - [md5](#string-md5)
  - [reMatches](#string-reMatches)
  - [stringMatch](#string-stringMatch)
  - [peekRight](#string-peekRight)
  - [peekLeft](#string-peekLeft)
  - [lineIndexComputer](#string-lineIndexComputer)
  - [empty](#string-empty)
  - [include](#string-include)
  - [startsWith](#string-startsWith)
  - [startsWithVowel](#string-startsWithVowel)
  - [endsWith](#string-endsWith)
  - [withDecimalPrecision](#string-withDecimalPrecision)
  - [capitalize](#string-capitalize)
  - [camelCaseString](#string-camelCaseString)
  - [camelize](#string-camelize)
  - [truncate](#string-truncate)
  - [regExpEscape](#string-regExpEscape)
  - [succ](#string-succ)
  - [times](#string-times)

#### number.js

- [num](#num)
  - [random](#num-random)
  - [normalRandom](#num-normalRandom)
  - [humanReadableByteSize](#num-humanReadableByteSize)
  - [average](#num-average)
  - [median](#num-median)
  - [between](#num-between)
  - [sort](#num-sort)
  - [parseLength](#num-parseLength)
  - [roundTo](#num-roundTo)
  - [detent](#num-detent)
  - [toDegrees](#num-toDegrees)
  - [toRadians](#num-toRadians)

#### date.js

#### collection.js

- [arrNative](#arrNative)
  - [map](#arrNative-map)
- [grid](#grid)
  - [toObjects](#grid-toObjects)
  - [tableFromObjects](#grid-tableFromObjects)
- [interval](#interval)
  - [compare](#interval-compare)
  - [coalesce](#interval-coalesce)
  - [coalesceOverlapping](#interval-coalesceOverlapping)
  - [intervalsInRangeDo](#interval-intervalsInRangeDo)
  - [intervalsInbetween](#interval-intervalsInbetween)
  - [mapToMatchingIndexes](#interval-mapToMatchingIndexes)
  - [benchmark](#interval-benchmark)
- [arr](#arr)
  - [reMatches](#arr-reMatches)
  - [mutableCompact](#arr-mutableCompact)
  - [uniqBy](#arr-uniqBy)
  - [nestedDelay](#arr-nestedDelay)
  - [doAndContinue](#arr-doAndContinue)
  - [forEachShowingProgress](#arr-forEachShowingProgress)
  - [batchify](#arr-batchify)
  - [mask](#arr-mask)

#### function.js

- [fun](#fun)
  - [argumentNames](#fun-argumentNames)
  - [extractBody](#fun-extractBody)
  - [throttle](#fun-throttle)
  - [debounce](#fun-debounce)
  - [throttleNamed](#fun-throttleNamed)
  - [debounceNamed](#fun-debounceNamed)
  - [createQueue](#fun-createQueue)
  - [workerWithCallbackQueue](#fun-workerWithCallbackQueue)
  - [composeAsync](#fun-composeAsync)
  - [compose](#fun-compose)
  - [flip](#fun-flip)
  - [waitFor](#fun-waitFor)
  - [getOriginal](#fun-getOriginal)
  - [addToObject](#fun-addToObject)
  - [binds](#fun-binds)
- [queue](#queue)
  - [handleError](#queue-handleError)
- [Closure](#Closure)

#### object.js

- [properties](#properties)
- [obj](#obj)
  - [inspect](#obj-inspect)
  - [merge](#obj-merge)
  - [valuesInPropertyHierarchy](#obj-valuesInPropertyHierarchy)
  - [shortPrintStringOf](#obj-shortPrintStringOf)
- [Path.prototype](#Path.prototype)
  - [normalizePath](#Path.prototype-normalizePath)
  - [watch](#Path.prototype-watch)
  - [debugFunctionWrapper](#Path.prototype-debugFunctionWrapper)

#### events.js

#### messenger.js

#### worker.js

- [WorkerSetup](#WorkerSetup)
- [BrowserWorker](#BrowserWorker)
  - [create](#BrowserWorker-create)
- [NodejsWorker](#NodejsWorker)
  - [create](#NodejsWorker-create)
  - [workerSetupFunction](#NodejsWorker-workerSetupFunction)
  - [startWorker](#NodejsWorker-startWorker)
- [worker](#worker)
  - [create](#worker-create)



## string.js

### string

 String utility methods for printing, parsing, and converting strings

#### <a name="string-format"></a>string.format()

`String+ -> String`
 Takes a variable number of arguments. The first argument is the format
 string. Placeholders in the format string are marked with `"%s"`.
 

```js
jsext.string.format("Hello %s!", "Lively User"); // => "Hello Lively User!"
```

#### <a name="string-indent"></a>string.indent(str, indentString, depth)

`String -> String -> String? -> String`
 

```js
string.indent("Hello", "  ", 2) // => "    Hello"
```

#### <a name="string-removeSurroundingWhitespaces"></a>string.removeSurroundingWhitespaces(str)

 

```js
string.removeSurroundingWhitespaces("  hello\n  world  ") // => "hello\nworld"
```

#### <a name="string-quote"></a>string.quote(str)

 

```js
string.print("fo\"o") // => "\"fo\\\"o\""
```

#### <a name="string-print"></a>string.print(obj)

 Prints Arrays and escapes quotations. See `obj.inspect` for how to
 completely print / inspect JavaScript data strcutures
 

```js
string.print([[1,2,3], "string", {foo: 23}])
// => [[1,2,3],"string",[object Object]]
```

#### <a name="string-printNested"></a>string.printNested(list, depth)

 

```js
string.printNested([1,2,[3,4,5]]) // => "1\n2\n  3\n  4\n  5\n"
```

#### <a name="string-pad"></a>string.pad(string, n, left)

 

```js
string.pad("Foo", 2) // => "Foo  "
string.pad("Foo", 2, true) // => "  Foo"
```

#### <a name="string-printTable"></a>string.printTable(tableArray, options)

`Array -> Object? -> String`
 Takes a 2D Array and prints a table string. Kind of the reverse
 operation to `strings.tableize`
 

```js
string.printTable([["aaa", "b", "c"], ["d", "e","f"]])
// =>
// aaa b c
// d   e f
```

#### <a name="string-printTree"></a>string.printTree(rootNode, nodePrinter, childGetter, indent)

`Object -> Function -> Function -> Number? -> String`
 A generic function to print a tree representation from a nested data structure.
 Receives three arguments:
 - `rootNode` an object representing the root node of the tree
 - `nodePrinter` is a function that gets a tree node and should return stringified version of it
 - `childGetter` is a function that gets a tree node and should return a list of child nodes
 

```js
var root = {name: "a", subs: [{name: "b", subs: [{name: "c"}]}, {name: "d"}]};
string.printTree(root, function(n) { return n.name; }, function(n) { return n.subs; });
// =>
// a
// |-b
// | \-c
// \-d
```

#### <a name="string-toArray"></a>string.toArray(s)

 

```js
string.toArray("fooo") // => ["f","o","o","o"]
```

#### <a name="string-lines"></a>string.lines(str)

 

```js
string.lines("foo\nbar\n\rbaz") // => ["foo","bar","baz"]
```

#### <a name="string-paragraphs"></a>string.paragraphs(string, options)

 

```js
var text = "Hello, this is a pretty long sentence\nthat even includes new lines."
+ "\n\n\nThis is a sentence in  a new paragraph.";
string.paragraphs(text) // => [
// "Hello, this is a pretty long sentence\nthat even includes new lines.",
// "This is a sentence in  a new paragraph."]
string.paragraphs(text, {keepEmptyLines: true}) // => [
// "Hello, this is a pretty long sentence\n that even includes new lines.",
// "\n ",
// "This is a sentence in  a new paragraph."]
```

#### <a name="string-nonEmptyLines"></a>string.nonEmptyLines(str)

 

```js
string.nonEmptyLines("foo\n\nbar\n") // => ["foo","bar"]
```

#### <a name="string-tokens"></a>string.tokens(str, regex)

 

```js
string.tokens(' a b c') => ['a', 'b', 'c']
```

#### <a name="string-tableize"></a>string.tableize(s, options)

`String -> Object? -> Array`
 Takes a String representing a "table" and parses it into a 2D-Array (as
 accepted by the `collection.Grid` methods or `string.printTable`)
 ```js
 options = {
     convertTypes: BOOLEAN, // automatically convert to Numbers, Dates, ...?
     cellSplitter: REGEXP // how to recognize "cells", by default just spaces
 }
 ```
 

```js
string.tableize('a b c\nd e f')
// => [["a","b","c"],["d","e","f"]]
// can also parse csv like
var csv = '"Symbol","Name","LastSale",\n'
+ '"FLWS","1-800 FLOWERS.COM, Inc.","5.65",\n'
+ '"FCTY","1st Century Bancshares, Inc","5.65",'
string.tableize(csv, {cellSplitter: /^\s*"|","|",?\s*$/g})
// => [["Symbol","Name","LastSale"],
//     ["FLWS","1-800 FLOWERS.COM, Inc.",5.65],
//     ["FCTY","1st Century Bancshares, Inc",5.65]]
```

#### <a name="string-unescapeCharacterEntities"></a>string.unescapeCharacterEntities(s)

 Converts [character entities](http://dev.w3.org/html5/html-author/charref)
 into utf-8 strings
 

```js
string.unescapeCharacterEntities("foo &amp;&amp; bar") // => "foo && bar"
```

#### <a name="string-toQueryParams"></a>string.toQueryParams(s, separator)

 

```js
string.toQueryParams("http://example.com?foo=23&bar=test")
// => {bar: "test", foo: "23"}
```

#### <a name="string-newUUID"></a>string.newUUID()

 

```js
string.newUUID() // => "3B3E74D0-85EA-45F2-901C-23ECF3EAB9FB"
```

#### <a name="string-createDataURI"></a>string.createDataURI(content, mimeType)

`String -> String -> String`
 Takes some string representing content and a mime type.
 For a list of mime types see: [http://www.iana.org/assignments/media-types/media-types.xhtml]()
 More about data URIs: [https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs]()
 

```js
window.open(string.createDataURI('<h1>test</h1>', 'text/html'));
```

#### <a name="string-hashCode"></a>string.hashCode(s)

 [http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/]()
 

```js
string.hashCode("foo") // => 101574
```

#### <a name="string-md5"></a>string.md5(string)

 © Joseph Myers [http://www.myersdaily.org/joseph/javascript/md5-text.html]()
 

```js
string.md5("foo") // => "acbd18db4cc2f85cedef654fccc4a4d8"
```

#### <a name="string-reMatches"></a>string.reMatches(string, re)

 Different to the native `match` function this method returns an object
 with `start`, `end`, and `match` fields
 

```js
string.reMatches("Hello World", /o/g)
// => [{start: 4, end: 5, match: "o"},{start: 7, end: 8, match: "o"}]
```

#### <a name="string-stringMatch"></a>string.stringMatch(s, patternString, options)

 returns `{matched: true}` if success otherwise
 `{matched: false, error: EXPLANATION, pattern: STRING|RE, pos: NUMBER}`
 

```js
string.stringMatch("foo 123 bar", "foo __/[0-9]+/__ bar") // => {matched: true}
string.stringMatch("foo aaa bar", "foo __/[0-9]+/__ bar")
// => {
//   error: "foo <--UNMATCHED-->aaa bar",
//   matched: false,
//   pattern: /[0-9]+/,
//   pos: 4
// }
```

#### <a name="string-peekRight"></a>string.peekRight(s, start, needle)

 Finds the next occurence of `needle` (String or RegExp). Returns delta
 index.
 

```js
string.peekRight("Hello World", 0, /o/g) // => 4
string.peekRight("Hello World", 5, /o/) // => 2
```

#### <a name="string-peekLeft"></a>string.peekLeft(s, start, needle)

 Similar to `peekRight`

#### <a name="string-lineIndexComputer"></a>string.lineIndexComputer(s)

`String -> Function`
 For converting character positions to line numbers.
 Returns a function accepting char positions. If the char pos is outside
 of the line ranges -1 is returned.
 

```js
var idxComp = string.lineIndexComputer("Hello\nWorld\n\nfoo");
idxComp(3) // => 0 (index 3 is "l")
idxComp(6) // => 1 (index 6 is "W")
idxComp(12) // => 2 (index 12 is "\n")
```

#### <a name="string-empty"></a>string.empty(s)



#### <a name="string-include"></a>string.include(s, pattern)

 

```js
string.include("fooo!", "oo") // => true
```

#### <a name="string-startsWith"></a>string.startsWith(s, pattern)

 

```js
string.startsWith("fooo!", "foo") // => true
```

#### <a name="string-startsWithVowel"></a>string.startsWithVowel(s)



#### <a name="string-endsWith"></a>string.endsWith(s, pattern)

 

```js
string.endsWith("fooo!", "o!") // => true
```

#### <a name="string-withDecimalPrecision"></a>string.withDecimalPrecision(str, precision)

`String -> Number -> String`
 

```js
string.withDecimalPrecision("1.12345678", 3) // => "1.123"
```

#### <a name="string-capitalize"></a>string.capitalize(s)

 

```js
string.capitalize("foo bar") // => "Foo bar"
```

#### <a name="string-camelCaseString"></a>string.camelCaseString(s)

 Spaces to camels, including first char
 

```js
string.camelCaseString("foo bar baz") // => "FooBarBaz"
```

#### <a name="string-camelize"></a>string.camelize(s)

 Dashes to camels, excluding first char
 

```js
string.camelize("foo-bar-baz") // => "fooBarBaz"
```

#### <a name="string-truncate"></a>string.truncate(s, length, truncation)

 Enforces that s is not more then `length` characters long.
 

```js
string.truncate("123456789", 5) // => "12..."
```

#### <a name="string-regExpEscape"></a>string.regExpEscape(s)

 For creating RegExps from strings and not worrying about proper escaping
 of RegExp special characters to literally match those.
 

```js
var re = new RegExp(string.regExpEscape("fooo{20}"));
re.test("fooo") // => false
re.test("fooo{20}") // => true
```

#### <a name="string-succ"></a>string.succ(s)

 Uses char code.
 

```js
string.succ("a") // => "b"
string.succ("Z") // => "["
```

#### <a name="string-times"></a>string.times(s, count)

 

```js
string.times("test", 3) // => "testtesttest"
```



## number.js

#### <a name="num-random"></a>num.random(min, max)

 random number between (and including) `min` and `max`

#### <a name="num-normalRandom"></a>num.normalRandom(mean, stdDev)

 returns randomized numbers in a normal distribution that can be
 controlled ising the `mean` and `stdDev` parameters

#### <a name="num-humanReadableByteSize"></a>num.humanReadableByteSize(n)

 interpret `n` as byte size and print a more readable version
 

```js
num.humanReadableByteSize(Math.pow(2,32)) // => "4096MB"
```

#### <a name="num-average"></a>num.average(numbers)



#### <a name="num-median"></a>num.median(numbers)



#### <a name="num-between"></a>num.between(x, a, b, eps)

 is `a` <= `x` <= `y`?

#### <a name="num-sort"></a>num.sort(arr)

 numerical sort, JavaScript native `sort` function is lexical by default.

#### <a name="num-parseLength"></a>num.parseLength(string, toUnit)

 This converts the length value to pixels or the specified `toUnit`.
 length converstion, supported units are: mm, cm, in, px, pt, pc
 

```js
num.parseLength('3cm') // => 113.38582677165354
num.parseLength('3cm', "in") // => 1.1811023622047243
```

#### <a name="num-roundTo"></a>num.roundTo(n, quantum)

 `quantum` is something like 0.01,

#### <a name="num-roundTo"></a>num.roundTo(n, quantum)

 for JS rounding to work we need the reciprocal

#### <a name="num-detent"></a>num.detent(n, detent, grid, snap)

 This function is useful to implement smooth transitions and snapping.
 Map all values that are within detent/2 of any multiple of grid to
 that multiple. Otherwise, if snap is true, return self, meaning that
 the values in the dead zone will never be returned. If snap is
 false, then expand the range between dead zone so that it covers the
 range between multiples of the grid, and scale the value by that
 factor.
 

```js
// With snapping:
num.detent(0.11, 0.2, 0.5, true) // => 0.11
num.detent(0.39, 0.2, 0.5, true) // => 0.39
num.detent(0.55, 0.2, 0.5, true)  // => 0.5
num.detent(0.61, 0.2, 0.5, true)   // => 0.61
// Smooth transitions without snapping:
num.detent(0.1,  0.2, 0.5) // => 0
num.detent(0.11,  0.2, 0.5) // => 0.0166666
num.detent(0.34,  0.2, 0.5)  // => 0.4
num.detent(0.39,  0.2, 0.5) // => 0.4833334
num.detent(0.4,  0.2, 0.5) // => 0.5
num.detent(0.6,  0.2, 0.5) // => 0.5
```

#### <a name="num-detent"></a>num.detent(n, detent, grid, snap)

 Nearest multiple of grid

#### <a name="num-detent"></a>num.detent(n, detent, grid, snap)

 Snap to that multiple...

#### <a name="num-detent"></a>num.detent(n, detent, grid, snap)

 ...and return n
 or compute nearest end of dead zone

#### <a name="num-detent"></a>num.detent(n, detent, grid, snap)

 and scale values between dead zones to fill range between multiples

#### <a name="num-toDegrees"></a>num.toDegrees(n)

 

```js
num.toDegrees(Math.PI/2) // => 90
```

#### <a name="num-toRadians"></a>num.toRadians(n)

 

```js
num.toRadians(180) // => 3.141592653589793
```



## date.js





## collection.js

### arrNative

 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 pure JS implementations of native Array methods
 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

### grid

 Global.Arrays = {
   equal: function(firstArray, secondArray) {
     // deprecated, use anArray.equals
     return firstArray.equals(secondArray);
   }
 }

### interval

 Intervals are arrays whose first two elements are numbers and the
 first element should be less or equal the second element, see
 #isInterval

#### <a name="arrNative-map"></a>arrNative.map(iterator, context)

 if (typeof iterator !== 'function')
 throw new TypeError(arguments[0] + ' is not a function');

#### <a name="arr-reMatches"></a>arr.reMatches(arr, re, stringifier)

 convert each element in arr into a string and apply re to match it.
 result might include null items if re did not match (usful for masking)
 

```js
var morphs = $world.withAllSubmorphsDo(function(x) { return x; ;
morphs.mask(morphs.reMatches(/code/i))
```

#### <a name="arr-mutableCompact"></a>arr.mutableCompact(arr)

 fix gaps that were created with 'delete'

#### <a name="arr-uniqBy"></a>arr.uniqBy(arr, comparator, context)

 comparator(a,b) returns BOOL. True if a and be should be regarded
 equal, false otherwise

#### <a name="arr-nestedDelay"></a>arr.nestedDelay(arr, iterator, waitSecs, endFunc, context, optSynchronChunks)

 calls iterator for every element in arr and waits between iterator
 calls waitSecs. eventually endFunc is called. When passing a number n
 as optSynchronChunks, only every nth iteration is delayed

#### <a name="arr-doAndContinue"></a>arr.doAndContinue(arr, iterator, endFunc, context)

 iterates over arr but instead of consecutively calling iterator,
 iterator gets passed in the invocation for the next iteration step
 as a function as first parameter. This allows to wait arbitrarily
 between operation steps, great for synchronous dependent steps

#### <a name="arr-forEachShowingProgress"></a>arr.forEachShowingProgress()

 init args

#### <a name="arr-forEachShowingProgress"></a>arr.forEachShowingProgress()

 init progressbar

#### <a name="arr-forEachShowingProgress"></a>arr.forEachShowingProgress()

 nest functions so that the iterator calls the next after a delay

#### <a name="arr-batchify"></a>arr.batchify(arr, constrainedFunc, context)

 takes elements and fits them into subarrays (=batches) so that for
 each batch constrainedFunc returns true. Note that contrained func
 should at least produce 1-length batches, otherwise an error is raised
 see [$world.browseCode("lively.lang.tests.ExtensionTests.ArrayTest", "testBatchify", "lively.lang.tests.ExtensionTests")]
 for an example

#### <a name="arr-mask"></a>arr.mask(arr, mask)

 select every element in arr for which arr's element is truthy
 

```js
[1,2,3].mask([false, true, false]) => [2]
```

#### <a name="grid-toObjects"></a>grid.toObjects(grid)

 the first row of the grid defines the propNames
 for each following row create a new object with those porperties
 mapped to the cells of the row as values
 Grid.toObjects([['a', 'b'],[1,2],[3,4]])
   --> [{a:1,b:2},{a:3,b:4}]

#### <a name="grid-tableFromObjects"></a>grid.tableFromObjects(objects, valueForUndefined)

 reverse of grid.toObjects
 useful to convert objectified SQL resultset into table that can be
 printed via Strings.printTable. objects are key/values like [{x:1,y:2},{x:3},{z:4}]
 interpret the keys as column names and add ea objects values as cell
 values of a new row. For the example object this would create the
 table: [["x","y","z"],[1,2,null],[3,null,null],[null,null,4]]

#### <a name="interval-compare"></a>interval.compare(a, b)

 we assume that a[0] <= a[1] and b[0] <= b[1]
 -3: a < b and non-overlapping, e.g [1,2] and [3,4]
 -2: a < b and intervals border at each other, e.g [1,3] and [3,4]
 -1: a < b and overlapping, e.g, [1,3] and [2,4] or [1,3] and [1,4]
  0: a = b, e.g. [1,2] and [1,2]
  1: a > b and overlapping, e.g. [2,4] and [1,3]
  2: a > b and share border, e.g [1,4] and [0,1]
  3: a > b and non-overlapping, e.g [2,4] and [0,1]

#### <a name="interval-compare"></a>interval.compare(a, b)

 we know a[0] > b[0], 1 || 2 || 3

#### <a name="interval-coalesce"></a>interval.coalesce(interval1, interval2, optMergeCallback)

 turns two arrays into one iff compare(interval1, interval2) ∈ [-2, -1,0,1, 2]
 otherwise returns null
 optionally uses merge function
 [1,4], [5,7] => null
 [1,2], [1,2] => [1,2]
 [1,4], [3,6] => [1,6]
 [3,6], [4,5] => [3,6]

#### <a name="interval-coalesce"></a>interval.coalesce(interval1, interval2, optMergeCallback)

 swap

#### <a name="interval-coalesceOverlapping"></a>interval.coalesceOverlapping(intervals, mergeFunc)

 accepts an array of intervals
 [[9,10], [1,8], [3, 7], [15, 20], [14, 21]] => [[1, 8], [9, 10], [14, 21]]

#### <a name="interval-intervalsInRangeDo"></a>interval.intervalsInRangeDo(start, end, intervals, iterator, mergeFunc, context)


      * merges and iterates through sorted intervals. Will "fill up" intervals, example:
      Strings.print(interval.intervalsInRangeDo(
              2, 10, [[0, 1], [5,8], [2,4]],
              function(i, isNew) { i.push(isNew); return i; }));
      *  => "[[2,4,false],[4,5,true],[5,8,false],[8,10,true]]"
      * this is currently used for computing text chunks in lively.morphic.TextCore
      

#### <a name="interval-intervalsInRangeDo"></a>interval.intervalsInRangeDo(start, end, intervals, iterator, mergeFunc, context)

 need to be sorted for the algorithm below

#### <a name="interval-intervalsInRangeDo"></a>interval.intervalsInRangeDo(start, end, intervals, iterator, mergeFunc, context)

 merged intervals are already sorted, simply "negate" the interval array;

#### <a name="interval-intervalsInbetween"></a>interval.intervalsInbetween(start, end, intervals)

 computes "free" intervals between the intervals given in range start - end
 currently used for computing text chunks in lively.morphic.TextCore
 start = 0, end = 10, intervals = [[1,4], [5,8]]
 => [[0,1], [4, 5], [8, 10]]

#### <a name="interval-mapToMatchingIndexes"></a>interval.mapToMatchingIndexes(intervals, intervalsToFind)

 returns an array of indexes of the items in intervals that match
 items in intervalsToFind
 Note: we expect intervals and intervals to be sorted according to interval.compare!
 This is the optimized version of:
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

#### <a name="interval-benchmark"></a>interval.benchmark()

 Used for developing the code above. If you change the code, please
 make sure that you don't worsen the performance!
 See also lively.lang.tests.ExtensionTests.IntervallTest



## function.js

#### <a name="fun-argumentNames"></a>fun.argumentNames(f)

 it's a class...

#### <a name="fun-extractBody"></a>fun.extractBody(func)

 returns the body of func as string, removing outer function code and
 superflous indent

#### <a name="fun-throttle"></a>fun.throttle(func, wait)

 exec func at most once every wait ms even when called more often
 useful to calm down eagerly running updaters and such

#### <a name="fun-throttle"></a>fun.throttle(func, wait)

 

```js
var i = 0;
x = fun.throttle(function() { show(++i + '-' + Date.now()) }, 500);
Array.range(0,100).forEach(function(n) { x() });

```

#### <a name="fun-debounce"></a>fun.debounce(wait, func, immediate)

 Execute func after wait milliseconds elapsed since invocation.
 E.g. to exec something after receiving an input stream
 with immediate truthy exec immediately but when called before
 wait ms are done nothing happens. E.g. to not exec a user invoked
 action twice accidentally

#### <a name="fun-throttleNamed"></a>fun.throttleNamed(name, wait, func)

 see comment in debounceNamed

#### <a name="fun-debounceNamed"></a>fun.debounceNamed(name, wait, func, immediate)

 debounce is based on the identity of the function called. When you call the
 identical method using debounce, multiple calls that happen between the first
 invocation and wait time will only cause execution once. However, wrapping a
 function with debounce and then storing (to be able to call the exact same
 function again) it is a repeating task and unpractical when using anonymous
 methods. debounceNamed() automatically maps function to ids and removes the
 need for this housekeeping code.

#### <a name="fun-createQueue"></a>fun.createQueue(id, workerFunc)

 can be overwritten by a function

#### <a name="queue-handleError"></a>queue.handleError(err)

 can be overwritten

#### <a name="fun-workerWithCallbackQueue"></a>fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 This functions helps when you have a long running computation that
 multiple call sites (independent from each other) depend on. This
 function does the houskeeping to start the long running computation
 just once and returns an object that allows to schedule callbacks
 once the workerFunc is done
 this is how it works:
 if id does not exist, workerFunc is called, otherwise ignored.
 workerFunc is expected to call thenDoFunc with arguments: error, arg1, ..., argN
 if called subsequently before workerFunc is done, the other thenDoFunc
 will "pile up" and called with the same arguments as the first
 thenDoFunc once workerFunc is done

#### <a name="fun-workerWithCallbackQueue"></a>fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 timeout

#### <a name="fun-workerWithCallbackQueue"></a>fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 init the store

#### <a name="fun-workerWithCallbackQueue"></a>fun.workerWithCallbackQueue(id, workerFunc, optTimeout)

 call worker, but delay so we can immediately return

#### <a name="fun-composeAsync"></a>fun.composeAsync()

 composes functions: fun.composeAsync(f,g,h)(arg1, arg2) =
   f(arg1, arg2, thenDo1) -> thenDo1(err, fResult)
 -> g(fResult, thenDo2) -> thenDo2(err, gResult) ->
 -> h(fResult, thenDo3) -> thenDo2(err, hResult)
 

```js
fun.composeAsync(
function(a,b, thenDo) { thenDo(null, a+b); },
function(x, thenDo) { thenDo(x*4); })(3,2, function(err, result) { alert(result); });
```

#### <a name="fun-compose"></a>fun.compose()

 composes functions: fun.compose(f,g,h)(arg1, arg2) = h(g(f(arg1, arg2)))
 

```js
fun.compose(function(a,b) {return a+b}, function(x) {return x*4})(3,2)
```

#### <a name="fun-flip"></a>fun.flip(f)

 swaps the first two args
 fun.flip(function(a, b, c) { return a + b + c; })(' World', 'Hello', '!')

#### <a name="fun-flip"></a>fun.flip(f)

args

#### <a name="fun-waitFor"></a>fun.waitFor(timeoutMs, waitTesterFunc, thenDo)

 wait for waitTesterFunc to return true, then run thenDo, passing
 failure/timout err as first parameter. A timout occurs after
 timeoutMs. During the wait period waitTesterFunc might be called
 multiple times

#### <a name="fun-getOriginal"></a>fun.getOriginal(func)

 get the original 'unwrapped' function, traversing as many wrappers as necessary.

#### <a name="fun-addToObject"></a>fun.addToObject(f, obj, name)

 suppport for tracing

#### <a name="fun-binds"></a>fun.binds(f, varMapping)

 convenience function

#### <a name="undefined-Closure"></a>Closure()

 represents a function and its bound values



## object.js

### properties

 -=-=-=-=-=-
 properties
 -=-=-=-=-=-

#### <a name="obj-inspect"></a>obj.inspect(obj, options, depth)

 print function

#### <a name="obj-inspect"></a>obj.inspect(obj, options, depth)

 print "primitive"

#### <a name="obj-merge"></a>obj.merge(objs)

 // if objs are arrays just concat them
 // if objs are real objs then merge propertdies

#### <a name="obj-valuesInPropertyHierarchy"></a>obj.valuesInPropertyHierarchy(obj, name)

 lookup all properties named name in the proto hierarchy of obj
 also uses Lively's class structure

#### <a name="obj-shortPrintStringOf"></a>obj.shortPrintStringOf(obj)

 primitive values

#### <a name="obj-shortPrintStringOf"></a>obj.shortPrintStringOf(obj)

 constructed objects

#### <a name="obj-shortPrintStringOf"></a>obj.shortPrintStringOf(obj)

 arrays or plain objects

#### <a name="Path.prototype-normalizePath"></a>Path>>normalizePath()

 FIXME: define normalization

#### <a name="Path.prototype-watch"></a>Path>>watch(options)

 options: target, haltWhenChanged, uninstall, onGet, onSet, verbose

#### <a name="Path.prototype-watch"></a>Path>>watch(options)

 observe slots, for debugging

#### <a name="Path.prototype-debugFunctionWrapper"></a>Path>>debugFunctionWrapper(options)

 options = {target, [haltWhenChanged, showStack, verbose, uninstall]}



## events.js





## messenger.js





## worker.js

### WorkerSetup

 code in worker setup is evaluated in the context of workers, it will get to
 workers in a stringified form(!)

### BrowserWorker

 setting up the worker messenger interface, this is how the worker
 should be communicated with

#### <a name="BrowserWorker-create"></a>BrowserWorker.create(options)

 this function instantiates a browser worker object. We provide a
 messenger-based interface to the pure Worker. Please use create to get an
 improved interface to a worker

#### <a name="BrowserWorker-create"></a>BrowserWorker.create(options)

 figure out where the other lang libs can be loaded from

#### <a name="BrowserWorker-create"></a>BrowserWorker.create(options)

 This code is triggered in the UI process directly after the
 creation of the worker and sends the setup message to the worker
 for initializing it.

#### <a name="BrowserWorker-create"></a>BrowserWorker.create(options)

 This code is run inside the worker and bootstraps the messenger
 interface. It also installs a console.log method since since this is not
 available by default.

#### <a name="NodejsWorker-create"></a>NodejsWorker.create(options)

 figure out where the other lang libs can be loaded from
 if (!options.libLocation && !options.scriptsToLoad) {
   var workerScript = document.querySelector("script[src$=\"worker.js\"]");
   if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libLocation: \"...\"}) to explicitly define the path!");
   options.libLocation = workerScript.src.replace(/worker.js$/, '');
 }

#### <a name="NodejsWorker-workerSetupFunction"></a>NodejsWorker.workerSetupFunction()

 this code is run in the context of the worker process

#### <a name="NodejsWorker-workerSetupFunction"></a>NodejsWorker.workerSetupFunction()

 process.on('message', function(m) {
   debug && console.log('[WORKER] got message:', m);
   if (m.action === 'ping') process.send({action: 'pong', data: m});
   else if (m.action === 'close') close = true;
   else if (m.action === 'setup') setup(m.data);
   else console.error('[WORKER] unknown message: ', m);
 });

#### <a name="NodejsWorker-startWorker"></a>NodejsWorker.startWorker(options, thenDo)

 WorkerSetup.initBrowserGlobals,

#### <a name="worker-create"></a>worker.create(options)

runFunc, arg1, ... argN, thenDo
<!---API_GENERATED_END--->

## License

[MIT License](LICENSE)

### methods throttle and debounce in function.js

adapted from Underscore.js 1.3.3
© 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
Underscore is distributed under the MIT license.

### dateFormat in date.js

Date Format 1.2.3
© 2007-2009 Steven Levithan <stevenlevithan.com>
MIT license
Includes enhancements by Scott Trenda <scott.trenda.net>
and Kris Kowal <cixar.com/~kris.kowal/>

### serveral methods in object.js including `subclass()`

are inspired or derived from Prototype JavaScript framework, version 1.6.0_rc1
© 2005-2007 Sam Stephenson
Prototype is freely distributable under the terms of an MIT-style license.
For details, see the Prototype web site: http://www.prototypejs.org/
