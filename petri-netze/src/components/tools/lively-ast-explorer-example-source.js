function fizzbuzz(n) {
  function divisible(x, d) {
    return x % d === 0;
  }
  
  if (divisible(n, 15))
    return "FizzBuzz";
  if (divisible(n, 3))
    return "Fizz";
  if (divisible(n, 5))
    return "Buzz";
  return n;
}

function test() {
  return;
}

fizzbuzz(16);