import PropertyMap from 'src/client/stroboscope/propertymap.js';

export default class ObjectView
{
  constructor(event){
    this.id = event.object_id
    this.propertiesEventsMap = new Map();
    this.propertiesMap = new PropertyMap();
    this.propertiesMap.handleEvent(event);
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