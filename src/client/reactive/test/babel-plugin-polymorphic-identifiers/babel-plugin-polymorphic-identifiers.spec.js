'pi';
"enable aexpr";

import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { PIScheme, local, localStorage as ls, query as q } from 'polymorphic-identifiers';
import { uuid } from 'utils';

describe("PI", function () {

  it("is defined", () => {
    expect(PIScheme).to.be.ok;
  });

  it("detects accesses", () => {
    class fourtyTwo extends PIScheme {
      read() {
        return 42;
      }
    }

    expect(fourtyTwo``).to.equal(42);
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
    expect(o.func()).to.equal(17

    // write
    );o.write(23);
    expect(o.bar).to.equal(23);
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

    let v1 = 'v1',
        v2 = 42;

    // read
    expect(local`v1`).to.equal('v1'

    // write
    );local`v2` << "v2";
    expect(v2).to.equal('v2');

    // read/write
    local`v2` << local`v2` + '.2';
    expect(v2).to.equal('v2.2');
  });

  it("ignore normal tagged template strings", () => {
    function foo() {
      return 'bar';
    }

    expect(foo``).to.equal('bar');
  });
});

describe("PI Schemes", function () {

  it("is defined", () => {
    expect(PIScheme).to.be.ok;
  });

  it("detects accesses", () => {
    class fourtyTwo extends PIScheme {
      read() {
        return 42;
      }
    }

    expect(fourtyTwo``).to.equal(42);
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
    expect(o.func()).to.equal(17

    // write
    );o.write(23);
    expect(o.bar).to.equal(23);
  });

  it("local: can access local variables with eval", () => {
    let v1 = 'v1',
        v2 = 42;

    // read
    expect(local`v1`).to.equal('v1'

    // write
    );local`v2` << "v2";
    expect(v2).to.equal('v2');

    // read/write
    local`v2` << local`v2` + '.2';
    expect(v2).to.equal('v2.2');
  });

  it("ls/localStorage", () => {
    localStorage.setItem;

    let v1 = 'v1',
        v2 = 42;

    // read
    expect(local`v1`).to.equal('v1'

    // write
    );local`v2` << "v2";
    expect(v2).to.equal('v2');

    // read/write
    local`v2` << local`v2` + '.2';
    expect(v2).to.equal('v2.2');
  });

  describe("query", function () {

    let testElement;
    beforeEach(() => {
      document.body.querySelectorAll('.query-test').forEach(e => e.remove());
      testElement = <div class="query-test">17</div>;
      document.body.appendChild(testElement);
    });
    afterEach(() => {
      testElement.remove();
    });

    it("is defined", () => {
      expect(q).to.be.ok;
    });

    it("return testElement", () => {
      expect(q`.query-test`).to.equal(testElement);
    });

    it("return a property", () => {
      const expectedProp = testElement.myProp = {};
      expect(q`.query-test/prop/myProp`).to.equal(expectedProp);
    });

    it("return an attribute", () => {
      testElement.setAttribute('myAttr', 24);
      expect(q`.query-test/attr/myAttr`).to.equal('24');
    });

    it("return a style", () => {
      testElement.style.border = '3px solid red';
      expect(q`.query-test/style/border`).to.equal(testElement.style.border);
    });

    it("return a style in camel- and kebabcase", () => {
      const expectedStyle = testElement.style.backgroundColor = 'red';
      expect(q`.query-test/style/background-color`).to.equal(expectedStyle);
      expect(q`.query-test/style/backgroundColor`).to.equal(expectedStyle);
    });

    it("return innerHTML", () => {
      const expectedHTML = testElement.innerHTML = 'hello';
      expect(q`.query-test/html`).to.equal(expectedHTML);
    });

    it("replace testElement", () => {
      const expectedResult = <div id={'this-is-the-expected-result'}></div>;

      q`.query-test` << expectedResult;
      expect(document.body.contains(testElement)).to.be.false;
      expect(document.body.contains(expectedResult)).to.be.true;
    });

    it("set a property", () => {
      const expectedProp = {};
      q`.query-test/prop/myProp` << expectedProp;
      expect(testElement.myProp).to.equal(expectedProp);
    });

    it("set an attribute", () => {
      q`.query-test/attr/myAttr` << 24;
      expect(testElement.getAttribute('myAttr')).to.equal('24');
    });

    it("set a style", () => {
      const expectedStyle = '3px solid red';
      q`.query-test/style/border` << expectedStyle;
      expect(testElement.style.border).to.equal(expectedStyle);
    });

    it("set a style in camel- and kebabcase", () => {
      let expectedStyle = 'red';
      q`.query-test/style/background-color` << expectedStyle;
      expect(testElement.style.backgroundColor).to.equal(expectedStyle);

      expectedStyle = 'blue';
      q`.query-test/style/backgroundColor` << expectedStyle;
      expect(testElement.style.backgroundColor).to.equal(expectedStyle);
    });

    it("set innerHTML", () => {
      const expectedHTML = 'hello';
      q`.query-test/html` << expectedHTML;
      expect(testElement.innerHTML).to.equal(expectedHTML);
    });

  });
});