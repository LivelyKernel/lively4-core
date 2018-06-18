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

export function InstanceButton(callback) {
  return Button(callback, ["object-group", "space-before"], "Edit Instances");
}

export function AddButton(callback) {
  return Button(callback, ["plus"], "Add");
}

export function TextButton(text, cls, callback) {
  let button = <button>
        <span class={"icon " + cls} title={text}></span>
        {text.length ? <span class="text">{text}</span> : ""}
      </button>;
  button.addEventListener("click", callback);
  return button;
}