export default (callback) => {
  let button = <span class="delete-button"></span>
  button.addEventListener("click", callback);
  return button;
}