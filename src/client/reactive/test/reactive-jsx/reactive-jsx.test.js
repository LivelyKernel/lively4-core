"use strict";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

describe('simple', function() {
  it('simple div1', () => {
    let div = <div>Hello</div>;
    
    expect(div).to.have.property('tagName', 'DIV');
    expect(div).to.have.property('innerHTML', 'Hello');
  });
});

describe('computed content', function() {
  it('supports symbols', () => {
    let div = <div>{Symbol('Hello')}</div>;
    
    expect(div).to.have.property('tagName', 'DIV');
    expect(div).to.have.property('innerHTML', 'Symbol(Hello)');
  });
});

describe('async support for WebComponents', function() {
  it('simple WebComponent', async function() {
    this.timeout(30000);
    let prom = <add-knot>Hello</add-knot>;
    expect(prom).to.be.an.instanceof(Promise);

    let editor = await prom;
    expect(editor).to.have.property('tagName', 'ADD-KNOT');
    expect(editor).to.have.property('innerHTML', 'Hello');
    expect(editor.afterSubmit).to.be.a('function');
  });
  it('nested WebComponent', async function() {
    this.timeout(30000);
    let prom = <div><add-knot>Hello</add-knot></div>;
    expect(prom).to.be.an.instanceof(Promise);

    let div = await prom;
    expect(div).to.have.property('tagName', 'DIV');
    let addKnot = div.querySelector('add-knot');
    expect(addKnot).to.have.property('innerHTML', 'Hello');
    expect(addKnot.afterSubmit).to.be.a('function');
  });
  it('dealing with object that are not convertible to primitives (which createTextNode does)', async function() {
    this.timeout(30000);
    const div = <div>{Object.create(null)}</div>;
    expect(div).to.have.property('tagName', 'DIV');
    expect(div).to.have.property('innerHTML', '[object Object]');
  });
  xit('support CodeMirror', async function() {
    this.timeout(30000);
    let prom = <lively-code-mirror>Hello</lively-code-mirror>;
    expect(prom).to.be.an.instanceof(Promise);

    let editor = await prom;
    expect(editor).to.have.property('tagName', 'LIVELY-CODE-MIRROR');
    expect(editor.editor.getValue()).to.equal('Hello');
  });
});
