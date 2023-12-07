import { expect } from 'src/external/chai.js';
import { Point, rect, pt } from 'src/client/graphics.js';
import { Grid } from 'src/client/morphic/snapping.js';

describe('Point', () => {

  it('subPt should subtract points', () => {
    var p1 = new Point(10, 7);
    var p2 = new Point(4, 4);
    var p3 = p1.subPt(p2);

    expect(p3.x).to.equal(6);
    expect(p3.y).to.equal(3);
  });

  it('addPt should subtract points', () => {
    var p1 = new Point(10, 7);
    var p2 = new Point(4, 4);
    var p3 = p1.addPt(p2);

    expect(p3.x).to.equal(14);
    expect(p3.y).to.equal(11);
  });

  it('eqPt should compare points', () => {
    var p1 = new Point(10, 7);
    var p2 = new Point(4, 4);
    var p3 = new Point(10, 7);

    expect(p1.eqPt(p1)).to.equal(true);
    expect(p1.eqPt(p2)).to.equal(false);
    expect(p1.eqPt(p3)).to.equal(true);
  });

  it('dist should compute distance', () => {
    var p1 = new Point(0, 0);
    var p2 = new Point(10, 0);
    var p3 = new Point(0, 10);

    expect(p1.dist(p1)).to.equal(0);
    expect(p1.dist(p2)).to.equal(10);
    expect(p1.dist(p3)).to.equal(10);
  });

  it('lerp', () => {
    var p1 = new Point(0, 0);
    var p2 = new Point(10, 20);

    expect(p1.lerp(p2, 0)).to.deep.equal(new Point(0, 0));
    expect(p1.lerp(p2, .5)).to.deep.equal(new Point(5, 10));
    expect(p1.lerp(p2, 1)).to.deep.equal(new Point(10, 20));
  });
});

describe('Rectangle/AABB/BBox', () => {

  it('rect should create a recangle', () => {
    var r1 = rect(10, 5, 50, 100);
    expect(r1.x).to.equal(10);
  });

  it('rect containsPoint', () => {
    var r1 = rect(10, 5, 50, 100);
    expect(r1.containsPoint(pt(11, 6))).to.equal(true);
    expect(r1.containsPoint(pt(0, 6))).to.equal(false);
  });

  it('centerIn', () => {
    const r1 = lively.rect(1, 1, 3, 3);
    const bounds = lively.rect(-1, -1, 2, 2);
    r1.centerIn(bounds);

    const center = bounds.center();
    expect(center).to.have.property('x', 0)
    expect(center).to.have.property('y', 0);
    expect(r1.width).to.equal(3);
    expect(r1.height).to.equal(3);
  });
});

describe('Grid', () => {

  it('Grid should snap values', () => {
    expect(Grid.snap(1, 100, 20)).to.equal(0);
  });

  it('Grid should snap negative values', () => {
    expect(Grid.snap(-1, 100, 20)).to.equal(0);
    expect(Grid.snap(-98, 100, 20)).to.equal(-100);
    expect(Grid.snap(-102, 100, 20)).to.equal(-100);
  });

  it('Grid should not snap values above snap size', () => {
    expect(Grid.snap(21, 100, 20)).to.equal(21);
  });

  it('Grid should round up while snapping', () => {
    expect(Grid.snap(198, 100, 20)).to.equal(200);
  });
});



describe('Rectangle', () => {
  
  describe('scaleUnitToRect', () => {

    it('scale unit rect into new rect', () => {
      
      var r = rect(pt(0.25,0.25),pt(0.5,0.5))
      var to = rect(pt(200,200),pt(300,300))
      var result = r.scaleUnitToRect(to)
      
      expect(result.height).to.equal(25)
      expect(result.width).to.equal(25)
      expect(result.x).to.equal(225)
      expect(result.y).to.equal(225)
    });
    
     it('scale unit rect into new rect 2 ', () => {
      
      var r = rect(pt(0.25,0.35),pt(0.5,0.9))
      var to = rect(pt(200,200),pt(300,300))
      var result = r.scaleUnitToRect(to)
      
      expect(result.width, "width").to.equal(25)
      expect(result.height, "height").to.equal(55)
      expect(result.x, "x").to.equal(225)
      expect(result.y, "y").to.equal(235)
    });
    
  })
});
