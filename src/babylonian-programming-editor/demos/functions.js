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
function max(a, b) {
  if(a > b) {
    return a;
  } else {
    return b;
  }
}

// Recursion
function factorial(x) {
  return x <= 1 ? 1 : x * factorial(x-1);
}

/* Examples: {"annotations":{"probes":[],"sliders":[],"examples":[{"location":[20,9,20,12],"id":"8cc9_3db9_c3d9","name":{"mode":"input","value":""},"color":"hsl(60, 30%, 70%)","values":{"a":{"mode":"input","value":"10"},"b":{"mode":"input","value":"8"}},"instanceId":{"mode":"select","value":"2817_8ee7_7238"},"prescript":"","postscript":""}],"replacements":[],"instances":[]},"context":{"prescript":"","postscript":""},"customInstances":[{"id":"2817_8ee7_7238","name":"ASDF","code":"return null;"},{"id":"1699_1760_e74a","name":"Number Two","code":"return 2;"}]} */