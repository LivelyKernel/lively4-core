# Reactive Object Queries (a Collection of Notes)

## Related Systems
[Space Time](https://github.com/Mondego/spacetime) and [predicate collection classes (PCC)](https://github.com/Mondego/pcc) as related work to ROQs

- also use entity finder in Bloob as example
  - also use layering/instance-specific layering as example

## Group Semantics

- implicitly process groups using multitude-based programming
- define behavior of groups of objects, not in terms of their classes
  - e.g.:
    - [group-based behavior adaptations](https://lively4/notes/Group-based_Behavior_Adaptation.md), COP, ILA
    - COP for scoping behavior variations (which can be also done over time)

## Group-based Approach

Idea: **discard classes** as they do not reflect natural thinking about physical objects.
Instead follow the Theory **'Prototype Theory'** (what looks like X is an X)

## Groups

Groups as a wobbly data structure.

## Homomorphism and Isomorphism

- Homomorphismus
- Isomorhpismus
  - bidirectionales mapping für collection API
    - use Constraints statt `.map` function --> ROQs do only provide forward computation up until the writing of this thesis, so changes currently do not back-propagate.

## Analogy (ROQ)

= Object Grep

# Active Groups

= ROQ sets

## CSS Selectors for Active Groups: Design Alternatives

For `select('lively-window')`

- Mutation Observer
  - This technology is far away from CSS Selector syntax -> manual parsing required. Existing libraries offer just a small portion of the standard (e.g. no :hover): better using build-in browser technology to cope the full range of possibilities
    - here, our used library, called Mutation Summary:
      - [https://github.com/rafaelw/mutation-summary/blob/master/Tutorial.md]()
      - [https://github.com/rafaelw/mutation-summary/blob/master/APIReference.md#the-characterdata-query]()
      - [https://github.com/rafaelw/mutation-summary/blob/master/APIReference.md#the-all-query]()
      - example in lively4: `/src/external/mutation-summary/example-usage.js`
      - Downside: library is limited to relatively simple css queries (e.g. no `:hover`)
- Keyframe Hack
  - +: Uses built-in browser features, thus, relatively unexpensive
  - - may conflict with styles assigned by the user
  - caveat: each dom element can only be recognized by 1 keyframe animation at a time (because multiples would just modify the same property. then, just one of the identical animations start and therefore, the callback is fired)
  - - no callback on \textit{not matching any more} -> need to fallback to polling
- Polling
  - potentially expensive
  - maybe fall back to this strategy when having multiple CSS Selectors the keyframe hack cannot cope with

## Rethink Base Sets

ROQs currently work only with classes, but when doing trifecta, one could actually use other base sets, e.g. all instances in another View or use times to construct an implicit base set containing all objects that were created in the last minute.

Similar, we can use pattern to describe a Query, graphically. Thus, when integrating ROQ with Triples, we do not need Explicit Base Sets anymore; instead it solely depends on the structure of a subgraph.

-> Basically: Introduce an API to specify Basesets/To make objects persistent (this is the really important quality here (look at Group-based Behavior Adaptation). Provide convenience functions for common cases. Potential Basesets are:

- All instances of given class
- An Iterable (has to be monitored for change as well)
- a css selector (with mutation observers)
- all Graph Knots

## Operations on Active Groups

`select` of ROQs should return a Proxy to overwrite DNU. In case of DNU: delegate calls to all items, etc. \#Todo \#ROQ

Combine Active Groups with normal sets:
```javascript
select(Rectangle, r => r.isPortrait()) + [r1, r2];
```

`map` use case: create new Morph for each game object (also possible with a `toDOMNode` utility)


```javascript
sel
.enter
.exit
.layer({
  method: function() { cop.bla }
})
```

\textit{pluck} data from all data sources (sources = existing selection of objects)

flat pluck

`.comprehend(factoryFunction)` -> object disappears/is removed from game if its initial mapping source is destroyed

`doesNotUnderstand` könnte die function auf alle argumente anwenden (d3-like)(\textbf{jede active group als Proxy zurückgeben!})

Random idea:

Reactive object queries + entity component systems {simulations) + powerful queries (foreign keys, intersections) + local views with state and behavior + distributed +

---
---

# DEPRECATED
We now use `select(Class).filter(fn)` instead of `select(Class, fn)`!

# Reactive Object Queries [![Build Status](https://travis-ci.org/active-expressions/reactive-object-queries.svg?branch=master)](https://travis-ci.org/active-expressions/reactive-object-queries)
A JavaScript implementation of reactive object queries using active expressions.

## Installation

As npm for Node.js:

```
$ npm install reactive-object-queries --save
```

Or download the [bundle](https://raw.githubusercontent.com/active-expressions/active-expressions/master/dist/reactive-object-queries.js) file.

## Building

```
$ npm run-script build
```

creates the *bundle* file in the `dist` folder.

## Testing

As npm package:

```
$ npm test
```

### Prototype of Reactive Object Set Queries in JavaScript [![Build Status](https://travis-ci.org/onsetsu/active-collection-prototype.svg?branch=master)](https://travis-ci.org/onsetsu/active-collection-prototype) [![view on npm](http://img.shields.io/npm/v/object-queries.svg)](https://www.npmjs.org/package/object-queries)
Reactive Object Queries allow you to glob your program for specific objects. To do so, the `select` method returns a view containing all objects that match a given condition.
Note, that views are automatically updated, i.e. objects are added to or removed from a view in case of new objects being constructed or certain objects no longer match the specified condition.
As a result, a view represents a persistent materialized representation of your program state at any given point in time.

### Example
For a sample usage visit [this page](http://onsetsu.github.io/active-collection-prototype/bloob.html). This example implements an entity finding utility for the [Bloob Game/Physics Engine](https://github.com/onsetsu/bloob). You can search for any named entity in the game world. Simply type in a name and click on an item in the dropdown list to focus the camera on the particular entity. This list view is also reactive. For example, type *Crate* and click on *CrateSpawner*. Then, you can click on the *CrateSpawner* entity in the game world. This will create a *jumpingCrate* entity, which will automatically be reflected by the list view.

The following code was used to query our program and create the list view for any matching entity:

```javascript
// Track construction and destruction of Entity objects.
withLogging.call(Entity);

// Define a start query and create a dropdown menu with it.
var search = { string: 'Blob' };

var entityFinder = new Dropdown('#entityFinder', 'Blob');
entityFinder.show();

// Query the program space for entities containing the search string.
var matchingEntities = select(Entity, function(entity) {
  return entity.name.includes(entityFinder.getInput());
});

// Create a list item for every entity that matches the query.
matchingEntities.map(function(entity) {
  var item = document.createElement('a');
  item.innerHTML = entity.name;
  item.on('click', function() {
    env.camera.track(entity.body, layer);
  });

  return item;
})
  // When a new list item is created, append it to the list.
  .enter(function(elem) {
    entityFinder.div.append(elem);
  })
  // Remove a list item, when its corresponding entity no longer fits the condition.
  .exit(function(elem) {
    elem.remove();
  });
```

### API
The project supports a single method: [`select`](https://onsetsu.github.io/active-collection-prototype/docs/global.html#select). This method takes a class and a filter function as parameter. The filter function is called with an object of the specified class as single parameter and should return a boolean. Note, that a source code transformation is applied to the code in order to identify the context of the filter function. Before objects of a class can be queried, you have to track that class using the `withLogging` method.

The `select` method return a reactive object view that supports the following methods in three categories:

##### Reactive Transformations
* `map`: Takes a mapping function and returns another view. That view always contains the mapped objects corresponding to the objects in the callee.
* `filter`: Takes an additional filter function and returns a view. That view only contains the objects of the callee that also match the given filter function.
* `union`: Takes a second view and returns a view that contains all elements of both input views. However, duplications are only present once in the resulting view.
* `cross`: Takes a second view and returns a view that contains pair of elements representing the cartesian product of both input views.
* `delay`: Takes a timespan in milliseconds and returns a new view. Elements added to the callee are added to the returned view only after the timespan passed. If the element is removed from the callee within this timespan, the element is not propagated.
* `layer`: Takes an Object as parameter. The methods of this object are dynamically added to all elements of the view. This holds as long as the element is contained within the view. For an example, take a look at the [out-of-screen indicator demo](https://onsetsu.github.io/active-collection-prototype/outofscreenrendering.html).

##### React to View Changes using Fine-grained Events
* `enter`: Takes a callback that consumes a single parameter. This callback is called with that very object whenever an object is added to the view.
* `exit`: Similar to `enter`, but the callback is called everytime an object is removed from the view.

##### Inspecting the Current State of a View
* `now`: Returns an Array of the objects that are currently in the view. This Array does not update automatically.
* `size`: Returns the current number of objects the view contains.

For more information, please use the [jsdoc documentation](https://onsetsu.github.io/active-collection-prototype/docs/index.html).

### Get Reactive Object Queries

```
npm install object-queries
```

### Open Issues
* Modularize dependencies appropriately.
* Provide source code transformation as Babel plugin.

### Questions?
If you are interested or have any questions, simply write to [@onsetsu](https://github.com/onsetsu).
