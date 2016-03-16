### Prototype of Reactive Object Set Queries in JavaScript [![Build Status](https://travis-ci.org/onsetsu/active-collection-prototype.svg?branch=master)](https://travis-ci.org/onsetsu/active-collection-prototype)
Object Set Queries allow you to glob your program for specific objects. To do so, the `select` method returns an object set containing all objects that match a given condition.
Note, that the object set is automatically updated, i.e. objects are added or removed from the set in case of new objects being constructed or certain objects no longer match the specified condition.
As a result, the object set represents a persistent materialized view on your program at any given point in time.

### Example
For a sample usage visit [this page](http://onsetsu.github.io/active-collection-prototype/bloob.html). This example implements an entity finding utility for the [Bloob Game/Physics Engine](https://github.com/onsetsu/bloob). You can search for any named entity in the game world. Simply type in a name and click on an item in the dropdown list to focus the camera on the particular entity. This list view is also reactive. For example, type *Crate* and click on *CrateSpawner*. Then, you can click on the *CrateSpawner* entity in the game world. This will create a *jumpingCrate* entity, which will automatically be reflected by the list view.

The following code was used to query our program and create the list view for any matching entity:

```javascript
// Track construction and destruction of Entity objects.
withLogging.call(Entity);

// Define a start query and create a dropdown menu with it.
var search = { string: 'Blob' };

var entityFinder = new EntityDropdown('#entityFinder', search);
entityFinder.show();

// Query the program space for entities containing the search string.
var matchingEntities = select(Entity, function(entity) {
  return entity.name.indexOf(search.string) > -1;
});

// Create a list item for every entity that matches the query.
matchingEntities.map(function(entity) {
  var name = entity.name;
  var file = jQuery('<a/>', {
    class: 'file',
    html: name,
    title: name
  });
  file.bind('click', entityFinder.focusCameraOn.bind(entityFinder, entity, layer));
  return file;
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
The project supports a single method: `select`. This method takes a class and a filter function as parameter. The filter function is called with an object of the specified class as single parameter and should return a boolean. Note, that a source code transformation is applied to the code in order to identify the context of the filter function. Before objects of a class can be queried, you have to track that class using the `withLogging` method.

The `select` method return a reactive object set that supports the following methods:
* `map`: Takes a mapping function and returns another reactive object set. That set always contains the mapped objects corresponding to the objects in the original set.
* `filter`: Takes an additional filter function and returns a reactive object set. That set only contains the objects of the original set that also match the given filter function.
* `enter`: Takes a callback that consumes a single parameter. This callback is called whenever an object is added to the reactive set with that very object.
* `exit`: Similar to `enter`, but the callback is called everytime an object is removed from the set.
* `now`: Returns an Array of the objects that are currently in the set. This Array does not update automatically.
* `size`: Returns the current number of objects the set contains.

### Questions?
If you are interested or have any questions, simply write to [@onsetsu](https://github.com/onsetsu).
