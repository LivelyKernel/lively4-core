import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';
import { toValueString } from 'src/client/reactive/components/basic/aexpr-debugging-utils.js';
import { pluralize } from 'utils'

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
  LAYERCREATED: "layer created",
  //CUSTON
  CUSTOM: "custom mark",
}

function fileNameString(file) {
  return file.substring(file.lastIndexOf('/') + 1);
}

function humanizePosition(file, line) {
  return <div>in <span style="color:#0000FF">{fileNameString(file)}</span> line <span style="color:#0000FF">{line}</span></div>;
}

export default class Event {
  constructor(ae, value, type, overrideTimestamp = undefined) {
    this.timestamp = overrideTimestamp || new Date();
    this.overallID = eventCounter;
    eventCounter++;
        
    this.type = type;
    this.valuePromise = Promise.resolve(value).then(resolvedValue => {
      this.value = resolvedValue;
    });
    this.setAE(ae);
  }
  
  setAE(ae) {
    if(!ae) return;
    const eventIDInAE = ae.addEvent(this);
    
    this.id = ae.meta().get('id') + "-" + eventIDInAE;
    this.ae = ae;
    
    this.valuePromise.then(() => {
      AExprRegistry.eventListeners().forEach(listener => listener.callback(this.ae, this));
    });
  }
  
  async ensureResolved() {
    await this.valuePromise;
    return this;
  }
  
  typeName() {
    if(this.ae.isILA() && this.type === EventTypes.CHANGED) {
      return this.value && this.value.value ? "layer enabled" : "layer disabled"
    }
    return this.type;
  }
  
  getColor() {
    switch(this.type) {
      case EventTypes.CREATED:
        return 'green';
      case EventTypes.LAYERCREATED:
        return 'lightgreen';
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
      case EventTypes.CUSTOM:
        return 'gray';
      default:
        return 'black';
    }
  }
  
  valueString(value) {
    if (value === undefined) {
      if (this.value === undefined) {
        value = undefined
      } else {
        value = this.value.value
      }
    }
    if(this.ae.isILA()) return value ? "on" : "off";
    return toValueString(value);
  }
  
  extractLayererdFunctions() {
    if(this.ae.isILA()) {
      const result = new Map();
      for(const event of this.ae.events) {
        if(event === this) break;
        if(event.type === EventTypes.REFINE) {
          const functionMap = result.getOrCreate(event.value.obj, () => new Map());
          Object.keys(event.value.functions).forEach(key => {
            functionMap.set(key, {function: event.value.functions[key], debugInfo: event.value.debugInfo[key]});
            
          })
        } else if(event.type === EventTypes.UNREFINE) {
          result.set(event.value.obj, new Map());
        }
      }
      //const layer = this.ae.getLayer();
      return result;
    }
    return undefined;
  }
  
  layeredFunctionsString() {
    const layeredFunctions = this.extractLayererdFunctions();
    if(!layeredFunctions) return "";
    return <div><span style="color:#AA00AA">{pluralize([...layeredFunctions.values()].reduce((p, c) => p += c.size, 0), "active method")}</span> in <span style="color:#AA00AA">{pluralize(layeredFunctions.size, "object")}</span><br/></div>
  }
  
  async humanizedData() {
    switch (this.type) {
      case EventTypes.CHANGED:
        return <div>
          {... this.value.triggers.map(({ location }) => humanizePosition(location.file, location.start.line))} 
          <br /> 
          <span style="color:#00AAAA">{this.valueString(this.value.lastValue)}</span> → <span style="color:#00AAAA">{this.valueString(this.value && this.value.value)}</span>
          <br /> 
          {this.layeredFunctionsString()}
          {this.value.triggers[0].hook.informationString()}
        </div>;
      //Todo: Join trigger hook informationString
      case EventTypes.EVALFAIL:
        return <div>
          {this.value.triggers ? this.value.triggers.map(({ location }) => humanizePosition(location.file, location.start.line)) : ""} 
          <br /> 
          {this.value.error.name + ": " + this.value.error.message}
        </div>;
      case EventTypes.CREATED:
        {
          const ae = this.ae;
          /*const stack = this.value.stack;
          const locations = await Promise.all(stack.frames.map(frame => frame.getSourceLoc()));
          return locations.map(location => this.humanizePosition(location.source, location.line));*/
          const location = ae.meta().get("location");
          return <div>
            <span style="color:#00AAAA">{this.valueString(this.value.lastValue)}</span>
            {this.layeredFunctionsString()}
            {humanizePosition(location.file, location.start.line)}
          </div>
        }
      case EventTypes.DISPOSED:
        {
          const ae = this.value;
          const location = ae.meta().get("location");
          return humanizePosition(location.file, location.start.line);
        }
      case EventTypes.DEPCHANGED:
        {
          return <div>
              Added: {this.value.added.length}
              Removed: {this.value.removed.length}
              Matching: {this.value.matching.length}
            </div>;
        }
      case EventTypes.CBADDED:
      case EventTypes.CBREMOVED:
      case EventTypes.REFINE:
      case EventTypes.UNREFINE:
      case EventTypes.LAYERCREATED:
      case EventTypes.CUSTOM:
      default:
        return (this.value || "").toString();
    }
  }
  
  

}