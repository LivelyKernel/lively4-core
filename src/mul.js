define(function(require, exports, module) {
    "use strict";

    var add = require('./add.js');

    module.exports = function mul(a, b) {
        "use strict";

        var result = 0;

        for(var i = 0; i < b; i++) {
            result = add(result, a);
        }

        return result;
    };
});
