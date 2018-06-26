// Examples for functions
function celcuisToFahrenheit(celcius) {
  let fahrenheit = celcius * 9/5 + 32;
  return fahrenheit;
}

// This also works for static methods
class TestClass {
   static testMethod() {
     const pi = 3.1415026;
     console.log(pi);
   }
  
  static square(x) {
    return x*x;
  }
}

// It also works for functions with parameters
function /*example:*/max/*{"id":"ac09_1857_56af","name":{"mode":"input","value":""},"color":"hsl(150, 30%, 70%)","values":{"a":{"mode":"input","value":"10"},"b":{"mode":"input","value":"5"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(a, b) {
  if(a > b) {
    /*probe:*/return/*{}*/ a;
  } else {
    return b;
  }
}

// Arrow functions
export const /*example:*/fibonacci/*{"id":"4c22_6e4b_fe59","name":{"mode":"input","value":""},"color":"hsl(220, 30%, 70%)","values":{"x":{"mode":"input","value":"1"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/ = (x) => {
  /*probe:*/return/*{}*/ x <= 1 ? 1 : fibonacci(x-1) + fibonacci(x-2);
}

// Recursion
function /*example:*//*slider:*/factorial/*{"id":"97c4_c756_018c","name":{"mode":"input","value":""},"color":"hsl(110, 30%, 70%)","values":{"x":{"mode":"input","value":"10"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{}*/(x) {
  /*probe:*/return/*{}*/ x <= 1 ? 1 : /*probe:*/x/*{}*/ * factorial(x-1);
}

// Intermodule examples
import Person from "./classes.js";

function /*example:*/testPerson/*{"id":"89b1_41ea_8d70","name":{"mode":"input","value":""},"color":"hsl(270, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  let /*probe:*/person/*{}*/ = new Person("David", "debuggging");
  person.reverseName();
  /*probe:*/person/*{}*/.sayHello();
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */