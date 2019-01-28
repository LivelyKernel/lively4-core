import PropertyView from 'src/client/stroboscope/propertyview.js';

export default class ObjectView
{
  constructor(event){
    this.id = event.object_id;
    this.propertyMap = new Map();
    this.append(event);
  }
  
  append(event){
    if(event.property in this.propertyMap){
      this.propertyMap[event.property].handleEvent(event);
    }
    else
    {
      this.propertyMap[event.property] = new PropertyView(event);
    }
  }
  
  propertyCount()
  {
    return 5
  }
}