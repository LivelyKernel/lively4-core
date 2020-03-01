## 2020-02-12
*Author: @JensLincke*

## Annotations
![](update_annotations.drawio)



<script>
import d3 from "src/external/d3.v5.js"
import diff from 'src/external/diff-match-patch.js';
const dmp = new diff.diff_match_patch();

// moment("2020-01-29T13:48:38.798Z").toDate().toString()

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
  
  let annotations = []
  
  // additions per version
  for(let version of versions) {
    annotations = JSON.parse(JSON.stringify(annotations)) // cheap force deep copy
    let pos = 0
    let old_annotations = annotations
    let new_annotations = []
    for(let change of version.diff) {

      if (change[0] == 0)  {
        // nothing changed
        pos += change[1].length
      } else if (change[0] == 1) {
        // addition 
        let l = change[1].length
        let newpos = pos + l

        // extend old annotations
        for(let old of old_annotations) {
          
          
          if (old.from < pos) {
            
          }
          
          if (old.to < pos) {
            
          }
          
          
           if (old.from > newpos) {
            old.from += l // move right
          }
          if (old.to > newpos) {
            old.to += l
          }
          
        }
        new_annotations.push({
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


        // shrink or delete old annotations
        for(let old of old_annotations) {
          if (old.to < pos) { // total left
            
          } else if (newpos < old.from ) { // total right
            old.from -= l // move right
            old.to -= l
          } else { // in the middle
            old.to -= l
          }
        }
        
        new_annotations.push({
          type: "del", 
          from: pos, to: pos, 
          content: change[1],
          version: version.version 
        })
        
      }
    }
    
    annotations.push(...new_annotations)
    version.annotations = annotations
    version.new_annotations = new_annotations
  }
  

  function printAnnotated(text, annotations) {
    
    var spans = text.split("").map((ea,pos) => 
      <span>{ea}</span>) // #Hardcore
    // style={pos % 2 == 0 ? "color:red" : "color:blue"}
    annotations.forEach(annotation => {
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
    })
    
    
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


### Challenge... 

Without updating indices...

![](annotations_without_updating_pos.png){width=300px}





