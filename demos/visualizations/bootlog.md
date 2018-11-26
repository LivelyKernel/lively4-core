# Bootlog


<script>
import Bootlog from "src/client/bootlog.js"
(async() => {


  var currentboot = []
  await Bootlog.current().db.logs.each(ea => {
    if (ea.bootid == lively4currentbootid) {
      currentboot.push(ea)
    }
  })

  var chart = await lively.create("d3-barchart")
  chart.style.width = "2000px"
  var offset = currentboot[0].date
  
  var data = currentboot.filter(ea => ea.mode == "resolveInstantiateEnd").map(ea => {
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
    }
  })
  
  chart.setData(data)
  chart.updateViz() 

  return chart
})()
</script>