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
function /*slider:*//*example:*/max/*{}*//*{"id":"ac09_1857_56af","name":{"mode":"input","value":""},"color":"hsl(150, 30%, 70%)","values":{"a":{"mode":"input","value":"10"},"b":{"mode":"input","value":"5"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(a, b) {
  if(a > b) {
    return a;
  } else {
    return b;
  }
}

// Recursion
function /*example:*/factorial/*{"name":{"mode":"input","value":""},"color":"hsl(280, 30%, 70%)","values":{"x":{"mode":"input","value":""}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(x) {
  return x <= 1 ? 1 : x * factorial(x-1);
}

// Arrow functions
export const fibonacci = (x) => {
  return x <= 1 ? 1 : fibonacci(x-1) + fibonacci(x-2);
}/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */