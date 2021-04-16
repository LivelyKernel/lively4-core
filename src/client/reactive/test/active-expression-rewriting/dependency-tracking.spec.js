"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import {reset} from 'active-expression-rewriting';
import * as frameBasedAExpr from "active-expression-frame-based";

aexpr(()=>{});

let moduleScopedVariable = 1;

// #TODO: does not yet detect changes to the iterator variable itself
describe('simplify locals', function() {
  it('easier get', () => {
    let myIdentifier = 0;
    let _;

    aexpr(() => myIdentifier).onChange(()=>{});

    _ =  myIdentifier = 2;
  });
});
describe('destructuring', function() {
  it('baseline: do not alter semantics', () => {
    var [a, b] = [1,2];
  });
  xit('baseline: do not alter semantics (complex)', () => {
    const readP0Spy = sinon.spy();
    const readP0I0Spy = sinon.spy();
    const readP0I1Spy = sinon.spy();
    const readP0I2Spy = sinon.spy();
    const readP1Spy = sinon.spy();
    const readP2Spy = sinon.spy();

    const writeP0Spy = sinon.spy();
    const writeP0I0Spy = sinon.spy();
    const writeP0I1Spy = sinon.spy();
    const writeP0RestSpy = sinon.spy();
    const writeP1Spy = sinon.spy();
    const writeRestSpy = sinon.spy();

    const obj = {
      get p0() {
        readP0Spy();
        return 'p0'
      },
      get p1() {
        readP0Spy();
        return 'p1'
      },
      get p2() {
        readP0Spy();
        return 'p2'
      }
    };
    
    const a = {
      set p0(v) {
        return writeP0Spy(v);
      }
    }
    
    const b = {
      set p1(v) {
        return writeP1Spy(v);
      }
    }
    
    const c = {
      set rest(v) {
        return writeRestSpy(v);
      }
    }
    
    //({p: [a.p, b.p], p2:c.p, ...e} = o);
    let x = 0;
    const spy = sinon.spy();
    aexpr(() => x).onChange(spy);

    for(var i = 0; i < 3; i += 1) {
      x += i;
    }
    expect(spy).to.be.calledTwice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
  });
});
describe('loop constructs', function() {
  it('examples that should compile and run', () => {
    
    const spy = sinon.spy();
    for(let x0 = 0;x0 < 5; x0++) {
      x0;
      x0 += 1
      spy(x0)
    }
    expect(spy).to.have.been.calledThrice;
    spy.reset();
    
    for(var x0 = 0;x0 < 5; x0++) {
      x0;
      x0 += 1
      spy(x0)
    }
    expect(spy).to.have.been.calledThrice;
    
    // #TODO: test properly
    var y =8;
    for(var x in window) {
      // console.log("x: " + x)
      y += x
      x = 42;
    }
    
    for(var x2 of Object.keys(window)) {
      // console.log("x2: " + x2)
      y += x2
      x2 = 42;
    }
    
    (async () => {
      for await (var x3 of Object.keys(window)) {
        // console.log("x3: " + x3)
        y += x3
        x3 = 42;
      }
    })();

    for(let x4 in window) {
      // console.log("x4: " + x4)
      y += x4
      x4 = 42;
    }

  });
  
  it('for loop/local variable (var)', () => {
    let x = 0;
    const spy = sinon.spy();
    aexpr(() => x).onChange(spy);

    for(var i = 0; i < 3; i += 1) {
      x += i;
    }
    expect(spy).to.be.calledTwice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
  });
  
  it('for loop/local variable (let)', () => {
    let x = 0;
    const spy = sinon.spy();
    aexpr(() => x).onChange(spy);

    for(let i = 0; i < 3; i += 1) {
      x += i;
    }
    expect(spy).to.be.calledTwice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
  });
  // TODO: we do not yet support tracking iterator variables
  xit('track changes on iterator variable (var)', () => {
    const spy = sinon.spy();
    const holder = {};

    for(var i = 0; i < 3; i += 1) {
      holder.aexpr = holder.aexpr || aexpr(() => i).onChange(spy);
    }
    expect(spy).to.be.calledThrice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(2);
    expect(spy).to.be.calledWithMatch(3);
  });
  xit('track changes on iterator variable (let)', () => {
    const spy = sinon.spy();
    const holder = {};

    for(let i = 0; i < 3; i += 1) {
      holder.aexpr = holder.aexpr || aexpr(() => i).onChange(spy);
    }
    expect(spy).to.be.calledThrice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(2);
    expect(spy).to.be.calledWithMatch(3);
  });
  it('for-in/local variable (var)', () => {
    let x = 0;
    const obj = { a: 42, b: 17 };
    const spy = sinon.spy();
    aexpr(() => x).onChange(spy);

    for(var i in obj) {
      x += obj[i];
    }
    expect(spy).to.be.calledTwice;
    expect(spy).to.be.calledWithMatch(42);
    expect(spy).to.be.calledWithMatch(59);
  });
  it('for-in/local variable (let)', () => {
    let x = 0;
    const obj = { a: 42, b: 17 };
    const spy = sinon.spy();
    aexpr(() => x).onChange(spy);

    for(let i in obj) {
      x += obj[i];
    }
    expect(spy).to.be.calledTwice;
    expect(spy).to.be.calledWithMatch(42);
    expect(spy).to.be.calledWithMatch(59);
  });
  it('for-of/local variable (var)', () => {
    let x = 0;
    const spy = sinon.spy();
    aexpr(() => x).onChange(spy);

    for (var a of [1,2,3]) {
      x += a;
    }
    expect(spy).to.be.calledThrice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
    expect(spy).to.be.calledWithMatch(6);
  });
  it('for-of/local variable (var, defined outside)', () => {
    let x = 0;
    const spy = sinon.spy();
    aexpr(() => x).onChange(spy);

    var a;
    for (a of [1,2,3]) {
      x += a;
    }
    expect(spy).to.be.calledThrice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
    expect(spy).to.be.calledWithMatch(6);
  });
  it('for-of/local variable (let)', () => {
    let x = 0;
    const spy = sinon.spy();
    aexpr(() => x).onChange(spy);

    for (let a of [1,2,3]) {
      x += a;
    }
    expect(spy).to.be.calledThrice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
    expect(spy).to.be.calledWithMatch(6);
  });
  // TODO: we do not yet support tracking quasi-assignments in loops
  xit('for-of/object member', () => {
    let obj = { prop: 0 };
    const spy = sinon.spy();
    aexpr(() => obj.prop).onChange(spy);

    for (obj.prop of [1,2,3]) {
    }
    expect(spy).to.be.calledThrice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
    expect(spy).to.be.calledWithMatch(6);
  });
  xit('for-of/destructuring to members', () => {
    let obj = { prop: 0 };
    const spy = sinon.spy();
    aexpr(() => obj.prop).onChange(spy);

    for ([obj.prop] of [[1],[2],[3]]) {
    }
    expect(spy).to.be.calledThrice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
    expect(spy).to.be.calledWithMatch(6);
  });
  xit('for-of/destructuring to var and members', () => {
    var a = 0;
    const spy = sinon.spy();
    aexpr(() => a).onChange(spy);

    for ([a] of [[1],[2],[3]]) {
    }
    expect(spy).to.be.calledThrice;
    expect(spy).to.be.calledWithMatch(1);
    expect(spy).to.be.calledWithMatch(3);
    expect(spy).to.be.calledWithMatch(6);
  });
});

// #TODO: spread arguments

describe('super', () => {
  
  it('source transform allows for super', () => {
    class A {
      constructor(arg) {
        this.value = 42 + arg;
      }
    }
    
    class B extends A {
      constructor(arg) {
        super(arg);
      }
    }
    
    expect(new B('b')).to.have.property('value', '42b');
  });

  it('source transform allows for super.func(x)', () => {
    class A {
      double(arg) {
        return arg * 2;
      }
    }
    
    class B extends A {
      double(arg) {
        return super.double(arg) * 3;
      }
    }
    
    expect(new B().double(1)).to.equal(6);
  });

});

describe('new.target', () => {
  
  it('source transform allows for new.target', () => {
    class A {
      constructor() {
        this.myClass = new.target;
      }
    }
    
    expect(new A()).to.have.property('myClass', A);
  });

  it('new.target works correctly for subclasses', () => {
    class A {
      constructor() {
        this.myClass = new.target;
      }
    }
    
    class B extends A {
      constructor() {
        super();
        expect(new.target).to.equal(B);
      }
    }
    
    expect(new B()).to.have.property('myClass', B);
  });

  it('new.target as part of a member expression', () => {
    class A {
      constructor() {
        this.myClassName = new.target.name;
      }
    }
    
    expect(new A()).to.have.property('myClassName', 'A');
  });

});

describe('Propagation Logic', function() {
  it('is a transparent wrapper for property accesses', () => {
    let obj = {
      prop: 42,
      func(mul) { return this.prop * mul}
    };

    expect(obj.prop).to.equal(42);
    expect(obj.func(2)).to.equal(84);

    obj.prop /= 3;

    expect(obj.prop).to.equal(14);
    expect(obj.func(2)).to.equal(28);
  });

  it('should be supported with proper integration', () => {
    let obj = { prop: 42 },
        spy = sinon.spy();

    aexpr(() => obj.prop).onChange(spy);
    expect(spy).not.to.be.called;

    obj.prop = 17;
    expect(spy).to.be.calledOnce;
  });

  it('should recalculate to recognize latest changes', () => {
    let obj = {
      prop: 'a',
      a: 15,
      b: 32
    };
    let spy = sinon.spy();

    aexpr(() => obj[obj.prop]).onChange(spy);

    obj.a = 17;
    expect(spy.withArgs(17)).to.be.calledOnce;

    obj.prop = 'b';
    expect(spy.withArgs(32)).to.be.calledOnce;

    obj.a = 42;
    expect(spy.withArgs(42)).not.to.be.called;

    obj.b = 33;
    expect(spy.withArgs(33)).to.be.calledOnce;
  });

  it('applies the given operator', () => {
    let obj = {
      a: 5
    };
    let spy = sinon.spy();

    aexpr(() => obj.a).onChange(spy);

    obj.a *= 1;
    expect(spy).not.to.be.called;

    obj.a += 2;
    expect(spy.withArgs(7)).to.be.calledOnce;
  });

  it('retain the this reference semantic', () => {
    let obj = {
      a: 5,
      func() { return this.a * 3; }
    };
    let spy = sinon.spy();

    aexpr(() => obj.func()).onChange(spy);

    obj.a = 1;

    expect(spy.withArgs(3)).to.be.calledOnce;
  });
  
  it('reset all active expressions', () => {
    const obj = {
      get calcProp() { return this.x + this.y; },
      x: 42,
      y: 17
    },
        spy = sinon.spy();

    aexpr(() => obj.calcProp).onChange(spy);

    obj.x = 33;
    expect(spy).to.be.calledWith(50);
  });

  it('reset all active expressions', () => {
    let obj = { prop: 42 },
        spy = sinon.spy();

    aexpr(() => obj.prop).onChange(spy);

    reset();

    obj.prop = 17;
    expect(spy).not.to.be.called;
  });

  describe('parametrizable aexprs', () => {
    afterEach(() => {
      reset();
    });

    it('handles a single instance binding', () => {
      let _scope = {};
      let obj = { val: 17 },
          spy = sinon.spy();

      aexpr(o => o.val, { params: [obj] }).onChange(spy);

      expect(spy).not.to.be.called;

      obj.val = 42;

      expect(spy).to.be.calledOnce;
    });

    it("handle aexprs with one instance binding with multiple variables", () => {
      let obj1 = { val: 1 },
          obj2 = { val: 2 },
          obj3 = { val: 3 },
          spy = sinon.spy();

      aexpr((o1, o2, o3) => o1.val + o2.val + o3.val, { params: [obj1, obj2, obj3] }).onChange(spy);

      expect(spy).not.to.be.called;

      obj1.val = 10;

      expect(spy.withArgs(15)).to.be.calledOnce;

      obj2.val = 20;

      expect(spy.withArgs(33)).to.be.calledOnce;
    });

    it("handle aexprs with multiple instance bindings", () => {
      let obj1 = { val: 1 },
          obj2 = { val: 2 },
          obj3 = { val: 3 },
          spy12 = sinon.spy(),
          spy23 = sinon.spy(),
          expr = (o1, o2) => o1.val + o2.val;

      aexpr(expr, { params: [obj1, obj2] }).onChange(spy12);
      aexpr(expr, { params: [obj2, obj3] }).onChange(spy23);

      expect(spy12).not.to.be.called;
      expect(spy23).not.to.be.called;

      obj1.val = 10;

      expect(spy12.withArgs(12)).to.be.calledOnce;
      expect(spy23).not.to.be.called;

      obj2.val = 20;

      expect(spy12.withArgs(30)).to.be.calledOnce;
      expect(spy23.withArgs(23)).to.be.calledOnce;

      obj3.val = 30;

      expect(spy12.withArgs(30)).to.be.calledOnce;
      expect(spy23.withArgs(50)).to.be.calledOnce;
    });
  });

  describe('locals', () => {

    it('is a transparent wrapper for local variables', () => {
      var x = 0, y = 1, z = 2;

      let func, inc;
      {
        let x = 42;
        func = function() {
          return x;
        };
        inc = function() {
          x += 1;
        };
      }

      expect(func()).to.equal(42);

      x = 17;

      expect(x).to.equal(17);
      expect(func()).to.equal(42);

      inc();

      expect(x).to.equal(17);
      expect(func()).to.equal(43);
    });

    it('should be supported with proper integration', () => {
      let value = 17,
          spy = sinon.spy();

      aexpr(() => value).onChange(spy);

      expect(spy).not.to.be.called;

      value = 42;
      expect(spy).to.be.calledOnce;
    });

    it('should recalculate to recognize latest changes', () => {
      let obj = { a: 15 },
          obj2 = obj,
          spy = sinon.spy();

      aexpr(() => obj.a).onChange(spy);

      obj.a = 17;
      expect(spy.withArgs(17)).to.be.calledOnce;

      obj = { a: 32 };
      expect(spy.withArgs(32)).to.be.calledOnce;

      obj2.a = 42;
      expect(spy.withArgs(42)).not.to.be.called;

      obj.a = 33;
      expect(spy.withArgs(33)).to.be.calledOnce;
    });

    it('reset all active expressions', () => {
      let value = 42,
          spy = sinon.spy();

      aexpr(() => value).onChange(spy);

      reset();

      value = 17;
      expect(spy).not.to.be.called;
    });
    
    it('should not track constant local', () => {
      const spy = sinon.spy();
      const local = 10;

      const ae = aexpr(() => local).onChange(spy);

      expect(ae.dependencies().all().length).to.equal(0);
      expect(spy).to.have.callCount(0);
      ae.dispose();
    });

    it('should not track local without constant violation', () => {
      const spy = sinon.spy();

      let local = 10;

      const ae = aexpr(() => local).onChange(spy);

      expect(ae.dependencies().all().length).to.equal(0);
      expect(spy).to.have.callCount(0);
      ae.dispose();
    });

    it('should track local with constant violation', () => {
      const spy = sinon.spy();

      let local = 10;

      const ae = aexpr(() => local).onChange(spy);

      local++;

      expect(ae.dependencies().all().length).to.equal(1);
      expect(spy).to.have.callCount(1);
      ae.dispose();
    });

    it('should track constant locals if they are non-primitve', () => {
      const spy = sinon.spy();

      
      let local = {lol: 1};

      const ae = aexpr(() => local.lol).onChange(spy);

      local.lol++;
      
      expect(ae.dependencies().all().length).to.equal(2);
      expect(spy).to.have.callCount(1);
      ae.dispose();
    });

    it('cannot access local variables using function constructors', () => {
      const spy = sinon.spy();
      
      let local = 1;
      expect((new Function(`local++`))).to.throw;
      expect((new Function(`eval('local++')`))).to.throw;
    });

    
    it('should track all locals in a scope that contains an eval', () => {
      const spy = sinon.spy();
      
      let local = 1;

      const ae = aexpr(() => local).onChange(spy);

      eval("local++");

      expect(ae.dependencies().all().length).to.equal(1);
      // expect(spy).to.have.callCount(1); <- #TODO: eval is currently not supported
      ae.dispose();
    });
  });

  describe('globals', () => {
    it('interacts with member accesses on global object', () => {
      window.globalValue = 17;
      let spy = sinon.spy();

      aexpr(() => globalValue).onChange(spy);
      expect(spy).not.to.be.called;

      globalValue = 33;
      expect(spy.withArgs(33)).to.be.calledOnce;

      window.globalValue = 42;
      expect(spy).to.be.calledWithMatch(42);
    });

    it('should be supported with proper integration', () => {
      window.globalValue = 17;
      let spy = sinon.spy();

      aexpr(() => globalValue).onChange(spy);
      expect(spy).not.to.be.called;

      globalValue = 42;
      expect(spy).to.be.calledOnce;
    });

    it('reset all active expressions', () => {
      globalValue = 42;
      let spy = sinon.spy();

      aexpr(() => globalValue).onChange(spy);

      reset();

      globalValue = 17;
      expect(spy).not.to.be.called;
    });
  });

  it('aexpr ordering', () => {
    let a = 1;
    let b = 1;
    let spyA = sinon.spy(),
        spyB = sinon.spy();

    aexpr(() => a).onChange(spyA);
    aexpr(() => b).onChange(spyB);

    a = b = 2;
    expect(spyA).to.be.calledAfter(spyB);
  });

  xit('support assignments in aexprs', () => {
    let a = 1;
    let b = 1;
    let spy = sinon.spy();

    aexpr(() => {
      b = b + 1; // #TODO: do we even want to support this?
      return a;
    }).onChange(spy);

    a = 2;
    expect(spy).to.be.calledOnce;
  });

  xit('monitor collections for change', () => {
    let arr = [1,2];
    let spy = sinon.spy();
    
    monitorCollection(); // or
    arr::monitor().onChange(spy);
    
    arr.push(3);
    expect(spy).to.be.calledOnce;
  });

  describe('module-scoped variables', () => {
    it('track assignment to module-scoped variable', () => {
      const spy = sinon.spy();

      aexpr(() => moduleScopedVariable).onChange(spy);
      expect(spy).not.to.be.called;

      moduleScopedVariable = 2;
      expect(spy).to.be.calledWithMatch(2);
    })
  });

  describe('members', () => {
    it('triggers correct callbacks', () => {
      let rect = {
        extent: { x: 2, y: 2 },
        width() { return this.extent.x; }
      };

      let spyExtent = sinon.spy(),
          spyWidth = sinon.spy();

      aexpr(() => rect.width()).onChange(spyWidth);
      aexpr(() => rect.extent).onChange(spyExtent);

      rect.extent = { x: 2, y: 2 };
      expect(spyWidth).not.to.be.called;
      expect(spyExtent).to.be.calledWithMatch({ x: 2, y: 2 });
      spyExtent.reset();

      rect.extent.x = 3;
      expect(spyWidth).to.be.calledWithMatch(3);
      expect(spyExtent).not.to.be.called;
    });    

    describe('nested members', () => {
      it('handle nested members', () => {
        let a = { b: { c: { d: { e: { f: 1 } } } } };
        let spy = sinon.spy();

        aexpr(() => a.b.c.d.e.f).onChange(spy);

        a.b = { c: { d: { e: { f: 2 } } } };
        expect(spy).to.be.calledWithMatch(2);

        a.b.c = { d: { e: { f: 3 } } };
        expect(spy).to.be.calledWithMatch(3);

        a.b.c.d = { e: { f: 4 } };
        expect(spy).to.be.calledWithMatch(4);

        a.b.c.d.e = { f: 5 };
        expect(spy).to.be.calledWithMatch(5);

        a.b.c.d.e.f = 6;
        expect(spy).to.be.calledWithMatch(6);
      });
      
      it('handle nested member functions', () => {
        let a = { b() { return b; } };
        let b = { c() { return c; } };
        let c = { d() { return d; } };
        let d = { e() { return e; } };
        let e = { f() { return 1; } };
        let b2 = { c() { return c2; } };
        let c2 = { d() { return d2; } };
        let d2 = { e() { return e2; } };
        let e2 = { f() { return 2; } };
        let c3 = { d() { return d3; } };
        let d3 = { e() { return e3; } };
        let e3 = { f() { return 3; } };
        let d4 = { e() { return e4; } };
        let e4 = { f() { return 4; } };
        let e5 = { f() { return 5; } };
        let spy = sinon.spy();

        aexpr(() => a.b().c().d().e().f()).onChange(spy);
        
        a.b = () => b2;
        expect(spy).to.be.calledWithMatch(2);

        a.b().c = () => c3;
        expect(spy).to.be.calledWithMatch(3);

        a.b().c().d = () => d4;
        expect(spy).to.be.calledWithMatch(4);

        a.b().c().d().e = () => e5;
        expect(spy).to.be.calledWithMatch(5);
      });
      
      it('handle nested mixed members and member functions', () => {
        let f = 1;
        let d = { e: { f() { return f; } } };
        let b = { c: { d() { return d; } } };
        let a = { b() { return b; } };

        let f2 = 2;
        let e2 = { f() { return f2; } };
        let d2 = { e: e2 };
        let c2 = { d() { return d2; } };
        let b2 = { c: c2 };
        
        let f3 = 3;
        let e3 = { f() { return f3; } };
        let d3 = { e: e3 };
        let c3 = { d() { return d3; } };

        let f4 = 4;
        let e4 = { f() { return f4; } };
        let d4 = { e: e4 };

        let f5 = 5;
        let e5 = { f() { return f5; } };

        let spy = sinon.spy();

        aexpr(() => a.b().c.d().e.f()).onChange(spy);

        a.b = () => b2;
        expect(spy).to.be.calledWithMatch(2);

        a.b().c = c3;
        expect(spy).to.be.calledWithMatch(3);

        a.b().c.d = () => d4;
        expect(spy).to.be.calledWithMatch(4);

        a.b().c.d().e = e5;
        expect(spy).to.be.calledWithMatch(5);

        a.b().c.d().e = { f() { return 6; }};
        expect(spy).to.be.calledWithMatch(6);
      });
    });
    it('binds `this` correctly', () => {
      const obj = {
        get computedProp() { return this.basicProp + 1 },
        set computedProp(value) { return this.basicProp = value -1; },
        basicProp: 'basicProp'
      }
      const spy = sinon.spy();

      expect(obj.computedProp).to.equal(obj.basicProp + 1);
      
      aexpr(() => obj.computedProp).onChange(spy);

      obj.computedProp = 5;
      expect(spy).to.be.calledOnce;
      expect(spy).to.be.calledWith(5);
      expect(obj.basicProp).to.equal(4);
    });
  });
});

describe("misc", () => {
  it("rewrite call expression in sequence expression does not result in stack overflow", () => {
    const obj = {
      x: 3,
      fn() {
        return this.x;
      }
    };
    
    (obj.fn(), obj.fn());
  });
  it("rewrite member expression with Identifier as property", () => {
    const obj = {
      x: 3,
      fn() {
        return this.x;
      }
    };
    const func = "fn";    
    const spy = sinon.spy();
    
    aexpr(() => obj[func]()).onChange(spy);
    obj.x = 2;
    
    expect(spy).to.be.calledOnce;
    expect(spy).to.be.calledWithMatch(2);
  });
  it("rewrite member expression with StringLiteral as property", () => {
    const obj = {
      x: 3,
      fn() {
        return this.x;
      }
    };
    const spy = sinon.spy();
    
    aexpr(() => obj["fn"]()).onChange(spy);
    obj.x = 2;
    
    expect(spy).to.be.calledOnce;
    expect(spy).to.be.calledWithMatch(2);
  });
  it("rewrite assignment to member expression with StringLiteral as property", () => {
    const obj = {
      x: 3,
      fn() {
        return this.x;
      }
    };
    const spy = sinon.spy();
    
    aexpr(() => obj.fn()).onChange(spy);
    obj["x"] = 2;
    
    expect(spy).to.be.calledOnce;
    expect(spy).to.be.calledWithMatch(2);
  });
  // #TODO: this is not checking, whether changes to a bindExpression are detected!
  it("bind expression as expression", () => {
    const obj = {
      x: 3,
      fn() {
        return this.x;
      }
    };
    const spy = sinon.spy();
    
    aexpr(::obj.fn).onChange(spy);
    obj.x = 2;
    
    expect(spy).to.be.calledOnce;
    expect(spy).to.be.calledWithMatch(2);
  });
  it("this as object of MemberExpression", () => {
    const obj = {
      x: 3,
      fn2() { return this.x; },
      fn() { return this.fn2(); }
    };
    const spy = sinon.spy();
    
    aexpr(() => obj.fn()).onChange(spy);
    obj.x = 2;
    
    expect(spy).to.be.calledOnce;
    expect(spy).to.be.calledWithMatch(2);
  });
})
