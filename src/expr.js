define(function module(foo, bar) {

  var NumExpr = function() { this.initialize.apply(this, arguments); };

  NumExpr.prototype.initialize = function(val) {
    this.val = val;
  };
  NumExpr.prototype.toString = function() {
    return this.val.toString();
  };
  NumExpr.prototype.result = function() {
    return this.val;
  };

  var NegExpr = function() { this.initialize.apply(this, arguments); };

  NegExpr.prototype.initialize = function(expr) {
    this.expr = expr;
  };
  NegExpr.prototype.toString = function() {
    return '(-' + this.expr.toString() + ')';
  };
  NegExpr.prototype.result = function() {
    return -1 * this.expr.result();
  };

  var AddExpr = function() { this.initialize.apply(this, arguments); };

  AddExpr.prototype.initialize = function(expr1, expr2) {
    this.expr1 = expr1;
    this.expr2 = expr2;
  };
  AddExpr.prototype.toString = function() {
    return '(' + this.expr1.toString() + ' + ' + this.expr2.toString() + ')';
  };
  AddExpr.prototype.result = function() {
    var result1 = this.expr1.result(),
        result2 = this.expr2.result();
    return result1 + result2;
  };

  return {
    NumExpr: NumExpr,
    NegExpr: NegExpr,
    AddExpr: AddExpr
  };
});
