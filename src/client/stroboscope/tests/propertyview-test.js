import { expect } from 'src/external/chai.js';
import PropertyView from 'src/client/stroboscope/propertyview.js';
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

describe('property view logic', () => {
  it('construct and initialize property view from event', () => {
    var event = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)

    var p_view = new PropertyView(event);
    
    expect(p_view.id).to.equal(event.object_id);
    expect(p_view.valueViews.length).to.equal(1);
    expect(p_view.valueViews[0].property_type).to.equal(event.property_type);
    expect(p_view.valueViews[0].endTime).to.equal(undefined);
    
  });

  
  it('create entry on new property', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "question", "string", "create", "Does it work?")
    
    var p_view = new PropertyView(event1)
    p_view.handleEvent(event2)
    
    expect(p_view.valueViews.length).to.equal(2)
    expect(p_view.valueViews[0].property_type).to.equal(event1.property_type);
    expect(p_view.valueViews[0].endTime).to.equal(undefined);
    expect(p_view.valueViews[1].property_type).to.equal(event2.property_type);
    expect(p_view.valueViews[1].endTime).to.equal(undefined);
    //expect(p_view.valueViews[event2.property][0]).to.equal(event2)
  });
  
  /*
  it('append event to entry on existing property', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "solution", "number", "delete", undefined)

    var view = new ObjectView(event1)
    view.append(event2)
    
    expect(view.propertyiesMap[event1.property].length).to.equal(2)
    expect(view.propertyiesMap[event1.property][0]).to.equal(event1)
    expect(view.propertyiesMap[event1.property][1]).to.equal(event2)
  });
  
    it('return correct property count', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "solution", "number", "delete", undefined)

    var view = new ObjectView(event1)
    expect(view.propertyCount()).to.equal(1)
    
    view.append(event2)
    expect(view.propertyCount()).to.equal(2)
    });
    */
});
