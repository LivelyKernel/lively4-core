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
/* Examples: {"probe":[{"loc":[24,4,24,10]},{"loc":[26,4,26,10]}],"replacement":[],"example":[{"loc":[22,9,22,12],"value":{"a":"50","b":"40"}}]} */
