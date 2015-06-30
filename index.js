define(function(require) {

  var withAdvice = require('lib/flight/advice').withAdvice;
  var AddExpr = require('src/expr').AddExpr;
  var NumExpr = require('src/expr').NumExpr;
  var select = require('src/select');

  function withLogging() {
    this.after('initialize', function() {
      console.log("LHKJFWIFK");
    });
    this.after('destroy', function() {
      console.log("LHKJFWIFK");
    });
  }
  withAdvice.call(NumExpr.prototype);
  withLogging.call(NumExpr.prototype);

  var expr = new AddExpr(
    new NumExpr(5),
    new AddExpr(
      new NumExpr(42),
      new NumExpr(17)
    )
  );
  console.log(expr.toString(), expr.result());

  var selection = select(NumExpr, function(numExpr) {
    return numExpr.result() > 10;
  });
});
