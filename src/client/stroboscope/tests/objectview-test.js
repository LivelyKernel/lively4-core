import { expect } from 'src/external/chai.js';
import ObjectView from 'src/client/stroboscope/objectview.js';
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';

describe('object view logic', () => {
  it('construct and initialize map from event', () => {
    var event = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)

    var view = new ObjectView(event)
    
    expect(view.id).to.equal(event.object_id);
    expect(view.propertiesEventsMap[event.property].length).to.equal(1)
    expect(view.propertiesEventsMap[event.property][0]).to.equal(event)
  });

  it('create entry on new property', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "question", "string", "create", "Does it work?")
    
    var view = new ObjectView(event)
    view.append(event2)
    
    expect(view.id).to.equal(event.object_id);
    expect(view.propertiesEventsMap[event1.property]).to.equal(1)
    expect(view.propertiesEventsMap[event1.property][0]).to.equal(event1)
    expect(view.propertiesEventsMap[event2.property]).to.equal(1)
    expect(view.propertiesEventsMap[event2.property][0]).to.equal(event2)
  });
  
  it('append event to entry on existing property', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "solution", "number", "delete", undefined)

    var view = new ObjectView(event)
    
    expect(view.propertiesEventsMap[event.property]).to.equal(2)
    expect(view.propertiesEventsMap[event.property][0]).to.equal(event1)
    expect(view.propertiesEventsMap[event.property][1]).to.equal(event2)
  });
});
