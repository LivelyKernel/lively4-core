// es6 application code

import Human from './human.js'

let foo = new Human("Foo", "Bar");

document.querySelector("h1").innerHTML = `Hello ${foo.toString()}`;
