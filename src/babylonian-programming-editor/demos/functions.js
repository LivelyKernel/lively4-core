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
/* Examples: {"probes":[{"location":[15,4,15,10]},{"location":[4,2,4,8]},{"location":[58,2,58,8]}],"sliders":[],"examples":[{"location":[57,9,57,18],"id":"620c-dc07-a5da","name":"Normal","values":{"x":"8"},"instanceId":"0"},{"location":[57,9,57,18],"id":"b100-e3eb-6f20","name":"Negative","values":{"x":"-50"},"instanceId":"0"},{"location":[57,9,57,18],"id":"0f4e-deed-3446","name":"Large","values":{"x":"100"},"instanceId":"0"},{"location":[2,9,2,28],"id":"9125-35b4-1411","name":"","values":{"celcius":"23"},"instanceId":"0"},{"location":[2,9,2,28],"id":"8557-5dfd-01e3","name":"","values":{"celcius":"100"},"instanceId":"0"}],"replacements":[],"instances":[]} */