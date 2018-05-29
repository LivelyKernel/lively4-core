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
    // Gets a string representaion for a single run
    const elementForRun = (run) => {
      // run: [{type, value}]
      if(run[0].value instanceof Array) {
        // We have an array
        if(run.length > 1) {
          const combinedArray = run[0].value.map(e => [e, undefined]);
          for(let i in run[1].value) {
            if(i < combinedArray.length) {
              combinedArray[i][1] = run[1].value[i];
            } else {
              combinedArray.push([undefined, run[1].value[i]]);
            }
          }
          const arrayElement = <span class="run array"></span>;
          for(let entry of combinedArray) {
            if(entry[0] !== entry[1]) {
              arrayElement.appendChild(<span class="old-value space-after">{entry[0]}</span>);
            }
            arrayElement.appendChild(<span class="new-value">{entry[1]}</span>);
          }
          return arrayElement;
        } else {
          const arrayElement = <span class="run array"></span>;
          for(let entry of run[0].value) {
            arrayElement.appendChild(<span class="new-value">{entry}</span>);
          }
          return arrayElement;
        }
      } else if(run[0].value instanceof ImageData) {
        const imageData = run[run.length-1].value;
        const canvas = <canvas
                         class="run"
                         width={imageData.width}
                         height={imageData.height}
                         ></canvas>
        canvas.getContext("2d").putImageData(imageData, 0, 0);
        return canvas;
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
        const propElement = <span class="properties"></span>;
        for(let key in combinedObj) {
          if(key === "__tracker_identity") {
            continue;
          }
          if(combinedObj[key][0] === combinedObj[key][run.length-1]) {
            propElement.appendChild(<span class="property">
                <span class="key">{key}</span>
                <span class="new-value">{run[run.length-1].value[key]}</span>
              </span>);
          } else {
            propElement.appendChild(<span class="property">
                <span class="key">{key}</span>
                <span class="old-value">{run[0].value[key]}</span>
                <span class="new-value">{run[run.length-1].value[key]}</span>
              </span>);
          }
        }
        
        // Check the identity
        let identityElement = <span class="identity space-after"></span>;
        if(combinedObj.__tracker_identity[0] !== combinedObj.__tracker_identity[1]) {
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
        if(run.length < 2 || run[0].value === run[run.length-1].value) {
          return <span class="run">
            <span class="new-value">{run[0].value}</span>
          </span>;
        } else {
          return <span class="run">
            <span class="old-value">{run[0].value}</span>
            <span class="new-value">{run[run.length-1].value}</span>
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
             .map(entry => elementForRun(entry[1]))
             .forEach(element => valueElement.appendChild(element));
      }
      
      // Show a delete button for the first element, and just a space for all others
      let leftSpace = <span>&nbsp;</span>;
      if(index === 0) {
        leftSpace = DeleteButton(this._deleteCallback);
      }
      
      let variableName = <span></span>;
      if(index === 0) {
        variableName = <span class="id-name space-after">{Array.from(runs.values())[0][0].name}</span>;
      }
      
      let exampleName = "";
      if(example.id !== defaultExample().id) {
        exampleName = <span
          class="example-name space-after"
          style={"background-color:" + example.color}>
          {example.name.length ? example.name : "\u00A0"}
        </span>;
      }
      
      return <tr class="widget-line">
        <td class="probe-meta">
          {leftSpace}
          {variableName}
        </td>
        <td class="probe-example">
          {exampleName}
          {valueElement}
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
}
