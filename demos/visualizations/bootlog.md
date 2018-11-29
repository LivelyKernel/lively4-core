# Bootlog

<script>
import Bootlog from "src/client/bootlog.js"
import d3 from "src/external/d3.v5.js"
(async() => {


  var currentboot = []
  await Bootlog.current().db.logs.each(ea => {
    if (ea.bootid == lively4currentbootid) {
      currentboot.push(ea)
    }
  })

  if (currentboot.length == 0) {
    return "no log for current boot, please enable <b>Preference > keep bootlog</b>"
  }


  var chart = await lively.create("d3-barchart")
  chart.style.width = "1200px"
  // chart.style.height = "4800px"
  
  
  
  var offset = currentboot[0].date
              
  var color = d3.scaleOrdinal(d3.schemeCategory10);
            
  var nodeMap = new Map();              
  var data = currentboot
    // .filter(ea => ea.mode.match(/resolveInstantiate(Dep?)End.*/))
    //.filter(ea => ea.time > 5) // filter out cached already loaded modules #TODO make it better
    .map(ea => {
      return {
        log: ea,
        children: [],
        label: ea.url.replace(/.*\//,""),
        x0: ea.date - ea.time - offset,
        x1: ea.date - offset,
      }
    })
    
  data = _.sortBy(data, d => d.log.date)
  data = data.map(d => {
      var parentNode = nodeMap.get(d.log.url)
      if (parentNode) {
        parentNode.children.push(d)
        d.parent = parentNode
        return null
      } else {
        nodeMap.set(d.log.url, d)
        return d
      }
    })
    .filter(ea => ea)
    
      // data.forEach(ea => {
      //   ea.x0 = _.min([ea.x0].concat(ea.children.map(ea => ea.x0)))
      //   ea.x1 = _.max([ea.x1].concat(ea.children.map(ea => ea.x1)))
      // });
    
  chart.config({
    height(d, defaultValue) {
    
      if (d.log.mode.match(/resolveInstantiate(Dep)?End/)) {
        return 0.3 * parseFloat(defaultValue)
      }
      return defaultValue
    },
    onclick(d, evt) {
      if(evt.shiftKey) {
        lively.openInspector(d)
      } else {
        lively.openBrowser(d.log.url, true)
      }
    },
    color(d) {
      return color(d.log.mode)
      // if (d.log.mode == "resolveInstantiateEnd") {
      //   return "steelblue"
      // } else {
      //   return "lightblue"
      // }
    },
    title(d) {
      return d.log.mode + " \n" + d.log.url + "\n" + d.log.time.toFixed(2) + "ms"
    }
  })
  
  chart.setData(data)
  chart.updateViz() 

  return chart
})()
</script>