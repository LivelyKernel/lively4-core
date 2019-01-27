export default class ObjectView
{
  constructor(event){
    this.id = event.object_id
    this.propertiesEventsMap = new Map();
    this.append(event)
  }
  
  append(event){
    if(event.property in this.propertiesEventsMap){
      this.propertiesEventsMap[event.property].push(event);
    }
    else
    {
      this.propertiesEventsMap[event.property] = [event];
    }
  }
}