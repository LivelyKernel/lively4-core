## lib/string.js

String utility methods for printing, parsing, and converting strings.

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
  - [joinPath](#string-joinPath)
  - [newUUID](#string-newUUID)
  - [createDataURI](#string-createDataURI)
  - [hashCode](#string-hashCode)
  - [md5](#string-md5)
  - [reMatches](#string-reMatches)
  - [stringMatch](#string-stringMatch)
  - [peekRight](#string-peekRight)
  - [peekLeft](#string-peekLeft)
  - [lineIndexComputer](#string-lineIndexComputer)
  - [lineNumberToIndexesComputer](#string-lineNumberToIndexesComputer)
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

### <a name="string"></a>string



#### <a name="string-format"></a>string.format()


 Takes a variable number of arguments. The first argument is the format
 string. Placeholders in the format string are marked with `"%s"`.
 

```js
lively.lang.string.format("Hello %s!", "Lively User"); // => "Hello Lively User!"
```

#### <a name="string-indent"></a>string.indent(str, indentString, depth)


 

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


 Takes a 2D Array and prints a table string. Kind of the reverse
 operation to `strings.tableize`
 

```js
string.printTable([["aaa", "b", "c"], ["d", "e","f"]])
   // =>
   // aaa b c
   // d   e f
```

#### <a name="string-printTree"></a>string.printTree(rootNode, nodePrinter, childGetter, indent)


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

#### <a name="string-joinPath"></a>string.joinPath()

 Joins the strings passed as paramters together so that ea string is
 connected via a single "/".
 

```js
string.joinPath("foo", "bar") // => "foo/bar";
```

#### <a name="string-newUUID"></a>string.newUUID()

 

```js
string.newUUID() // => "3B3E74D0-85EA-45F2-901C-23ECF3EAB9FB"
```

#### <a name="string-createDataURI"></a>string.createDataURI(content, mimeType)


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


 For converting character positions to line numbers.
 Returns a function accepting char positions. If the char pos is outside
 of the line ranges -1 is returned.
 

```js
var idxComp = string.lineIndexComputer("Hello\nWorld\n\nfoo");
idxComp(3) // => 0 (index 3 is "l")
idxComp(6) // => 1 (index 6 is "W")
idxComp(12) // => 2 (index 12 is "\n")
```

#### <a name="string-lineNumberToIndexesComputer"></a>string.lineNumberToIndexesComputer(s)


 For converting line numbers to [startIndex, endIndex]
 

```js
var idxComp = string.lineNumberToIndexesComputer("Hello\nWorld\n\nfoo");
idxComp(1) // => [6,12]
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