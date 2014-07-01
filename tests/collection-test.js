/*global beforeEach, afterEach, describe, it*/

var expect = typeof module !== 'undefined' && module.require ?
  module.require('expect.js') : this.expect;

var jsext = typeof module !== 'undefined' && module.require ?
  module.require('../index') : this.jsext;

var arr = jsext.arr;

describe('arr', function() {

  it('forEach', function() {
    var result = '';
    arr.forEach([4,5,6], function(ea, i) {
      result += '[' + ea + ',' + i + ']'; })
    expect(result).to.equal('[4,0][5,1][6,2]')
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

  it('batchify', function() {
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

  it('batchifyNeedstoConsume', function() {
    function batchConstrained(batch) { return arr.sum(batch) < batchMaxSize; }
    var batchMaxSize = 3,
        sizes = [1,4,2,3];
    expect(function() { sizes.batchify(batchConstrained); })
      .to.throwError('batchify endless recursion?');
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

});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// TestCase.subclass('lively.lang.tests.ExtensionTests.IntervalTest', {

//     testIsInterval: function() {
//         this.assert(Interval.isInterval([1,2]));
//         this.assert(Interval.isInterval([1,2,'some addition']));
//         this.assert(Interval.isInterval([1,1]));
//         this.assert(!Interval.isInterval([1,0]));
//     },

//     testCompareInterval: function() {
//         var inputAndExpected = [
//             [1,2], [3,4], -3,
//             // less and at border
//             [1,2], [2,3], -2,
//             // less and overlapping
//             [1,3], [2,4], -1,
//             [1,5], [2,4], -1,
//             [1,5], [2,4], -1,
//             [1,5], [1,6], -1,
//             // // equal
//             [1,1], [1,1], 0,
//             // // greater and pverlapping
//             [2,4], [1,3], 1,
//             // // greater and at border
//             [3,4], [1,3], 2,
//             // // greater and non-overlapping
//             [2,4], [0,1], 3];

//         for (var i = 0; i < inputAndExpected.length; i += 3) {
//             var expected = inputAndExpected[i+2],
//                 a = inputAndExpected[i+0],
//                 b = inputAndExpected[i+1];
//             this.assertEquals(
//                 expected, Interval.compare(a, b),
//                 expected + ' not result of cmp ' + a + ' vs ' + b);
//         }

//         // // less and non-overlapping
//         // this.assertEquals(-2, Interval.compare([1,2], [3,4]), '< n-o');
//         // // less and overlapping
//         // this.assertEquals(-1, Interval.compare([1,2], [2,3]), '< o');
//         // this.assertEquals(-1, Interval.compare([1,3], [2,4]), '< o');
//         // this.assertEquals(-1, Interval.compare([1,5], [2,4]), '< o');
//         // this.assertEquals(-1, Interval.compare([1,5], [2,4]), '< o');
//         // this.assertEquals(-1, Interval.compare([1,5], [1,6]), '< o');
//         // // // equal
//         // this.assertEquals(0, Interval.compare([1,1], [1,1]), '=');
//         // // // greater and overlapping
//         // this.assertEquals(1, Interval.compare([3,4], [1,3]), '> o');
//         // this.assertEquals(1, Interval.compare([2,4], [1,3]), '> o');
//         // // // greater and non-overlapping
//         // this.assertEquals(2, Interval.compare([2,4], [0,1]), '> n-o');

//     },

//     testSortIntervals: function() {
//         this.assertEqualState([], Interval.sort([]));
//         this.assertEqualState([[1,2], [2,3]], Interval.sort([[1, 2], [2, 3]]));
//         this.assertEqualState([[1,2], [1,3]], Interval.sort([[1, 3], [1, 2]]));
//         this.assertEqualState(
//             [[1,2], [4,6], [5,9]],
//             Interval.sort([[4,6], [1,2], [5,9]]));
//     },

//     testCoalesceTwoOverlappingIntervals: function() {
//         this.assertEqualState(null, Interval.coalesce([1,4], [5,7]));
//         this.assertEqualState([1, 5], Interval.coalesce([1,3], [2, 5]));
//         this.assertEqualState([1, 5], Interval.coalesce([3, 5], [1,3]));
//         // this.assertEqualState([1, 5], Interval.coalesce([1, 5], [2,3]));
//         // this.assertEqualState([3,6], Interval.coalesce([3,6], [4,5]));

//         // var callbackArgs;
//         // Interval.coalesce([3,6], [4,5], function() { callbackArgs = Array.from(arguments); })
//         // this.assertEqualState([[3,6], [4,5], [3,6]], callbackArgs, 'callback');
//     },

//     testCoalesceOverlappingIntervalsTest: function() {
//         this.assertEqualState([], Interval.coalesceOverlapping([]));
//         this.assertEqualState([[1, 5]], Interval.coalesceOverlapping([[1,3], [2, 4], [2, 5]]));
//         this.assertEqualState(
//             [[1, 3], [5, 10]],
//             Interval.coalesceOverlapping([[1,3], [5,9 ], [6, 10]]));
//         this.assertEqualState(
//             [[1, 8], [9, 10], [14, 21]],
//             Interval.coalesceOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]]));

//         // with merge func
//         var result = Interval.coalesceOverlapping(
//             [[3,5, 'b'], [1,4, 'a'], [8, 10, 'c']],
//             function(a, b, merged) { merged.push(a[2] + b[2]) });
//         this.assertEqualState([[1,5, 'ab'], [8, 10, 'c']], result);
//     },

//     testCoalesceIdenticalIntervalsTest: function() {
//         this.assertEqualState([[1,3]], Interval.coalesceOverlapping([[1,3], [1, 3]]));
//     },

//     testFindFreeIntervalsInbetween: function() {
//         this.assertEqualState([[0,10]], Interval.intervalsInbetween(0, 10, []));
//         this.assertEqualState([[5,10]], Interval.intervalsInbetween(0, 10, [[0, 5]]));
//         this.assertEqualState([[0,3], [5,10]], Interval.intervalsInbetween(0, 10, [[3, 5]]));
//         this.assertEqualState([[1,3], [5,8]], Interval.intervalsInbetween(0, 10, [[0, 1], [3, 5], [8, 10]]));
//         this.assertEqualState([[5,8]], Interval.intervalsInbetween(0, 10, [[0, 1], [1, 5], [8, 10]]));
//         this.assertEqualState([[0,5]], Interval.intervalsInbetween(0, 5, [[8, 10]]));
//         this.assertEqualState([[0,3]], Interval.intervalsInbetween(0, 5, [[3, 10]]));
//         this.assertEqualState([], Interval.intervalsInbetween(0, 5, [[0, 6]]));
//     },

//     testWithIntervalsInRangeDo: function() {
//         this.assertEqualState(
//             [[0,2, false], [2,3, true], [3,5, false], [5,8, true], [8,10, false]],
//             Interval.intervalsInRangeDo(
//                 0, 10, [[8, 10], [0, 2], [3, 5]],
//                 function(interval, isNew) { interval.push(isNew); return interval; }));

//         this.assertEqualState(
//             [[0,3, true], [3,5, 'x', false]],
//             Interval.intervalsInRangeDo(
//                 0, 5, [[3, 6, 'x'], [6, 20, 'y']],
//                 function(interval, isNew) { interval.push(isNew); return interval; }),
//             "slice interval in back");

//         this.assertEqualState(
//             [[1,2, 'x', false], [2,5, true]],
//             Interval.intervalsInRangeDo(
//                 1, 5, [[-4,0, 'y'], [0, 2, 'x']],
//                 function(interval, isNew) { interval.push(isNew); return interval; }),
//             "slice interval in front");

//         this.assertEqualState(
//             [[0,1, 'ab'], [1,2, 'c']],
//             Interval.intervalsInRangeDo(
//                 0, 2, [[0,1, 'a'], [0,1, 'b'], [1,2, 'c']],
//                 function(interval, isNew) { return interval; },
//                 function(a, b, merged) { merged[2] = a[2] + b[2] }),
//             "identical intervals not merged");
//     },

//     testFindMatchingIntervalsDo: function() {
//         var existingIntervals = [[1,4], [4,5], [5,8], [9,20]];
//         var test = this, testTable = [
//             {expected: [[0]],               input: [[1,4]]},
//             {expected: [[0], [0]],          input: [[1,4], [1,4]]},
//             {expected: [[]],                input: [[2,4]]},
//             {expected: [[]],                input: [[4,6]]},
//             {expected: [[1,2], [2,3], []],  input: [[4,8], [5,20], [10,20]]}
//         ]

//         testTable.forEach(function(ea) {
//             test.assertEqualState(
//                 ea.expected,
//                 Interval.mapToMatchingIndexes(existingIntervals, ea.input),
//                 'On input: ' + Strings.print(ea.input));
//         });
//     },

//     testMergeOverlappingIntervals: function() {
//         return; // WIP
//         var inputsAndExpected = [
//             {a: [[1,6, 'a'], [7,9, 'b']],
//             b: [],
//             expected: [[1,6, 'a'], [7,9, 'b']]},
//             {a: [[1,6, 'a'], [6,9, 'b']],
//             b: [[1,3, 'c']],
//             expected: [[1,3, 'ac'], [3,6, 'a'], [7,9, 'b']]},
//             // {a: [[1,3, 'a'], [6,9, 'b']],
//             //  b: [[1,6, 'c']],
//             //  expected: [[1,3, 'ac'], [3,6, 'c'], [6,9, 'b']]},
//             // {a: [[1,3, 'a'], [3,8, 'b']],
//             // b: [[1,6, 'c']],
//             //  expected: [[1,3, 'ac'], [3,8, 'bc'], [6,8, 'b']]},
//             // {a: [[1,3, 'a'], [3,4, 'b']],
//             //  b: [[1,2, 'c'], [1,5, 'd']],
//             //  expected: [[1,2, 'acd'], [2,3, 'ad'], [3,4, 'bd'], [4,5, 'd']]}
//         ];

//         function merge(a,b) {
//             return [Math.min(a[0], b[0]), Math.max(a[1], b[1]), a[2] + b[2]]
//         }
//         for (var i = 0; i < inputsAndExpected.length; i++) {
//             var expected = inputsAndExpected[i].expected,
//                 a = inputsAndExpected[i].a,
//                 b = inputsAndExpected[i].b;
//             this.assertEqualState(
//                 expected, Interval.mergeOverlapping(a, b, merge),
//                 expected + ' not result of merge ' + a + ' vs ' + b);
//         }


//         // nothing happens without a merge func
//         // this.assertEqualState([], Interval.mergeOverlapping([]));
//         // this.assertEqualState([[1,2, 'a'], [1,2, 'b']],
//         //                       Interval.mergeOverlapping([[1,2, 'a'], [1,2, 'b']]));

//         // this.assertEqualState(
//         //     [[1,2, 'ab']],
//         //     Interval.mergeOverlapping(
//         //         [[1,2, 'a'], [1,2, 'b']],
//         //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

//         // this.assertEqualState(
//         //     [[1,2, 'abc']],
//         //     Interval.mergeOverlapping(
//         //         [[1,2, 'a'], [1,2, 'b'], [1,2, 'c']],
//         //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

//         // this.assertEqualState(
//         //     [[1,3, 'ab'], [3,6, 'b']],
//         //     Interval.mergeOverlapping(
//         //         [[1,3, 'a'], [1,6, 'b']],
//         //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

//         // this.assertEqualState(
//         //     [[1,2, 'ac'], [2,3, 'abc'], [3, 4, 'bc'], [4, 6, 'c']],
//         //     Interval.mergeOverlapping(
//         //         [[1,3, 'a'], [2,4, 'b'], [1,6, 'c']],
//         //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

//         // this.assertEqualState([[1, 5]], Interval.mergeOverlapping([[1,3], [2, 4], [2, 5]]));
//         // this.assertEqualState(
//         //     [[1, 3], [5, 10]],
//         //     Interval.mergeOverlapping([[1,3], [5,9 ], [6, 10]]));
//         // this.assertEqualState(
//         //     [[1, 8], [9, 10], [14, 21]],
//         //     Interval.mergeOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]]));

//         // // with merge func
//         // var result = Interval.mergeOverlapping(
//         //     [[3,5, 'b'], [1,4, 'a'], [8, 10, 'c']],
//         //     function(a, b, merged) { merged.push(a[2] + b[2]) });
//         // this.assertEqualState([[1,5, 'ab'], [8, 10, 'c']], result);
//     }

// });

// TestCase.subclass('lively.lang.tests.ExtensionTests.GridTest', {
//     testCreateGrid: function() {
//         var result = Grid.create(2, 3, 'foo'),
//             expected = [
//                 ['foo', 'foo', 'foo'],
//                 ['foo', 'foo', 'foo']];
//         this.assertEqualState(expected, result);
//     },

//     testCreateGridReturnsDistinctColumns: function() {
//         var result = Grid.create(2, 3, 'foo'),
//             expected = [
//                 ['foo', 'bar', 'foo'],
//                 ['foo', 'foo', 'foo']];
//         result[0][1] = 'bar';
//         this.assertEqualState(expected, result);
//     },

//     testGridForEach: function() {
//         var result = [],
//             expected = [[0,0], [0,1], [0,2],
//                         [1,0], [1,1], [1,2]];
//         Grid.forEach(Grid.create(2, 3), function(_, row, col) {
//             result.push([row, col]); });
//         this.assertEqualState(expected, result);
//     },

//     testGridMap: function() {
//         var result = Grid.map(Grid.create(2, 3), function(_, row, col) {
//             return row + col; }),
//             expected = [[0, 1, 2],
//                         [1, 2, 3]];
//         this.assertEqualState(expected, result);
//     },

//     testGridMapCreate: function() {
//         var result = Grid.mapCreate(2, 3, function(row, col) {
//             return row + col; }),
//             expected = [[0, 1, 2],
//                         [1, 2, 3]];
//         this.assertEqualState(expected, result);
//     },

//     testToObjects: function() {
//         this.assertEqualState(
//             [{a:1,b:2},{a:3,b:4}],
//             Grid.toObjects([['a', 'b'],[1,2],[3,4]]));
//     },

//     testTableFromObjects: function() {
//         var objects = [{x:1,y:2},{x:3},{z:4}],
//             expected = [["x","y","z"],[1,2,null],[3,null,null],[null,null,4]];
//         this.assertEqualState(
//             expected,
//             Grid.tableFromObjects(objects));

//         // gracefully handle non-arrays
//         var object = {x:1,y:2},
//             expected = [["x","y"],[1,2]];
//         this.assertEqualState(expected, Grid.tableFromObjects(object));
//     }
// });

// TestCase.subclass('lively.lang.tests.ExtensionTests.ArrayProjection', {

//     testCreateProjection: function() {
//         var sut = lively.ArrayProjection;
//         // array = ["A","B","C","D","E","F","G","H","I","J"]
//         var array = Array.range(65,74).map(function(i) { return String.fromCharCode(i); });
//         this.assertEqualState({array: array, from: 0, to: 3}, sut.create(array, 3));
//         this.assertEqualState({array: array, from: 2, to: 5}, sut.create(array, 3, 2));
//         this.assertEqualState({array: array, from: 7, to: 10}, sut.create(array, 3, 9));
//     },

//     testGetProjection: function() {
//         var sut = lively.ArrayProjection;
//         // array = ["A","B","C","D","E","F","G","H","I","J"]
//         var array = Array.range(65,74).map(function(i) { return String.fromCharCode(i); }),
//             projection = {array: array, from: 5, to: 8},
//             result = sut.toArray(projection);
//         this.assertEquals(["F","G","H"], result);
//     },

//     testProjectionIndices: function() {
//         var sut = lively.ArrayProjection;
//         var array = Array.range(65,74).map(function(i) { return String.fromCharCode(i); }),
//             projection = {array: array, from: 5, to: 8},
//             result = sut.toArray(projection);
//         this.assertEquals(null, sut.originalToProjectedIndex(projection, 2), 'orig index to projected 2');
//         this.assertEquals(0, sut.originalToProjectedIndex(projection, 5), 'orig index to projected 5');
//         this.assertEquals(2, sut.originalToProjectedIndex(projection, 7), 'orig index to projected 7');
//         this.assertEquals(null, sut.originalToProjectedIndex(projection, 9), 'orig index to projected 9');
//         // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
//         this.assertEquals(7, sut.projectedToOriginalIndex(projection, 2), 'orig index to projected 2');
//         this.assertEquals(5, sut.projectedToOriginalIndex(projection, 0), 'orig index to projected 0');
//         this.assertEquals(null, sut.projectedToOriginalIndex(projection, 4), 'orig index to projected 4');
//     },

//     testMoveProjectionToIncludeIndex: function() {
//         var sut = lively.ArrayProjection;
//         var array = Array.range(65,74).map(function(i) { return String.fromCharCode(i); }),
//             projection = sut.create(array, 3, 2);
//         this.assertEqualState(projection, sut.transformToIncludeIndex(projection, 3));
//         this.assertEqualState({array: array, from: 1, to: 4}, sut.transformToIncludeIndex(projection, 1));
//         // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
//         var array = [1,2,3,4,5], projection = sut.create(array, 3);
//         this.assertEquals(array[3], sut.toArray(sut.transformToIncludeIndex(projection, 3)).last());
//     }
// });
