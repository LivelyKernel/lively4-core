# Tally Example



```javascript {.fileContent}
What files do I have in the folder openai?
```


<script>
import Luna from "./luna.js"
  
(async () => {
  var query = lively.query(this, ".fileContent").textContent;
  let luna = new Luna();
  
  var lunaContext = await luna.query(query)

  var inspector = await (<lively-inspector></lively-inspector>)
      inspector.inspect(lunaContext) 

  var responseField = document.createElement("pre")

  responseField.textContent = lunaContext.getFinalResponse();

  return <div><h3>RESULT:</h3> {responseField}<h4>Context</h4> {inspector}</div>
  
})()


</script>