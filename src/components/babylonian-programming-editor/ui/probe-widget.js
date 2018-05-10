import Widget from "./widget.js";

const MAX_VALUESTRING_LENGTH = 40;

/**
 * A widget to display a probe value
 */
export default class ProbeWidget extends Widget {
  constructor(editor, location, kind) {
    super(editor, location, kind);
    this._examples = [{
      id: 0,
      name: "global",
      color: "transparent"
    }]; // [{id, name, color}]
    this._value = new Map(); // Map(exampleId, Map(runId, {type, value}))
    this._activeRuns = new Map(); // exampleId -> run
    this._update(); // TODO: Is this needed?
  }
  
  /**
   * Sets the displayed run (loops)
   */
  setActiveRunForExampleId(exampleId, activeRun) {
    this._activeRuns.set(exampleId, activeRun);
    this._update();
  }
  
  /**
   * Unsets s the displayed run (loops)
   */
  unsetActiveRunForExample(exampleId) {
    this._activeRuns.delete(exampleId);
    this._update();
  }
  
  /**
   * Updates the Widget's UI
   */
  _update() {
    // Gets a string representaion for a single run
    const stringForRun = (run) => {
      // run: {type, value}
      return `${run.value}`;
    }
    
    // Gets a string representation for a single example
    const elementForExample = (example) => {
      // example: {id, name, color}
      let valueString = "";
      const runs = this._value.get(example.id); // Map(runId, {type, value})
      
      if(this._activeRuns.has(example.id)) {
        valueString = stringForRun(runs.get(example.id));
      } else {
        valueString= Array.from(runs.values())
                          .map(stringForRun)
                          .join(" | ");
        if(valueString.length > MAX_VALUESTRING_LENGTH) {
          valueString = valueString.substring(0, MAX_VALUESTRING_LENGTH) + "...";
        }
      }
      
      return <span>
        <span
          class="example-name"
          style={"background-color:" + example.color}>↘︎ {example.name}:
        </span>
        &nbsp;{valueString}
      </span>
    }
    
    // Iterate over all examples and get their values
    this._element.innerHTML = ""
    const newChildren = this._examples
                            .filter((e) => this._value.has(e.id))
                            .map(elementForExample);
    newChildren.forEach((e) => this._element.appendChild(e));
  }
}
