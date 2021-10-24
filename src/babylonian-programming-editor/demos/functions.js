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
function /*slider:*//*example:*/factorial/*{}*//*{"id":"97c4_c756_018c","name":{"mode":"input","value":""},"color":"hsl(110, 30%, 70%)","values":{"x":{"mode":"input","value":"10"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(x) {
  /*probe:*/return/*{}*/ x <= 1 ? 1 : /*probe:*/x/*{}*/ * factorial(x-1);
}

// Intermodule examples
import Person from "./classes.js";

function /*example:*/testPerson/*{"id":"89b1_41ea_8d70","name":{"mode":"input","value":"Simple Person Test"},"color":"hsl(270, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  let /*probe:*/person/*{}*/ = new Person("David", "debuggging");
  personScreenshot(person);
  person.reverseName();
  /*probe:*/person/*{}*/.sayHello();
}



function personScreenshot(person) {
  
  /*probe:*/person/*{}*/.hobby = "testing";
  
}

function /*example:*//*example:*/loopScreenshot/*{"id":"4711_f750_1351","name":{"mode":"input","value":"Powers of 5"},"color":"hsl(160, 30%, 70%)","values":{"power":{"mode":"input","value":"5"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"9596_1d02_cbf3","name":{"mode":"input","value":"Powers of 2"},"color":"hsl(10, 30%, 70%)","values":{"power":{"mode":"input","value":"2"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(power) {
  for(let i = 0; i < 5; i++) {
    
    /*probe:*/power/*{}*/ *= power;
    
  }
}


function /*example:*/iterations/*{"id":"0966_ef94_b205","name":{"mode":"input","value":"a"},"color":"hsl(200, 30%, 70%)","values":{},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/() {
  
  var products = []
  
  /*slider:*/for/*{}*/ (var i=0; i< 10; i++) {
   
    for (var j=0; j< 20; j++) {
      products.push(i*j)
    }
  }
  return products
}




/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */