self.l4 = {
    identity: function identity(x) {
        return x;
    },
    through: function through(callback) {
        return function(x) {
            callback(x);
            return x;
        }
    }
};

