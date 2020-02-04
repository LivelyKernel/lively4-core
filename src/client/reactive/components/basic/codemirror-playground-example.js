"enable aexpr";
// thomas mag es sachen zu machen... z.b. die ackermannfunktion
//let limit;
{
	let n = 1;
	let m = 2;

	function _ackermann(nn, mm) {
		if (nn >= limit) { return NaN }
		if (nn === 0) {
			return mm + 1;
		} else if (mm === 0) {
			return _ackermann(nn - 1, 1)
		} else {
			return _ackermann(nn - 1, _ackermann(nn, mm - 1));
		}
	}

	function ackermann() {
		return _ackermann(n, m);
	}

	let a = aexpr(() => limit + n + m);
	a.onChange(() => { console.error(ackermann())});

	limit = 3;
	n = 2;
	m = 20;
  n = 30;
}





let limit;
{
	let n;
	let fib_num;
	function _fib(num) {
		if (num >= limit) {
      return NaN}
		return _fib(num - 1) + _fib(num - 2);
	}
  
	function fib() {
		if (!fib_num) {
			fib_num = _fib(n);
		}
		return fib_num;
	}

	let b = aexpr(() => n);
	b.onChange(() => fib_num = false);
	let c = aexpr(() => fib());
	c.onChange(() => {console.error(fib())});

	limit = 1000;
  n = 999;
  n = 998;
  
}


