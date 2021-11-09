import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';
import { toValueString } from 'src/client/reactive/components/basic/aexpr-debugging-utils.js';

let eventCounter = 0;

export const EventTypes = {
  //AE
  CREATED: "created",
  DISPOSED: "disposed",
  CHANGED: "changed value",
  EVALFAIL: "evaluation failed",
  CBADDED: "callback added",
  CBREMOVED: "callback removed",
  DEPCHANGED: "dependencies changed",
  //ILA
  REFINE: "refine function",
  UNREFINE: "unrefine function",
}

function fileNameString(file) {
  return file.substring(file.lastIndexOf('/') + 1);
}

function humanizePosition(file, line) {
  return <div>in <span style="color:#0000FF">{fileNameString(file)}</span> line <span style="color:#0000FF">{line}</span></div>;
}

export default class Event {
  constructor(ae, value, type) {
    const events = ae.events;
    events.push(this);
    if (events.length > 5000) events.shift();
    
    this.timestamp = new Date();
    this.overallID = eventCounter;
    this.id = ae.meta().get('id') + "-" + events.length
    this.ae = ae;
    this.type = type;
    eventCounter++;
    this.valuePromise = Promise.resolve(value).then(resolvedValue => {
      AExprRegistry.eventListeners().forEach(listener => listener.callback(ae, this));
      this.value = resolvedValue;
    });
  }
  
  async ensureResolved() {
    await this.valuePromise;
    return this;
  }
  
  typeName() {
    if(this.ae.isILA() && this.type === EventTypes.CHANGED) {
      return this.value.value ? "layer enabled" : "layer disabled"
    }
    return this.type;
  }
  
  getColor() {
    switch(this.type) {
      case EventTypes.CREATED:
        return 'green';
      case EventTypes.DISPOSED:
      case EventTypes.EVALFAIL:
        return 'red';
      case EventTypes.CHANGED:
        return 'blue';
      case EventTypes.CBADDED:
      case EventTypes.REFINE:
        return 'yellow';
      case EventTypes.CBREMOVED:
      case EventTypes.UNREFINE:
        return 'purple';
      case EventTypes.DEPCHANGED:
        return 'orange';
      default:
        return 'black';
    }
  }
  
  valueString(value = this.value.value) {
    if(this.ae.isILA()) return value ? "on" : "off";
    return toValueString(value);
  }
  
  async humanizedData() {
    switch (this.type) {
      case 'changed value':
        return <div>
          {... this.value.triggers.map(({ location }) => humanizePosition(location.file, location.start.line))} 
          <br /> 
          <span style="color:#00AAAA">{this.valueString(this.value.lastValue)}</span> → <span style="color:#00AAAA">{this.valueString(this.value.value)}</span>
          <br /> 
          {this.value.triggers[0].hook.informationString()}
        </div>;
      //Todo: Join trigger hook informationString
      case 'evaluation failed':
        return <div>
          {this.value.triggers ? this.value.triggers.map(({ location }) => humanizePosition(location.file, location.start.line)) : ""} 
          <br /> 
          {this.value.error.name + ": " + this.value.error.message}
        </div>;
      case 'created':
        {
          const ae = this.ae;
          /*const stack = this.value.stack;
          const locations = await Promise.all(stack.frames.map(frame => frame.getSourceLoc()));
          return locations.map(location => this.humanizePosition(location.source, location.line));*/
          const location = ae.meta().get("location");
          return <div>
            <span style="color:#00AAAA">{this.valueString(this.value.lastValue)}</span>
            {humanizePosition(location.file, location.start.line)}
          </div>
        }
      case 'disposed':
        {
          const ae = this.value;
          const location = ae.meta().get("location");
          return humanizePosition(location.file, location.start.line);
        }
      case 'dependencies changed':
        {
          return <div>
              Added: {this.value.added.length}
              Removed: {this.value.removed.length}
              Matching: {this.value.matching.length}
            </div>;
        }
      case 'callbacks changed':
      default:
        return (this.value || "").toString();
    }
  }
  
  

}