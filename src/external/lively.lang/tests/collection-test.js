/*global beforeEach, afterEach, describe, it*/

var Global = typeof window !== 'undefined' ? window : global;
var expect = Global.expect ||  require('expect.js');
var lively = Global.lively || {}; lively.lang = lively.lang || require('../index');

describe('arr', function() {

  var arr = lively.lang.arr;

  it('forEach', function() {
    var result = '';
    arr.forEach([4,5,6], function(ea, i) {
      result += '[' + ea + ',' + i + ']'; })
    expect(result).to.equal('[4,0][5,1][6,2]')
  });

  it("range", function() {
    expect(arr.range(1,1)).to.eql([1]);
    expect(arr.range(1,1, 10)).to.eql([1]);
    expect(arr.range(1,5)).to.eql([1,2,3,4,5]);
    expect(arr.range(1,10, 2)).to.eql([1,3,5,7,9]);
    expect(arr.range(10, 1, -2)).to.eql([10,8,6,4,2]);
    expect(arr.range(10, 1, 20)).to.eql([10]);
  });

  it('without', function() {
    var array = ["a"];
    expect([]).to.eql(arr.without(array, "a"));
    expect(["a"]).to.eql(arr.without(array, "c"));
    delete array[0];
    expect([]).to.eql(arr.without(array, "a"));
  });

  it('mutableCompact', function() {
    var a = ["a", "b", "c", undefined];
    delete a[1];
    arr.mutableCompact(a);
    expect(["a", "c", undefined]).to.eql(a);
  });

  it('min', function() {
    var a = [{x:2,y:12},{x:5,y:6},{x:9,y:4}];
    expect(2).to.eql(arr.min(arr.pluck(a, 'x')));
    expect(4).to.eql(arr.min(arr.pluck(a, 'y')));
    expect({x:2,y:12}).to.eql(arr.min(a, function(ea) { return ea.x }));
    expect({x:9,y:4}).to.eql(arr.min(a, function(ea) { return ea.y }));

    expect(2).to.eql(arr.min([5,3,2,6,4,3,2]));
    expect(-10).to.eql(arr.min([-3,-3,-5,-10]));
    expect(-10).to.eql(arr.min([-3,-3,-5,-10]));
    expect(-5).to.eql(arr.min([-3,null,-5,null]));
    expect(0).to.eql(arr.min([0, 10]));
    expect({x: 'foo'}).to.eql(arr.min([{x: 'bar'},{x: 'foo'}, {x: 'baz'}], function(ea) { return ea.x.charCodeAt(2); }));
  });

  it('max', function() {
    var a = [{x:2,y:12},{x:5,y:6},{x:9,y:4}];
    expect(9).to.equal(arr.max(arr.pluck(a, 'x')));
    expect(12).to.equal(arr.max(arr.pluck(a, 'y')));
    expect({x:9,y:4}).to.eql(arr.max(a, function(ea) { return ea.x }));
    expect({x:2,y:12}).to.eql(arr.max(a, function(ea) { return ea.y }));

    expect(6).to.equal(arr.max([5,3,2,6,4,-3,2]));
    expect(-1).to.equal(arr.max([-3,-2,-1,-10]));
    expect(-2).to.equal(arr.max([-3,-2,null,-10]));
    expect(0).to.equal(arr.max([0, -10]));
    expect({x: 'baz'}).to.eql(
      arr.max([{x: 'bar'},{x: 'foo'}, {x: 'baz'}],
      function(ea) { return ea.x.charCodeAt(2); }));
  });

  it('swap', function() {
    var a = ['a', 'b', 'c', 'd', 'e'];
    arr.swap(a, 1,4);
    expect(a).to.eql(['a', 'e', 'c', 'd', 'b']);
    arr.swap(a, 0, -1)
    expect(a).to.eql(['b', 'e', 'c', 'd', 'a']);
  });

  it('rotate', function() {
    var a = ['a', 'b', 'c', 'd', 'e'];
    a = arr.rotate(a);
    expect(a).to.eql(['b', 'c', 'd', 'e', 'a']);
    a = arr.rotate(a, 2);
    expect(a).to.eql(['d', 'e', 'a', 'b', 'c']);
  });

  it('partition', function() {
    expect(arr.partition(arr.range(0,10), function(n) { return n % 2 === 0 }))
      .to.eql([[0,2,4,6,8,10], [1,3,5,7,9]]);
  });

  it('groupBy', function() {
    var elts = [{a: 'foo', b: 1},
                {a: 'bar', b: 2},
                {a: 'foo', b: 3},
                {a: 'baz', b: 4},
                {a: 'foo', b: 5},
                {a: 'bar',b:6}],
        group = arr.groupBy(elts, function(ea) { return ea.a; }),
        expected = {
          foo: [elts[0],elts[2],elts[4]],
          bar: [elts[1],elts[5]],
          baz: [elts[3]]
        };

    expect(expected).to.eql(group);
    expect([[elts[0],elts[2],elts[4]],[elts[1],elts[5]],[elts[3]]])
      .to.eql(group.toArray(), 'toArray');

    expect(['foo', 'bar', 'baz']).to.eql(group.keys(), 'groupNames');
    expect({foo: 3, bar: 2, baz: 1}).to.eql(group.count(), 'coount');

    var mapGroupsResult = group.mapGroups(function(groupName, group) { return arr.sum(arr.pluck(group, 'b')); });
    expect({foo: 9, bar: 8, baz: 4}).to.eql(mapGroupsResult, 'mapGroupsResult');

    var mapGroupResult = group.map(function(groupName, groupEl) { return groupEl.b; });
    expect({foo: [1,3,5], bar: [2,6], baz: [4]}).to.eql(mapGroupResult, 'mapGroupResult');
  });

  it('uniqBy', function() {
    var a = [{x:33}, {x: 1}, {x: 2}, {x: 3}, {x: 99}, {x: 1}, {x: 2}, {x:1}, {x: 1}],
        result = arr.pluck(arr.uniqBy(a, function(a,b) { return a.x === b.x; }), 'x'),
        expected = [33, 1,2,3,99];
    expect(expected).to.eql(result);
  });

  it('mask', function() {
    var a = arr.range(1,4),
        mask = [false, true, false, true];
    expect([2,4]).to.eql(arr.mask(a, mask), 'mask');
  });

  it('reMatches', function() {
    var a = ['foo', 'bar', 'zork'],
        result = arr.reMatches(a, /.r.?/i);
    expect([
        null,
        {'0': 'ar', index: 1, input: 'bar'},
        {'0': 'ork', index: 1, input: 'zork'}]).to.eql(result);
  });

  describe("batchify", function() {

    it('splits array ccording to constraint', function() {
      function batchConstrained(batch) { return batch.length == 1 || arr.sum(batch) < batchMaxSize; }
      var batchMaxSize = Math.pow(2, 28)/*256MB*/,
          sizes = [
              Math.pow(2, 15), // 32KB
              Math.pow(2, 29), // 512MB
              Math.pow(2, 29), // 512MB
              Math.pow(2, 27), // 128MB
              Math.pow(2, 26), // 64MB
              Math.pow(2, 26), // 64MB
              Math.pow(2, 24), // 16MB
              Math.pow(2, 26)],// 64MB
          batches = arr.batchify(sizes, batchConstrained);
      expect(arr.flatten(batches)).to.have.length(sizes.length, 'not all batches included?');
      // the sum of each batch should be < 256MB or batch shoudl just have single item
      expect(batches.every(batchConstrained)).to.be(true);
    });

    it('needs to consume', function() {
      function batchConstrained(batch) { return arr.sum(batch) < batchMaxSize; }
      var batchMaxSize = 3,
          sizes = [1,4,2,3];
      expect(function() { sizes.batchify(batchConstrained); })
        .to.throwError('batchify endless recursion?');
    });
  });

  describe("permutations", function() {
    it("creates them", function() {
      expect(arr.permutations([3,1,2])).to.eql(
        [[3, 1, 2], [3, 2, 1], [1, 3, 2], [1, 2, 3], [2, 3, 1], [2, 1, 3]])
    })
  });

  it("delimWith", function() {
    expect(arr.delimWith(["test", "abc", 444], "aha")).to.eql(["test","aha","abc","aha",444]);
  });

  describe("flatten", function() {

    it("un-nest arrays", function() {
      expect(arr.flatten([1, [2], [3, [4, [[[5]]]]]])).to.eql([1,2,3,4,5]);
    });

    it("un-nest arrays to a certain depth", function() {
      expect(arr.flatten([1, [2], [3, [4, [[[5]]]]]], 2)).to.eql([1,2,3,4,[[[5]]]]);
    });

  });

  describe("flatmap", function() {

    it("flatmaps", function() {
      var result = arr.flatmap([1,2,3], function(ea, i) { return lively.lang.arr.withN(i+1, ea) });
      expect(result).to.eql([1,2,2,3,3,3]);
    });

    it("flatmaps big time", function() {
      // old flatmap version threw stack overlflow errors
      var result = arr.flatmap(lively.lang.arr.range(1,800000), function(ea, i) { return [ea, i] });
      expect(result.length).to.eql(800000*2);
    });

  });

  describe("sorting", function() {

    it("isSorted", function() {
      expect(arr.isSorted([2,4,7,9])).to.be.true;
      expect(arr.isSorted([2,4,3,9])).to.be.false;
    });

    it("isSorted descending", function() {
      expect(arr.isSorted([4,2,1], true)).to.be.true;
      expect(arr.isSorted([4,5,1])).to.be.false;
    });
  });

  describe("combinations", function() {

    it("combines all elements of lists", function() {
      expect(arr.combinations([['a', 'b', 'c'], [1, 2]]))
        .to.eql([["a", 1], ["a", 2], ["b", 1], ["b", 2], ["c", 1], ["c", 2]]);
    });

    it("retrieves a specific combination", function() {
      var searchSpace = [["a", "b", "c"], [1,2]];
      expect(arr.combinationsPick(searchSpace, [0,1])).to.eql([["a",2], [1,0]]);
      expect(arr.combinationsPick(searchSpace, [1,0])).to.eql([["b",1], [1,1]]);
      expect(arr.combinationsPick(searchSpace, [2,1])).to.eql([["c",2], undefined]);
    });

  });
  it('histogram', function() {
    var data = [0,1,2,3,7,2,1,3,9];

    var hist = arr.histogram(data);
    expect([[0,1], [2,3], [7,2], [1,3], [9]]).to.eql(hist);

    var hist = arr.histogram(data, 3); // 3 bins
    expect([[0,1,2],[3,7,2],[1,3,9]]).to.eql(hist);

    var hist = arr.histogram(data, [0,3,6]); // 3 bins
    expect([[0,1,2,2,1],[3,3],[7,9]]).to.eql(hist);

    var data = [1,2,3,4];
    var hist = arr.histogram(data, [0,3,6]); // 3 bins
    expect([[1,2],[3,4],[]]).to.eql(hist);
  });

  it("zips", function() {
    expect(arr.zip([1,2,3], [4,5,6])).to.eql([[1,4],[2,5],[3,6]]);
  });

  describe("async", function() {

    var numbers = lively.lang.arr.range(1,10);
    var rand = lively.lang.num.random;

    describe("mapAsyncSeries()", function() {

      it("iterates in order", function(done) {
        lively.lang.arr.mapAsyncSeries(numbers, function(n, i, next) {
          setTimeout(function() { next(null, i+1); }, rand(0,100));
        }, function(err, result) {
          expect(result).to.eql(numbers);
          done();
        });
      });

      it("catches errors", function(done) {
        lively.lang.arr.mapAsyncSeries(numbers, function(n, i, next) {
          if (i === 2) throw new Error("FOO!"); next();
        }, function(err, result) {
          expect(err.message).to.eql("FOO!");
          done();
        });
      });

      it("does not invoke callbacks multiple times", function(done) {
        lively.lang.arr.mapAsyncSeries(numbers, function(n, i, next) {
          if (i === 2) next(null, n);
          setTimeout(lively.lang.fun.curry(next, null, n), 10);
        }, function(err, result) {
          expect(result).to.eql(numbers);
          done();
        });
      });

    });

    describe("mapAsync()", function() {

      it("maps asynchronously", function(done) {
        lively.lang.arr.mapAsync(numbers,
          function(n, i, next) { setTimeout(function() { next(null, n); }, rand(0,100)); },
          function(err, result) {
            expect(result).to.eql(numbers);
            done();
          });
      });

      it("maps asynchronously one elem", function(done) {
        lively.lang.arr.mapAsync([1],
          function(n, i, next) { setTimeout(function() { next(null, n); }, rand(0,100)); },
          function(err, result) {
            expect(result).to.eql([1]);
            done();
          });
      });

      it("maps asynchronously empty list", function(done) {
        lively.lang.arr.mapAsync([],
          function(n, i, next) { setTimeout(function() { next(null, n); }, rand(0,100)); },
          function(err, result) { expect(result).to.eql([]); done(); });
      });

      it("does not invoke callbacks twice", function(done) {
        lively.lang.arr.mapAsync(numbers,
          function(n, i, next) {
            setTimeout(function() { next(null, n); }, rand(0,100));
            if (i == 2) next(null, n);
          },
          function(err, result) {
            expect(result).to.eql(numbers);
            done();
          });
      });

      it("catches errors", function(done) {
        lively.lang.arr.mapAsync(numbers,
          function(n, i, next) {
            if (i == 2) throw new Error("FOO!");
            setTimeout(function() { next(null, n); }, rand(0,100));
          },
          function(err, result) {
            expect(err.message).to.be("FOO!");
            done();
          });
      });

      it("can control the number of parallel iterator invocations", function(done) {
        var maxInvocations = 0, invocations = 0;
        lively.lang.arr.mapAsync(numbers, {parallel: 3},
          function(n, i, next) {
            invocations++;
            maxInvocations = Math.max(maxInvocations, invocations);
            setTimeout(function() { invocations--; next(null, n); }, rand(0,100));
          },
          function(err, result) {
            expect(maxInvocations).to.be(3);
            done();
          });
      })
    });

  });

  describe("dropping and taking", function() {

    it("take", function() {
      expect(lively.lang.arr.take([1,2,3,4,5], 3)).to.eql([1,2,3]);
    });

    it("drop", function() {
      expect(lively.lang.arr.drop([1,2,3,4,5], 3)).to.eql([4,5]);
    });

    it("takeWhile", function() {
      expect(lively.lang.arr.takeWhile([1,2,3,4,5], function(n) { return n < 3; })).to.eql([1,2]);
      expect(lively.lang.arr.takeWhile([1,2,3,4,5], function(n) { return true; })).to.eql([1,2,3,4,5]);
      expect(lively.lang.arr.takeWhile([1,2,3,4,5], function(n) { return false; })).to.eql([]);
    });

    it("dropWhile", function() {
      expect(lively.lang.arr.dropWhile([1,2,3,4,5], function(n) { return n < 3; })).to.eql([3, 4,5]);
      expect(lively.lang.arr.dropWhile([1,2,3,4,5], function(n) { return true; })).to.eql([]);
      expect(lively.lang.arr.dropWhile([1,2,3,4,5], function(n) { return false; })).to.eql([1,2,3,4,5]);
    });
  })
});


describe('Interval', function() {

  var Interval = lively.lang.interval;

  it("tests for interval type", function() {
    expect(Interval.isInterval([1,2])).to.be(true);
    expect(Interval.isInterval([1,2,'some addition'])).to.be(true);
    expect(Interval.isInterval([1,1])).to.be(true);
    expect(Interval.isInterval([1,0])).to.be(false);
  })

  it("compares intervals", function() {
    var inputAndExpected = [
      [1,2], [3,4], -3,
      // less and at border
      [1,2], [2,3], -2,
      // less and overlapping
      [1,3], [2,4], -1,
      [1,5], [2,4], -1,
      [1,5], [2,4], -1,
      [1,5], [1,6], -1,
      // // equal
      [1,1], [1,1], 0,
      // // greater and pverlapping
      [2,4], [1,3], 1,
      // // greater and at border
      [3,4], [1,3], 2,
      // // greater and non-overlapping
      [2,4], [0,1], 3];

    for (var i = 0; i < inputAndExpected.length; i += 3) {
      var expected = inputAndExpected[i+2],
        a = inputAndExpected[i+0],
        b = inputAndExpected[i+1];
      expect(expected).to.equal(Interval.compare(a, b),expected + ' not result of cmp ' + a + ' vs ' + b);
    }

    // // less and non-overlapping
    // expect(-2).to.equal(Interval.compare([1,2], [3,4]),'< n-o');
    // // less and overlapping
    // expect(-1).to.equal(Interval.compare([1,2], [2,3]),'< o');
    // expect(-1).to.equal(Interval.compare([1,3], [2,4]),'< o');
    // expect(-1).to.equal(Interval.compare([1,5], [2,4]),'< o');
    // expect(-1).to.equal(Interval.compare([1,5], [2,4]),'< o');
    // expect(-1).to.equal(Interval.compare([1,5], [1,6]),'< o');
    // // // equal
    // expect(0).to.equal(Interval.compare([1,1], [1,1]),'=');
    // // // greater and overlapping
    // expect(1).to.equal(Interval.compare([3,4], [1,3]),'> o');
    // expect(1).to.equal(Interval.compare([2,4], [1,3]),'> o');
    // // // greater and non-overlapping
    // expect(2).to.equal(Interval.compare([2,4], [0,1]),'> n-o');

  })

  it("sorts intervals", function() {
    expect([]).to.eql(Interval.sort([]));
    expect([[1,2], [2,3]]).to.eql(Interval.sort([[1, 2], [2, 3]]));
    expect([[1,2], [1,3]]).to.eql(Interval.sort([[1, 3], [1, 2]]));
    expect([[1,2], [4,6], [5,9]]).to.eql(Interval.sort([[4,6], [1,2], [5,9]]));
  })

  it("coalesces two overlapping intervals", function() {
    expect(null).to.eql(Interval.coalesce([1,4], [5,7]));
    expect([1, 5]).to.eql(Interval.coalesce([1,3], [2, 5]));
    expect([1, 5]).to.eql(Interval.coalesce([3, 5], [1,3]));
    // this.assertEqualState([1, 5], Interval.coalesce([1, 5], [2,3]));
    // this.assertEqualState([3,6], Interval.coalesce([3,6], [4,5]));

    // var callbackArgs;
    // Interval.coalesce([3,6], [4,5], function() { callbackArgs = Array.from(arguments); })
    // this.assertEqualState([[3,6], [4,5], [3,6]], callbackArgs, 'callback');
  });

  it("coalesces any number of overlapping intervals", function() {
    expect([]).to.eql(Interval.coalesceOverlapping([]));
    expect([[1, 5]]).to.eql(Interval.coalesceOverlapping([[1,3], [2, 4], [2, 5]]));
    expect([[1, 3], [5, 10]]).to.eql(Interval.coalesceOverlapping([[1,3], [5,9 ], [6, 10]]));
    expect([[1, 8], [9, 10], [14, 21]]).to.eql(Interval.coalesceOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]]));

    // with merge func
    var result = Interval.coalesceOverlapping(
      [[3,5, 'b'], [1,4, 'a'], [8, 10, 'c']],
      function(a, b, merged) { merged.push(a[2] + b[2]) });
    expect([[1,5, 'ab'], [8, 10, 'c']]).to.eql(result);
  });

  it("coalesces identical intervals", function() {
    expect([[1,3]]).to.eql(Interval.coalesceOverlapping([[1,3], [1, 3]]));
  });

  it("finds free intervals inbetween", function() {
    expect([[0,10]]).to.eql(Interval.intervalsInbetween(0, 10, []));
    expect([[5,10]]).to.eql(Interval.intervalsInbetween(0, 10, [[0, 5]]));
    expect([[0,3], [5,10]]).to.eql(Interval.intervalsInbetween(0, 10, [[3, 5]]));
    expect([[1,3], [5,8]]).to.eql(Interval.intervalsInbetween(0, 10, [[0, 1], [3, 5], [8, 10]]));
    expect([[5,8]]).to.eql(Interval.intervalsInbetween(0, 10, [[0, 1], [1, 5], [8, 10]]));
    expect([[0,5]]).to.eql(Interval.intervalsInbetween(0, 5, [[8, 10]]));
    expect([[0,3]]).to.eql(Interval.intervalsInbetween(0, 5, [[3, 10]]));
    expect([]).to.eql(Interval.intervalsInbetween(0, 5, [[0, 6]]));
  });

  it("enumerates intervals using withIntervalsInRangeDo", function() {
    expect([[0,2, false], [2,3, true], [3,5, false], [5,8, true], [8,10, false]]).to.eql(Interval.intervalsInRangeDo(
        0, 10, [[8, 10], [0, 2], [3, 5]],
        function(interval, isNew) { interval.push(isNew); return interval; }));

    expect([[0,3, true], [3,5, 'x', false]]).to.eql(Interval.intervalsInRangeDo(
        0, 5, [[3, 6, 'x'], [6, 20, 'y']],
        function(interval, isNew) { interval.push(isNew); return interval; }),"slice interval in back");

    expect([[1,2, 'x', false], [2,5, true]]).to.eql(Interval.intervalsInRangeDo(
        1, 5, [[-4,0, 'y'], [0, 2, 'x']],
        function(interval, isNew) { interval.push(isNew); return interval; }),"slice interval in front");

    expect([[0,1, 'ab'], [1,2, 'c']]).to.eql(Interval.intervalsInRangeDo(
        0, 2, [[0,1, 'a'], [0,1, 'b'], [1,2, 'c']],
        function(interval, isNew) { return interval; },
        function(a, b, merged) { merged[2] = a[2] + b[2] }),"identical intervals not merged");
  });

  it("finds matching intervals", function() {
    var existingIntervals = [[1,4], [4,5], [5,8], [9,20]];
    var test = this, testTable = [
      {expected: [[0]],            input: [[1,4]]},
      {expected: [[0], [0]],      input: [[1,4], [1,4]]},
      {expected: [[]],        input: [[2,4]]},
      {expected: [[]],        input: [[4,6]]},
      {expected: [[1,2], [2,3], []],  input: [[4,8], [5,20], [10,20]]}
    ]

    testTable.forEach(function(ea) {
      expect(ea.expected).to.eql(
        Interval.mapToMatchingIndexes(existingIntervals, ea.input),
        'On input: ' + ea.input);
    });
  });

  it("merges overlapping intervals", function() {
    return; // WIP
    var inputsAndExpected = [
      {a: [[1,6, 'a'], [7,9, 'b']],
      b: [],
      expected: [[1,6, 'a'], [7,9, 'b']]},
      {a: [[1,6, 'a'], [6,9, 'b']],
      b: [[1,3, 'c']],
      expected: [[1,3, 'ac'], [3,6, 'a'], [7,9, 'b']]},
      // {a: [[1,3, 'a'], [6,9, 'b']],
      //  b: [[1,6, 'c']],
      //  expected: [[1,3, 'ac'], [3,6, 'c'], [6,9, 'b']]},
      // {a: [[1,3, 'a'], [3,8, 'b']],
      // b: [[1,6, 'c']],
      //  expected: [[1,3, 'ac'], [3,8, 'bc'], [6,8, 'b']]},
      // {a: [[1,3, 'a'], [3,4, 'b']],
      //  b: [[1,2, 'c'], [1,5, 'd']],
      //  expected: [[1,2, 'acd'], [2,3, 'ad'], [3,4, 'bd'], [4,5, 'd']]}
    ];

    function merge(a,b) {
      return [Math.min(a[0], b[0]), Math.max(a[1], b[1]), a[2] + b[2]]
    }
    for (var i = 0; i < inputsAndExpected.length; i++) {
      var expected = inputsAndExpected[i].expected,
        a = inputsAndExpected[i].a,
        b = inputsAndExpected[i].b;
      expect(expected).to.eql(Interval.mergeOverlapping(a, b, merge),expected + ' not result of merge ' + a + ' vs ' + b);
    }


    // nothing happens without a merge func
    // this.assertEqualState([], Interval.mergeOverlapping([]));
    // this.assertEqualState([[1,2, 'a'], [1,2, 'b']],
    //                       Interval.mergeOverlapping([[1,2, 'a'], [1,2, 'b']]));

    // this.assertEqualState(
    //     [[1,2, 'ab']],
    //     Interval.mergeOverlapping(
    //         [[1,2, 'a'], [1,2, 'b']],
    //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

    // this.assertEqualState(
    //     [[1,2, 'abc']],
    //     Interval.mergeOverlapping(
    //         [[1,2, 'a'], [1,2, 'b'], [1,2, 'c']],
    //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

    // this.assertEqualState(
    //     [[1,3, 'ab'], [3,6, 'b']],
    //     Interval.mergeOverlapping(
    //         [[1,3, 'a'], [1,6, 'b']],
    //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

    // this.assertEqualState(
    //     [[1,2, 'ac'], [2,3, 'abc'], [3, 4, 'bc'], [4, 6, 'c']],
    //     Interval.mergeOverlapping(
    //         [[1,3, 'a'], [2,4, 'b'], [1,6, 'c']],
    //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

    // this.assertEqualState([[1, 5]], Interval.mergeOverlapping([[1,3], [2, 4], [2, 5]]));
    // this.assertEqualState(
    //     [[1, 3], [5, 10]],
    //     Interval.mergeOverlapping([[1,3], [5,9 ], [6, 10]]));
    // this.assertEqualState(
    //     [[1, 8], [9, 10], [14, 21]],
    //     Interval.mergeOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]]));

    // // with merge func
    // var result = Interval.mergeOverlapping(
    //     [[3,5, 'b'], [1,4, 'a'], [8, 10, 'c']],
    //     function(a, b, merged) { merged.push(a[2] + b[2]) });
    // this.assertEqualState([[1,5, 'ab'], [8, 10, 'c']], result);
  });


});

describe('Grid', function() {

  var Grid = lively.lang.grid;

  it("creates a grid", function() {
    var result = Grid.create(2, 3, 'foo'),
      expected = [
        ['foo', 'foo', 'foo'],
        ['foo', 'foo', 'foo']];
    expect(expected).to.eql(result);
  });

  it("creates grid with distinct columns", function() {
    var result = Grid.create(2, 3, 'foo'),
      expected = [
        ['foo', 'bar', 'foo'],
        ['foo', 'foo', 'foo']];
    result[0][1] = 'bar';
    expect(expected).to.eql(result);
  });

  it("enumerates", function() {
    var result = [],
      expected = [[0,0], [0,1], [0,2],
                  [1,0], [1,1], [1,2]];
    Grid.forEach(Grid.create(2, 3), function(_, row, col) {
      result.push([row, col]); });
    expect(expected).to.eql(result);
  });

  it("maps", function() {
    var result = Grid.map(Grid.create(2, 3), function(_, row, col) {
      return row + col; }),
      expected = [[0, 1, 2],
            [1, 2, 3]];
    expect(expected).to.eql(result);
  });

  it("gridMapCreate", function() {
    var result = Grid.mapCreate(2, 3, function(row, col) {
      return row + col; }),
      expected = [[0, 1, 2],
            [1, 2, 3]];
    expect(expected).to.eql(result);
  });

  it("converts toObjects", function() {
    expect([{a:1,b:2},{a:3,b:4}]).to.eql(Grid.toObjects([['a', 'b'],[1,2],[3,4]]));
  });

  it("creates grid from objects", function() {
    var objects = [{x:1,y:2},{x:3},{z:4}],
      expected = [["x","y","z"],[1,2,null],[3,null,null],[null,null,4]];
    expect(expected).to.eql(Grid.tableFromObjects(objects));

    // gracefully handle non-arrays
    var object = {x:1,y:2},
      expected = [["x","y"],[1,2]];
    expect(expected).to.eql(Grid.tableFromObjects(object));
  });

  it("index access", function() {
    var g = Grid.mapCreate(3,3, function(i,j) { return [i,j]; });
    expect(Grid.get(g, 0, 0)).eql([0,0]);
    expect(Grid.get(g, 0, 1)).eql([0,1]);
    expect(Grid.get(g, 2, 2)).eql([2,2]);
    expect(Grid.get(g, 2, 3)).equal(undefined);
    expect(Grid.get(g, 3, 2)).equal(undefined);
    Grid.set(g, 0, 1, "foo");
    expect(Grid.get(g, 0, 1)).equal("foo");
  });

  it("row access", function() {
    var g = Grid.mapCreate(3,3, function(i,j) { return [i,j]; });
    expect(Grid.getRow(g, 1)).eql([[1,0], [1,1], [1,2]]);
    Grid.setRow(g, 1, [1,2,3])
    expect(g).eql([
      [[0, 0], [0, 1], [0, 2]],
      [1,2,3],
      [[2, 0], [2, 1], [2, 2]]]);
  });

  it("col access", function() {
    var g = Grid.mapCreate(3,3, function(i,j) { return [i,j]; });
    expect(Grid.getCol(g, 1)).eql([[0,1], [1,1], [2,1]]);
    Grid.setCol(g, 1, [1,2,3])
    expect(g).eql([
      [[0, 0], 1, [0, 2]],
      [[1, 0], 2, [1, 2]],
      [[2, 0], 3, [2, 2]]]);
  });
});

describe("ArrayProjection", function() {

  var arr = lively.lang.arr;
  var arrayProjection = lively.lang.arrayProjection;

  it("creates projection", function() {
    var sut = arrayProjection;
    // array = ["A","B","C","D","E","F","G","H","I","J"]
    var array = arr.range(65,74).map(function(i) { return String.fromCharCode(i); });
    expect({array: array, from: 0, to: 3}).to.eql(sut.create(array, 3));
    expect({array: array, from: 2, to: 5}).to.eql(sut.create(array, 3, 2));
    expect({array: array, from: 7, to: 10}).to.eql(sut.create(array, 3, 9));
  });

  it("gets projection in range", function() {
    var sut = arrayProjection;
    // array = ["A","B","C","D","E","F","G","H","I","J"]
    var array = arr.range(65,74).map(function(i) { return String.fromCharCode(i); }),
        projection = {array: array, from: 5, to: 8},
        result = sut.toArray(projection);
    expect(["F","G","H"]).to.eql(result);
  });

  it("computes projection indices", function() {
    var sut = arrayProjection;
    var array = arr.range(65,74).map(function(i) { return String.fromCharCode(i); }),
        projection = {array: array, from: 5, to: 8},
        result = sut.toArray(projection);
    expect(null).to.equal(sut.originalToProjectedIndex(projection, 2),'orig index to projected 2');
    expect(0).to.equal(sut.originalToProjectedIndex(projection, 5),'orig index to projected 5');
    expect(2).to.equal(sut.originalToProjectedIndex(projection, 7),'orig index to projected 7');
    expect(null).to.equal(sut.originalToProjectedIndex(projection, 9),'orig index to projected 9');
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    expect(7).to.equal(sut.projectedToOriginalIndex(projection, 2),'orig index to projected 2');
    expect(5).to.equal(sut.projectedToOriginalIndex(projection, 0),'orig index to projected 0');
    expect(null).to.equal(sut.projectedToOriginalIndex(projection, 4),'orig index to projected 4');
  });

  it("transforms projection to include index", function() {
    var sut = arrayProjection;
    var array = arr.range(65,74).map(function(i) { return String.fromCharCode(i); }),
        projection = sut.create(array, 3, 2);
    expect(projection).to.eql(sut.transformToIncludeIndex(projection, 3));
    expect({array: array, from: 1, to: 4}).to.eql(sut.transformToIncludeIndex(projection, 1));
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    var array = [1,2,3,4,5], projection = sut.create(array, 3);
    expect(array[3]).to.equal(
      sut.toArray(sut.transformToIncludeIndex(projection, 3))
        .slice(-1)[0]);
  });

});
