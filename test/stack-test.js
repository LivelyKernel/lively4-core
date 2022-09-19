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

  it('named function as first frame', () => {
    function expectedFunc() {
      return lively.stack();
    }

    const stack = expectedFunc();

    expect(stack.getFrame(0).func).to.equal('expectedFunc');
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

    expect(stack.getFrame(0).func).to.equal('eval');
    expect(stack.getFrame(1).func).to.equal('Context.eval');
  });

  it('arrow function (iife) represented by `eval`', () => {
    const stack = (() => {
      return lively.stack();
    })();

    expect(stack.getFrame(0).func).to.equal('eval');
  });

  it('named arrow function', () => {
    const myFn = () => {
      return lively.stack();
    };
    const stack = myFn();

    expect(stack.getFrame(0).func).to.equal('myFn');
  });

  it('function as parameter', () => {
    function exec(fn) {
      return fn();
    }
    const stack = exec(() => {
      return lively.stack();
    });

    expect(stack.getFrame(0).func).to.equal('eval');
    expect(stack.getFrame(1).func).to.equal('exec');
  });

  it('named function as parameter', () => {
    function exec(fn) {
      return fn();
    }
    function myFn() {
      return lively.stack();
    }
    const stack = exec(myFn);

    expect(stack.getFrame(0).func).to.equal('myFn');
    expect(stack.getFrame(1).func).to.equal('exec');
  });

  it('function in boundEval', async (done) => {
    const code = `
    function exec(fn) {
      return fn();
    }
    function myFn() {
      return lively.stack();
    }
    const stack = exec(myFn);
stack;
`;
    const stack = await code.boundEval();

    expect(stack.getFrame(0).func).to.equal('myFn');
    expect(stack.getFrame(1).func).to.equal('exec');
    
    done()
  });

  it('function in eval', async (done) => {
    const code = `
    function exec(fn) {
      return fn();
    }
    function myFn() {
      return lively.stack();
    }
    const stack = exec(myFn);
stack;
`;
    const stack = eval(code);

    expect(stack.getFrame(0).func).to.equal('myFn');
    expect(stack.getFrame(1).func).to.equal('exec');
    expect(stack.getFrame(2).func).to.equal('eval');
    
    
    done()
  });

  it('constructor', () => {
    let stack;
    class AClass {
      constructor() {
        stack = lively.stack();
      }
    }
    new AClass();

    expect(stack.getFrame(0).func).to.equal('AClass');
  });

  it('computed property', () => {
    const o = {
      ['stuff']() {
        return lively.stack();
      }

    };
    const stack = o['stu' + 'ff']();

    expect(stack.getFrame(0).func).to.equal('Object.stuff');
    // lively.openInspector(this)
  });

  it('getter', () => {
    const o = {
      get myGetter() {
        return lively.stack();
      }

    };
    const stack = o.myGetter;

    expect(stack.getFrame(0).func).to.equal('get myGetter [as myGetter]');
  });

  it('static getter', () => {
    class AClass {
      static get myStaticGetter() {
        return lively.stack();
      }

    }
    const stack = AClass.myStaticGetter;

    expect(stack.getFrame(0).func).to.equal('get myStaticGetter [as myStaticGetter]');
  });

  it('new as property name', () => {
    const o = {
      new() {
        return lively.stack();
      }
    };
    const stack = o.new();

    expect(stack.getFrame(0).func).to.equal('Object.new');
  });

  it('call to nested property', () => {
    const o = {
      o2: {
        fn() {
          return lively.stack();
        }

      }
    };
    const stack = o.o2.fn();

    expect(stack.getFrame(0).func).to.equal('Object.fn');
  });

  it('get as function name', () => {
    function get() {
      return lively.stack();
    }
    const stack = get();

    expect(stack.getFrame(0).func).to.equal('get');
  });

  it('anonymous class', () => {
    let stack;
    new class {
      constructor() {
        stack = lively.stack();
      }
    }();
    expect(stack.getFrame(0).func).to.equal('eval');
    expect(stack.getFrame(1).func).to.equal('Context.eval');
  });
});

describe('Frame', () => {

  function frameTest(str, expected) {
    it(`frameTest: "${str}"`, () => {
      const frame = new Frame(str);

      for (let [key, value] of Object.entries(expected)) {
        expect(frame[key]).to.equal(value, `expected frame.${key} to equal ${value}, but was ${frame[key]}`);
      }
    });
  }

  frameTest(" at https://lively-kernel.org/lively4/aexpr/src/external/mocha.js?1583757762700:4694:7", {
    file: "https://lively-kernel.org/lively4/aexpr/src/external/mocha.js?1583757762700",
    transpiled: false,
    line: 4694,
    char: 7,
  });
  
  frameTest("   at doEvaluate (eval at loadJavaScript (https://lively-kernel.org/lively4/aexpr/src/client/boot.js:25:3), &lt;anonymous>:1554:13)", {
    async: false,
    new: false,
    func: "doEvaluate",

    file: "&lt;anonymous>",
    transpiled: false,
    line: 1554,
    char: 13,
    
    evalAsync: false,
    evalNew: false,
    evalFunc: "loadJavaScript",
    
    evalFile: "https://lively-kernel.org/lively4/aexpr/src/client/boot.js",
    evalTranspiled: false,
    evalLine: 25,
    evalChar: 3,
  })
  frameTest("    at eval (eval at <anonymous> (https://lively-kernel.org/lively4/aexpr/test/stack-test.js!transpiled), <anonymous>:8:19)", {
    async: false,
    new: false,
    func: "eval",

    file: "<anonymous>",
    transpiled: false,
    line: 8,
    char: 19,
    
    evalAsync: false,
    evalNew: false,
    evalFunc: "<anonymous>",

    evalFile: "https://lively-kernel.org/lively4/aexpr/test/stack-test.js",
    evalTranspiled: true,
    evalLine: undefined,
    evalChar: undefined,
  })
  frameTest(" at Function.stack (https://lively-kernel.org/lively4/aexpr/src/client/lively.js!transpiled:2548:19)", {
    async: false,
    new: false,
    func: "Function.stack",

    file: "https://lively-kernel.org/lively4/aexpr/src/client/lively.js",
    transpiled: true,
    line: 2548,
    char: 19,
  })
  frameTest(" at Object.get getter [as getter] (https://lively-kernel.org/lively4/aexpr/test/stack-test.js!transpiled:241:29)", {
    async: false,
    new: false,
    func: "Object.get getter [as getter]",

    file: "https://lively-kernel.org/lively4/aexpr/test/stack-test.js",
    transpiled: true,
    line: 241,
    char: 29,
  })
  frameTest(" at Function.get staticGetter [as staticGetter] (https://lively-kernel.org/lively4/aexpr/test/stack-test.js!transpiled:241:29)", {
    async: false,
    new: false,
    func: "Function.get staticGetter [as staticGetter]",

    file: "https://lively-kernel.org/lively4/aexpr/test/stack-test.js",
    transpiled: true,
    line: 241,
    char: 29,
  })
  frameTest(" at async String.boundEval (https://lively-kernel.org/lively4/aexpr/src/client/lang/lang-ext.js:292:26)", {
    async: true,
    new: false,
    func: "String.boundEval",

    file: "https://lively-kernel.org/lively4/aexpr/src/client/lang/lang-ext.js",
    transpiled: false,
    line: 292,
    char: 26,
  })
  frameTest(" at async boundEval (https://lively-kernel.org/lively4/aexpr/src/client/bound-eval.js!transpiled:117:18)", {
    async: true,
    new: false,
    func: "boundEval",

    file: "https://lively-kernel.org/lively4/aexpr/src/client/bound-eval.js",
    transpiled: true,
    line: 117,
    char: 18,
  })
  frameTest(" at new AClass (https://lively-kernel.org/lively4/aexpr/test/stack-test.js!transpiled:226:30)", {
    async: false,
    new: true,
    func: "AClass",

    file: "https://lively-kernel.org/lively4/aexpr/test/stack-test.js",
    transpiled: true,
    line: 226,
    char: 30,
  })
  frameTest(" at new eval (https://lively-kernel.org/lively4/aexpr/test/stack-test.js!transpiled:312:30)", {
    async: false,
    new: true,
    func: "eval",

    file: "https://lively-kernel.org/lively4/aexpr/test/stack-test.js",
    transpiled: true,
    line: 312,
    char: 30,
  })
  frameTest(" at new ClassB (workspace:7159c399-4d43-4781-b2c0-98c82fd93f92/lively-kernel.org/lively4/aexpr/unnamed_module_c6ec94a4_42d9_4324_9b1c_af48fc2b9557!transpiled:25:248)", {
    async: false,
    new: true,
    func: "ClassB",

    file: "workspace:7159c399-4d43-4781-b2c0-98c82fd93f92/lively-kernel.org/lively4/aexpr/unnamed_module_c6ec94a4_42d9_4324_9b1c_af48fc2b9557",
    transpiled: true,
    line: 25,
    char: 248,
  })

});
