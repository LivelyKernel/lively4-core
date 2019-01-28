import PropertyView from 'src/client/stroboscope/propertyview.js';

export default class ObjectView
{
  constructor(event){
    this.id = event.object_id;
    this.propertyMap = new Map();
    this.append(event);
  }
  
  append(event){
    if(this.propertyMap.has(event.property)){
      this.propertyMap.get(event.property).handleEvent(event);
    }
    else
    {
      this.propertyMap.set(event.property, new PropertyView(event));
    }
  }
  
  propertyCount()
  {
    return this.propertyMap.size
  }
  
  propertyViews() {
    return Array.from(this.propertyMap.values());
  }
}