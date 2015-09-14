define(function(require, exports, module) {
    "use strict";

    require('../../src/external/jquery-1.11.3.js');

    module.exports = {
        answer: 42,
        getRepo: function(cb) {
            $.ajax({
                url: "https://githubapi/",
                type: "get",
                data: {
                    foo: 'bar'
                },
                success: cb
            });
        }
    };
});
