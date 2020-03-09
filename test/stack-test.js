import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Stack, { Frame } from 'src/client/utils/stack.js';

describe('Stack', function () {

  it('is defined', () => {
    expect(lively.stack()).to.have.property('frames');
    expect(Frame).to.be.defined;
  });

  it('lively.stack', () => {
    expect(lively.stack()).to.be.an.instanceof(Stack);
  });

  it('named function', () => {
    function expectedFunc() {
      return lively.stack();
    }

    const stack = expectedFunc();

    expect(stack.frames.find(f => f.func === 'expectedFunc').func).to.equal('expectedFunc');
  });

  it('anonymous function', () => {
    const expectedFunc = function () {
      return lively.stack();
    };

    const stack = expectedFunc();

    expect(stack.frames.find(f => f.func === 'expectedFunc').func).to.equal('expectedFunc');
  });

  it('iife represented by `eval`', () => {
    const stack = function () {
      return lively.stack();
    }();

    expect(stack.getFrame(1).func).to.equal('eval');
  });

  it('arrow function (iife) represented by `eval`', () => {
    const stack = (() => {
      return lively.stack();
    })();

    expect(stack.getFrame(1).func).to.equal('eval');
  });

  it('named arrow function', () => {
    const myFn = () => {
      return lively.stack();
    };
    const stack = myFn();

    expect(stack.getFrame(1).func).to.equal('myFn');
  });

  it('function as parameter', () => {
    function exec(fn) {
      return fn();
    }
    const stack = exec(() => {
      return lively.stack();
    });

    expect(stack.getFrame(1).func).to.equal('eval');
    expect(stack.getFrame(2).func).to.equal('exec');
  });

  it('named function as parameter', () => {
    function exec(fn) {
      return fn();
    }
    function myFn() {
      return lively.stack();
    }
    const stack = exec(myFn);

    expect(stack.getFrame(1).func).to.equal('myFn');
    expect(stack.getFrame(2).func).to.equal('exec');
  });

  it('function in boundEval', async () => {
    const code = `
    function exec(fn) {
      return fn();
    }
    function myFn() {
      return lively.stack();
    }
    const stack = exec(myFn);
stack;
`
    const stack = await code.boundEval();

    expect(stack.getFrame(0).func).to.equal('Function.stack');
    expect(stack.getFrame(1).func).to.equal('myFn');
    expect(stack.getFrame(2).func).to.equal('exec');
    // expect(stack.getFrame(3).func).to.equal('exec');
    // expect(stack.getFrame(4).func).to.equal('exec');
    // expect(stack.getFrame(5).func).to.equal('exec');
    // expect(stack.getFrame(6).func).to.equal('exec');
    // expect(stack.getFrame(7).func).to.equal('exec');
    // expect(stack.getFrame(8).func).to.equal('exec');
    // expect(stack.getFrame(9).func).to.equal('exec');
    // expect(stack.getFrame(10)).to.equal(42);
  });

  it('function in eval', async () => {
    const code = `
    function exec(fn) {
      return fn();
    }
    function myFn() {
      return lively.stack();
    }
    const stack = exec(myFn);
stack;
`
    const stack = eval(code);

    expect(stack.getFrame(0).func).to.equal('Function.stack');
    expect(stack.getFrame(1).func).to.equal('myFn');
    expect(stack.getFrame(2).func).to.equal('exec');
    expect(stack.getFrame(3).func).to.equal('eval');
    // expect(stack.getFrame(3).func).to.equal('exec');
    // expect(stack.getFrame(4).func).to.equal('exec');
    // expect(stack.getFrame(5).func).to.equal('exec');
    // expect(stack.getFrame(6).func).to.equal('exec');
    // expect(stack.getFrame(7).func).to.equal('exec');
    // expect(stack.getFrame(8).func).to.equal('exec');
    // expect(stack.getFrame(9).func).to.equal('exec');
    // expect(stack.getFrame(10)).to.equal(42);
  });

});