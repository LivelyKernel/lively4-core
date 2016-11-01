export class NumExpr {
  constructor() { this.initialize.apply(this, arguments); }

  initialize(val) {
    this.val = val;
    this.toString = () => this.val.toString();
    this.result = () => this.val;
  }
}

export class NegExpr {
  constructor() { this.initialize.apply(this, arguments); }
  initialize(expr) {
    this.expr = expr;
    this.toString = () => '(-' + this.expr.toString() + ')';
    this.result = () => -1 * this.expr.result();
  }
}

export class AddExpr {
  constructor() { this.initialize.apply(this, arguments); }

  initialize(expr1, expr2) {
    this.expr1 = expr1;
    this.expr2 = expr2;
    this.toString = () => '(' + this.expr1.toString() + ' + ' + this.expr2.toString() + ')';
    this.result = () => {
      var result1 = this.expr1.result(),
          result2 = this.expr2.result();
      return result1 + result2;
    }
  }
}
