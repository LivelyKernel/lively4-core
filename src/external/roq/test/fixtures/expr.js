export class NumExpr {
  constructor() { this.initialize.apply(this, arguments); }

  initialize(val) {
    this.val = val;
  }

  toString() {
    return this.val.toString();
  }

  result() {
    return this.val;
  }
}

export class NegExpr {
  constructor() { this.initialize.apply(this, arguments); }
  initialize(expr) {
    this.expr = expr;
  }

  toString() {
    return '(-' + this.expr.toString() + ')';
  }

  result() {
    return -1 * this.expr.result();
  }
}

export class AddExpr {
  constructor() { this.initialize.apply(this, arguments); }

  initialize(expr1, expr2) {
    this.expr1 = expr1;
    this.expr2 = expr2;
  }

  toString() {
    return '(' + this.expr1.toString() + ' + ' + this.expr2.toString() + ')';
  }

  result() {
    var result1 = this.expr1.result(),
        result2 = this.expr2.result();
    return result1 + result2;
  }
}
