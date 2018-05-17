'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Annotations from 'src/client/reactive/active-expressions/active-expressions/src/annotations.js';

describe('Annotations (AExprs/Vivide)', () => {
  it("Annotations exists", () => {
    expect(Annotations).to.be.defined;
    
  });

  it("supports add and has methods", () => {
    expect(Annotations).to.respondTo('add');
    expect(Annotations).to.respondTo('has');
    expect(Annotations).to.respondTo('keys');
    expect(Annotations).to.respondTo('get');
    expect(Annotations).to.respondTo('getAll');
  });

  it("adds annotations", () => {
    const ann = new Annotations();
    expect(ann.has('value')).to.be.false;

    ann.add({ value: 42 });
    
    expect(ann.has('value')).to.be.true;
    expect(ann.has('prop')).to.be.false;

    ann.add({ prop: 17, attribute: 33 });

    expect(ann.has('value')).to.be.true;
    expect(ann.has('prop')).to.be.true;
    expect(ann.has('attribute')).to.be.true;
    expect(ann.has('non-existent')).to.be.false;
  });

  it("keys properties", () => {
    const ann = new Annotations();
    expect(ann.keys()).to.eql([]);

    ann.add({ value: 42 });
    expect(ann.keys()).to.eql(['value']);

    ann.add({ prop: 17, attribute: 33 });
    expect(ann.keys()).to.eql(['value', 'prop', 'attribute']);
  });

  it("gets properties", () => {
    const ann = new Annotations();
    expect(ann.get('value')).to.be.undefined;

    ann.add({ value: 42 });
    expect(ann.get('value')).to.equal(42);

    ann.add({ value: 17, prop: 33 });
    expect([42, 17]).to.include(ann.get('value'));
    expect(ann.get('prop')).to.equal(33);
  });

  it("getAll properties", () => {
    const ann = new Annotations();
    expect(ann.getAll('value')).to.eql([]);

    ann.add({ value: 42 });
    expect(ann.getAll('value')).to.eql([42]);

    ann.add({ value: 17, prop: 33 });
    expect(ann.getAll('value')).to.eql([42, 17]);
    expect(ann.getAll('prop')).to.eql([33]);
  });
});
