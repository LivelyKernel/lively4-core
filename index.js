define(function module(require) { "use strict"

  var withLogging = require('./src/withlogging');
  var select = require('./src/select');

  var AddExpr = require('./src/expr').AddExpr;
  var NegExpr = require('./src/expr').NegExpr;
  var NumExpr = require('./src/expr').NumExpr;

  withLogging.call(AddExpr);

  var threshold = 10;
  var selection = select(AddExpr, function(expr) {
    return expr.result() > threshold;
  });

  var five = new NumExpr(5);
  var seventeen = new NumExpr(17);
  var expr = new AddExpr(
    five,
    new AddExpr(
      new NegExpr(
        seventeen
      ),
      new NumExpr(42)
    )
  );
  console.log(expr.toString(), expr.result());
  five.val = -30;
  console.log(expr.toString(), expr.result());
  seventeen.val = 70;
  console.log(expr.toString(), expr.result());

  console.log('Size of Selection', selection.size());
});
