/**
 *
 * @param {Class} baseSet
 * @param {predicate} predicate
 * @return {View}
 */
function select(baseSet, predicate) { return new View(); }

/**
 * This callback to determine whether an item should be part of the resulting {@link View}
 * @callback predicate
 * @param {Object} item
 * @return {Boolean}
 */

/** Class representing a VIEW!!!!. */
class View {
    /**
     * Takes an additional filter function and returns a reactive object set. That set only contains the objects of the original set that also match the given filter function.
     * @param {View~filterIterator} iterator
     * @return {View}
     */
    filter(iterator) { return new View(); }

    /**
     * Takes a mapping function and returns another reactive object set. That set always contains the mapped objects corresponding to the objects in the original set.
     * @param {View~mapIterator} iterator
     * @return {View}
     */
    map(iterator) { return new View(); }

    /**
     * Takes a callback that consumes a single parameter. This callback is called whenever an object is added to the reactive set with that very object.
     * @param {View~enterCallback} callback
     * @return {View}
     */
    enter(callback) { return new View(); }

    /**
     * Similar to \texttt{enter}, but the callback is called everytime an object is removed from the set.
     * @param {View~exitCallback} callback
     * @return {View}
     */
    exit(callback) { return new View(); }

    /**
     * Returns an Array of the objects that are currently in the set. This Array does not update automatically.
     * @return {Array}
     */
    now() { return new Array(); }

    /**
     * Returns the current number of objects the set contains.
     * @return {Number}
     */
    size() { return new Number(); }
}

/**
 * The callback function called to determine whether an Object is in the derived {@link View}.
 * @callback View~filterIterator
 * @param {Object} item - item from the original {@link View}.
 * @return {Boolean}
 */

/**
 * The callback that computes the item to be added to the mapped {@link View}.
 * @callback View~mapIterator
 * @param {Object} item - item from the original {@link View}.
 * @return {Object} mapped item
 */

/**
 * This callback is call whenever an item is added to this {@link View}.
 * @callback View~enterCallback
 * @param {Object} item - the item that was just added to the {@link View}.
 */

/**
 * This callback is call whenever an item is removed from this {@link View}.
 * @callback View~exitCallback
 * @param {Object} item - the item that was just removed from the {@link View}.
 */
