import { expect } from 'src/external/chai.js';
import Stroboscope from 'src/client/stroboscope/stroboscope.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

describe('stroboscope slice', () => {

  it('events for undefined', () => {
    var stroboscope = new Stroboscope(undefined)
    
    expect(stroboscope.slice()).to.deep.equal([]);
  });

  it('event for create property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.slice();
    expect(events.length).to.equal(1);
    expect(events[0].event_type).to.equal(EventType.create);
    expect(events[0].event_type).to.not.equal(undefined);

    
  });

  it('event trigger is stroboscope', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.slice();
    expect(events[0].trigger).to.equal("Stroboscope");
  });
})