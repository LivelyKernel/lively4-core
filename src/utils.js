define(function module() {

var pushIfMissing = function(array, item) {
    // check for already existing.
    var exists = false;
    var len = array.length;
    for(var i = 0; i < len; i++)
        if(array[i] == item) {
            exists = true;
            break;
        };

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

return {
    pushIfMissing: pushIfMissing,
    removeIfExisting: removeIfExisting
};

});
