import { expect } from 'src/external/chai.js';
import Stroboscope from 'src/client/stroboscope/stroboscope.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

describe('stroboscope create events', () => {

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
    stroboscope.slice();
    
    delete target.solution;
       
    var events = stroboscope.slice()
    expect(events.length).to.equal(1);
    var delete_event = events[0]
    expect(delete_event.event_type).to.equal(EventType.delete);
    expect(delete_event.property).to.equal("solution");
    expect(delete_event.value).to.equal(undefined);
    expect(delete_event.property_type).to.equal(undefined);
  });
  
  it('event for change property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events1 = stroboscope.slice();
    expect(events1.length).to.equal(1);
        
    target.solution = 21;
    
    var events2 = stroboscope.slice();
    expect(events2.length).to.equal(1);
    
    var create_event = events2[0]
    expect(create_event.event_type).to.equal(EventType.change);
    expect(create_event.property).to.equal("solution");
    expect(create_event.value).to.equal(21);
    expect(create_event.property_type).to.equal("number");
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

  it('event for property type number', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.slice();
    var event = events[0]
    expect(event.property_type).to.equal("number");
  });
  
  it('event for property type string', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = "What's the question?";
    var events = stroboscope.slice();
    var event = events[0]
    expect(event.property_type).to.equal("string");
  });  

  it('event for property type boolean', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = true;
    var events = stroboscope.slice();
    var event = events[0]
    expect(event.property_type).to.equal("boolean");
  }); 

  it('event for property type null', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = null; 
    var events = stroboscope.slice();
    var event = events[0]
    expect(event.property_type).to.equal("object");
  });
  
  it('event for property type undefined', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = undefined; 
    var events = stroboscope.slice();
    var event = events[0]
    expect(event.property_type).to.equal("undefined");
  });

  it('event for property type symbol', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = Symbol("id"); 
    var events = stroboscope.slice();
    var event = events[0]
    expect(event.property_type).to.equal("symbol");
  });

  it('event for property type function', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = function(){}; 
    var events = stroboscope.slice();
    var event = events[0]
    expect(event.property_type).to.equal("function");
  });
  
  it('event for property type object', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = {}; 
    var events = stroboscope.slice();
    var event = events[0]
    expect(event.property_type).to.equal("object");
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