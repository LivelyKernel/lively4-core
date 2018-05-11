// This function is never called in the code
// Try defining an example for it
function someFunction() {
  let celcius = 24;
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
/* Examples: {"probes":[{"location":[17,4,17,10]},{"location":[6,2,6,8]}],"sliders":[],"examples":[{"location":[16,9,16,15],"name":"Example","values":{"x":"10"}},{"location":[16,9,16,15],"name":"Test","values":{"x":"50000"}},{"location":[3,9,3,21],"name":"Something","values":{}}],"replacements":[{"location":[4,16,4,18],"code":"100"}],"instances":[]} */