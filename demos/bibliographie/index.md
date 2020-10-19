# Bibliographie
Halli hallo

```
var a = 3
```

<script> 
var a = 3
a+4
</script>


## Input:



<script>

var url = "https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/input.html";

(async () => {
  var text = await fetch(url).then( resp => resp.text())

  var htmlElement = <div></div>
  htmlElement.innerHTML = text

  // return "<pre>" + text.replace(/\</g,"&gt;") + "</pre"
  
  var pubList = htmlElement.querySelectorAll(".publist")


  var items = []

  for(var list of pubList ) {
    for(var ea of list.querySelectorAll("li") ) {
      items.push(ea)
    }
  }


  return items.map(ea => "EINTRAG:" + ea.innerHTML )
  
  // return htmlElement.querySelectorAll(".publist").length
})()
</script>


