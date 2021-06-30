import Morph from 'src/components/widgets/lively-morph.js';
import moment from "src/external/moment.js";


import d3 from "src/external/d3.v5.js"

// moment("2020-01-29T13:48:38.798Z").toDate().toString()


export default class LogVisualisation extends Morph {
  async initialize() {
    this.updateView()
  }  
  
  async updateView() {
    this.get("#content").innerHTML = ""
    this.get("#content").appendChild(await this.createView())
  }
  

  async loadLogs() {
    var url = this.url
    this.currentlogs = []
    this.logs = []
    this.allLogs = []
    var starttime = performance.now()
    var requestMap = new Map()


    var openRequests = new Set()
    var logstring = await fetch(url).then(r => r.text())
    logstring.split("\n").forEach(line => {
      /*
      `[2020-01-29T13:48:38.798Z] [server] REQUEST[0]  START GET	/lively4-jens/swx-loader.js`.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  START GET	([^ ]+)/)

      `[2020-01-29T13:48:38.898Z] [server] REQUEST[0]  FINISHED GET (100ms) /lively4-jens/swx-loader.js`.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  FINISHED GET \(([0-9]+)ms\)/)

      `[2020-01-30T10:56:19.678Z] [server] REQUEST[224]  SESSION Sessiond9deecc5-a6a0-4e33-afc9-1f8d2377ff7e`
      */


      var m = line.match(/\[(.*)\] +\[server\] REQUEST\[([0-9]+)\]  ?(.*)/)
      if (m) {  
        let date = moment(m[1])
        let time = date.toDate().getTime()
        let req = m[2]
        let message = m[3]
        let d
        let entry = {time: time, tag: "server", start: time, message: message}
        this.allLogs.push(entry)
        m = message.match(/START ([A-Z]+)	([^ ]+)/)
        if (m) { 
          let method = m[1]
          let url = m[2]
          let offset = time
          var requests = Array.from(openRequests.values())
          // var openPreviousRequest = requests.first
          // if (openPreviousRequest) { offset = openPreviousRequest.offset }
          Object.assign(entry, {url, req, method, offset, messages: []})          
          d = entry
          d.openrequests = requests.map(ea => ea.req)
          this.logs.push(d)
          openRequests.add(d)
          requestMap.set(req, d)
        } else {
          d = requestMap.get(req)
        }

        if (!d) return;
        d.messages.push(entry);

        m = line.match(/SESSION +(.+)/)
        if (m) {
          d.session = m[3];
        }

        m = line.match(/SYSTEM +(.+)/)
        if (m) {
         d.system = m[1];
        }

        m = line.match(/EVENTID +(.+)/)
        if (m) {
         d.eventid = m[1];
        }

        
        m = line.match(/FINISHED ([A-Z]+) \(([0-9]+)ms\)/)
        if (m) {
          let duration = parseInt(m[2])
          d.duration = duration;
          d.finished = time
          openRequests.delete(d)
        }
      }
    })
    // console.log("loaded Bootlog in " + (performance.now() - starttime))

  }
  
  
  async loadConsoleLogs() {
    var url = this.consoleLogsURL
    this.consolelogs = []
    var entryMap = new Map()
    this.entryMap = entryMap
    var starttime = performance.now()
    var openRequests = new Set()
    var logstring = await fetch(url).then(r => r.text())
    var lastTime = 0
    logstring.split("\n").forEach(line => {
      // [boot]  534 2021-06-28T11:42:59.856Z  44.60ms  finished fetch  https://lively-kernel.org/lively4/lively4-markus/src/client/reactive/components/basic/aexpr-graph/
      
      var m = line.match(/\[(.*)\]  ([0-9]+) ([0-9].+) ([0-9.]+)ms  (.*)/)
      if (!m) {
        // ok, I am to stupid to do it more elegantyly
        m = line.match(/\[(.*)\]  ([0-9]+) ([0-9].+) ()(.*)/) 
      }
      
      if (m) {  
        let tag = m[1]
        let id = m[2]
        let date = moment(m[3])
        let time = date.toDate().getTime()
        let duration = m[4]
        let message = m[5]
        let start = time - Math.round(duration);
        
        let urlMatch = line.match(/(https?:\/\/[^ ]+)/)
        let url
        if (urlMatch) {
          url = urlMatch[1]
        }
        
        let entry = {eventid: id, time: time, start: start, offset: start, finished: time, 
                     duration, tag, message, line: line, 
                     messages: [], url}
        let prevEntry = entryMap.get(tag + id)
        if (!prevEntry) {
          this.consolelogs.push(entry)
          entryMap.set(tag + id, entry)
        } else {
          entry.first = prevEntry
          prevEntry.messages.push(entry) 
          prevEntry.finished = entry.finished
          prevEntry.duration = entry.duration

        }
        lastTime = time
      } else {
        // this.consolelogs.push({time: lastTime, start: lastTime, offset: lastTime, finished: lastTime, 
        //                        duration: 0,
        //                        tag: "console",
        //                        message: line, messages: []})
      }
    })
    // console.log("loaded Bootlog in " + (performance.now() - starttime))

  }
  
  async  createView() {
    await this.loadLogs()
    await this.loadConsoleLogs()


    this.table = <table></table>
    this.table.style.whiteSpace = "nowrap"
    this.updateCurrentLogs()
    await this.updateChart()
    var style = document.createElement("style")
    style.innerHTML = `
      #chartpane {
        width: calc(100% - 0px);
        height: calc(100% - 0px);
        overflow: auto;
      }
      #control {
        padding: 10px;
      }

      .url input {
          width: 600px;
      }
      .url label {
          padding: 5px;
          width: 200px;
      }

`
    this.pane = <div id="top" style="display: flex; flex-direction: column; position:absolute; width: 100%; height: 100%;">
        {style}
          <h1 style="flex:0.3">Log</h1>
            <div class="url">
              <label>server log:</label> <input  id="serverLog"  input={async (evt) => {
                this.url = this.pane.querySelector("#serverLog").value
                await this.loadLogs()
                this.updateCurrentLogs()
                this.updateChart()  
            }}></input>
            </div>    
            <div class="url" ><label>client log:</label> <input  id="clientLog" input={async (evt) => {
              this.consoleLogsURL = this.pane.querySelector("#clientLog").value
                await this.loadConsoleLogs()
                this.updateCurrentLogs()
                this.updateChart()  
              }}></input>
            </div>
            <div id="control" style="flex:0.3">
              
              <span>from <input id="from" input={(evt) => {
                this.from = new Number(this.pane.querySelector("#from").value)
                this.updateCurrentLogs()
                this.updateChart()  
              }}></input></span>
              <span>to <input id="limit" input={(evt) => {
                this.limit = new Number(this.pane.querySelector("#limit").value)
                this.updateCurrentLogs()
                this.updateChart()  
              }}></input></span>
              <span>Filter <input id="filter" value="" input={(evt) => {
                this.filter = this.pane.querySelector("#filter").value
                this.updateCurrentLogs()
                this.updateChart()  
              }}></input></span>
            </div>
            <div id='chartpane'>{this.table}</div>
        </div>
      
    if (this.filter) {
       this.pane.querySelector("#filter").value = this.filter
    }

    if (this.from) {
       this.pane.querySelector("#from").value = this.from
    }
    
    if (this.limit) {
       this.pane.querySelector("#limit").value = this.limit
    }
    
    if (this.url) {
      this.pane.querySelector("#serverLog").value = this.url
    }
    if (this.consoleLogsURL) {
      this.pane.querySelector("#clientLog").value = this.consoleLogsURL
    }
    
    
    return this.pane
  }

  updateCurrentLogs() {
        // limit vis
    // var logs = this.logs
    // var logs = this.consolelogs
    var logs = this.logs.concat(this.consolelogs).sortBy(ea => ea.time)
    
    if (this.filter) logs = logs.filter(ea => (ea.url || ea.message).match(this.filter))
    this.currentlogs = logs.slice(this.from, this.from + this.limit)

  }

  
  async updateChart() {
    var table = this.table
    table.innerHTML = ""
    var counter = 0;
    var header  = ["time", "tag", "eventid", "bar", "method", "file", "message"]
    
    var activeLogs = []
    var data = this.currentlogs
      .map(ea => {
        activeLogs = activeLogs.filter(entry => entry.finished  > ea.start)
        activeLogs.push(ea)
        var result = {
          row: counter++,
          // now: ea.time,
          time:  moment(ea.finished).format("HH:MM:ss.SSS"),
          duration: ea.duration ? ea.duration : 0,
          eventid: ea.eventid ? ea.eventid : "",
          tag: ea.tag,
          req: ea.req ? "S_" + ea.req : "",
          method: ea.method ? ea.method : "",
          file: ea.url ? ea.url.replace(/.*\/(?!$| )/,"") : "",
          message: ea.message.replace(/https?:\/\/[^ ]*/,""),
          log: ea,
          start: ea.start,
          offset: activeLogs[0].start
        }
        return result
        
      })
      table.appendChild(<tr>{
          ...header.map(key => <th>{key}</th>)
        }</tr>)
      for(let ea of data) {
        table.appendChild(<tr>{
          ...header.map(key => {
            let td = <td>{ea[key]}</td>
            if (key == "bar") {
              var totalWidth = 200
              var totalTime = 1000 // milliseconds
              var scale = totalWidth / totalTime
              var x = (ea.start - ea.offset) * scale
              
              var width = ea.duration * scale
              var bar = <div style={`position: absolute;
                  height: 11px; top: 0px; left: ${x}px; 
                  width:${width}px; background-color: rgba(0,0,0,0.3);
                  font-size: 8pt; color: white; padding: 2px;
                `}>{ea.duration}ms</div>
              
              var holder = <div style={`position: relative; height: 15px; width:${totalWidth}px; background-color: lightgray`}>{bar}</div>
              holder.addEventListener("click", evt => {
                if (evt.shiftKey) {
                  lively.openInspector(ea)
                }
              })
              return <td>{holder}</td>
            } 
            if (key == "file") {
              let a = <a href={ea.log.url}>{ea.file}</a>
              a.addEventListener("click", evt => {
                lively.openBrowser(ea.log.url, true)
                evt.preventDefault()
                evt.stopPropagation()
              })
              td = <td>{a}</td>
            }
            return td
          })
        }</tr>)
      }    
  } 

  get url() {
    return this.getAttribute("server-src")
  }

  set url(s) {
    this.setAttribute("server-src", s)
  }
  
  get consoleLogsURL() {
    return this.getAttribute("console-src")
  }

  set consoleLogsURL(s) {
    this.setAttribute("console-src", s)
  }
  
  
  get from() {
    return this.getAttribute("from")
  }

  set from(n) {
    this.setAttribute("from", n)
  }
  
  get limit() {
    return this.getAttribute("limit")
  }

  set limit(n) {
    this.setAttribute("limit", n)
  }
  
  async livelyExample() {
    this.base = "https://lively-kernel.org/lively4/lively4-markus"
    this.url = "cached://" + lively4url +"/demos/data/210630_serverlog.txt"
    this.consoleLogsURL = "cached://" + lively4url +"/demos/data/210630_clientlog.txt"
    this.from = 0
    this.limit = 1000
    this.updateView()
  }
  
  
}
