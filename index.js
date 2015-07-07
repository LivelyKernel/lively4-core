define(function module(require) { "use strict"

  var errorIfFalse = function(check) {
    if(!check) {
      throw new Error('OH NO!');
    }
  };

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
  errorIfFalse(expr.result() === 30);
  errorIfFalse(selection.size() === 2);

  five.val = -30;
  errorIfFalse(expr.result() === -5);
  errorIfFalse(selection.size() === 1);

  seventeen.val = 70;
  errorIfFalse(expr.result() === -58);
  errorIfFalse(selection.size() === 0);

  var eleven = new NegExpr(
    new NegExpr(
      new NumExpr(11)
    )
  );
  var expr2 = new AddExpr(
    eleven,
    new NumExpr(0)
  );
  errorIfFalse(expr2.result() === 11);
  errorIfFalse(selection.size() === 1);

  var newFive = new NumExpr(5)
  eleven.expr = newFive;
  errorIfFalse(expr2.result() === -5);
  errorIfFalse(selection.size() === 0);

  newFive.val = -11;
  console.log('Size of Selection', selection.size());
  errorIfFalse(expr2.result() === 11);
  errorIfFalse(selection.size() === 1);
});
