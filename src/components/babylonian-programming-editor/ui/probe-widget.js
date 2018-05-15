import Widget from "./widget.js";
import DeleteButton from "./delete-button.js";
import { defaultExample } from "../utils/defaults.js";

const MAX_VALUESTRING_LENGTH = 100;


export default class ProbeWidget extends Widget {
  constructor(editor, location, kind, examples, deleteCallback) {
    super(editor, location, kind, deleteCallback);
    this._examples = examples; // [{id, name, color}]
    this._values = new Map(); // Map(exampleId, Map(runId, [{type, value}]))
    this._activeRuns = new Map(); // exampleId -> runId
  }
  
  set values(values) {
    this._values = values;
    this._update();
  }

  setActiveRunForExampleId(exampleId, activeRun) {
    this._activeRuns.set(exampleId, activeRun);
    this._update();
  }
  
  unsetActiveRunForExample(exampleId) {
    this._activeRuns.delete(exampleId);
    this._update();
  }

  _update() {
    // Gets a string representaion for a single run
    const stringForRun = (run) => {
      // run: [{type, value}]
      if(run[0].value instanceof Array) {
        // We have an array
        if(run.length > 1) {
          let combinedArray = run[0].value.map(e => [e, undefined]);
          for(let i in run[1].value) {
            if(i < combinedArray.length) {
              combinedArray[i][1] = run[1].value[i];
            } else {
              combinedArray.push([undefined, run[1].value[i]]);
            }
          }
          return `[${combinedArray.map(e => e[0] == e[1] ? `${e[0]}` : `${e[0]} → ${e[1]}`).join(", ")}]`;
        } else {
          return `[${run[0].value.join(", ")}]`;
        }
      } else if(run[0].value instanceof Object) {
        // We have to print the key-value pairs
        // Combine all properties (before and after)
        const combinedObj = {}; // {key: [oldValue, newValue]}
        for(let key in run[0].value) {
          combinedObj[key] = [run[0].value[key], undefined];
        }
        for(let key in run[run.length-1].value) {
          if(combinedObj[key] instanceof Array) {
            combinedObj[key][1] = run[run.length-1].value[key];
          } else {
            combinedObj[key] = [undefined, run[run.length-1].value[key]];
          }
        }
        const propStrings = [];
        for(let key in combinedObj) {
          if(key === "__tracker_identity") {
            continue;
          }
          if(combinedObj[key][0] === combinedObj[key][run.length-1]) {
            propStrings.push(`  ${key}: ${run[0].value[key]}`);
          } else {
            propStrings.push(`  ${key}: ${run[0].value[key]} → ${run[run.length-1].value[key]}`);
          }
        }
        
        // Check the identity
        let identityString;
        if(combinedObj.__tracker_identity[0] === combinedObj.__tracker_identity[1]) {
          identityString = combinedObj.__tracker_identity[0];
        } else {
          identityString = `${combinedObj.__tracker_identity[0]} → ${combinedObj.__tracker_identity[1]}`;
        }
        
        return `${identityString}:{\n${propStrings.join("\n")}\n}`;
      } else {
        // We can just print the value
        if(run.length < 2 || run[0].value === run[run.length-1].value) {
           return `${run[0].value}`;
        } else {
          return `${run[0].value} → ${run[run.length-1].value}`;
        }
      }
    }
    
    // Gets a string representation for a single example
    const elementForExample = (example, index) => {
      // example: {id, name, color}
      let valueString = "";
      const runs = this._values.get(example.id); // Map(runId, {type, value})
      
      if(this._activeRuns.has(example.id)
         && this._activeRuns.get(example.id) !== -1) {
        valueString = stringForRun(runs.get(this._activeRuns.get(example.id)));
      } else {
        valueString= Array.from(runs.values())
                          .map(stringForRun)
                          .join(" | ");
        if(valueString.length > MAX_VALUESTRING_LENGTH) {
          valueString = valueString.substring(0, MAX_VALUESTRING_LENGTH) + "...";
        }
      }
      
      // Show a delete button for the first element, and just a space for all others
      let leftSpace = <span>&nbsp;</span>;
      if(index === 0) {
        leftSpace = DeleteButton(this._deleteCallback);
      }
      
      return <span class="widget-line">
        {leftSpace}
        <span
          class="example-name"
          style={"background-color:" + example.color}>
          {example.name.length ? example.name : "\u00A0"}
        </span>
        &nbsp;
        <span class="probe-value">{valueString}</span>
      </span>
    }
    
    // Iterate over all examples and get their values
    this._element.innerHTML = "";
    let examples = Array.from(this._examples);
    if(this._values.has(defaultExample().id)) {
      examples.unshift(defaultExample());
    }
    
    const newChildren = examples.filter((e) => this._values.has(e.id))
                                .map(elementForExample);
    newChildren.forEach((e) => this._element.appendChild(e));
    
    // Hide if empty
    if(newChildren.length === 0) {
      this._element.style.display = "none";
    } else {
      this._element.style.display = "";
    }
  }
}
