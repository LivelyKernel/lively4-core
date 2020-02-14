# Annotations
![](update_annotations.drawio)

<script>
import diff from 'src/external/diff-match-patch.js';
const dmp = new diff.diff_match_patch();
import Annotations from 'src/client/annotations.js'

(async() => {

  var versions = [
  
    {version: "c1", content: "Hello" },
    {version: "c2", content: "Hello World" },
    {version: "c3", content: "Hallo Welt" },
    {version: "c4", content: "In the beginning: Hallo Welt" },
    {version: "c5", content: "Beginning: Hallo Welt" }
  ]



  let last = ""
  for(let ea of versions) {
    if (!ea) continue;
    ea.diff = dmp.diff_main(last, ea.content);
    last = ea.content
  }
  
  let annotations = new Annotations()
  
  // additions per version
  for(let version of versions) {
    annotations = annotations.clone()
    let pos = 0
    let new_annotations = new Annotations()
    for(let change of version.diff) {
      if (change[0] == 0)  {
        // nothing changed
        pos += change[1].length
      } else if (change[0] == 1) {
        // addition 
        let l = change[1].length
        let newpos = pos + l        
        new_annotations.add({
          type: "add", 
          from: pos, to: newpos, 
          content: change[1],
          version: version.version 
        })

        pos = newpos
      } else if (change[0] ==  -1){
        // deletion
        let l = change[1].length
        let newpos = pos + l   
        new_annotations.add({
          type: "del", 
          from: pos, to: pos, 
          content: change[1],
          version: version.version 
        })
        
      }
    }
    annotations.applyDiff(version.diff)
    annotations.addAll(new_annotations)
    version.annotations = annotations
    version.new_annotations = new_annotations
  }
  

  function printAnnotated(text, annotations) {
    
    var spans = text.split("").map((ea,pos) => 
      <span>{ea}</span>) // #Hardcore
    // style={pos % 2 == 0 ? "color:red" : "color:blue"}
    for(let annotation of annotations) {
      for(var i=annotation.from; i < annotation.to; i++ ) {
        if (annotation.type == "add") {
          var span = spans[i]
          if (span) span.classList.add("add")
        }
      }
      if (annotation.type == "del") {
        let span =spans[annotation.from]
        if (span) span.insertBefore(<span class="del">{annotation.content}</span>, span.childNodes[0])
      }
    }
    
    var span = <span>{...spans}</span>
    return span
  }
  var style = document.createElement("style")
  style.textContent = `
    span {
      font-size: 14pt;
      font-family: Courier;
      font-weight: bold;
    }
    .add {
      color: green;
    }
    .del {
      color: red;
      text-decoration: line-through;
    }

  `

  return <div>{style}
    <h3>New Annotations</h3>
    <ul>{...versions.map(ea => <li>
      <a click={() => lively.openInspector(ea)}>{ea.version}:</a> {printAnnotated(ea.content, ea.new_annotations)}
      </li>)}
    </ul>
    <h3>All Annotations</h3>
    <ul>{...versions.map(ea => <li>
      <a click={() => lively.openInspector(ea)}>{ea.version}:</a> {printAnnotated(ea.content, ea.annotations)}
      </li>)}
    </ul>
    </div>
})()
</script>


