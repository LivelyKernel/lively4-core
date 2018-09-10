"enable aexpr";

import { trackInstance, untrackInstance } from 'active-group';

export class NumExpr {
  constructor(val) {
    this.val = val;
    trackInstance.call(NumExpr, this);
  }
  destroy() {
    untrackInstance.call(NumExpr, this);
  }

  toString() {
    return this.val.toString();
  }

  result() {
    return this.val;
  }
}

export class NegExpr {
  constructor(expr) {
    this.expr = expr;
    trackInstance.call(NegExpr, this);
  }
  destroy() {
    untrackInstance.call(NegExpr, this);
  }

  toString() {
    return '(-' + this.expr.toString() + ')';
  }

  result() {
    return -1 * this.expr.result();
  }
}

export class AddExpr {
  constructor(expr1, expr2) {
    this.expr1 = expr1;
    this.expr2 = expr2;
    trackInstance.call(AddExpr, this);
  }
  destroy() {
    untrackInstance.call(AddExpr, this);
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
