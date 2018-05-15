// This function is never called in the code
// Try defining an example for it
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
/* Examples: {"probes":[{"location":[16,4,16,10]},{"location":[5,2,5,8]}],"sliders":[],"examples":[{"location":[3,9,3,28],"id":"fd7e-ac75-4de7","name":"Room temperature","values":{"celcius":"23"}},{"location":[3,9,3,28],"id":"63c6-d5d4-cd32","name":"Boiling","values":{"celcius":"100"}},{"location":[3,9,3,28],"id":"b73d-2fb7-f4fb","name":"Freezing","values":{"celcius":"0"}}],"replacements":[],"instances":[]} */