# OpenAI

```javascript {.example1}

// swaps the keys and values of a dictionary
function swapKeysAndValue(dict) {



```


We expect something like the copilot completion tested in visual studio code:

```javascript
// swaps the keys and values of a dictionary
function swapKeysAndValue(dict) {
    var newDict = {};
    for (var key in dict) {
        newDict[dict[key]] = key;
    }
    return newDict;
}
```





<script>

  import OpenAI from "./openai.js"
  
  
(async () => {
  var code = lively.query(this, ".example1").textContent
  var data = await OpenAI.completeCode(code)

    var inspector = await (<lively-inspector></lively-inspector>)
      inspector.inspect(data) 

  var code = document.createElement("pre")
  code.textContent = data.completion

  return <div><h3>RESULT:</h3> {code}<h4>Data</h4> {inspector}</div>
  
})()


</script>