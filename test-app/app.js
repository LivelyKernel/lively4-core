// es6 application code

import Human from './human.js'
import lively4 from './../src/lively4-client.js'
import messaging from './../src/client/messaging.js'

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

messaging.postMessage({
    meta: {
        type: 'github api'
    },
    message: {
        // TODO: use .config file for such parametrization
        credentials: {
            token: 'f468386a26986cbe44a80584fd478da86be3d546',
            auth: 'oauth'
        },
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


document.querySelector("h1").innerHTML = `Hello ${foo.toString()}`;
