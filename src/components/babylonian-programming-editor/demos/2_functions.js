// This function is never called in the code...
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
}