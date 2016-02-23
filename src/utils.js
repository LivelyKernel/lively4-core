define(function module() {

var pushIfMissing = function(array, item) {
    // check for already existing.
    var exists = false;
    var len = array.length;
    for(var i = 0; i < len; i++)
        if(array[i] == item) {
            exists = true;
            break;
        }

    // do not add an already existing item
    if (!exists) {
        array.push(item);
    }

    // return true if the given element was pushed, otherwise false
    return !exists;
};

var removeIfExisting = function(array, item) {
    var index = array.indexOf(item);
    if (index !== -1) {
        array.splice(index, 1);
        // return true if the given element was actually removed
        return true;
    }
    return false;
};

var Stack = function() {
    this.arr = [];
};
Stack.prototype.push = function(el) {
    this.arr.push(el);
};

Stack.prototype.pop = function() {
    this.arr.length--;
};

Stack.prototype.top = function() {
    return this.arr.last();
};

var isPrimitive = function(elem) {
    var getType = function (elem) {
        return Object.prototype.toString.call(elem).slice(8, -1);
    };

    var type = getType(elem);

    return type === 'String' ||
        type === 'RegExp' ||
        type === 'Boolean' ||
        type === 'Number' ||
        type === 'Null' ||
        type === 'Undefined';
};

return {
    pushIfMissing: pushIfMissing,
    removeIfExisting: removeIfExisting,
    Stack: Stack,
    isPrimitive: isPrimitive,
    identity: function identity(x) { return x; }
};

});
