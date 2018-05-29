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

// Recursion
function factorial(x) {
  return x <= 1 ? 1 : x * factorial(x-1);
}
/* Examples: {"probes":[{"location":[16,4,16,10]},{"location":[5,2,5,8]},{"location":[31,2,31,8]}],"sliders":[{"location":[30,9,30,18]}],"examples":[{"location":[3,9,3,28],"id":"fd7e-ac75-4de7","name":"Room temperature","values":{"celcius":"23"},"instanceId":"0"},{"location":[3,9,3,28],"id":"63c6-d5d4-cd32","name":"Boiling","values":{"celcius":"100"},"instanceId":"0"},{"location":[3,9,3,28],"id":"b73d-2fb7-f4fb","name":"Freezing","values":{"celcius":"0"},"instanceId":"0"},{"location":[30,9,30,18],"id":"620c-dc07-a5da","name":"Normal","values":{"x":"8"},"instanceId":"0"},{"location":[30,9,30,18],"id":"b100-e3eb-6f20","name":"Negative","values":{"x":"-50"},"instanceId":"0"},{"location":[30,9,30,18],"id":"0f4e-deed-3446","name":"Large","values":{"x":"100"},"instanceId":"0"}],"replacements":[],"instances":[]} */