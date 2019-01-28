export default class ValueView
{
  constructor(event){
    this.id = event.object_id
    this.append(event)
  }
  
}