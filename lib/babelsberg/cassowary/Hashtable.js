module('users.timfelgentreff.cassowary.Hashtable').requires().toRun(function() {
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
 * ORIGINAL:
 * jshashtable
 *
 * jshashtable is a JavaScript implementation of a hash table. It
 * creates a single constructor function called Hashtable in the
 * global scope.
 *
 * Author: Tim Down <tim@timdown.co.uk>
 * Version: 2.1
 * Build date: 21 March 2010
 * Website: http://www.timdown.co.uk/jshashtable
 *
 * I made it a Lively module.
 * Hashtable is still global.
 * Fabian Bornhofen <fbornhofen@googlemail.com>
 * 2011-10-24
 */
    var FUNCTION = 'function';

    var arrayRemoveAt = (typeof Array.prototype.splice == FUNCTION) ?
        function(arr, idx) {
            arr.splice(idx, 1);
        } :

        function(arr, idx) {
            var itemsAfterDeleted, i, len;
            if (idx === arr.length - 1) {
                arr.length = idx;
            } else {
                itemsAfterDeleted = arr.slice(idx + 1);
                arr.length = idx;
                for (i = 0, len = itemsAfterDeleted.length; i < len; ++i) {
                    arr[idx + i] = itemsAfterDeleted[i];
                }
            }
        };

    function hashObject(obj) {
        var hashCode;
        if (typeof obj == 'string') {
            return obj;
        } else if (typeof obj.hashCode == FUNCTION) {
            // Check the hashCode method really has returned a string
            hashCode = obj.hashCode();
            return (typeof hashCode == 'string') ? hashCode : hashObject(hashCode);
        } else if (typeof obj.toString == FUNCTION) {
            return obj.toString();
        } else {
            return safeToString(obj);
        }

        // moving try-catch into its own function, for V8 opt benefit
        function safeToString(obj) {
            try {
                return String(obj);
            } catch (ex) {
                // For host objects (such as ActiveObjects in IE) that
                // have no toString() method and throw an error when
                // passed to String()
                return Object.prototype.toString.call(obj);
            }
        }
    }

    function equals_fixedValueHasEquals(fixedValue, variableValue) {
        return fixedValue.equals(variableValue);
    }

    function equals_fixedValueNoEquals(fixedValue, variableValue) {
        return (typeof variableValue.equals == FUNCTION) ?
               variableValue.equals(fixedValue) : (fixedValue === variableValue);
    }

    function createKeyValCheck(kvStr) {
        return function(kv) {
            if (kv === null) {
                 debugger;
                throw new Error('null is not a valid ' + kvStr);
            } else if (typeof kv == 'undefined') {
                throw new Error(kvStr + ' must not be undefined');
            }
        };
    }

    var checkKey = createKeyValCheck('key'), checkValue = createKeyValCheck('value');

    /*-------------------------------------------------------------------------*/

    /// Bucket utility funcs
    var EXISTENCE = 0,
        ENTRY = 1,
        ENTRY_INDEX_AND_VALUE = 2;


    /// ---------------- Bucket

        Object.subclass('Bucket', 'default category', {
        initialize: function(hash, firstKey, firstValue, equalityFunction) {
                this[0] = hash;
            this.entries = [];
            this.addEntry(firstKey, firstValue);

            if (equalityFunction !== null) {
                this.getEqualityFunction = function() {
                    return equalityFunction;
                };
            }
        },

        createBucketSearcher: function(mode) {
            var that = this;
            return function(key) {
                var i = that.entries.length,
                    equals = that.getEqualityFunction(key),
                    entry;
                while (i--) {
                    entry = that.entries[i];
                    if (equals(key, entry[0])) {
                        switch (mode) {
                        case EXISTENCE:
                            return true;
                        case ENTRY:
                            return entry;
                        case ENTRY_INDEX_AND_VALUE:
                            return [i, entry[1]];
                        }
                    }
                }
                return false;
            };
        },

        createBucketLister: function(entryProperty) {
            var that = this;
            return function(aggregatedArr) {
                var startIndex = aggregatedArr.length;
                for (var i = 0, len = that.entries.length; i < len; ++i) {
                    aggregatedArr[startIndex + i] = that.entries[i][entryProperty];
                }
            };
        },

        getEqualityFunction: function(searchValue) {
            return (typeof searchValue.equals == FUNCTION) ?
                equals_fixedValueHasEquals :
                equals_fixedValueNoEquals;
        },

        getEntryForKey: function(key) {
            return (this.createBucketSearcher(ENTRY))(key);
        },

        getEntryAndIndexForKey: function(key) {
            return (this.createBucketSearcher(ENTRY_INDEX_AND_VALUE))(key);
        },

        removeEntryForKey: function(key) {
            var result = this.getEntryAndIndexForKey(key);
            if (result) {
                arrayRemoveAt(this.entries, result[0]);
                return result[1];
            }
            return null;
        },

        addEntry: function(key, value) {
            this.entries[this.entries.length] = [key, value];
        },

        keys: function(aggregatedArr) {
            return (this.createBucketLister(0))(aggregatedArr);
        },

        values: function(aggregatedArr) {
            return (this.createBucketLister(1))(aggregatedArr);
        },

        getEntries: function(entries) {
            var startIndex = entries.length;
            for (var i = 0, len = this.entries.length; i < len; ++i) {
                // Clone the entry stored in the bucket before adding to array
                entries[startIndex + i] = this.entries[i].slice(0);
            }
        },

        containsKey: function(key) {
            return (this.createBucketSearcher(EXISTENCE))(key);
        },

        containsValue: function(value) {
            var i = this.entries.length;
            while (i--) {
                if (value === this.entries[i][1]) {
                    return true;
                }
            }
            return false;
        }
    });

    /*-------------------------------------------------------------------------*/

    // Supporting functions for searching hashtable buckets

    function searchBuckets(buckets, hash) {
        var i = buckets.length, bucket;
        while (i--) {
            bucket = buckets[i];
            if (hash === bucket[0]) {
                return i;
            }
        }
        return null;
    }

    function getBucketForHash(bucketsByHash, hash) {
        var bucket = bucketsByHash[hash];

        // Check that this is a genuine bucket and not something
        // inherited from the bucketsByHash's prototype
        return (bucket && (bucket instanceof Bucket)) ? bucket : null;
    }


    /*-------------------------------------------------------------------------*/

    Object.subclass('Hashtable', 'default category', {
        initialize: function(hashingFunctionParam, equalityFunctionParam) {
            this.hashingFunctionParam = hashingFunctionParam;
            this.equalityFunctionParam = equalityFunctionParam;
            this.hasCustomEqualityFunction = (typeof equalityFunctionParam == FUNCTION);
            this.buckets = [];
            this.bucketsByHash = {};

        },

        hashingFunction: function(key) {
            return ((typeof this.hashingFunctionParam == FUNCTION) ?
                    this.hashingFunctionParam : hashObject) (key);
        },

        equalityFunction: function(arg1, arg2) {

            return ((this.hasCustomEqualityFunction) ?
                    equalityFunctionParam :
                    (function(a, b) { return a == b; })
                ) (arg1, arg2);
        },

        put: function(key, value) {
            checkKey(key);
            checkValue(value);
            var hash = this.hashingFunction(key), bucket, bucketEntry, oldValue = null;

                // Check if a bucket exists for the bucket key
            bucket = getBucketForHash(this.bucketsByHash, hash);
            if (bucket) {
                    // Check this bucket to see if it already contains this key
                bucketEntry = bucket.getEntryForKey(key);
                if (bucketEntry) {
                    // This bucket entry is the current mapping of key
                    // to value, so replace old value and we're done.
                    oldValue = bucketEntry[1];
                    bucketEntry[1] = value;
                } else {
                    // The bucket does not contain an entry for this key, so add one
                    bucket.addEntry(key, value);
                }
            } else {
                    // No bucket exists for the key, so create one and
                    // put our key/value mapping in
                bucket = new Bucket(
                    hash,
                    key,
                    value,
                    this.hasCustomEqualityFunction ? this.equalityFunction : null
                );
                this.buckets[this.buckets.length] = bucket;
                this.bucketsByHash[hash] = bucket;
            }
            return oldValue;
        },

        get: function(key) {
            checkKey(key);

            var hash = this.hashingFunction(key);

            // Check if a bucket exists for the bucket key
            var bucket = getBucketForHash(this.bucketsByHash, hash);
            if (bucket) {
                // Check this bucket to see if it contains this key
                var bucketEntry = bucket.getEntryForKey(key);
                if (bucketEntry) {
                    // This bucket entry is the current mapping of key
                    // to value, so return the value.
                    return bucketEntry[1];
                }
            }
            return null;
        },

        containsKey: function(key) {
            checkKey(key);
            var bucketKey = this.hashingFunction(key);

            // Check if a bucket exists for the bucket key
            var bucket = getBucketForHash(this.bucketsByHash, bucketKey);

            return bucket ? bucket.containsKey(key) : false;
        },

        containsValue: function(value) {
            checkValue(value);
            var i = this.buckets.length;
            while (i--) {
                if (this.buckets[i].containsValue(value)) {
                    return true;
                }
            }
            return false;
        },

        clear: function() {
            this.buckets.length = 0;
            this.bucketsByHash = {};
        },

        isEmpty: function() {
            return !this.buckets.length;
        },


        createBucketAggregator: function(bucketFuncName) {
            var that = this;
            return function() {
                var aggregated = [], i = that.buckets.length;
                while (i--) {
                    that.buckets[i][bucketFuncName](aggregated);
                }
                return aggregated;
            };
        },
        keys: function() {
            return (this.createBucketAggregator('keys'))();
        },
        values: function() {
            return (this.createBucketAggregator('values'))();
        },
        entries: function() {
            return (this.createBucketAggregator('getEntries'))();
        },

        remove: function(key) {
            checkKey(key);

            var hash = this.hashingFunction(key), bucketIndex, oldValue = null;

            // Check if a bucket exists for the bucket key
            var bucket = getBucketForHash(this.bucketsByHash, hash);

            if (bucket) {
                // Remove entry from this bucket for this key
                oldValue = bucket.removeEntryForKey(key);
                if (oldValue !== null) {
                    // Entry was removed, so check if bucket is empty
                    if (!bucket.entries.length) {
                        // Bucket is empty, so remove it from the bucket collections
                        bucketIndex = searchBuckets(this.buckets, hash);
                        arrayRemoveAt(this.buckets, bucketIndex);
                        delete this.bucketsByHash[hash];
                    }
                }
            }
            return oldValue;
        },

        size: function() {
            var total = 0, i = this.buckets.length;
            while (i--) {
                total += this.buckets[i].entries.length;
            }
            return total;
        },

        each: function(callback) {
            var that = this;
            var entries = that.entries(), i = entries.length, entry;
            while (i--) {
                entry = entries[i];
                callback(entry[0], entry[1]);
            }
        },

        escapingEach: function(callback) {
            var that = this;
                        var entries = that.entries(), i = entries.length, entry;
                        var context = {};  // GJB
                        while (i--) {
                                entry = entries[i];
                                context = callback(entry[0], entry[1]);
                                // 2011-10-21 fbo context can be falsey
                                if (context && context.hasOwnProperty('return')) {
                                    return context['return'];
                                } else if (context && context.hasOwnProperty('retval')) {
                                    return context.retval;
                                } else if (context && context.hasOwnProperty('break')) {
                                    break;
                                }
                        }
                },

        putAll: function(hashtable, conflictCallback) {
            var that = this;
            var entries = hashtable.entries();
            var entry, key, value, thisValue, i = entries.length;
            var hasConflictCallback = (typeof conflictCallback == FUNCTION);
            while (i--) {
                entry = entries[i];
                key = entry[0];
                value = entry[1];

                // Check for a conflict. The default behaviour is to
                // overwrite the value for an existing key
                if (hasConflictCallback && (thisValue = that.get(key))) {
                    value = conflictCallback(key, thisValue, value);
                }
                that.put(key, value);
            }
        },

        clone: function() {
            var that = this;
            var clone = new Hashtable(
                this.hashingFunctionParam,
                this.equalityFunctionParam
            );
            clone.putAll(that);
            return clone;
        }
    });
}); // end of module
