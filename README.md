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
### [string.js]()

String utility methods for printing, parsing, and converting strings.



### [number.js]()

Utility functions for JS Numbers.




### [date.js]()

Util functions to print and work with JS date objects.




### [collection.js]()

Methods to make working with arrays more convenient and collection-like
abstractions for groups, intervals, grids.




### [function.js]()

Abstractions around first class functions like augmenting and inspecting
functions as well as to control function calls like dealing with asynchronous
control flows.




### [object.js]()

Utility functions that help to inspect, enumerate, and create JS objects




### [events.js]()

A simple node.js-like cross-platform event emitter implementation.




### [messenger.js]()

A pluggable interface to provide asynchronous, actor-like message
communication between JavaScript systems. Provides a unified message protocol
and send / receive methods.




### [worker.js]()

A platform-independent worker interface that will spawn new processes per
worker (if the platform you use it on supports it).



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
