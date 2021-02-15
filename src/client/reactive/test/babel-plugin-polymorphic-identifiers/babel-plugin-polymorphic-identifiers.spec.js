'pi'
"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { PIScheme } from 'polymorphic-identifiers';
import { uuid } from 'utils';

describe("PI", function() {
  
  it("is defined", () => {
    expect(PIScheme).to.be.ok;
  });

  it("detects accesses", () => {
    class fourtyTwo extends PIScheme {
      read() {
        return 42;
      }
    }

    expect(fourtyTwo``).to.equal(42)
    
  });

  it("can access the `this` reference", () => {
    class prop extends PIScheme {
      initialize() {
        this.prop = this.strings.first;
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
        return prop`foo`;
      },
      write(value) {
        prop`bar` << value;
      }
    };
    expect(o.func()).to.equal(17)
    
    // write
    o.write(23)
    expect(o.bar).to.equal(23)
  });

  it("can access locals with eval", () => {
    class local extends PIScheme {
      initialize() {
        this.local = this.strings.first;
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
    expect(local`v1`).to.equal('v1')
    
    // write
    local`v2` << "v2";
    expect(v2).to.equal('v2');
    
    // read/write
    local`v2` << local`v2` + '.2';
    expect(v2).to.equal('v2.2');
  });

  it("ignore normal tagged template strings", () => {
    function foo() {
      return 'bar';
    }
    
    expect(foo``).to.equal('bar')
  });

});
