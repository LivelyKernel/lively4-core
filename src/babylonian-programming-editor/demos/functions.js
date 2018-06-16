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
