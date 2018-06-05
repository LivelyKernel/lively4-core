export function Button(callback, additionalClasses = [], hoverText = "") {
  let button = <span class="icon" title={hoverText}></span>
  button.addEventListener("click", callback);
  for(let cls of additionalClasses) {
    button.classList.add(cls);
  }
  return button;
}

export function DeleteButton(callback) {
  return Button(callback, ["delete-button"], "Delete");
}

export function SwitchButton(callback, isOn) {
  return Button(callback, ["switch-button", "space-before", isOn ? "on" : "off"]);
}

export function ExpandButton(callback) {
  return Button(callback, ["expand", "space-before"], "Switch form layout");
}

export function ErrorButton(hoverText) {
  return Button(Function(), ["warn", "space-before"], hoverText);
}

export function PrePostscriptButton(callback) {
  return Button(callback, ["exchange", "space-before"], "Edit Pre/Postscript");
}
