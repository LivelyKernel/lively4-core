define(function() { 'use strict'
  class Expr {
    constructor() {
      this.initialize.apply(this, arguments);
    }
    initialize() {}
  }

  class NumExpr extends Expr {
    initialize(val) {
      super.initialize();
      this.val = val;
    }
    toString() {
      return this.val.toString();
    }
    result() {
      return this.val;
    }
  }

  class AddExpr extends Expr {
    initialize(expr1, expr2) {
      super.initialize();
      this.expr1 = expr1;
      this.expr2 = expr2;
    }
    toString() {
      return '(' + this.expr1.toString() + ' + ' + this.expr2.toString() + ')';
    }
    result() {
      return this.expr1.result() + this.expr2.result();
    }
  }

  return {
    Expr,
    NumExpr,
    AddExpr
  };
});
