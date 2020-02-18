"enable aexpr";
let n = 1;
let m = 2;


let a = aexpr(() => n + m);
a.onChange(() => { lively.error(ackermann()) });

function _ackermann(nn, mm) {
	if (nn === 0) {
		return mm + 1;
	} else if (mm === 0) {
		return _ackermann(nn - 1, 1)
	} else {
		return _ackermann(nn - 1, _ackermann(nn, mm - 1));
	}
}


function ackermann() {
	lively.warn("calling ackermann with n " + n + " m " + m);
	if (n > 1 || m > 2) {
		lively.error("input" + n + " or " + m + " too high... reducing both");
		n = n - 1;
		m = m - 1;
	} else {
		return _ackermann(n, m);
	}
}


function sum(arr) {
  let result = 0;
  let n = 0;
  while (n <= arr.length) {
    result += arr[n];
    n++;
  }
  return result;
}

sum([...Array(12).keys()])





