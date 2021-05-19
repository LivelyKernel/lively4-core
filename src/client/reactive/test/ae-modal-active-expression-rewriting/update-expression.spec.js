"ae";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('UpdateOperator', () => {

  it('x++', () => {
    const outerSpy = sinon.spy(i => i);
    const changeSpy = sinon.spy();

    var x = 42;
    aexpr(() => x).onChange(changeSpy);

    outerSpy(x++);

    expect(changeSpy).to.be.calledOnce;
    expect(changeSpy).to.be.calledWith(43);
    expect(changeSpy).to.be.calledBefore(outerSpy);
    expect(outerSpy).to.be.calledWith(42); // expression return the previous value

    expect(x).to.equal(43);
  });

  it('x--', () => {
    const outerSpy = sinon.spy(i => i);
    const changeSpy = sinon.spy();

    var x = 42;
    aexpr(() => x).onChange(changeSpy);

    outerSpy(x--);

    expect(changeSpy).to.be.calledOnce;
    expect(changeSpy).to.be.calledWith(41);
    expect(changeSpy).to.be.calledBefore(outerSpy);
    expect(outerSpy).to.be.calledWith(42); // expression return the previous value

    expect(x).to.equal(41);
  });

  it('++x', () => {
    const outerSpy = sinon.spy(i => i);
    const changeSpy = sinon.spy();

    var x = 42;
    aexpr(() => x).onChange(changeSpy);

    outerSpy(++x);

    expect(changeSpy).to.be.calledOnce;
    expect(changeSpy).to.be.calledWith(43);
    expect(changeSpy).to.be.calledBefore(outerSpy);
    expect(outerSpy).to.be.calledWith(43); // expression return the previous value

    expect(x).to.equal(43);
  });

  it('--x', () => {
    const outerSpy = sinon.spy(i => i);
    const changeSpy = sinon.spy();

    var x = 42;
    aexpr(() => x).onChange(changeSpy);

    outerSpy(--x);

    expect(changeSpy).to.be.calledOnce;
    expect(changeSpy).to.be.calledWith(41);
    expect(changeSpy).to.be.calledBefore(outerSpy);
    expect(outerSpy).to.be.calledWith(41); // expression return the previous value

    expect(x).to.equal(41);
  });

  it('obj.prop++', () => {
    const outerSpy = sinon.spy(i => i);
    const changeSpy = sinon.spy();

    const obj = { prop: 42 };
    aexpr(() => obj.prop).onChange(changeSpy);

    outerSpy(obj.prop++);

    expect(changeSpy).to.be.calledOnce;
    expect(changeSpy).to.be.calledWith(43);
    expect(changeSpy).to.be.calledBefore(outerSpy);
    expect(outerSpy).to.be.calledWith(42); // expression return the previous value

    expect(obj.prop).to.equal(43);
  });

  it('obj.prop--', () => {
    const outerSpy = sinon.spy(i => i);
    const changeSpy = sinon.spy();

    const obj = { prop: 42 };
    aexpr(() => obj.prop).onChange(changeSpy);

    outerSpy(obj.prop--);

    expect(changeSpy).to.be.calledOnce;
    expect(changeSpy).to.be.calledWith(41);
    expect(changeSpy).to.be.calledBefore(outerSpy);
    expect(outerSpy).to.be.calledWith(42); // expression return the previous value

    expect(obj.prop).to.equal(41);
  });

  it('++obj.prop', () => {
    const outerSpy = sinon.spy(i => i);
    const changeSpy = sinon.spy();

    const obj = { prop: 42 };
    aexpr(() => obj.prop).onChange(changeSpy);

    outerSpy(++obj.prop);

    expect(changeSpy).to.be.calledOnce;
    expect(changeSpy).to.be.calledWith(43);
    expect(changeSpy).to.be.calledBefore(outerSpy);
    expect(outerSpy).to.be.calledWith(43); // expression return the previous value

    expect(obj.prop).to.equal(43);
  });

  it('--obj.prop', () => {
    const outerSpy = sinon.spy(i => i);
    const changeSpy = sinon.spy();

    const obj = { prop: 42 };
    aexpr(() => obj.prop).onChange(changeSpy);

    outerSpy(--obj.prop);

    expect(changeSpy).to.be.calledOnce;
    expect(changeSpy).to.be.calledWith(41);
    expect(changeSpy).to.be.calledBefore(outerSpy);
    expect(outerSpy).to.be.calledWith(41); // expression return the previous value

    expect(obj.prop).to.equal(41);
  });

});
