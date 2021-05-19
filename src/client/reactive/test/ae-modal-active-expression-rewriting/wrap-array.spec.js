'ae';
'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

function test(name, fn) {
  const arr012 = [0,1,2];
  const spy = sinon.spy();
  const changeSpy = sinon.spy();
  const expr = aexpr(() => arr012).onChange(changeSpy);

  it(name, () => fn({
    arr012,
    spy,
    changeSpy,
  }));
}

describe('AExpr Monitoring preserves Array Semantics', () => {

  test('read 0', ({ arr012 }) => {
    expect(arr012[0]).to.equal(0);
  });

  test('write 4', ({ arr012 }) => {
    arr012[4] = 4;

    expect(arr012.length).to.equal(5);
    expect(arr012[3]).to.equal(undefined);
    expect(arr012[4]).to.equal(4);
  });

  test('read first', ({ arr012 }) => {
    expect(arr012.first).to.equal(0);
  });

  test('write first', ({ arr012 }) => {
    arr012.first = 'first';

    expect(arr012.first).to.equal('first');
  });

  test('read last', ({ arr012 }) => {
    expect(arr012.last).to.equal(2);
  });

  test('write last', ({ arr012 }) => {
    arr012.last = 'last';

    expect(arr012.last).to.equal('last');
  });

  test('forEach', ({ spy, arr012 }) => {
    arr012.forEach(spy);

    expect(spy).to.be.calledThrice;
    expect(spy.getCall(0).args[0]).to.equal(0);
    expect(spy.getCall(1).args[0]).to.equal(1);
    expect(spy.getCall(2).args[0]).to.equal(2);
  });

  test('push, then forEach', ({ spy, arr012 }) => {
    arr012.push(3);
    arr012.push(4);
    arr012.forEach(spy);

    expect(spy).to.have.callCount(5);
    expect(spy.getCall(0).args[0]).to.equal(0);
    expect(spy.getCall(1).args[0]).to.equal(1);
    expect(spy.getCall(2).args[0]).to.equal(2);
    expect(spy.getCall(3).args[0]).to.equal(3);
    expect(spy.getCall(4).args[0]).to.equal(4);
  });

  test('push, then for in', ({ spy, arr012 }) => {
    arr012.push(3);
    arr012.push(4);

    for (let i in arr012) {
      spy(i)
    }

    expect(spy).to.have.callCount(5);
    expect(spy.getCall(0).args[0]).to.equal('0');
    expect(spy.getCall(1).args[0]).to.equal('1');
    expect(spy.getCall(2).args[0]).to.equal('2');
    expect(spy.getCall(3).args[0]).to.equal('3');
    expect(spy.getCall(4).args[0]).to.equal('4');
  });

  test('push, then for of', ({ spy, arr012 }) => {
    arr012.push(3);
    arr012.push(4);

    for (let i of arr012) {
      spy(i)
    }

    expect(spy).to.have.callCount(5);
    expect(spy.getCall(0).args[0]).to.equal(0);
    expect(spy.getCall(1).args[0]).to.equal(1);
    expect(spy.getCall(2).args[0]).to.equal(2);
    expect(spy.getCall(3).args[0]).to.equal(3);
    expect(spy.getCall(4).args[0]).to.equal(4);
  });

  test('Object.entries', ({ spy, arr012 }) => {
    arr012.push(3);
    arr012.push(4);

    Object.entries(arr012).forEach((args) => spy(...args));

    expect(spy).to.have.callCount(5);
    expect(spy).to.calledWith('0', 0);
    expect(spy).to.calledWith('1', 1);
    expect(spy).to.calledWith('2', 2);
    expect(spy).to.calledWith('3', 3);
    expect(spy).to.calledWith('4', 4);
  });

  test('get length', ({ spy, arr012 }) => {
    arr012.forEach(spy);
    expect(arr012.length).to.equal(3);

    arr012.length = 5;
    expect(arr012.length).to.equal(5);
  });

});
