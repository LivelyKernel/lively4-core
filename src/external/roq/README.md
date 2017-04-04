# Reactive Object Queries[![Build Status](https://travis-ci.org/active-expressions/reactive-object-queries.svg?branch=master)](https://travis-ci.org/active-expressions/reactive-object-queries)
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
