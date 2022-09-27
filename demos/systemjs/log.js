
export function log(s) {
  var logElement = document.body.querySelector("#log")
  if (logElement) {
    var li = document.createElement("li")
    li.textContent = s
    logElement.appendChild(li)
  }
  console.log(s)
}
