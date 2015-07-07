module('users.timfelgentreff.cassowary.HashSet').
    requires('users.timfelgentreff.cassowary.Hashtable').toRun(function() {
/**
 * Copyright 2010 Tim Down.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * HashSet
 *
 * This is a JavaScript implementation of HashSet, similar in concept
 * to those found in Java or C#'s standard libraries.  It is
 * distributed as part of jshashtable and depends on
 * jshashtable.js. It creates a single constructor function called
 * HashSet in the global scope.
 *
 * Author: Tim Down <tim@timdown.co.uk>
 * Version: 2.1
 * Build date: 27 March 2010
 * Website: http://www.timdown.co.uk/jshashtable/
 *
 *
 * adaption for Lively Kernel by Fabian Bornhofen
 * https://github.com/fbornhofen
 */
Object.subclass('HashSet', 'default category', {
    initialize: function(hashingFunction, equalityFunction) {
        this.hashingFunction = hashingFunction;
    this.equalityFunction = equalityFunction;
        this.hashTable = new Hashtable(hashingFunction, equalityFunction);
    },

    add: function(o) {
        this.hashTable.put(o, true);
    },

    addAll: function(arr) {
        var i = arr.length;
        while (i--) {
            this.hashTable.put(arr[i], true);
        }
    },

    values: function() {
        return this.hashTable.keys();
    },

    remove: function(o) {
        return this.hashTable.remove(o) ? o : null;
    },

    contains: function(o) {
        return this.hashTable.containsKey(o);
    },

    clear: function() {
        this.hashTable.clear();
    },

    size: function() {
        return this.hashTable.size();
    },

    isEmpty: function() {
        return this.hashTable.isEmpty();
    },

    clone: function() {
        var h = new HashSet(this.hashingFunction, this.equalityFunction);
        h.addAll(this.hashTable.keys());
        return h;
    },

    intersection: function(hashSet) {
        var intersection = new HashSet(this.hashingFunction, this.equalityFunction);
        var values = this.hashSet.values(), i = values.length, val;
        while (i--) {
            val = values[i];
            if (this.hashTable.containsKey(val)) {
                intersection.add(val);
            }
        }
        return intersection;
    },

    union: function(hashSet) {
        var union = this.clone();
        var values = this.hashSet.values(), i = values.length, val;
        while (i--) {
            val = values[i];
            if (!this.hashTable.containsKey(val)) {
                union.add(val);
            }
        }
        return union;
    },

    isSubsetOf: function(hashSet) {
        var values = this.hashTable.keys(), i = values.length;
        while (i--) {
            if (!this.hashSet.contains(values[i])) {
                return false;
            }
        }
        return true;
    },

    each: function(f) {
        var e = this.hashTable.keys(),
            i = e.length;
        while (i-- && i >= 0) {
            f(this.hashTable.keys()[i]);
        }
    },
    escapingEach: function(callback) {
        return this.hashTable.escapingEach(callback);
    }
});
}); // end of module
