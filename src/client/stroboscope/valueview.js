export default class ValueView
{
  constructor(event){
    this.type = event.property_type;
    this.lastValue = undefined
    this.startTime = event.timestamp;
    this.endTime = undefined;
    this.changes = [];  
    this.changeValue(event);
  }
  
  changeValue(event) {
    this.lastValue = event.value
    this.changes.push( [event.timestamp, event.value] );
  }
  
  close(event) {
    this.endTime = event.timestamp;
  }

  isCompleted() {
    return (this.endTime !== undefined);
  }
}