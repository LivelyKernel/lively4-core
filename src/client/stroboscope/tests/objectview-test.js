import { expect } from 'src/external/chai.js';
import ObjectView from 'src/client/stroboscope/objectview.js';
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';

describe('object view logic', () => {
  it('initialize', () => {
    var event = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)

    var view = new ObjectView(event)

    expect(view.id).to.equal(event.object_id);
    expect(view.propertyCount()).to.equal(1)
  });


  it('append event to entry on existing property', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "solution", "number", "delete", undefined)

    var view = new ObjectView(event1)
    view.append(event2)

    expect(view.propertyCount()).to.equal(1)
  });

  it('return correct property count', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "answer", "string", "create", "There it is.")

    var view = new ObjectView(event1)
    expect(view.propertyCount()).to.equal(1)

    view.append(event2)
    expect(view.propertyCount()).to.equal(2)
  });
});
