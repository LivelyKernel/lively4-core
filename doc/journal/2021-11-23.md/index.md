## 2021-11-23 Working on Babylonian Programming

*Author: @JensLincke* 


Getting Async to work in Babylonian/JS is on a good way and during working on it some thoughts occurred to me:

### How can we make debugging with something like this faster, IDE or better language support? 

```javascript
get _evaluationLocked() {
    return this.__evaluationLocked
  }
 
  set _evaluationLocked(v) {
    lively.notify("XXX " + v)
    if (!v) { 
      debugger
    }
    return this.__evaluationLocked = v
  }
```

### ContextJS for Modules


Babylonian/S has a nice implementation based on Context/S, which is easy there because Babylonian/S needs only to address methods in classes. But the Babylonian Editor in lively has much more freedom and needs to adapt module global functions, variable declarations, besides more typical Classes and methods. But since modules have a name and a scope, what about allowing ContextJS not only to address partial classes, but partial modules? A layer over modules and not just classes, by that means we could rethink the layer activation mechanism? Making it fast? It would have to be very fast if we would consider it as an implementation technique for Babylonian/JS, because the current mechanism does not affect the original code and therefore runs at full speed. The current implementation of  Babylonian/JS might also be a case of very extreme broad context-oriented programming by providing a layer of instrumented modules that are used in the context of example execution. So did we ever think about the granularity of those entities that are used as refinement?

From very course to very fine:

- a different virtual machine for a web request (load balancing, A-B testing, payed features)
- different program / process (again web request... or condition in shell script)
- different module 
- different class
- different/additional method / function (this is the level of most COP languages)
- different/additional statement
- different/additional expression ( Aspect-oriented programming can go down here...)

And COP is not about just replacing the original behavior, but composing nicely with the original behavior and other refinements. 
