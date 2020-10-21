<script>
var markdownComp = lively.query(this, "lively-markdown")

import {Panning} from "src/client/html.js"
import Literature from "src/client/literature.js"
import {Paper, Author, MicrosoftAcademicEntities} from "src/client/protocols/academic.js"
import Chart from 'src/external/chart.js';
import Strings from "src/client/strings.js"


import files from "src/client/files.js"

const default_query="Composite(AA.AuId=2055148755)"
const default_count = 1000
const default_min = 0
const default_attr = "F.FN"

class HistogramChart {

  static queryString() {
    return this.pane.querySelector("input#query").value
  }
  
  static count() {
    return this.pane.querySelector("input#count").value
  }

  static attr() {
    return this.pane.querySelector("input#attr").value
  }

  static min() {
    return this.pane.querySelector("input#min").value
  }



  static style() {
     var style = document.createElement("style")
      style.textContent = `
      
      input#query {
        width: 400px;
      }
      
      input#count, input#min {
        width: 30px
      }
      
      div#info {
        color: lightgray;
        font-style: italic;
        padding: 2px;
      }
      `
      return style
  }

  static createChart(json, ctx) {
    if (!json || !json.histograms || !json.histograms[0]) return
  
    this.data = json
  
    var hist = json.histograms[0].histogram
    hist = hist.sortBy(ea => ea.value)
    
    var minValue = this.min()
    hist = hist.filter(ea => ea.count > minValue)

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hist.map(ea => ea.value),
          datasets: [{
            label: 'Histogram',
            data: hist.map(ea => ea.count),
            borderWidth: 1
          }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
    return this.chart 
  }
  
  static subQuery(query, attribute, value, count=10) {
    // ok, we have to create a subquery based on the type of the attribute #Fuck #Patrick #Home ... #Objects
    var attributeSchema = this.schemas.paper[attribute]
    var type = attributeSchema.type
    var other = attribute+ '=' + (type == "String" ? "'" + value + "'" : value)
    if(attribute.match(/\./)) {
      other = "Composite(" + other + ")"
    }
    return `academic://expr:And(${query},${other})?count=${count}`
  }
  
  static async onClick(evt, element) {
    if (evt.shiftKey) return lively.openInspector(this);
    
    var firstPoint = this.chart.getElementAtEvent(evt)[0];
    if (firstPoint) {
      var label = this.chart.data.labels[firstPoint._index];
      var value = this.chart.data.datasets[firstPoint._datasetIndex].data[firstPoint._index];
      
      lively.openBrowser(this.subQuery(this.queryString(), this.attr(), label, 20))      
    } else {
    
      let mousePoint = Chart.helpers.getRelativePosition(evt, this.chart.chart);
      let value = this.chart.scales['x-axis-0'].getValueForPixel(mousePoint.x);
      let label = this.chart.data.labels[value]
      let attribute = this.attr() 
      
      
      if (attribute == "F.FN"){
        var newquery = `And(Composite(F.FN='${label}'),${this.queryString()})`
        lively.openBrowser("academic://hist:" + newquery + "?count=" + this.count() + "&attr=" + attribute)
      } else {
        lively.notify("narrowing in on " + attribute + " is not supported yet!")
      }


      
      
    }
  }

  static async update() {
    if (this.canvas) this.canvas.remove()
    this.canvas = <canvas></canvas>
    this.pane.appendChild(this.canvas)
  
    var json  = await files.loadJSON(`academic://hist:${this.queryString()}?count=${this.count()}&attr=${this.attr()}`);
    var ctx = this.canvas.getContext('2d');
  
    let targetLabel = ""
    let info = ""
    for(var m of Strings.matchAll(/[Ii]d=([0-9]+)/, this.queryString())) {
      let id = m[1]
      let raw  = await files.loadJSON(`academic://raw:Id=${id}?attr=AuN,Ty,AA.AuN,Y,Ti,FN`)
      
      var entity = raw.entities[0]
      var type = MicrosoftAcademicEntities.getEntityType(entity.Ty)
      var label = ""
      if(type =="author") { 
        label = entity["AuN"]
      } else if(type == "field-of-study") { 
        label =  entity["FN"] 
      } else if(type =="paper") { 
        label =  entity["Ti"] 
      }
      
      info += `<span>${id}: ${type}, ${label}</span><br>` 
    }
    this.pane.querySelector("#info").innerHTML = info

  
  
  
    this.canvas.onclick  = evt => {
      if (!this.chart) return
      this.onClick(evt, this.chart.getElementAtEvent(evt));
    }
    
    (() => this.createChart(json, ctx)).defer(100);  
  }

  static async create() {
    
    this.schemas = await MicrosoftAcademicEntities.allSchemas()
  
    var browse = () => lively.openBrowser("academic://expr:" + this.queryString() + "?count=100") 
    var inspect = () => lively.openInspector(this.data) 
    var update = (() => this.update()).debounce(500)  
    
    this.pane = <div id="root" title=" " style={`
        position: absolute; 
        top: 0px; 
        left: 0px; 
        overflow-x: auto; 
        overflow-y: scroll; 
        user-select: none;
        width: calc(100% ); 
        height: calc(100%);`}>
        {this.style()}
        <div>
          <h2>Academic Query: </h2> 
          <input input={update} id="query" value={default_query}></input>
          <span>Count: <input input={update} id="count" value={default_count}></input></span>
          <span>Attribute: <input input={update} id="attr" value={default_attr} list="attributelist"></input></span>
          <datalist id="attributelist" ></datalist> 
          <span>min: <input input={update} id="min" value={default_min}></input></span>
          <div id="info"></div>
          <button click={browse}>browse</button>
          </div>
        <button click={inspect}>inspect</button>
      </div>
      
    this.pane.querySelector("#attributelist").innerHTML = Object.keys(this.schemas.paper).map(ea => "<option>" + ea).join("\n")
    
    this.pane.creator = this
    
    
    let parameters = markdownComp.parameters
    for(let name of Object.keys(parameters)) {
       let element = this.pane.querySelector("#" +name)
       if (element && (parameters[name] !== undefined)) element.value = parameters[name]
       else {
        lively.warn("parameter " + name + " not found")
       }
    }
    
    this.update()
      
    return this.pane
  }
}

HistogramChart.create()
</script>