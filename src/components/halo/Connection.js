"enable aexpr";
import {pt} from 'src/client/graphics.js';

export default class Connection {
  constructor(target, targetProperty, source, sourceProperty, isEvent) {
    this.target = target;
    this.targetProperty = targetProperty;
    this.source = source;
    this.sourceProperty = sourceProperty;
    this.isEvent = isEvent;
  }
  
  activateConnection(){
    if(this.isEvent){
      this.activateEventConnection()
    }
    else {
      this.activateAexprConnection()
    }    
  }
  
  activateEventConnection(){
    this.source.addEventListener('click', event => this.target.style.width = this.target.style.width*2+"pt")
  }
  
  activateAexprConnection(){
    let ae = aexpr(() => this.source[this.sourceProperty]);
    ae.onChange(svalue => this.target.style[this.targetProperty]= svalue + "pt");
  }
  
  drawConnectionLine(){
    //TODO make work
    let line = [this.source.style.position, this.target.style.position];
    lively.showPath(line, "rgba(80,180,80,1)", true);
  }
}