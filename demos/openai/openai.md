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

## Costs?

Does that make sense?

```
5000 tokens per cent

1000 tokens per request

5 request per cent

6 request per min

~1 cent per minute

```

## Example

Prompt:

```javascript
function drawConnectorBetweenTwoHTMLElements(from, to){

```

```javascript
function drawConnectorBetweenTwoHTMLElements(from, to){
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  
  const fromX = fromRect.left + fromRect.width / 2;
  const fromY = fromRect.top + fromRect.height / 2;
  
  const toX = toRect.left + toRect.width / 2;
  const toY = toRect.top + toRect.height / 2;
  
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  
  document.body.appendChild(canvas);
}
```

and version in SVG

```javascript
function drawConnectorBetweenTwoHTMLElements(from, to){
  const fromRect = from.getBoundingClientRect()
  const toRect = to.getBoundingClientRect()
  
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("width", "100%")
  svg.setAttribute("height", "100%")
  svg.setAttribute("viewBox", `0 0 ${document.documentElement.scrollWidth} ${document.documentElement.scrollHeight}`)
  
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
  path.setAttribute("d", `M ${fromRect.left + fromRect.width/2} ${fromRect.top + fromRect.height/2} L ${toRect.left + toRect.width/2} ${toRect.top + toRect.height/2}`)
  path.setAttribute("stroke", "black")
  path.setAttribute("stroke-width", "2")
  path.setAttribute("fill", "none")
  
  svg.appendChild(path)
  
  document.body.appendChild(svg)
}
```




```javascript
var from = that
var to = that
 drawConnectorBetweenTwoHTMLElements(from, to)
```


## Some thoughts...

- How to discuss the proposed program and make changes to it?
- How to make it stop proposing... without disabling it completely







