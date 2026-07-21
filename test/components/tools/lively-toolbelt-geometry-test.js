import { expect } from 'src/external/chai.js';
import { pt, rect } from 'src/client/graphics.js';
import {
  boundsOf, hitPolyline, pointInPolygon, polylineIntersectsRect,
  polylineIntersectsPolygon, distPointToSegment, sweptWithin, splitStroke,
  translatePoints, scalePoints, rectsOverlap, distPointToPolyline,
} from 'src/components/tools/lively-toolbelt-geometry.js';

// A stroke point as the toolbelt stores it: plain object with dynamics channels.
const p = (x, y, extra = {}) => ({ x, y, pressure: 0.5, t: 0, altitude: 1.5, pointerType: 'pen', ...extra });
const line = (n, y = 0) => Array.from({ length: n }, (_, i) => p(i * 10, y));

describe('lively-toolbelt-geometry', () => {

  describe('boundsOf', () => {
    it('returns null for no points', () => {
      expect(boundsOf([])).to.equal(null);
    });
    it('spans the extremes', () => {
      const b = boundsOf([p(10, 20), p(-5, 40), p(30, 0)]);
      expect(b.toTuple()).to.eql([-5, 0, 35, 40]);
    });
  });

  describe('rectsOverlap', () => {
    it('detects plain overlap', () => {
      expect(rectsOverlap(rect(pt(0, 0), pt(10, 10)), rect(pt(5, 5), pt(15, 15)))).to.equal(true);
    });
    it('rejects disjoint rects', () => {
      expect(rectsOverlap(rect(pt(0, 0), pt(10, 10)), rect(pt(20, 20), pt(30, 30)))).to.equal(false);
    });
    // The bug this exists for: a perfectly horizontal stroke has a ZERO-HEIGHT bbox,
    // and Rectangle.intersects (intersection().isNonEmpty()) reports false for it —
    // which made straight strokes impossible to select or erase.
    it('handles a zero-height rect, where Rectangle.intersects fails', () => {
      const flat = rect(pt(100, 200), pt(500, 200));
      const region = rect(pt(80, 150), pt(520, 250));
      expect(flat.height).to.equal(0);
      expect(region.intersects(flat)).to.equal(false); // the trap
      expect(rectsOverlap(flat, region)).to.equal(true);
    });
    it('handles a zero-width rect', () => {
      const flat = rect(pt(200, 100), pt(200, 500));
      expect(rectsOverlap(flat, rect(pt(150, 80), pt(250, 520)))).to.equal(true);
    });
    it('counts touching edges as overlapping', () => {
      expect(rectsOverlap(rect(pt(0, 0), pt(10, 10)), rect(pt(10, 0), pt(20, 10)))).to.equal(true);
    });
  });

  describe('hitPolyline', () => {
    it('returns null when the centerline is unknown (pre-P6 restored stroke)', () => {
      expect(hitPolyline({ type: 'freeform', points: [] })).to.equal(null);
    });
    it('traces a rectangle outline, not its diagonal', () => {
      const poly = hitPolyline({ type: 'rectangle', points: [p(0, 0), p(10, 5)] });
      expect(poly.map(q => q.toTuple())).to.eql([[0, 0], [10, 0], [10, 5], [0, 5], [0, 0]]);
    });
    it('reduces an arrow to its endpoints', () => {
      const poly = hitPolyline({ type: 'arrow', points: [p(0, 0), p(3, 3), p(9, 9)] });
      expect(poly.map(q => q.toTuple())).to.eql([[0, 0], [9, 9]]);
    });
  });

  describe('pointInPolygon', () => {
    const square = [pt(0, 0), pt(10, 0), pt(10, 10), pt(0, 10)];
    it('detects inside', () => {
      expect(pointInPolygon(pt(5, 5), square)).to.equal(true);
    });
    it('detects outside', () => {
      expect(pointInPolygon(pt(15, 5), square)).to.equal(false);
    });
    it('handles a concave polygon', () => {
      // A "C" shape: the notch on the right is outside despite being within the bbox.
      const c = [pt(0, 0), pt(10, 0), pt(10, 3), pt(4, 3), pt(4, 7), pt(10, 7), pt(10, 10), pt(0, 10)];
      expect(pointInPolygon(pt(2, 5), c)).to.equal(true);
      expect(pointInPolygon(pt(8, 5), c)).to.equal(false);
    });
  });

  describe('polylineIntersectsRect', () => {
    const r = rect(pt(0, 0), pt(10, 10));
    it('selects a stroke fully inside', () => {
      expect(polylineIntersectsRect([pt(2, 2), pt(8, 8)], r)).to.equal(true);
    });
    it('selects a stroke merely crossing it (intersect semantics)', () => {
      expect(polylineIntersectsRect([pt(-50, 5), pt(50, 5)], r)).to.equal(true);
    });
    it('rejects a stroke entirely outside', () => {
      expect(polylineIntersectsRect([pt(20, 20), pt(30, 30)], r)).to.equal(false);
    });
  });

  describe('polylineIntersectsPolygon', () => {
    const square = [pt(0, 0), pt(10, 0), pt(10, 10), pt(0, 10)];
    it('selects a stroke inside the lasso', () => {
      expect(polylineIntersectsPolygon([pt(3, 3), pt(6, 6)], square)).to.equal(true);
    });
    it('selects a stroke crossing the lasso boundary', () => {
      expect(polylineIntersectsPolygon([pt(5, 5), pt(50, 5)], square)).to.equal(true);
    });
    it('rejects a stroke outside', () => {
      expect(polylineIntersectsPolygon([pt(20, 20), pt(25, 25)], square)).to.equal(false);
    });
    it('rejects a degenerate lasso', () => {
      expect(polylineIntersectsPolygon([pt(1, 1), pt(2, 2)], [pt(0, 0), pt(1, 1)])).to.equal(false);
    });
  });

  describe('distPointToSegment', () => {
    it('clamps beyond the segment start', () => {
      expect(distPointToSegment(pt(-3, 0), pt(0, 0), pt(10, 0))).to.equal(3);
    });
    it('clamps beyond the segment end', () => {
      expect(distPointToSegment(pt(14, 0), pt(0, 0), pt(10, 0))).to.equal(4);
    });
    it('projects onto the interior', () => {
      expect(distPointToSegment(pt(5, 7), pt(0, 0), pt(10, 0))).to.equal(7);
    });
    it('handles a zero-length segment', () => {
      expect(distPointToSegment(pt(3, 4), pt(0, 0), pt(0, 0))).to.equal(5);
    });
    // These are exactly the cases that rule out Point.nearestPointOnLineBetween,
    // whose parameter divides by both dx and dy.
    it('is exact for an axis-aligned horizontal segment', () => {
      expect(distPointToSegment(pt(5, 2), pt(0, 0), pt(10, 0))).to.equal(2);
    });
    it('is exact for an axis-aligned vertical segment', () => {
      expect(distPointToSegment(pt(2, 5), pt(0, 0), pt(0, 10))).to.equal(2);
    });
    it('is stable for a near-axis-aligned segment', () => {
      const d = distPointToSegment(pt(5, 3), pt(0, 0), pt(10, 1e-9));
      expect(d).to.be.closeTo(3, 1e-6);
    });
  });

  describe('distPointToPolyline', () => {
    const poly = [pt(0, 0), pt(100, 0), pt(100, 100)];
    it('measures to the nearest segment', () => {
      expect(distPointToPolyline(pt(50, 7), poly)).to.equal(7);
      expect(distPointToPolyline(pt(93, 50), poly)).to.equal(7);
    });
    it('clamps past the ends', () => {
      expect(distPointToPolyline(pt(-5, 0), poly)).to.equal(5);
    });
    it('handles a degenerate polyline', () => {
      expect(distPointToPolyline(pt(3, 4), [pt(0, 0)])).to.equal(5);
      expect(distPointToPolyline(pt(0, 0), [])).to.equal(Infinity);
    });
  });

  describe('sweptWithin', () => {
    it('treats a single-sample sweep as a disc', () => {
      expect(sweptWithin(p(0, 5), [pt(0, 0)], 6)).to.equal(true);
      expect(sweptWithin(p(0, 5), [pt(0, 0)], 4)).to.equal(false);
    });
    it('covers the whole swept polyline', () => {
      const sweep = [pt(0, 0), pt(10, 0), pt(10, 10)];
      expect(sweptWithin(p(10, 5), sweep, 1)).to.equal(true);
      expect(sweptWithin(p(5, 5), sweep, 1)).to.equal(false);
    });
  });

  describe('splitStroke', () => {
    it('returns null when the sweep misses (caller keeps the original)', () => {
      expect(splitStroke(line(5), [pt(0, 500)], 5)).to.equal(null);
    });
    it('returns [] when the whole stroke is erased', () => {
      expect(splitStroke(line(5), [pt(-10, 0), pt(100, 0)], 5)).to.eql([]);
    });
    // The invariant, rather than magic numbers: a cut end lands just OUTSIDE the
    // erased span, no further from it than one densify step (radius / 2).
    it('splits a stroke cut in the middle into two runs', () => {
      const r = 6, step = r / 2;
      const runs = splitStroke(line(10), [pt(45, 0)], r);
      expect(runs.length).to.equal(2);
      expect(runs[0][0].x).to.equal(0);
      expect(runs[0].at(-1).x).to.be.at.most(45 - r);          // outside the erased span
      expect(runs[0].at(-1).x).to.be.at.least(45 - r - step);  // but hard against it
      expect(runs[1][0].x).to.be.at.least(45 + r);
      expect(runs[1][0].x).to.be.at.most(45 + r + step);
      expect(runs[1].at(-1).x).to.equal(90);
    });
    it('shortens a stroke erased at one end', () => {
      const r = 5, step = r / 2;
      const runs = splitStroke(line(10), [pt(0, 0), pt(20, 0)], r);
      expect(runs.length).to.equal(1);
      expect(runs[0][0].x).to.be.at.least(20 + r);
      expect(runs[0][0].x).to.be.at.most(20 + r + step);
      expect(runs[0].at(-1).x).to.equal(90);
    });
    it('drops surviving runs too short to render', () => {
      const runs = splitStroke(line(10), [pt(-50, 0), pt(100, 0)], 6);
      expect(runs).to.eql([]);
    });
    // The fast-stroke bug: samples 120px apart, eraser radius 20. Testing only the
    // stored points lets the eraser pass clean through the gap and cut nothing, even
    // though the drawn line visibly crosses it.
    it('cuts a fast stroke whose samples straddle the eraser', () => {
      const sparse = [p(0, 0), p(120, 0), p(240, 0)];
      const runs = splitStroke(sparse, [pt(60, 0)], 20);
      expect(runs).to.not.equal(null);
      expect(runs.length).to.equal(2);
      expect(runs[0].at(-1).x).to.be.closeTo(40, 12);
      expect(runs[1][0].x).to.be.closeTo(80, 12);
    });
    it('still reports a clean miss between samples', () => {
      const sparse = [p(0, 0), p(400, 0)];
      expect(splitStroke(sparse, [pt(200, 300)], 20)).to.equal(null);
    });
    it('interpolates the dynamics channels at a cut', () => {
      const sparse = [p(0, 0, { pressure: 0 }), p(200, 0, { pressure: 1 })];
      const runs = splitStroke(sparse, [pt(100, 0)], 20);
      const cutEnd = runs[0].at(-1);
      // ~x=80 along a 0..1 pressure ramp
      expect(cutEnd.pressure).to.be.closeTo(0.4, 0.15);
    });
    it('preserves the dynamics channels of surviving points', () => {
      const pts = [p(0, 0, { pressure: 0.11 }), p(10, 0, { pressure: 0.22 }), p(90, 0)];
      const runs = splitStroke(pts, [pt(90, 0)], 5);
      expect(runs[0][0].pressure).to.equal(0.11);
      expect(runs[0][1].pressure).to.equal(0.22);
    });
  });

  describe('transforms preserve dynamics channels', () => {
    it('translatePoints', () => {
      const out = translatePoints([p(1, 2, { pressure: 0.9 })], pt(10, 20));
      expect(out[0].x).to.equal(11);
      expect(out[0].y).to.equal(22);
      expect(out[0].pressure).to.equal(0.9);
      expect(out[0].altitude).to.equal(1.5);
    });
    it('scalePoints about an origin', () => {
      const out = scalePoints([p(10, 10, { pressure: 0.3 })], 2, pt(0, 0));
      expect(out[0].x).to.equal(20);
      expect(out[0].y).to.equal(20);
      expect(out[0].pressure).to.equal(0.3);
    });
    it('scalePoints leaves the origin fixed', () => {
      const out = scalePoints([p(5, 5)], 3, pt(5, 5));
      expect(out[0].x).to.equal(5);
      expect(out[0].y).to.equal(5);
    });
  });

});
