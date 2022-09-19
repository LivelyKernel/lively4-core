import chai, { expect } from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import { uuid } from 'utils';

describe('Clipboard', function () {

  let existingElement1;
  let existingElement2;

  beforeEach(() => {
    existingElement1 = <div data-lively-id={'id' + uuid()}></div>;
    existingElement2 = <div data-lively-id={'id' + uuid()}></div>;
    document.body.append(existingElement1, existingElement2);
  });

  afterEach(() => {
    existingElement1.remove();
    existingElement2.remove();
  });

  it('`initializeElements` does not introduce unnessecary ids', () => {
    const div = <div></div>;

    const newElements = [div];
    lively.clipboard.initializeElements(newElements);

    expect(div.hasAttribute('data-lively-id')).to.be.false;
  });

  it('`initializeElements` prevents duplicate ids', () => {
    const div = <div data-lively-id={existingElement1.dataset.livelyId}></div>;

    const newElements = [div];
    lively.clipboard.initializeElements(newElements);

    expect(div.dataset.livelyId).to.not.equal(existingElement1.dataset.livelyId);
  });

  it('`initializeElements` prevents multiple duplicate ids', () => {
    const div = <div data-lively-id={existingElement1.dataset.livelyId}></div>;
    const div2 = <div data-lively-id={existingElement2.dataset.livelyId}></div>;

    const newElements = [div, div2];
    lively.clipboard.initializeElements(newElements);

    expect(div.dataset.livelyId).to.not.equal(existingElement1.dataset.livelyId);
    expect(div2.dataset.livelyId).to.not.equal(existingElement2.dataset.livelyId);
    expect(div.dataset.livelyId).to.not.equal(div2.dataset.livelyId);
  });

  it('SPEEDY', () => {
    const newElements = 10 .times(() => <div data-lively-id={uuid()}></div>);
    lively.clipboard.initializeElements(newElements);
  });

  it('`initializeElements` rewrites duplicate ids', () => {
    const existId = existingElement1.dataset.livelyId;

    const div = <div data-lively-id={existId}></div>;
    const div2 = <div an-attibute={existId}></div>;

    const newElements = [div, div2];
    lively.clipboard.initializeElements(newElements);

    expect(div.dataset.livelyId).to.not.equal(existingElement1.dataset.livelyId);
    expect(div.dataset.livelyId).to.equal(div2.getAttribute('an-attibute'));
  });

  it('`initializeElements` handles ids hidden within attributes', () => {
    const existId = existingElement1.dataset.livelyId;

    const div = <div data-lively-id={existId}></div>;
    const complexAttr = existId + ' and ' + existId;
    const div2 = <div an-attibute={complexAttr}></div>;

    const newElements = [div, div2];
    lively.clipboard.initializeElements(newElements);

    expect(div.dataset.livelyId).to.not.equal(existingElement1.dataset.livelyId);
    expect(div2.getAttribute('an-attibute')).to.equal(div.dataset.livelyId + ' and ' + div.dataset.livelyId);
  });

  it('`initializeElements` returns mapped ids', () => {
    const existId = existingElement1.dataset.livelyId;
    const newId = 'id' + uuid();

    const div = <div data-lively-id={existId}></div>;
    const div2 = <div data-lively-id={newId}></div>;

    const newElements = [div, div2];
    const idMap = lively.clipboard.initializeElements(newElements);

    expect(idMap).to.be.an.instanceof(Map);
    expect(idMap.has(existId)).to.be.true;
    expect(idMap.get(existId)).to.equal(div.dataset.livelyId);
    expect(idMap.has(newId)).to.be.false;
  });
});