import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Script from 'src/client/vivide/vividescript.js';
import ScriptStep from 'src/client/vivide/vividescriptstep.js';

import { times } from 'utils';

function someSteps() {
  return times.call(10, () => new ScriptStep());
}
function threePartScript() {
  const transform = new ScriptStep();
  const extract = new ScriptStep();
  const descent = new ScriptStep();

  transform.insertAfter(extract);
  extract.insertAfter(descent);

  const script = new Script();
  script.setInitialStep(transform);
  transform.setScript(script);
  extract.setScript(script);
  descent.setScript(script);

  return [script, transform, extract, descent];
}

// #TODO: does not yet detect changes to the iterator variable itself
describe('Vivide Scripts and ScriptSteps', function() {
  it('is defined', () => {
    expect(new Script()).to.be.ok;
    expect(new ScriptStep()).to.be.ok;
  });
  it('is defined', () => {
    expect(new Script()).to.be.ok;
    expect(new ScriptStep()).to.be.ok;
  });
  
  describe('properly build list of steps', function() {
    it('set on create', () => {
      const step = new ScriptStep();
      
      expect(step.getLastStep()).to.equal(step);
    });
    it('set insert after', () => {
      const [first, second] = someSteps();
      
      first.insertAfter(second);

      expect(first.getLastStep()).to.equal(second);
      expect(second.getLastStep()).to.equal(second);
    });
    it('set insert after (longer chain)', () => {
      const [first, second, third] = someSteps();
      
      first.insertAfter(second);
      second.insertAfter(third);

      expect(first.getLastStep()).to.equal(third);
      expect(second.getLastStep()).to.equal(third);
      expect(third.getLastStep()).to.equal(third);
    });
    it('set insert after (longer chain + reversed)', () => {
      const [first, second, third] = someSteps();
      
      second.insertAfter(third);
      first.insertAfter(second);

      expect(first.getLastStep()).to.equal(second);
      expect(second.getLastStep()).to.equal(second);
    });
  });
  describe('remove steps from script', () => {
    it('remove first', () => {
      const [script, first, second, third] = threePartScript();
      
      script.removeStep(first);
      
      expect(script.getInitialStep()).to.equal(second);
    });
    it('remove second', () => {
      const [script, first, second, third] = threePartScript();

      script.removeStep(second);
      
      expect(script.getInitialStep()).to.equal(first);
    });
    it('remove last', () => {
      const [script, first, second, third] = threePartScript();

      script.removeStep(third);
      
      expect(script.getInitialStep()).to.equal(first);
    });
    it('loops work at all', () => {
      const [script, first, second, third] = threePartScript();
      
      script.setLoopStart(first);
      expect(script.getLoopStartStep()).to.equal(first);
      
      script.setLoopStart(third);
      expect(script.getLoopStartStep()).to.equal(third);
      
      script.removeLoop();
      expect(script.getLoopStartStep()).to.be.undefined;
      
      script.setLoopStart(second);
      expect(script.getLoopStartStep()).to.equal(second);
      
      // insert a step at the end
      const forth = new ScriptStep();
      script.getLastStep().insertAfter(forth);
      expect(script.getLoopStartStep()).to.equal(second);
    });
    it('remove first as loopstart', () => {
      const [script, first, second, third] = threePartScript();
      
      script.setLoopStart(first);
      script.removeStep(first);
      
      expect(script.getInitialStep()).to.equal(second);
      expect(script.getLoopStartStep()).to.be.undefined;
    });
    it('remove second as loopstart', () => {
      const [script, first, second, third] = threePartScript();
      
      script.setLoopStart(second);
      script.removeStep(second);
      
      expect(script.getInitialStep()).to.equal(first);
      expect(script.getLoopStartStep()).to.be.undefined;
    });
    it('remove third as loopstart', () => {
      const [script, first, second, third] = threePartScript();
      
      script.setLoopStart(third);
      script.removeStep(third);
      
      expect(script.getInitialStep()).to.equal(first);
      expect(script.getLoopStartStep()).to.be.undefined;
    });
    it('remove the loopstart referrer', () => {
      const [script, first, second, third] = threePartScript();
      
      script.setLoopStart(first);
      script.removeStep(third);
      
      expect(script.getLastStep()).to.equal(second);
      expect(script.getLoopStartStep()).to.equal(first);
    });
  })
  describe('get next computational step', function() {
    it('insertAfter', () => {
      const [first, second, third] = someSteps();

      first.insertAfter(second);
      second.insertAfter(third);
      
      expect(first.getNextExecutionStep()).to.equal(second);
      expect(second.getNextExecutionStep()).to.equal(third);
    });

    it('insertAfter (reversed)', () => {
      const [first, second, third] = someSteps();

      second.insertAfter(third);
      first.insertAfter(second);
      
      expect(first.getNextExecutionStep()).to.equal(second);
      // #TODO: remove null
      expect(second.getNextExecutionStep()).to.be.undefined;
    });
  });
  describe('Script', function() {
    describe('removeFirstStep', function() {
      xit('remove first step that is also the loop start')
    });
  });
  describe('iterate', function() {
    it('synchronous', function() {
      const [first, second, third, forth] = someSteps();
      first.insertAfter(second);
      second.insertAfter(third);
      
      const spy = sinon.spy();
      
      first.iterateLinear(spy);
      
      expect(spy).to.be.calledTrice;
      expect(spy).to.be.calledWith(first);
      expect(spy).to.be.calledWith(second);
      expect(spy).to.be.calledWith(third);
      expect(spy).not.to.be.calledWith(forth);
    });
    it('asynchronous', async function() {
      const [first, second, third, forth] = someSteps();
      first.insertAfter(second);
      second.insertAfter(third);
      
      const spy = sinon.spy();
      
      await first.iterateLinearAsync(async (...args) => await spy(...args));
      
      expect(spy).to.be.calledTrice;
      expect(spy).to.be.calledWith(first);
      expect(spy).to.be.calledWith(second);
      expect(spy).to.be.calledWith(third);
      expect(spy).not.to.be.calledWith(forth);
    });
  });
});
