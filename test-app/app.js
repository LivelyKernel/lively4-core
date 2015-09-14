// es6 application code

import Human from './human.js'
import Github from './../client/github/github-client.js'
import lively4 from './../src/lively4-client.js'

let foo = new Human("Foo", "Bar");

Github.getRepo((result) => {
    "use strict";
    console.log('# # # # # # # # # # # # # # # # # # # # # ');
    console.log(result);
    console.log(Github);
});

document.querySelector("h1").innerHTML = `Hello ${foo.toString()}`;
