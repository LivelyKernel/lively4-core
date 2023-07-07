# Tally Example

<div class='fileContent' contenteditable='true'>
What javascript files do I have in the folder openai?
</div>

<script>
import Luna from "./luna.js"
  
const prompt = lively.query(this, ".fileContent");
  prompt.addEventListener('keydown', evt => {
  if (evt.key === 'Enter') {
  evt.preventDefault()
request()
}
})

var container
const request = (async () => {
debugger
  var query = prompt.textContent;
  let luna = new Luna();
  
  var lunaContext = await luna.query(query)

  var inspector = await (<lively-inspector></lively-inspector>)
      inspector.inspect(lunaContext) 

  var responseField = document.createElement("pre")

  responseField.textContent = lunaContext.getFinalResponse();

  const result = <div><h3>RESULT:</h3> {responseField}<h4>Context</h4> {inspector}</div>
  if (container) {
    const newContainer = <div id='result-fofofo'>{result}</div>
    container.replaceWith(newContainer)
    container = newContainer
  } else {
  return result
  }
})

container = <div id='result-fofofo'></div>
request().then(element => (container.append(element), container))
</script>