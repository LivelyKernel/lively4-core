# Connector Example


```javascript {.example1}
class Connector {
  
  constructor(fromElement, toElement) {
    this.from = fromElement
    this.to = toElement
  }
  
  // create svg element and render
  // only draw from border to border
  render(htmlElement) {
    AI_COMPLETE_HERE
  }
}
```


<script>

  import OpenAI from "./openai.js"
  
  
(async () => {
  var code = lively.query(this, ".example1").textContent
  var data = await OpenAI.completeCode(code, "AI_COMPLETE_HERE")

    var inspector = await (<lively-inspector></lively-inspector>)
      inspector.inspect(data) 

  var code = document.createElement("pre")
  code.textContent = data.completion

  return <div><h3>RESULT:</h3> {code}<h4>Data</h4> {inspector}</div>
  
})()


</script>


