import { expect } from 'src/external/chai.js';
import PropertyView from 'src/client/stroboscope/propertyview.js';
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';

describe('property view logic', () => {
  it('construct and initialize property view from event', () => {
    var event = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)

    var propertyView = new PropertyView(event);
    
    expect(propertyView.valueViews.length).to.equal(1);
    expect(propertyView.valueViews[0].type).to.equal(event.property_type);
    expect(propertyView.valueViews[0].endTime).to.equal(undefined);
  });

  
  it('recieve change value event', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "solution", "number", "change", 2)
    
    var propertyView = new PropertyView(event1)
    propertyView.handleEvent(event2)
    
    expect(propertyView.valueViews.length).to.equal(1)
    var view = propertyView.valueViews[0]
    expect(view.type).to.equal(event1.property_type);
    expect(view.endTime).to.equal(undefined);
  });
  
  it('recieve delete event', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "solution", "number", "change", 2)
    var event3 = new StroboscopeEvent(1, "Test", "solution", "number", "delete", undefined)
    
    var propertyView = new PropertyView(event1)
    propertyView.handleEvent(event2)
    propertyView.handleEvent(event3)
    
    expect(propertyView.valueViews.length).to.equal(1)
    var view = propertyView.valueViews[0]
    expect(view.type).to.equal(event1.property_type);
    expect(view.endTime).to.not.equal(undefined);
  });
  
  it('recieve change type event', () => {
    var event1 = new StroboscopeEvent(1, "Test", "solution", "number", "create", 1)
    var event2 = new StroboscopeEvent(1, "Test", "solution", "string", "change", 2)
    
    var propertyView = new PropertyView(event1)
    propertyView.handleEvent(event2)
    
    expect(propertyView.valueViews.length).to.equal(2)
    var view1 = propertyView.valueViews[0]
    expect(view1.type).to.equal(event1.property_type);
    
    var view2 = propertyView.valueViews[0]
    expect(view2.type).to.equal(event1.property_type);
    expect(view2.endTime).to.not.equal(undefined);
  });
    
});
