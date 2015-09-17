l4.identity = function identity(x) {
    return x;
};

l4.through = function through(callback) {
    return function(x) {
        callback(x);
        return x;
    }
};
