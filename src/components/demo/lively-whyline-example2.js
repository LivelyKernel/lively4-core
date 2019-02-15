function numberToString(n, base) {
  let result = "";
  let sign = "";
  if (n < 0) {
    sign = "-";
    n = -n;
  }
  do {
    result = String(n % base) + result;
    n /= base;
  } while (n > 0);
  return sign + result;
}

let s = numberToString(13, 10);