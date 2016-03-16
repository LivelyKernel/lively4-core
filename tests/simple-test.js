define(function module(require) { "use strict";

  var errorIfFalse = function(check) {
    if(!check) {
      throw new Error('OH NO!');
    }
  };

  var withLogging = require('../src/withlogging');
  var select = require('../src/select');

  var AddExpr = require('../src/expr').AddExpr;
  var NegExpr = require('../src/expr').NegExpr;
  var NumExpr = require('../src/expr').NumExpr;

  withLogging.call(AddExpr);

  var seventeen = new NumExpr(17);
  var adExpr = new AddExpr(
      new NegExpr(
          seventeen
      ),
      new NumExpr(42)
  );

  var threshold = 10;
  var selection = select(AddExpr, function(expr) {
    return expr.result() > threshold;
  });

  errorIfFalse(selection.size() === 1);

  var manualSelectionSize = 0;
  selection
      .enter(function(item) {
        manualSelectionSize++;
      })
      .exit(function(item) {
        manualSelectionSize--;
      });

  errorIfFalse(manualSelectionSize === 1);

  var mappedSelection = selection.map(function(addExpr) {
        return new NumExpr(addExpr.result());
      })
      .enter(function(numExpr) {
        console.log('new NumExpr through maping', numExpr);
      });


  errorIfFalse(mappedSelection.size() === 1);
  mappedSelection.now().forEach(function(numExpr) {
    errorIfFalse(numExpr.result() === 25);
  });

  var five = new NumExpr(5);
  var expr = new AddExpr(
      five,
      adExpr
  );
  errorIfFalse(expr.result() === 30);
  errorIfFalse(selection.size() === 2);
  errorIfFalse(manualSelectionSize === 2);

  errorIfFalse(mappedSelection.size() === 2);
  mappedSelection.now().forEach(function(numExpr) {
    errorIfFalse(
        numExpr.result() === 25 ||
        numExpr.result() === 30
    );
  });

  five.val = -30;
  errorIfFalse(expr.result() === -5);
  errorIfFalse(selection.size() === 1);
  errorIfFalse(manualSelectionSize === 1);

  errorIfFalse(mappedSelection.size() === 1);
  mappedSelection.now().forEach(function(numExpr) {
    errorIfFalse(numExpr.result() === 25);
  });

  seventeen.val = 70;
  errorIfFalse(expr.result() === -58);
  errorIfFalse(selection.size() === 0);
  errorIfFalse(manualSelectionSize === 0);

  errorIfFalse(mappedSelection.size() === 0);

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
  errorIfFalse(manualSelectionSize === 1);

  errorIfFalse(mappedSelection.size() === 1);
  mappedSelection.now().forEach(function(numExpr) {
    errorIfFalse(numExpr.result() === 11);
  });

  var newFive = new NumExpr(5)
  eleven.expr = newFive;
  errorIfFalse(expr2.result() === -5);
  errorIfFalse(selection.size() === 0);
  errorIfFalse(manualSelectionSize === 0);

  errorIfFalse(mappedSelection.size() === 0);

  newFive.val = -11;
  console.log('Size of Selection', selection.size());
  errorIfFalse(expr2.result() === 11);
  errorIfFalse(selection.size() === 1);
  errorIfFalse(manualSelectionSize === 1);

  errorIfFalse(mappedSelection.size() === 1);
  mappedSelection.now().forEach(function(numExpr) {
    errorIfFalse(numExpr.result() === 11);
  });

  expr2.destroy();
  expr2.destroy();
  console.log('Size of Selection', selection.size());
  errorIfFalse(selection.size() === 0);
  errorIfFalse(manualSelectionSize === 0);

  errorIfFalse(mappedSelection.size() === 0);

  /**
   * .layer test
   */
  var Person = require('../src/person').Person;

  withLogging.call(Person);

  var jenkinsName = 'Jenkins';
  var travisName = 'Travis';
  var jenkins = new Person(jenkinsName);
  var travis = new Person(travisName, Person.Dr);

  console.log(jenkins, travis);

  var drRefinement = {
    getName: function() {
      return Person.Dr + ' ' + cop.proceed();
    }
  };

  var TestLayer = new Layer('WHAT?')
      .refineObject(travis, drRefinement);
  console.log(TestLayer);
  //TestLayer.beGlobal();
  var doctors = select(Person, function(p) {
    return p.title === Person.Dr;
  })
      .layer(drRefinement);

  errorIfFalse(jenkins.getName() === jenkinsName);
  errorIfFalse(travis.getName() === Person.Dr + ' ' + travisName);
  console.log(travis.getName());
  travis.setTitle(Person.NoTitle);
  errorIfFalse(travis.getName() === travisName);
  console.log(travis.getName());

  var herukoName = 'Heruko';
  var heruko = new Person(herukoName, Person.Dr);

  console.log(heruko);
  errorIfFalse(heruko.getName() === Person.Dr + ' ' + herukoName);

  // ---- filter ----

  var DataHolder = require('../src/expr').DataHolder;
  withLogging.call(DataHolder);
  var range = {
    min: 0,
    max: 20
  };
  var positiveData = select(DataHolder, function(data) {
    return data.value > range.min;
  });
  var d1 = new DataHolder(17);
  var d2 = new DataHolder(33);
  var smallData = positiveData.filter(function(data) {
    return data.value < range.max;
  });
  errorIfFalse(smallData.now().length === 1);
  range.max = 50;
  errorIfFalse(smallData.now().length === 2);
  var d3 = new DataHolder(42);
  errorIfFalse(smallData.now().length === 3);
  range.min = 40;
  errorIfFalse(smallData.now().length === 1);

  // ---- union ----

  var ValueHolder = require('../src/expr').ValueHolder;
  withLogging.call(ValueHolder);
  var range1 = {
    min: 0,
    max: 25
  };
  var range2 = {
    min: 15,
    max: 50
  };
  var view1 = select(ValueHolder, function(data) {
    return range1.min <= data.value && data.value <= range1.max;
  });
  var view2 = select(ValueHolder, function(data) {
    return range2.min <= data.value && data.value <= range2.max;
  });
  var v1 = new ValueHolder(10);
  var v2 = new ValueHolder(20);
  var v3 = new ValueHolder(30);
  var union = view1.union(view2);
  errorIfFalse(union.now().length === 3);
  errorIfFalse(union.now().includes(v1));
  errorIfFalse(union.now().includes(v2));
  errorIfFalse(union.now().includes(v3));

  // remove a value that is contained in only one upstream
  v1.value = -1;
  errorIfFalse(union.now().length === 2);
  errorIfFalse(union.now().includes(v2));
  errorIfFalse(union.now().includes(v3));

  // remove a value from both upstreams
  v2.value = -1;
  errorIfFalse(union.now().length === 1);
  errorIfFalse(union.now().includes(v3));

  // add a value to one upstream
  v1.value = 10;
  errorIfFalse(union.now().length === 2);
  errorIfFalse(union.now().includes(v1));
  errorIfFalse(union.now().includes(v3));

  // add a value to both upstreams
  var v4 = new ValueHolder(20);
  errorIfFalse(union.now().length === 3);
  errorIfFalse(union.now().includes(v1));
  errorIfFalse(union.now().includes(v3));
  errorIfFalse(union.now().includes(v4));

  // remove multiple values at once
  range1.max = 15;
  range2.min = 35;

  errorIfFalse(union.now().length === 1);
  errorIfFalse(union.now().includes(v1));


  var OtherClass = require('../src/expr').OtherClass;
  withLogging.call(OtherClass);

  var otherInstance1 = new OtherClass(42);
  var baseView = select(OtherClass, function(data) {
    return data.value === 42;
  });
  var otherInstance2 = new OtherClass(42);
  var delayedView = baseView.delay(1000);
  var otherInstance3 = new OtherClass(42);
  var otherInstance4;

  errorIfFalse(delayedView.now().length === 0);

  setTimeout(function() {
    otherInstance4 = new OtherClass(42);
    otherInstance3.value = 17;
  }, 300);

  setTimeout(function() {
    otherInstance3.value = 42;
  }, 700);

  setTimeout(function() {
    errorIfFalse(delayedView.now().length === 2);
    errorIfFalse(delayedView.now().includes(otherInstance1));
    errorIfFalse(delayedView.now().includes(otherInstance2));

    otherInstance1.value = 17;

    errorIfFalse(delayedView.now().length === 1);
    errorIfFalse(delayedView.now().includes(otherInstance2));
  }, 1100);

  setTimeout(function() {
    errorIfFalse(delayedView.now().length === 2);
    errorIfFalse(delayedView.now().includes(otherInstance2));
    errorIfFalse(delayedView.now().includes(otherInstance4));
  }, 1500);

  setTimeout(function() {
    errorIfFalse(delayedView.now().length === 3);
    errorIfFalse(delayedView.now().includes(otherInstance2));
    errorIfFalse(delayedView.now().includes(otherInstance3));
    errorIfFalse(delayedView.now().includes(otherInstance4));
  }, 2000);

  describe('interpretation', function() {
    it('runs an empty program', function() {
      expect((undefined)).to.be.undefined;
    });
  });
});
