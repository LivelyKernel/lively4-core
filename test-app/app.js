// es6 application code

import Human from './human'

let foo = new Human("Foo", "Bar");

document.querySelector("h1").innerHTML = `Hello ${foo.toString()}`;
