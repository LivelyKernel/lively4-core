import { expect } from 'src/external/chai.js';
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';

describe('stroboscope event object id', () => {

  it('object id for undefined', () => {
    var event = new StroboscopeEvent(undefined)
    expect(event.object_id).to.equal(undefined);
  });

  it('obejct id for an object', () => {
    var a = {}

    var event = new StroboscopeEvent(a)
    expect(event.object_id).to.not.equal(undefined);
  });

  it('object id for multiple events', () => {
    var a = {}

    var event_1 = new StroboscopeEvent(a)
    var event_2 = new StroboscopeEvent(a)

    expect(event_1.object_id).to.equal(event_2.object_id);
  });

  it('object id for multiple objects', () => {
    var a = {}
    var b = {}

    var event_1 = new StroboscopeEvent(a)
    var event_2 = new StroboscopeEvent(b)

    expect(event_1.object_id).to.not.equal(event_2.object_id);
  });
});

describe('stroboscope event id', () => {
  it('event id is unique', () => {
    var event_1 = new StroboscopeEvent(undefined)
    var event_2 = new StroboscopeEvent(undefined)

    expect(event_1.id).to.not.equal(event_2.id);
  });

  it('event id is defined', () => {
    var event = new StroboscopeEvent(undefined)
    expect(event.id).to.not.equal(undefined);
  });
});

describe('stroboscope timestamp', () => {
  it('timestamp is defined', () => {
    var event = new StroboscopeEvent(undefined)
    expect(event.timestamp).to.not.equal(undefined);
  });
});