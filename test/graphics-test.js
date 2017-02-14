import {expect} from '../node_modules/chai/chai.js';
import {Point, rect, pt} from 'src/client/graphics.js'

describe('graphics', () => {
  it('subPt should subtract points', () => {
    var p1 = new Point(10,7)
    var p2 = new Point(4,4)
    var p3 = p1.subPt(p2)
    
    expect(p3.x).to.equal(6);
    expect(p3.y).to.equal(3);
  });
  
  it('addPt should subtract points', () => {
    var p1 = new Point(10,7)
    var p2 = new Point(4,4)
    var p3 = p1.addPt(p2)
    
    expect(p3.x).to.equal(14);
    expect(p3.y).to.equal(11);
  });
  
  it('eqPt should compare points', () => {
    var p1 = new Point(10,7)
    var p2 = new Point(4,4)
    var p3 = new Point(10,7)
    
    expect(p1.eqPt(p1)).to.equal(true);
    expect(p1.eqPt(p2)).to.equal(false);
    expect(p1.eqPt(p3)).to.equal(true);
  });

  it('rect should create a recangle', () => {
    var r1 = rect(10,5,50, 100)
    expect(r1.x).to.equal(10);
  });

  it('dist should compute distance', () => {
    var p1 = new Point(0,0)
    var p2 = new Point(10,0)
    var p3 = new Point(0,10)
    
    expect(p1.dist(p1)).to.equal(0);
    expect(p1.dist(p2)).to.equal(10);
    expect(p1.dist(p3)).to.equal(10);
  });

  
  it('rect containsPoint', () => {
    var r1 = rect(10,5,50, 100)
    expect(r1.containsPoint(pt(11,6))).to.equal(true);
    expect(r1.containsPoint(pt(0,6))).to.equal(false);

  });
});