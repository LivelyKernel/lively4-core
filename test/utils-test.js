import {loc, waitForDeepProperty, isFunctionALT as isFunction, functionMetaInfo, CallableObject, using, shallowEqualsArray, shallowEqualsSet, shallowEqualsMap, shallowEquals, deepEquals } from 'utils';
"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('Dynamic type checks', function() {
  // #TODO #Question: are generators functions in this case?
  it('`isFunction` works on functions but not on non-functions', () => {
    expect(isFunction(function foo() {}), "function foo() {}").to.be.true;
    expect(isFunction(async function foo() {}), "async function foo() {}").to.be.true;

    expect(isFunction({})).to.be.false;
    expect(isFunction('')).to.be.false;
    expect(isFunction(1)).to.be.false;
    expect(isFunction(undefined)).to.be.false;
    expect(isFunction(null)).to.be.false;
    expect(isFunction(0)).to.be.false;
    expect(isFunction(true)).to.be.false;
    expect(isFunction(new Date())).to.be.false;
  });
  describe('Dynamic type checks', function() {
    it('functionMetaInfo function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(function foo() {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.false;
    });
    it('functionMetaInfo anonymous function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(() => {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.false;
    });
    it('functionMetaInfo async function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(async () => {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.true;
      expect(isGenerator).to.be.false;
    });
    it('functionMetaInfo generator function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(function* foo() {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.true;
    });
    it('functionMetaInfo async generator function', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo(async function* foo() {});
      expect(isFunction).to.be.true;
      expect(isAsync).to.be.true;
      expect(isGenerator).to.be.true;
    });
    it('functionMetaInfo string', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo('');
      expect(isFunction).to.be.false;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.false;
    });
    it('functionMetaInfo null', () => {
      const { isFunction, isAsync, isGenerator } = functionMetaInfo('');
      expect(isFunction).to.be.false;
      expect(isAsync).to.be.false;
      expect(isGenerator).to.be.false;
    });

  });
});


describe('Callable Object', () => {
  it('defines CallableObject', () => {
    expect(CallableObject).to.be.ok;
  });
});


// === Python's with statement
describe('using', () => {
  class TestContextManager {
    constructor() {
      this.__enter__ = sinon.spy();
      this.__exit__ = sinon.spy();
    }
  }
  
  it('using is defined', () => {
    expect(using).to.be.ok;
  });

  it('using calls the specified function', () => {
    const spy = sinon.spy();
    
    const actual = using([], spy);
    expect(spy).to.be.calledOnce;
  });

  it("using returns the callback's value", () => {
    const expected = 42;
    
    const actual = using([], () => expected);
    expect(actual).to.equal(expected);
  });

  it('calls __enter__ and __exit__ of one context manager', () => {
    const callbackSpy = sinon.spy();
    const contextManager = new TestContextManager();
        
    using([contextManager], callbackSpy);
    expect(contextManager.__enter__).to.be.calledOnce;
    expect(callbackSpy).to.be.calledOnce;
    expect(contextManager.__exit__).to.be.calledOnce;
    expect(contextManager.__enter__).to.be.calledBefore(callbackSpy)
    expect(callbackSpy).to.be.calledBefore(contextManager.__exit__)
  });

  it('calls __enter__ and __exit__ of multiple context managers', () => {
    const callbackSpy = sinon.spy();
    const contextManager1 = new TestContextManager();
    const contextManager2 = new TestContextManager();

    using([contextManager1, contextManager2], callbackSpy);
    
    expect(contextManager1.__enter__).to.be.calledOnce;
    expect(contextManager2.__enter__).to.be.calledOnce;
    expect(callbackSpy).to.be.calledOnce;
    expect(contextManager2.__exit__).to.be.calledOnce;
    expect(contextManager1.__exit__).to.be.calledOnce;

    expect(contextManager1.__enter__).to.be.calledBefore(contextManager2.__enter__)
    expect(contextManager2.__enter__).to.be.calledBefore(callbackSpy)
    expect(callbackSpy).to.be.calledBefore(contextManager2.__exit__)
    expect(contextManager2.__exit__).to.be.calledBefore(contextManager1.__exit__)
  });

  it('nested usings call respective context managers', () => {
    const callbackSpy = sinon.spy();
    const contextManager1 = new TestContextManager();
    const contextManager2 = new TestContextManager();

    using([contextManager1], () =>
      using([contextManager2], callbackSpy)
    );
    
    expect(contextManager1.__enter__).to.be.calledOnce;
    expect(contextManager2.__enter__).to.be.calledOnce;
    expect(callbackSpy).to.be.calledOnce;
    expect(contextManager2.__exit__).to.be.calledOnce;
    expect(contextManager1.__exit__).to.be.calledOnce;

    expect(contextManager1.__enter__).to.be.calledBefore(contextManager2.__enter__)
    expect(contextManager2.__enter__).to.be.calledBefore(callbackSpy)
    expect(callbackSpy).to.be.calledBefore(contextManager2.__exit__)
    expect(contextManager2.__exit__).to.be.calledBefore(contextManager1.__exit__)
  });

  it('using calls context managers with error in case of exceptions', () => {
    const expectedError = new Error('test error');
    const contextManager1 = new TestContextManager();
    const contextManager2 = new TestContextManager();

    function errornousFunction() {
      using([contextManager1], () =>
        using([contextManager2], (callbackSpy => {
          throw expectedError;
        }))
      );
    }
    
    expect(errornousFunction).to.throw(expectedError);
    
    expect(contextManager2.__exit__).to.be.calledOnce;
    expect(contextManager2.__exit__).to.be.calledWith(expectedError);

    expect(contextManager1.__exit__).to.be.calledOnce;
    expect(contextManager1.__exit__).to.be.calledWith(expectedError);

    expect(contextManager2.__exit__).to.be.calledBefore(contextManager1.__exit__)
  });
});


describe('waitForDeepProperty', () => {
  it('it works', async (done) => {
    
    var o = new Object();
    
    lively.sleep(20).then(() => {
      o.foo = {}
    })

    lively.sleep(30).then(() => {
      o.foo.bar = 7
    })

    var result = await waitForDeepProperty(o, "foo.bar", 1000, 10) 
    expect(result).to.equal(7)
    done()
  });
});


describe('Location', () => {
  describe('loc', () => {
    it('converts from babel', () => {
      var pos = loc({line: 3, column: 1})
      expect(pos.isLocation).equal(true)
      expect(pos.toString()).equal("loc(2:1)")
    });
    it('converts from cm', () => {
      var pos = loc({line: 2, ch: 1})
      expect(pos.isLocation).equal(true)
      expect(pos.toString()).equal("loc(2:1)")
    });
    it('converts from treesitter', () => {
      var pos = loc({row: 2, column: 3})
      expect(pos.isLocation).equal(true)
      expect(pos.toString()).equal("loc(2:3)")
    });
  })
  describe('toTreeSitter', () => {
    it('converts from treesitter', () => {
      var pos = loc({row: 2, column: 3})
      var ts = pos.asTreeSitter()
      expect(ts.row).equal(2)
      expect(ts.column).equal(3)
    });
  })
});





