// es6 application code

import Human from './human.js'
import lively4 from './../src/lively4-client.js'
import messaging from './../src/client/messaging.js'

import $ from './../src/external/jquery-1.11.3.js'

let foo = new Human("Foo", "Bar");

messaging.postMessage({
    meta: {
        type: 'foo'
    },
    message: 'HELLOOO?'
}).then(e => {
    "use strict";

    console.log('+ + + ++  ++ + + + + + + + + + + + +');
    console.log(e.data);
});

var GITHUB_CREDENTIALS = {
    token: 'd1ca84a85c7629b8148ed9a0d5cb28fe2725f544',
    auth: 'oauth'
};

messaging.postMessage({
    meta: {
        type: 'github api'
    },
    message: {
        // TODO: use .config file for such parametrization
        credentials: GITHUB_CREDENTIALS,
        topLevelAPI: 'getRepo',
        topLevelArguments: ['Lively4', 'manuallycreated'],
        method: 'read',
        args: ['master', 'README.md']
    }
}).then(e => {
    "use strict";

    console.log('+ + + ++  ++ + + + + + + + + + + + +');
    console.log(e.data.message);
});

/*
navigator.storageQuota.queryInfo("temporary").then(function(info) {
    console.log('quota in bytes', info.quota);
    console.log('used data in bytes', info.usage);
});
*/

$(document).ready(function() {
    var topLevelAPI = $('<input type="text" value="getRepo">');
    var topLevelArguments1 = $('<input type="text" value="Lively4">');
    var topLevelArguments2 = $('<input type="text" value="manuallycreated">');
    var method = $('<input type="text" value="read">');
    var args1 = $('<input type="text" value="master">');
    var args2 = $('<input type="text" value="README.md">');
    var args3 = $('<textarea style="padding-left:200;" />').text('FOOOOOOOOOOOO');
    var button = $('<button/>', {
        text: 'Do it!',
        click: function () {
            "use strict";

            messaging.postMessage({
                meta: {
                    type: 'github api'
                },
                message: {
                    // TODO: use .config file for such parametrization
                    credentials: GITHUB_CREDENTIALS,
                    topLevelAPI: topLevelAPI.val(),
                    topLevelArguments: [
                        topLevelArguments1.val(),
                        topLevelArguments2.val()
                    ],
                    method: method.val(),
                    args: {
                        read: [args1.val(),args2.val()],
                        write: [args1.val(), args2.val(), args3.val(), 'auto-commited']
                    }[ method.val()]
                }
            }).then(e => {
                "use strict";

                if(method.val() === 'read') {
                    args3.val(e.data.message);
                }
            });
        }
    });
    $('body').append(
        args3,
        topLevelAPI,
        topLevelArguments1,
        topLevelArguments2,
        method,
        args1,
        args2,
        button);
});

document.querySelector("h1").innerHTML = `Hello ${foo.toString()}`;
