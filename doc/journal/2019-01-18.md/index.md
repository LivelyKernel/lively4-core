## 2019-01-18 Custom #Dragging

<br>

<div style="height:200px">
<lively-import id="dragimport" src="dragelement.html"></lively-import>
</div>



<script>
import Persistence from "src/client/persistence.js";
import highlight from 'src/external/highlight.js';

(async () => {
await lively.sleep(1000)
var tool =  lively.query(this,"#dragimport").get("#elements-under")

Persistence.initLivelyObject(tool) // bring it to livey #TODO should be done in lively-import

// ok, very hacky... can we do it otherwise?
// var style = document.createElement("style")
// style.textContent = await fetch(lively4url + "/src/external/highlight.css").then(r => r.text())
// this.shadowRoot.appendChild(style)
// alternative using link tag
var style = document.createElement("link")
style.setAttribute('rel',"stylesheet")
style.setAttribute('type',"text/css")
style.setAttribute('href',lively4url + "/src/external/highlight.css")

this.shadowRoot.appendChild(style)

var pre = document.createElement("pre")
pre.textContent = Array.from(tool.querySelectorAll("script")).map(ea => ea.textContent).join('\n')
highlight.highlightBlock(pre);
return pre
})()
</script>

### #Style, #Link

```JavaScript
// ok, very hacky... can we do it otherwise?
var style = document.createElement("style")
style.textContent = await fetch(lively4url + "/src/external/highlight.css").then(r => r.text())
this.shadowRoot.appendChild(style)

// alternative using link tag
var style = document.createElement("link")
style.setAttribute('rel',"stylesheet")
style.setAttribute('type',"text/css")
style.setAttribute('href',lively4url + "/src/external/highlight.css")
```
