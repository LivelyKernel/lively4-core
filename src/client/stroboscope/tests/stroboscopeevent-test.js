import { expect } from 'src/external/chai.js';
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';

describe('stroboscope event id', () => {
  it('event id is unique', () => {
    var event_1 = new StroboscopeEvent()
    var event_2 = new StroboscopeEvent()

    expect(event_1.id).to.not.equal(event_2.id);
  });

  it('event id is defined', () => {
    var event = new StroboscopeEvent()
    expect(event.id).to.not.equal(undefined);
  });
});

describe('stroboscope timestamp', () => {
  it('timestamp is defined', () => {
    var event = new StroboscopeEvent()
    expect(event.timestamp).to.not.equal(undefined);
  });
});