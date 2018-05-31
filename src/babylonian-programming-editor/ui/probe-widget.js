import Widget from "./widget.js";
import { DeleteButton } from "./buttons.js";
import { defaultExample } from "../utils/defaults.js";

const MAX_VALUESTRING_LENGTH = 100;


export default class ProbeWidget extends Widget {
  constructor(editor, location, kind, examples, deleteCallback) {
    super(editor, location, kind, deleteCallback);
    this._examples = examples; // [{id, name, color}]
    this._values = new Map(); // Map(exampleId, Map(runId, [{type, value, name}]))
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
    const renderValue = (value) => {
      if(!value) {
        return null;
      } else if(value instanceof HTMLElement) {
        return value.outerHTML
      } else if(value.toString) {
        return value.toString();
      } else {
        return value;
      }
    }
    
    // Gets a string representaion for a single run
    const elementForRun = (run) => {
      // run: {before, after: {type, value, name}}
      if(run.after.value instanceof Array) {
        // We have an array
        if(run.before) {
          const combinedArray = run.before.value.map(e => [e, undefined]);
          for(let i in run.after.value) {
            if(i < combinedArray.length) {
              combinedArray[i][1] = run.after.value[i];
            } else {
              combinedArray.push([undefined, run.after.value[i]]);
            }
          }
          const arrayElement = <span class="run array"></span>;
          for(let entry of combinedArray) {
            if(entry[0] !== entry[1]) {
              arrayElement.appendChild(<span class="old-value space-after">{renderValue(entry[0])}</span>);
            }
            arrayElement.appendChild(<span class="new-value">{renderValue(entry[1])}</span>);
          }
          return arrayElement;
        } else {
          const arrayElement = <span class="run array"></span>;
          for(let entry of run.after.value) {
            arrayElement.appendChild(<span class="new-value">{renderValue(entry)}</span>);
          }
          return arrayElement;
        }
      } else if(run.after.value instanceof ImageData) {
        const imageData = run.after.value;
        const canvas = <canvas
                         class="run"
                         width={imageData.width}
                         height={imageData.height}
                         ></canvas>
        canvas.getContext("2d").putImageData(imageData, 0, 0);
        return canvas;
      } else if(run.after.value instanceof Object
                && !(run.after.value instanceof HTMLElement)) {
        // We have to print the key-value pairs
        let noBefore = false;
        if(!run.before) {
          run.before = {value: {}, type: undefined};
          noBefore = true;
        }
        
        // Combine all properties (before and after)
        // {key: [oldValue, newValue]}
        const combinedKeys = new Set()
        Object.keys(run.before.value).forEach(key => combinedKeys.add(key));
        Object.keys(run.after.value).forEach(key => combinedKeys.add(key));

        const combinedObj = Array.from(combinedKeys)
                                 .reduce((acc, key) => {
                                   acc[key] = [run.before.value[key], run.after.value[key]];
                                   return acc;
                                 }, {});
          
        const propElement = <span class="properties"></span>;
        for(let key in combinedObj) {
          if(key === "__tracker_identity") {
            continue;
          }
          if(combinedObj[key][0] === combinedObj[key][1] || noBefore) {
            propElement.appendChild(<span class="property">
                <span class="key">{key}</span>
                <span class="new-value">{renderValue(combinedObj[key][1])}</span>
              </span>);
          } else {
            propElement.appendChild(<span class="property">
                <span class="key">{key}</span>
                <span class="old-value">{renderValue(combinedObj[key][0])}</span>
                <span class="new-value">{renderValue(combinedObj[key][1])}</span>
              </span>);
          }
        }
        
        // Check the identity
        let identityElement = <span class="identity space-after"></span>;
        if(combinedObj.__tracker_identity[0] !== combinedObj.__tracker_identity[1] && !noBefore) {
          identityElement.appendChild(<span class="old-value emoji ">
              {combinedObj.__tracker_identity[0]}
            </span>);
        }
        identityElement.appendChild(<span class="new-value emoji">
            {combinedObj.__tracker_identity[1]}
          </span>);
        
        return <span class="object">
            {identityElement}
            {propElement}
          </span>;
      } else {
        // We can just print the value
        if(!run.before || run.before.value === run.after.value) {
          return <span class="run">
            <span class="new-value">{renderValue(run.after.value)}</span>
          </span>;
        } else {
          return <span class="run">
            <span class="old-value">{renderValue(run.before.value)}</span>
            <span class="new-value">{renderValue(run.after.value)}</span>
          </span>;
        }
      }
    }
    
    // Gets a string representation for a single example
    const elementForExample = (example, index) => {
      // example: {id, name, color}
      let valueElement = <span class="probe-value"></span>
      const runs = this._values.get(example.id); // Map(runId, {type, value})
      
      if(this._activeRuns.has(example.id)
         && this._activeRuns.get(example.id) !== -1) {
        valueElement.appendChild(elementForRun(runs.get(this._activeRuns.get(example.id))));
      } else {
        Array.from(runs.entries())
             .sort((a, b) => a[0] - b[0])
             .forEach(entry => valueElement.appendChild(elementForRun(entry[1])));
      }
      
      // Show a delete button for the first element, and just a space for all others
      let leftSpace = <span>&nbsp;</span>;
      if(index === 0) {
        leftSpace = DeleteButton(this._deleteCallback);
      }
      
      let variableName = <span></span>;
      if(index === 0) {
        variableName = <span class="id-name space-after">{Array.from(runs.values())[0].after.name}</span>;
      }
      
      let exampleName = "";
      if(example.id !== defaultExample().id) {
        exampleName = <span
          class="example-name space-after"
          style={"background-color:" + example.color}>
          {example.name.length ? example.name : "\u00A0"}
        </span>;
      }
      
      // Inspector icon
      const inspectorIcon = <span class="icon inspector space-before"></span>;
      inspectorIcon.addEventListener("click", () => {
        this._onInspectorIconClicked(runs);
      });
      
      return <tr class="widget-line">
        <td class="probe-meta">
          {leftSpace}
          {variableName}
        </td>
        <td class="probe-example">
          {exampleName}
          {valueElement}
          {inspectorIcon}
        </td>
      </tr>
    }
    
    // Iterate over all examples and get their values
    this._element.innerHTML = "";
    let table = <table></table>;
    this._element.appendChild(table);
    let examples = Array.from(this._examples);
    if(this._values.has(defaultExample().id)) {
      examples.unshift(defaultExample());
    }
    
    const newChildren = examples.filter((e) => this._values.has(e.id))
                                .map(elementForExample);
    newChildren.forEach((e) => table.appendChild(e));
    
    // Hide if empty
    if(newChildren.length === 0) {
      this._element.style.display = "none";
    } else {
      this._element.style.display = "";
    }
  }
  
  _onInspectorIconClicked(runs) {
    const inspectableRun = Array.from(runs.entries())
                                .reduce((acc, run) => { acc[run[0]] = run[1]; return acc }, []);
        lively.openInspector(inspectableRun);
  }
}
