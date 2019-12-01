function fizzbuzz(n) {
  if (n % 15 === 0)
    return "FizzBuzz";
  if (n % 3 === 0)
    return "Fizz";
  if (n % 5 === 0)
    return "Buzz";
  return n;
}

for (let i = 1; i <= 15; i++) {
  console.log(fizzbuzz(i));
}