"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import * as frameBasedAExpr from "frame-based-aexpr";

describe('provide info about strategy', () => {
  it('sets strategy meta to "Rewriting"', () => {
    const expr = aexpr(() => {});
    expect(expr.meta().get('strategy')).to.equal('Rewriting');
  });
  it('sets strategy meta to "Frame-based"', () => {
    const expr = frameBasedAExpr.aexpr(() => {});
    expect(expr.meta().get('strategy')).to.equal('Frame-based');
  });
});