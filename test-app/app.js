// es6 application code

import Human from './human.js'
import Github from './../client/github/github-client.js'
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

Github.getRepo((result) => {
    "use strict";
    console.log('# # # # # # # # # # # # # # # # # # # # # ');
    console.log(result);
    console.log(Github);
});

document.querySelector("h1").innerHTML = `Hello ${foo.toString()}`;
