import Widget from "./widget.js";
import { DeleteButton } from "./buttons.js";
import { defaultExample } from "../utils/defaults.js";
import BabylonianWorker from "../worker/babylonian-worker.js";

const MAX_VALUESTRING_LENGTH = 100;



export default class ProbeWidget extends Widget {
  constructor(editor, location, kind, deleteCallback, probe) {
    super(editor, location, kind, deleteCallback);
    this._values = new Map(); // Map(exampleId, Map(runId, [{type, value, name}]))
    this._activeRuns = new Map(); // exampleId -> runId
    this.iterationParentId = -1;
    this.probe = probe
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
      if(value === null || value === undefined ) {
        return "null";
      } else if(value instanceof HTMLElement) {
        return value.outerHTML
      } else if(value.toString) {
        return value.toString();
      } else {
        return value;
      }
    }
    
    // Gets a string representaion for a single run
    const elementForRun = (run, prevRun) => {
      let runElement = null;
      
      if(!run || !(run.before || run.after)) {
        return <span class="run noexec">/</span>
      }
      
      
      if (!run.after) {
        return <span class="run noexec">/</span>
      }
      
      // #FutureWork #Issue deal with promises...
//       // run: we have a promise
//       if(run.after &&  run.after.type == "Promise") {
//         var promisedSpan = <span class="result"></span>
//         run.after.value.then(resolved => {
//           promisedSpan.appendChild(elementForRun({after: {
//             type: typeof resolved,
//             value: resolved
            
//           }} ))
//         })
            
//         return <span class="promise">Promised{result}</span>
//       }
      
      if(run.after && (run.after.value instanceof Array)) {
        
        
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
          runElement = arrayElement;
        } else {
          const arrayElement = <span class="run array"></span>;
          for(let entry of run.after.value) {
            arrayElement.appendChild(<span class="new-value">{renderValue(entry)}</span>);
          }
          runElement = arrayElement;
        }
      } else if(run.after.value instanceof ImageData) {
        const imageData = run.after.value;
        const canvas = <canvas
                         class="run"
                         width={imageData.width}
                         height={imageData.height}
                         ></canvas>
        canvas.getContext("2d").putImageData(imageData, 0, 0);
        runElement = canvas;
      } else if(run.after.value && run.after.value.livelyProbeWidget) {
        // just an example how to extend it...
        // now #TODO refactor so it can actually be extended...
        runElement = run.after.value.livelyProbeWidget(run, this) // #Experimental #API
      }  else if(run.after.value instanceof Object
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
          
          if(key === "__classFilePath__") {
            continue;
          }
          
          if(noBefore || combinedObj[key][0] === combinedObj[key][1]) {
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
        if(combinedObj.__tracker_identity) {
          if(combinedObj.__tracker_identity[0] && combinedObj.__tracker_identity[0] !== combinedObj.__tracker_identity[1] && !noBefore) {
            identityElement.appendChild(<span class="old-value emoji ">
                {combinedObj.__tracker_identity[0]}
              </span>);
          }
          identityElement.appendChild(<span class="new-value emoji">
              {combinedObj.__tracker_identity[1]}
            </span>);
        }
        
        runElement = <span class="run object">
            {identityElement}
            {propElement}
          </span>;
      } else {
        // We can just print the value
        if(!run.before ||
           run.before.type == "undefined" || /* should we mark this */
           run.before.value === run.after.value ||
           (prevRun && prevRun.after && prevRun.after.value === run.before.value)) {
          runElement = <span class="run">
            <span class="new-value">{renderValue(run.after.value)}</span>
          </span>;
        } else {
          runElement = <span class="run">
            <span class="old-value">{renderValue(run.before.value)}</span>
            <span class="new-value">{renderValue(run.after.value)}</span>
          </span>;
        }
      }
      
      runElement.addEventListener("click", (evt) => {
        this.openSnapshotView({
          "selection": [run]}, evt)
      });
      return runElement;
    }
    
    // Gets a string representation for a single example
    const elementForExample = (example, index, examples) => {
      // example: {id, name, color}
      let valueElement = <span class="probe-value"></span>
      const runs = this._values.get(example.id); // Map(runId, {type, value})
      
      if(this._activeRuns.has(example.id)
         && this._activeRuns.get(example.id) !== -1) {
        const run = runs.get(this._activeRuns.get(example.id));
          valueElement.appendChild(
            elementForRun(run, null)
          );
      } else {
        let maxRunId = BabylonianWorker.tracker.iterations.get(this.iterationParentId).get(example.id);
        
        for(let runId = 0; runId < maxRunId; runId++) {
          const prevRun = runId > 0 ? runs.get(runId-1) : null;
          const run = runs.get(runId);
            valueElement.appendChild(
              elementForRun(run, prevRun)
            );
        }
      }
      
      // Show some UI only for the first element
      let leftSpace = <span></span>;
      if(index === 0) {
        // Delete butotm
        leftSpace.appendChild(DeleteButton(this._deleteCallback));
        
        // Inspector icon
        const inspectorIcon = <span class="icon inspector space-before"></span>;
        inspectorIcon.addEventListener("click", (evt) => {
          this._onInspectorIconClicked(examples, evt);
        });
        leftSpace.appendChild(inspectorIcon);
      }
      
      let variableName = <span></span>;
      if(index === 0) {
        var firstValue = Array.from(runs.values())[0]
        if (firstValue && firstValue.after) {
          variableName = <span class="id-name space-after">{firstValue.after.name}</span>;
        } else {
          variableName = ""
        }
      }
      
      let exampleName = "";
      if(example.id !== defaultExample().id) {
        exampleName = <span
          class="example-name space-after"
          style={"background-color:" + example.color}>
          {example.name.value.length ? example.name.value : "\u00A0"}
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
    let examples = Array.from(BabylonianWorker.activeExamples);
    let myExamples = examples.filter((e) => this._values.has(e.id))
    debugger
    const newChildren = myExamples.map(elementForExample);
    newChildren.forEach((e) => table.appendChild(e));
    
    // Hide if empty
    if(newChildren.length === 0) {
      this._element.style.display = "none";
    } else {
      this._element.style.display = "";
    }
  }
  
  inspectorValue(examples) {
    var inspectorValue = {}
    var myExamples = examples.filter(ea => this._values.has(ea.id))
    for(let example of myExamples) {
      const runs = this._values.get(example.id);
      const value = Array.from(runs.entries())
                         .reduce((acc, run) => {
                           acc[run[0]] = run[1];
                           return acc
                         }, []);
      const key = (example.name.value && example.name.value.length) ?
                  `${example.name.value} (${example.id})` :
                  `Unnamed example (${example.id})`;
            
      inspectorValue[key] = {
        name: example.name.value, // for updating latter... so we don't have to parse it again
        id: example.id,
        probe: this.probe, // for live updating
        values: value
      };
    }
    return inspectorValue
  }
  
  _onInspectorIconClicked(examples, evt) {
    var inspectorValue = this.inspectorValue(examples)
    if (evt.shiftKey) {
      lively.openInspector(inspectorValue)
    } else {
      this.openSnapshotView(inspectorValue, evt)
    }
  }
  
  
  async openSnapshotView(examples, evt) {
    
    var comp = await lively.openComponentInWindow("lively-snapshot-view", lively.getPosition(evt))    
    
    comp.examples = examples

  }
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */