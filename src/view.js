/**
 *
 * @param {Class} baseSet
 * @param {Function} predicate
 * @return {View}
 */
function select(baseSet, predicate) { return new View(); }

/** Class representing a VIEW!!!!. */
class View {
    /**
     * Takes an additional filter function and returns a reactive object set. That set only contains the objects of the original set that also match the given filter function.
     * @param {Function} iterator
     * @return {View}
     */
    filter(iterator) { return new View(); }

    /**
     * Takes a mapping function and returns another reactive object set. That set always contains the mapped objects corresponding to the objects in the original set.
     * @param {Function} iterator
     * @return {View}
     */
    map(iterator) { return new View(); }

    /**
     * Takes a callback that consumes a single parameter. This callback is called whenever an object is added to the reactive set with that very object.
     * @param {Function} callback
     * @return {View}
     */
    enter(callback) { return new View(); }

    /**
     * Similar to \texttt{enter}, but the callback is called everytime an object is removed from the set.
     * @param {Function} callback
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