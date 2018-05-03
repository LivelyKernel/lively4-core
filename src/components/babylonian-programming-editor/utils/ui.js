/**
 * Adds a new marker to the editor
 */
export const addMarker = (editor, loc, classNames) => {
  const marker = editor.markText(
    loc.from,
    loc.to,
    {
      className: `marker ${classNames.join(" ")}`,
      startStyle: "start",
      endStyle: "end",
      inclusiveLeft: true,
      inclusiveRight: true
    }
  );
  marker._babylonian = true;
  return marker;
}


/**
 * An Annotation shows values for probes
 */
export class Annotation {
  constructor(editor, line, kind) {
    this.values = []
    this.indent = 0;
    this.kind = kind;
    
    this._element = document.createElement("span");
    this._element.classList.add("annotation");
    this._element.classList.add(this.kind);

    this._updateElement();
    
    this._widget = editor.addLineWidget(line, this._element);
  }
  
  update(values, indent) {
    this.values = values;
    this.indent = indent;
    this._updateElement();
  }
  
  _updateElement() {
    const arrow = this.kind === "replace" ? "↖︎" : "↘︎";
    const valuesString = this.values.length ? this.values.map((e)=>e[1]).join(" | ") : "??";
    this._element.textContent = `${arrow} ${valuesString}`;
    this._element.style.left = `${this.indent}ch`;
  }
  
  clear() {
    this._widget.clear();
  }
}



