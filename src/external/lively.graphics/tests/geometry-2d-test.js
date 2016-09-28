/*global describe, it*/

import { expect, chai } from "mocha-es6";
import { Rectangle, Line, Point, pt, rect, Transform } from "../geometry-2d.js";


describe("rectangles", () => {

  describe("area", () => {
    
    it("computes it", () => {
      expect(new Rectangle(10,20, 10, 20).area()).equals(10*20);
    });

    it("with negative width / height", () => {
      expect(new Rectangle(10,20, -10, -20).area()).equals(-10*20);
    });
    
    it("with only one negative side", () => {
      expect(new Rectangle(10,20, 10, -20).area()).equals(-10*20);
      expect(new Rectangle(10,20, -10, 20).area()).equals(-10*20);
    })

  });
  

  it("testCreateGrid", function() {
    var bounds = new Rectangle(0,0, 100, 200),
        w = 100/3, h = 200/2,
        result = bounds.grid(2,3),
        expected = [
          [new Rectangle(0  , 0, w, h),
           new Rectangle(w  , 0, w, h),
           new Rectangle(w*2, 0, w, h)],
          [new Rectangle(0  , h, w, h),
           new Rectangle(w  , h, w, h),
           new Rectangle(w*2, h, w, h)]];
    expect(expected).to.deep.equal(result);
  });

  it("testWithCenter", function() {
    expect(rect(10,10,10,10)).equals(rect(0,0, 10, 10).withCenter(pt(15,15)));

  });

  it("testWithTopRight", function() {
    var result = rect(10,10,10,10).withTopRight(pt(5,5));
    expect(pt(5,5)).to.equal(result.topRight());
    expect(rect(-5,5,10,10)).to.equal(result);
  });

  it("testDivideRelatively", function() {
    var result = rect(20,10,100,200).divide([rect(0.0, 0.0, 0.5, 0.8),
                                             rect(0.5, 0.0, 0.5, 0.2),
                                             rect(0.5, 0.8, 0.5, 0.2)]),
        expected = [rect(20,  10,   50, 160),
                    rect(20+50, 10,   50, 40),
                    rect(20+50, 10+160, 50, 40)];
    expect(expected).to.equal(result);
  });

  it("testTranslateForInclusion", function() {
    var smallRect = rect(90,60, 20,50),
      bigRect   = rect(0,0,100,100),
      trans   = bigRect.translateForInclusion(smallRect),
      expected  = rect(80,50,20,50);
    expect(expected).to.equal(trans);
  });

});

describe("lines", () => {


  it("testLineTo", function() {
    var r1 = rect(0,0, 10, 10),
        r2 = rect(20,5, 10, 10),
        line = r1.lineTo(r2);
    expect(pt(10,6.25).lineTo(pt(20,8.75))).to.equal(line);
  });

  it("testLineCreationAndEquality", function() {
    var line1 = pt(10,10).lineTo(pt(20,20)),
      line2 = new Line(pt(10,10), pt(20,20)),
      line3 = new Line(pt(10,10), pt(23,20));
    expect(line1).to.equal(line2, 'line1 = line2');
    expect(line2).to.equal(line1, 'line2 = line1');
    expect().assert(!line1.equals(line3), 'line1 = line3');
    expect().assert(!line3.equals(line2), 'line3 = line2');
  });

  it("testLinesFromRect", function() {
    var r = new Rectangle(10, 10, 10, 10),
      top = pt(10,10).lineTo(pt(20,10)),
      bottom = pt(10,20).lineTo(pt(20,20)),
      left = pt(10,10).lineTo(pt(10,20)),
      right = pt(20,10).lineTo(pt(20,20));
    expect(top).to.equal(r.topEdge(), "top");
    expect(bottom).to.equal(r.bottomEdge(), "bottom");
    expect(left).to.equal(r.leftEdge(), "left");
    expect(right).to.equal(r.rightEdge(), "right");
  });

  it("testLinesBetweenRect", function() {
    var r1 = new Rectangle(10, 10, 10, 10),
      r2 = new Rectangle(30, 20, 10, 10),
      r3 = new Rectangle(20, 10, 20, 20),
      l1 = r1.lineTo(r2),
      l2 = r2.lineTo(r1),
      l3 = r2.lineTo(r3),
      l4 = r3.lineTo(r2);
    expect(20).to.equal(l1.start.x);
    expect(17.5).to.equal(l1.start.y);
    expect(30).to.equal(l1.end.x);
    expect(22.5).to.equal(l1.end.y);
    expect().assert(l1.start.equals(l2.end));
    expect().assert(l2.start.equals(l1.end));
    expect().assert(!l3);
    expect().assert(!l4);
  });

  it("testPointOnLine", function() {
    var line = pt(10,10).lineTo(pt(20,20)),
      p1 = pt(12, 12),
      p2 = pt(21,21),
      p3 = pt(16,12);
    expect().assert(line.includesPoint(p1), "p1");
    expect().assert(line.includesPoint(p1, true), "p1 unconstrained");
    expect().assert(!line.includesPoint(p2), "p2");
    expect().assert(line.includesPoint(p2, true), "p2 unconstrained");
    expect().assert(!line.includesPoint(p3), "p3");
    expect().assert(!line.includesPoint(p3, true), "p3 unconstrained");
  });

  it("testLineIntersection", function() {
    var line1 = pt(10,10).lineTo(pt(20,20)),
      line2 = pt(20,10).lineTo(pt(10,20));
    expect(pt(15,15)).to.equal(line1.intersection(line2), 'line1 x line2');
    expect(pt(15,15)).to.equal(line2.intersection(line1), 'line1 x line2');
  });

  it("testIntersectionUnconstrained", function() {
    var line1 = pt(10,10).lineTo(pt(11,11)),
      line2 = pt(20,10).lineTo(pt(10,20));
    expect(pt(15,15)).to.equal(line1.intersection(line2, {constrained: true}), 'unconstrained');
    expect(null).to.equal(line1.intersection(line2), 'constrained');
  });

  it("testLineIntersectionParrallel", function() {
    var line1 = pt(10,10).lineTo(pt(20,20)),
      line2 = pt(20,10).lineTo(pt(30,20));
    expect().assert(!line1.intersection(line2), 'line1 x line2');
  });

  it("testSampleNPointsAlongLine", function() {
    var line = pt(10,10).lineTo(pt(20,20));
    expect([pt(10,10), pt(12,12), pt(14,14), pt(16,16), pt(18,18), pt(20,20)]).to.equal(line.sampleN(5));
  });

  it("testSampleSpacedPointsAlongLine", function() {
    var line = pt(10,10).lineTo(pt(20,10));
    line.length()
    expect([pt(10,10), pt(12,10), pt(14,10), pt(16,10), pt(18,10), pt(20,10)]).to.equal(line.sample(2)); // step length: 2
  });

  it("testLineRectangleIntersection1", function() {
    var r, line, result;
    // two points crossing
    r = new Rectangle(0,0, 20, 20);
    line = pt(5,0).lineTo(pt(15,20));
    result = r.lineIntersection(line);
    expect([pt(5,0), pt(15,20)]).to.equal(result);

    // one point
    line = r.center().lineTo(r.bottomCenter());
    result = r.lineIntersection(line);
    expect([pt(10, 20)]).to.equal(result);
  });

  it("point transform", function() {
      var globalPoint = pt(20,10),
          globalTransform = new Transform(pt(0,0), 0, pt(1,1)),
          localTransform = new Transform(pt(5,10), 0, pt(1,1)),
          globalizedInvertedLocal = localTransform.preConcatenate(globalTransform).inverse(),
          matrix = globalTransform.preConcatenate(globalizedInvertedLocal);
      expect(pt(15, 0)).deep.equals(globalPoint.matrixTransform(matrix))
  });

});
