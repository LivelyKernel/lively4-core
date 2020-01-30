# Serverlog

<script>
import d3 from "src/external/d3.v5.js"
import moment from "src/external/moment.js";

// moment("2020-01-29T13:48:38.798Z").toDate().toString()

(async() => {


  var currentlogs = []

  var starttime = performance.now()

  var requestMap = new Map()

  // lively4url + "/demos/data/livelyboot-serverlog.log"
  var url = "https://lively-kernel.org/lively4/lively4-server/server.log"
  // var url = "https://lively-kernel.org/research/lively4-server/server.log"



  var openRequests = new Set()
  var logstring = await fetch(url).then(r => r.text())
  logstring.split("\n").forEach(line => {
    /*
    `[2020-01-29T13:48:38.798Z] [server] REQUEST[0]  START GET	/lively4-jens/swx-loader.js`.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  START GET	([^ ]+)/)
    
    `[2020-01-29T13:48:38.898Z] [server] REQUEST[0]  FINISHED GET (100ms) /lively4-jens/swx-loader.js`.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  FINISHED GET \(([0-9]+)ms\)/)
    
    `[2020-01-30T10:56:19.678Z] [server] REQUEST[224]  SESSION Sessiond9deecc5-a6a0-4e33-afc9-1f8d2377ff7e`
    */
    var m = line.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  START GET	([^ ]+)/)
    if (m) {
    
      let timestamp = m[1]
      let req = m[2]
      let url = m[3]
      let start = moment(timestamp).toDate().getTime()
      let offset = start
      var openPreviousRequest = openRequests.values().first
      if (openPreviousRequest) { offset = openPreviousRequest.offset }
      let d = {url, req, offset, start}
      currentlogs.push(d)
      openRequests.add(d)
      requestMap.set(req, d)
    } 
    
    m = line.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  SESSION ([^ ]+)/)
    if (m) {
     let timestamp = m[1]
      let req = m[2]
      let session = m[3]
      var d = requestMap.get(req)
      if (d) {        
        d.session = session;
      }
    }
    
    m = line.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  SYSTEM ([^ ]+)/)
    if (m) {
     let timestamp = m[1]
      let req = m[2]
      let system = m[3]
      var d = requestMap.get(req)
      if (d) {        
        d.system = system;
      }
    }
    
    m = line.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  FINISHED GET \(([0-9]+)ms\)/)
    if (m) {
      let timestamp = m[1]
      let req = m[2]
      let time = parseInt(m[2])
      var d = requestMap.get(req)
      if (d) {
        d.time = time;
        d.finished = moment(timestamp).toDate().getTime()
        openRequests.delete(d)
      }
    }
  })
  // console.log("loaded Bootlog in " + (performance.now() - starttime))


  if (currentlogs.length == 0) {
    return "no log server log: " + url
  }
 
  var chart = await lively.create("d3-barchart")
  chart.style.width = "1200px"
  
  var color = d3.scaleOrdinal(d3.schemeCategory10);           
  var nodeMap = new Map();
  
  var data = currentlogs
    .map(ea => {
      return {
        log: ea,
        children: [],
        label: "[" + ea.req + "] " + ea.url.replace(/.*\//,""),
        x0: ea.start - ea.offset,
        x1: ea.finished - ea.offset,
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
      return color(d.log.session)
    },
    title(d) {
      return d.log.url
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