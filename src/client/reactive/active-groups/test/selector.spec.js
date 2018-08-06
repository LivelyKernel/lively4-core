"enable aexpr";

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import select from 'roq';

import { wait } from 'utils';

describe("select('css selector')", async () => {
  it("contains an existing div", async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    
    const sel = select('div');
    
    await wait(250);
    expect(sel.now()).to.include(div);
    
    div.remove();
  });
  it("existing div recognized by two selections", async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    
    const sel1 = select('div');
    const sel2 = select('div');
    
    await wait(250);
    expect(sel1.now()).to.include(div);
    expect(sel2.now()).to.include(div);
    
    div.remove();
  });
  it("recognizes a div later matching the selector", async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    
    const sel = select('div#my-test-div');
    await wait(250);
    expect(sel.now()).not.to.include(div);

    div.id = 'my-test-div';
    await wait(250);
    expect(sel.now()).to.include(div);
    
    div.remove();
  });
  it("recognizes a newly added div", async () => {
    const sel = select('div');
    
    const div = document.createElement('div');
    document.body.appendChild(div);
    
    await wait(250);
    expect(sel.now()).to.include(div);
    
    div.remove();
  });
  it("recognizes a removed div", async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    
    const sel = select('div');
    await wait(250);

    div.remove();

    await wait(250);
    lively.success(sel.now().length)
    expect(sel.now()).not.to.include(div);
  });
  it("recognizes a div no longer matching the selector", async () => {
    const div = document.createElement('div');
    div.id = 'my-test-div';
    document.body.appendChild(div);
    
    const sel = select('div#my-test-div');
    await wait(250);

    div.id = 'another id';

    await wait(250);
    lively.success(sel.now().length);
    expect(sel.now()).not.to.include(div);
    
    div.remove();
  });
});
