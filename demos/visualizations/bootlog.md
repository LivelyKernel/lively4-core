# Bootlog


xxx

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

  var chart = await lively.create("d3-barchart")
  chart.style.width = "1200px"
  chart.style.height = "800px"
  var offset = currentboot[0].date
              
              
  var color = d3.scaleOrdinal(d3.schemeCategory10);
              
              
  var data = currentboot.filter(ea => ea.mode.match(/.*/)).map(ea => {
    return {
      log: ea,
      label: ea.url.replace(/.*\//,""),
      x0: ea.date - ea.time - offset,
      x1: ea.date - offset,
    }
  })
  chart.config({
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
    }
  })
  
  chart.setData(data)
  chart.updateViz() 

  return chart
})()
</script>