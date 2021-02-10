"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { PIScheme, makeRef } from 'src/client/reactive/polymorphic-identifiers/polymorphic-identifiers.js';
import { uuid } from 'utils';

describe("PI", function() {
  
  it("is defined", () => {
    expect(PIScheme).to.be.ok;
    expect(makeRef).to.be.ok;
  });

  it("detects accesses", () => {
    class fourtyTwo extends PIScheme {
      read() {
        return 42;
      }
    }

    expect(makeRef(fourtyTwo, {
      thisReference: this,
      evalFunction: str => eval(str)
    })``.access).to.equal(42)
    
  });

  it("can access the `this` reference", () => {
    class prop extends PIScheme {
      create(strings) {
        this.prop = strings.first;
      }
      read() {
        return this.thisReference[this.prop];
      }
      write(value) {
        return this.thisReference[this.prop] = value;
      }
    }

    // read
    const o = {
      foo: 17,
      func() {
        return makeRef(prop, {
          thisReference: this,
          evalFunction: str => eval(str)
        })`foo`.access;
      },
      write(value) {
        makeRef(prop, {
          thisReference: this,
          evalFunction: str => eval(str)
        })`bar`.access = value;
      }
    };
    expect(o.func()).to.equal(17)
    
    // write
    o.write(23)
    expect(o.bar).to.equal(23)
  });

  it("can access locals with eval", () => {
    class local extends PIScheme {
      create(strings) {
        this.local = strings.first;
      }
      read() {
        return this.evalFunction(this.local);
      }
      write(value) {
        const id = uuid();
        self[id] = value;
        try {
          return this.evalFunction(this.local + ` = self['${id}']`);
        } finally {
          delete self[id];
        }
      }
    }

    let v1 = 'v1', v2 = 42;

    // read
    expect(makeRef(local, {
          thisReference: this,
          evalFunction: str => eval(str)
        })`v1`.access).to.equal('v1')
    
    // write
    makeRef(local, {
          thisReference: this,
          evalFunction: str => eval(str)
        })`v2`.access = "v2";
    expect(v2).to.equal('v2');
    
    // read/write
    makeRef(local, {
          thisReference: this,
          evalFunction: str => eval(str)
        })`v2`.access += '.2';
    expect(v2).to.equal('v2.2');
  });

  it("ignore normal tagged template strings", () => {
    function foo() {
      return 'bar';
    }
    
    expect(makeRef(foo, {
      thisReference: this,
      evalFunction: str => eval(str)
    })``.access).to.equal('bar')
  });

});
describe("AEs", function() {
  
  it("AExprs insert default constructors", () => {
    class A {
      constructor(prop) {
        this.prop = prop;
      }
    }
    class B extends A {}
    
    const b = new B(42);
    expect(b.prop).to.equal(42);
  });

});
