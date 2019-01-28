export default class ValueView
{
  constructor(event){
    this.property_type = event.property_type;
    this.endTime = undefined;
    this.changes = [];  // init emtpy
    this.changeValue(event);   // push 1st element
  }
  
  // push a change to array of changes
  changeValue(event) {
    this.changes.push( [event.timestamp, event.value] );
  }
  
  // push special change to indicate end of this ValueView
  endThisView(event) {
    this.endTime = event.timestamp;
  }

  isCompleted() {
    return (this.endTime !== undefined);
  }
}