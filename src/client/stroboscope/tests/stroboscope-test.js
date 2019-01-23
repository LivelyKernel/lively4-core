import { expect } from 'src/external/chai.js';
import Stroboscope from 'src/client/stroboscope/stroboscope.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

describe('stroboscope slice', () => {

  it('events for undefined', () => {
    var target = undefined
    var stroboscope = new Stroboscope(target)
    
    expect(stroboscope.slice()).to.deep.equal([]);
  });

  it('event for create property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.slice();
    expect(events.length).to.equal(1);
    
    var create_event = events[0]
    expect(create_event.event_type).to.equal(EventType.create);
    expect(create_event.property).to.equal("solution");
    expect(create_event.value).to.equal(42);
    expect(create_event.property_type).to.equal("number");
  });

  it('event for delete property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.slice();
    
    delete target.solution;
       
    expect(events.length).to.equal(1);
    var delete_event = events[0]
    expect(delete_event.event_type).to.equal(EventType.delete);
    expect(delete_event.property).to.equal("solution");
    expect(delete_event.value).to.equal(undefined);
    expect(delete_event.property_type).to.equal(undefined);
  });
  
  it('event for update property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.slice();
    expect(events.length).to.equal(1);
        
    target.solution = 42;
    
    var create_event = events[0]
    expect(create_event.event_type).to.equal(EventType.create);
    expect(create_event.property).to.equal("solution");
    expect(create_event.value).to.equal(undefined);
    expect(create_event.property_type).to.equal(undefined);
  });
   
  it('no event for already seen property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.slice();
    expect(events.length).to.equal(1);
    
    events = stroboscope.slice();
    expect(events.length).to.equal(0);
  });
 
  it('events for multiple property changes', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.question = "What's the answer?"
    target.solution = 42;
    var events = stroboscope.slice();
          
    expect(events.length).to.equal(2); 
  });
  
  it('event trigger is stroboscope', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.slice();
    expect(events[0].trigger).to.equal("Stroboscope");
  });
})