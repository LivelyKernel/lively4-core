## 2020-02-11
*Author: @JensLincke*


## Standoff Annotations in Lively

<script>
import d3 from "src/external/d3.v5.js"
import diff from 'src/external/diff-match-patch.js';


const dmp = new diff.diff_match_patch();

// moment("2020-01-29T13:48:38.798Z").toDate().toString()

(async() => {


  // #Insight: through manual execution of steps, Jupyter Notebooks get caching for free....
  let versions = window.tmpVersions // all versions are nodes in a graph ... lets ignore this for a while
  if (!versions) {
    let url = "https://lively-kernel.org/lively4/lively4-jens/demos/foo.js";
    versions = (await lively.files.loadVersions(url, true).then(r => r.json())).versions
    versions = versions.filter(ea => ea && ea.version );
    for(let ea of versions) {
      ea.content = await lively.files.loadFile( url, ea.version)
    }
    window.tmpVersions = versions
  }

  let last = ""
  for(let ea of versions) {
    if (!ea) continue;
    ea.diff = dmp.diff_main(last, ea.content);
    last = ea.content
  }
  
  // additions per version
  for(let version of versions) {

    let pos = 0
    let old_annotations = []
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
          if (old.to < pos) continue; // total left
          if (old.from > newpos) continue; // total right
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

        // shrink or delete old annotations
        for(let old of old_annotations) {
          if (old.to < pos) continue; // total left
          if (old.from > newpos) continue; // total right
        }
        
        new_annotations.push({
          type: "del", 
          from: pos, to: pos, 
          content: change[1],
          version: version.version 
        })
        
      }
    }
    version.new_annotations = new_annotations
  }
  
  let chart = await lively.create("d3-barchart")
  chart.style.width = "1200px"
  
  let color = d3.scaleOrdinal(d3.schemeCategory10);           
  let nodeMap = new Map();
  
  let data = versions
    .map(ea => {
      return {
        data: ea,
        children: ea.new_annotations.map(annotation => {
          var result = {data: annotation, x0: annotation.from, x1: annotation.to}
          if (annotation.type == "del") {
            result.x1 = result.x0 + annotation.content.length
            debugger
          }
          return result
        }),
        label: ea.version,
        x0: 0,
        x1: ea.content.length,
      }
    })

  
  chart.config({
    onclick(d, evt) {
      if(evt.shiftKey) {
        lively.openInspector(d)
      } else {
      let base = lively4url.replace(/\/[^/]*$/,"")
      lively.openBrowser(base + d.data.url, true)
      }
    },
    height(d) {
      if (d.data.type == "add") {
        return 10
      }
      if (d.data.type == "del") {
        return 10
      }
      return 20
    },
    color(d) {
      if (d.data.type == "add") return "rgba(0,255,0,0.8)"
      if (d.data.type == "del") return "rgba(255,0,0,0.8)"
      return "gray"
    },
    title(d) {
      if (!d.data|| !d.data.content) return ""
      return  (d.data.type ? d.data.type.toUpperCase() + ": " : "")  + d.data.content.slice(0,100)
      
      // return d.log.mode + " \n" + d.log.url + "\n" + d.log.time.toFixed(2) + "ms"
    }
  })
  
  chart.setData(data)
  chart.updateViz() 
  debugger
  chart.style.height = chart.get("svg").getBBox().height + "px"
  

  return <div>{chart}</div>
})()
</script>


## Results...

![](diff_history_of_foo.png)
