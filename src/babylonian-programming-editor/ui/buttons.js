export function Button(callback, additionalClasses) {
  let button = <span class="icon"></span>
  button.addEventListener("click", callback);
  for(let cls of additionalClasses) {
    button.classList.add(cls);
  }
  return button;
}

export function DeleteButton(callback) {
  return Button(callback, ["delete-button"]);
}

export function SwitchButton(callback, isOn) {
  return Button(callback, ["switch-button", "space-before", isOn ? "on" : "off"]);
}

export function ExpandButton(callback) {
  return Button(callback, ["expand", "space-before"]);
}