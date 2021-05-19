"ae";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Halo from 'src/components/halo/lively-halo.js'

describe('that', () => {

  it('that via source code hook', () => {
    const num = 13;

    const spy = sinon.spy();
    const temp = self.that;
    const expr = aexpr(() => that).onChange(spy);

    that = num
    expect(spy).to.be.calledOnce;
    expect(spy.getCall(0).args[0]).to.equal(num);

    self.that = temp;
  });

  it('that via wrapped setter', () => {
    const temp = self.that;

    const spy = sinon.spy();
    const expr = aexpr(() => that).onChange(spy);

    const div = <div></div>;
    document.body.appendChild(div);
    lively.showHalo(div);

    expect(spy).to.be.calledOnce;
    expect(spy.getCall(0).args[0]).to.equal(div);

    Halo.hideHalos()
    self.that = temp;
    div.remove();
  });

});
