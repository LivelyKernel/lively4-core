export function DeleteButton(callback) {
  let button = <span class="icon delete-button"></span>
  button.addEventListener("click", callback);
  return button;
}

export function SwitchButton(callback, isOn) {
  let stateClass = isOn ? "on" : "off";
  let button = <span class={"icon switch-button space-before " + stateClass}></span>
  button.addEventListener("click", callback);
  return button;
}