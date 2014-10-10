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

- [dateFormat](#dateFormat)
- [exports.date](#exports.date)
  - [format](#exports.date-format)
  - [equals](#exports.date-equals)
  - [relativeTo](#exports.date-relativeTo)

#### collection.js

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
  - [forEachShowingProgress](#arr-forEachShowingProgress)
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
- [thresholds](#thresholds)
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
- [Closure.prototype](#Closure.prototype)
  - [getFuncProperties](#Closure.prototype-getFuncProperties)
  - [recreateFuncFromSource](#Closure.prototype-recreateFuncFromSource)
  - [couldNotCreateFunc](#Closure.prototype-couldNotCreateFunc)

#### object.js

- [obj](#obj)
  - [inspect](#obj-inspect)
  - [merge](#obj-merge)
  - [valuesInPropertyHierarchy](#obj-valuesInPropertyHierarchy)
  - [shortPrintStringOf](#obj-shortPrintStringOf)
- [properties](#properties)
- [Path](#Path)
- [Path.prototype](#Path.prototype)
  - [normalizePath](#Path.prototype-normalizePath)
  - [watch](#Path.prototype-watch)
  - [debugFunctionWrapper](#Path.prototype-debugFunctionWrapper)

#### events.js

- [events](#events)
- [obj](#obj)
  - [once](#obj-once)

#### messenger.js

- [messenger](#messenger)

#### worker.js

- [WorkerSetup](#WorkerSetup)
- [remoteWorker](#remoteWorker)
  - [callStringifiedFunction](#remoteWorker-callStringifiedFunction)
- [BrowserWorker](#BrowserWorker)
  - [create](#BrowserWorker-create)
- [worker](#worker)
  - [onmessage](#worker-onmessage)
  - [create](#worker-create)
- [NodejsWorker](#NodejsWorker)
  - [create](#NodejsWorker-create)
  - [workerSetupFunction](#NodejsWorker-workerSetupFunction)
  - [startWorker](#NodejsWorker-startWorker)



## string.js

### <a name="string"></a>string

 String utility methods for printing, parsing, and converting strings

#### <a name="string-format"></a>string.format()

 String+ -> String
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

#### <a name="num-toDegrees"></a>num.toDegrees(n)

 

```js
num.toDegrees(Math.PI/2) // => 90
```

#### <a name="num-toRadians"></a>num.toRadians(n)

 

```js
num.toRadians(180) // => 3.141592653589793
```



## date.js

### <a name="dateFormat"></a>dateFormat

 http://blog.stevenlevithan.com/archives/date-time-format

#### <a name="exports.date-format"></a>exports.date.format(date, mask, utc)

 Custom date / time stringifier. Provides default masks:
 
 Mask           | Pattern
 ---------------|--------------------------------
 default        | `"ddd mmm dd yyyy HH:MM:ss"`
 shortDate      | `"m/d/yy"`
 mediumDate     | `"mmm d, yyyy"`
 longDate       | `"mmmm d, yyyy"`
 fullDate       | `"dddd, mmmm d, yyyy"`
 shortTime      | `"h:MM TT"`
 mediumTime     | `"h:MM:ss TT"`
 longTime       | `"h:MM:ss TT Z"`
 isoDate        | `"yyyy-mm-dd"`
 isoTime        | `"HH:MM:ss"`
 isoDateTime    | `"yyyy-mm-dd'T'HH:MM:ss"`
 isoUtcDateTime | `"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"`
 
 and internationalized strings via `date.format.i18n.dayNames`
 and `date.format.i18n.dayNames`
 

```js
date.format(new Date(), date.format.masks.longTime) // => "7:13:31 PM PDT"
date.format(new Date(), "yyyy/mm/dd") // => "2014/10/09"
```

#### <a name="exports.date-equals"></a>exports.date.equals(date, otherDate)



#### <a name="exports.date-relativeTo"></a>exports.date.relativeTo(date, otherDate)

 Prints a human readable difference of two Date objects. The older date
 goes first.
 

```js
var now = new Date();
date.relativeTo(new Date(now-2000), now) // => "2 secs"
date.relativeTo(new Date("10/11/2014"), new Date("10/12/2014")) // => "1 day"
```



## collection.js

### <a name="arrNative"></a>arrNative

 pure JS implementations of native Array methods

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

 `Number -> Function -> Array`
 Takes a generator function that is called for each `n`.
 

```js
arr.genN(3, num.random) // => [46,77,95]
```

#### <a name="arr-filter"></a>arr.filter(array, iterator, context)

 `[a] -> (a -> Boolean) -> c? -> [a]`
 Calls `iterator` for each element in `array` and returns a subset of it
 including the elements for which `iterator` returned a truthy value.
 Like `Array.prototype.filter`.

#### <a name="arr-detect"></a>arr.detect(arr, iterator, context)

 `[a] -> (a -> Boolean) -> c? -> a`
 returns the first occurrence of an element in `arr` for which iterator
 returns a truthy value

#### <a name="arr-filterByKey"></a>arr.filterByKey(arr, key)

 `[a] -> String -> [a]`
 

```js
var objects = [{x: 3}, {y: 4}, {x:5}]
arr.filterByKey(objects, "x") // => [{x: 3},{x: 5}]
```

#### <a name="arr-grep"></a>arr.grep(arr, filter, context)

 [a] -> String|RegExp -> [a]
 `filter` can be a String or RegExp. Will stringify each element in
 

```js

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

 `[a] -> (a -> Undefined) -> c? -> Undefined`
 `iterator` is called on each element in `array` for side effects. Like
 `Array.prototype.forEach`.

#### <a name="arr-zip"></a>arr.zip()

 Takes any number of lists as arguments. Combines them elment-wise.
 

```js
arr.zip([1,2,3], ["a", "b", "c"], ["A", "B"])
// // => [[1,"a","A"],[2,"b","B"],[3,"c",undefined]]
```

#### <a name="arr-flatten"></a>arr.flatten(array)

 Turns a nested collection into a flat one.
 

```js
arr.flatten([1, [2, [3,4,5], [6]], 7,8])
// => [1,2,3,4,5,6,7,8]
```

#### <a name="arr-map"></a>arr.map(array, iterator, context)

 `[a] -> (a -> b) -> c? -> [b]`
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

 `Array -> Function -> Object? -> Object? -> Object?`
 Applies `iterator` to each element of `array` and returns a new Array
 with the results of those calls. Like `Array.prototype.some`.

#### <a name="arr-reduceRight"></a>arr.reduceRight(array, iterator, memo, context)



#### <a name="arr-include"></a>arr.include(array, object)

 

```js
arr.include([1,2,3], 2) // => true
```

#### <a name="arr-some"></a>arr.some(array, iterator, context)

 `[a] -> (a -> Boolean) -> c? -> Boolean`
 Returns true if there is at least one abject in `array` for which
 `iterator` returns a truthy result. Like `Array.prototype.some`.

#### <a name="arr-every"></a>arr.every(array, iterator, context)

 `[a] -> (a -> Boolean) -> c? -> Boolean`
 Returns true if for all abjects in `array` `iterator` returns a truthy
 result. Like `Array.prototype.every`.

#### <a name="arr-equals"></a>arr.equals(array, otherArray)

 Returns true iff each element in `array` is equal (`==`) to its
 corresponding element in `otherArray`

#### <a name="arr-sort"></a>arr.sort(array, sortFunc)

 `[a] -> (a -> Number)? -> [a]`
 Just `Array.prototype.sort`

#### <a name="arr-sortBy"></a>arr.sortBy(array, iterator, context)

 

```js
arr.sortBy(["Hello", "Lively", "User"], function(ea) {
return ea.charCodeAt(ea.length-1); }) // => ["Hello","User","Lively"]
```

#### <a name="arr-sortByKey"></a>arr.sortByKey(array, key)

 

```js
jsext.arr.sortByKey([{x: 3}, {x: 2}, {x: 8}], "x")
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

#### <a name="arr-forEachShowingProgress"></a>arr.forEachShowingProgress()

 init args

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



### <a name="thresholds"></a>thresholds

 bins specifies n threshold values that will create n-1 bins.
 Each data value d is placed inside a bin i if:
 threshold[i] >= d && threshold[i+1] < d

#### <a name="arr-clone"></a>arr.clone(array)

 shallow copy

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

 show-in-docs

#### <a name="Group.prototype-reduceGroups"></a>Group>>reduceGroups(iterator, carryOver, context)

 Reduce/fold for each group, called like `iterator(carryOver, groupKey, group)`  

#### <a name="Group.prototype-count"></a>Group>>count()

 counts the elements of each group

### <a name="grid"></a>grid

 A grid is just a two-dimaensional array, representing a table-like data

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
 We assume that `a[0] <= a[1] and b[0] <= b[1]` accoring to `isInterval`
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



## function.js

#### <a name="fun-argumentNames"></a>fun.argumentNames(f)

 it's a class...

#### <a name="fun-extractBody"></a>fun.extractBody(func)

 returns the body of func as string, removing outer function code and
 superflous indent

#### <a name="fun-throttle"></a>fun.throttle(func, wait)

 exec func at most once every wait ms even when called more often
 useful to calm down eagerly running updaters and such

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

#### <a name="Closure"></a>Closure()

 represents a function and its bound values

#### <a name="Closure.prototype-getFuncProperties"></a>Closure>>getFuncProperties()

 a function may have state attached

#### <a name="Closure.prototype-recreateFuncFromSource"></a>Closure>>recreateFuncFromSource(funcSource, optFunc)

 what about objects that are copied by value, e.g. numbers?
 when those are modified after the originalFunc we captured
 varMapping then we will have divergent state

#### <a name="Closure.prototype-couldNotCreateFunc"></a>Closure>>couldNotCreateFunc(src)

 alert(msg);



## object.js

#### <a name="obj-inspect"></a>obj.inspect(obj, options, depth)

 print function

#### <a name="obj-merge"></a>obj.merge(objs)

 // if objs are arrays just concat them
 // if objs are real objs then merge propertdies

#### <a name="obj-valuesInPropertyHierarchy"></a>obj.valuesInPropertyHierarchy(obj, name)

 lookup all properties named name in the proto hierarchy of obj
 also uses Lively's class structure

#### <a name="obj-shortPrintStringOf"></a>obj.shortPrintStringOf(obj)

 primitive values

### <a name="properties"></a>properties

 -=-=-=-=-=-
 properties
 -=-=-=-=-=-

### <a name="Path"></a>Path

 -=-=-=-=-=-=-=-=-=-=-=-=-=-
 js object path accessor
 -=-=-=-=-=-=-=-=-=-=-=-=-=-

#### <a name="Path.prototype-normalizePath"></a>Path>>normalizePath()

 FIXME: define normalization

#### <a name="Path.prototype-watch"></a>Path>>watch(options)

 options: target, haltWhenChanged, uninstall, onGet, onSet, verbose

#### <a name="Path.prototype-debugFunctionWrapper"></a>Path>>debugFunctionWrapper(options)

 options = {target, [haltWhenChanged, showStack, verbose, uninstall]}



## events.js

### <a name="events"></a>events

 A simple node.js-like cross-platform event emitter implementations.

#### <a name="obj-once"></a>obj.once(type, handler)

args



## messenger.js

### <a name="messenger"></a>messenger



Messengers are interfaces that provide methods for asynchronous
message-based communication. This allows to give heterogeneous objects that are
communicating asynchronous (for example web workers, XHR requests, WebSockets,
node.js forked processes, ...) a unified interface.

This particular module allows users to create messengers and tie them to a
particular implementation by only providing a minimal set of functionality:
`send`, `listen`, `close`, and `isOnline`.

This is a minimal example for a messenger that only sends messages to the
console and receives nothing. (See below for a more sophisticated example.)

```js
var msger = jsext.messenger.create({
  send: function(msg, onSendDone) { console.log(msg); onSendDone(); },
  listen: function(messenger, thenDo) { thenDo(); },
  close: function(messenger, thenDo) { thenDo(); },
  isOnline: function() { return true }
});
```

#### Messenger interface

The interface methods are build to enable an user to send and receive
messages. Each messenger provides the following methods:

##### msger.id()

Each msger has an id that can either be defined by the user when the
msger is created or is automatically assigned.

##### msger.isOnline()

Can the msger send and receive messages right now?

##### msger.heartbeatEnabled()

Does the msger send automated heartbeat messages?

##### msger.listen(optionalCallback)

Brings the messenger "online": Starts listening for messages and brings it
into a state to send messages. `optionalCallback` is a function that is called
when listening begins. It should accept one argument `error` that is null if no
error occured when listening was started, an Error object otherwise.

##### msger.send(msg, onReceiveFunc)

Sends a message. The message should be structured according to the [message
protocol](#TODO). `onReceiveFunc` is triggered when the `msg` is being
answered. `onReceiveFunc` should take two arguments: `error` and `answer`.
`answer` is itself a message object.

##### msger.sendTo(target, action, data, onReceiveFunc)

A simpler `send`, the `msg` object is automatically assembled. `target`
should be an id of the receiver and `action` a string naming the service that
should be triggered on the receiver.

##### msger.answer(msg, data, expectMore, whenSend)

Assembles an answer message for `msg` that includes `data`. `expectMore`
should be truthy when multiple answers should be send (a streaming response,
see the [messaging protocol](#TODO)).

##### msger.close(thenDo)

Stops listening.

##### msger.whenOnline

Registers a callback that is triggered as soon as a listen attempt succeeds
(or when the messenger is listening already then it succeeds immediately).

##### msger.outgoingMessages()

Returns the messages that are currently inflight or not yet send.

##### msger.addServices(serviceSpec)

Add services to the messenger. `serviceSpec` should be  JS object whose keys
correspond to message actions.


```js
```js
msg.addServices({
helloWorld: function(msg, messenger) {
messenger.answer(msg, "received a message!");
}
});
```
See the examples below for more information.
##### *event` msger.on("message")
To allow users to receive messages that were not initiated by a send,
messengers are [event emitters](events.js) that emit `"message"` events
whenever they receive a new message.
The messenger object is used to create new messenger interfaces and ties
them to a specific implementation. Please see [worker.js]() for examples of
how web workers and node.js processes are wrapped to provide a cross-platform
interface to a worker abstraction.

```



## worker.js

### <a name="WorkerSetup"></a>WorkerSetup

 code in worker setup is evaluated in the context of workers, it will get to
 workers in a stringified form(!)

#### <a name="remoteWorker-callStringifiedFunction"></a>remoteWorker.callStringifiedFunction(stringifiedFunc, args, thenDo)

 runs stringified function and passing args. stringifiedFunc might
 be asynchronous if it takes an addaitional argument. In this case a
 callback to call when the work is done is passed, otherwise thenDo
 will be called immediatelly after creating and calling the function

### <a name="BrowserWorker"></a>BrowserWorker

 setting up the worker messenger interface, this is how the worker
 should be communicated with

#### <a name="BrowserWorker-create"></a>BrowserWorker.create(options)

 this function instantiates a browser worker object. We provide a
 messenger-based interface to the pure Worker. Please use create to get an
 improved interface to a worker

#### <a name="worker-onmessage"></a>worker.onmessage(evt)

 console.log("BrowserWorker got message\n", evt.data);

#### <a name="NodejsWorker-create"></a>NodejsWorker.create(options)

 figure out where the other lang libs can be loaded from
 if (!options.libLocation && !options.scriptsToLoad) {
   var workerScript = document.querySelector("script[src$=\"worker.js\"]");
   if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libLocation: \"...\"}) to explicitly define the path!");
   options.libLocation = workerScript.src.replace(/worker.js$/, '');
 }

#### <a name="NodejsWorker-workerSetupFunction"></a>NodejsWorker.workerSetupFunction()

 this code is run in the context of the worker process

#### <a name="NodejsWorker-startWorker"></a>NodejsWorker.startWorker(options, thenDo)

 WorkerSetup.initBrowserGlobals,

### <a name="worker"></a>worker

 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
 the worker interface, usable both in browser and node.js contexts
 -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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
