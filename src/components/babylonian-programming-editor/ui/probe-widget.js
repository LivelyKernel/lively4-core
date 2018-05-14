import Widget from "./widget.js";
import { defaultExample } from "../utils/defaults.js";

const MAX_VALUESTRING_LENGTH = 40;


export default class ProbeWidget extends Widget {
  constructor(editor, location, kind, examples) {
    super(editor, location, kind);
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
      if(run[0].value.__proto__
           && run[0].value.__proto__.constructor.name === "Object") {
        // We have to print the key-value pairs
        let combinedObj = {}; // {key: [oldValue, newValue]}
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
          if(combinedObj[key][0] === combinedObj[key][run.length-1]) {
            propStrings.push(`  ${key}: ${run[0].value[key]}`);
          } else {
            propStrings.push(`  ${key}: ${run[0].value[key]} → ${run[run.length-1].value[key]}`);
          }
        }
        return `{\n${propStrings.join("\n")}\n}`;
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
    const elementForExample = (example) => {
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
      
      return <span class="widget-line">
        ↘︎
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
    this._element.innerHTML = ""
    const newChildren = this._examples
                            .filter((e) => this._values.has(e.id))
                            .map(elementForExample);
    if(this._values.has(defaultExample().id)) {
      newChildren.push(elementForExample(defaultExample()));
    }
    newChildren.forEach((e) => this._element.appendChild(e));
    
    // Hide if empty
    if(newChildren.length === 0) {
      this._element.style.display = "none";
    } else {
      this._element.style.display = "";
    }
  }
}
