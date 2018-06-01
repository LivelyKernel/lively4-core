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
/* Examples: {"probes":[{"location":[4,2,4,8]}],"sliders":[],"examples":[{"location":[2,9,2,28],"id":"47be-519a-b017","name":{"value":"Room temperature","isConnection":false},"values":{"celcius":{"value":"23","isConnection":false}},"instanceId":{"value":"0","isConnection":false}},{"location":[2,9,2,28],"id":"f38a-3a54-b3cd","name":{"value":"Boiling","isConnection":false},"values":{"celcius":{"value":"100","isConnection":false}},"instanceId":{"value":"0","isConnection":false}}],"replacements":[],"instances":[]} */