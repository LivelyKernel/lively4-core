<script>
var markdownComp = lively.query(this, "lively-markdown")

import {Panning} from "src/client/html.js"
import Literature from "src/client/literature.js"
import {Paper, Author, MicrosoftAcademicEntities} from "src/client/protocols/academic.js"
import Chart from 'src/external/chart.js';



import files from "src/client/files.js"

const default_query="Composite(AA.AuId=2055148755)"
const default_count = 1000
const default_min = 0
const default_attr = "Y"

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
      
      div#root {
        overflow: visible;
        width: 5000px;
        height: 800px;
        user-select: none
      }
      `
      return style
  }

  static chart(json, ctx) {
    if (!json || !json.histograms || !json.histograms[0]) return
  
    this.data = json
  
    var hist = json.histograms[0].histogram
    hist = hist.sortBy(ea => ea.value)
    
    var minValue = this.min()
    hist = hist.filter(ea => ea.count > minValue)

    var myChart = new Chart(ctx, {
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
    return myChart
  }

  static async update() {
    if (this.canvas) this.canvas.remove()
    this.canvas = <canvas></canvas>
    this.pane.appendChild(this.canvas)
  
    var json  = await files.loadJSON(`academic://hist:${this.queryString()}?count=${this.count()}&attr=${this.attr()}`);
    var ctx = this.canvas.getContext('2d');
    (() => this.chart(json, ctx)).defer(100);  
  }

  static async create() {
    
    this.schemas = await MicrosoftAcademicEntities.allSchemas()
  
  
    this.pane = <div id="root" title=" " style="position: absolute; top: 0px; left: 0px; overflow-x: auto; overflow-y: scroll; width: calc(100% ); height: calc(100%);">
        {this.style()}
        <div><h2>Academic Query: </h2> 
            <input input={(() => this.update()).debounce(500) } id="query" value={default_query}></input>
            <span>Count: <input input={(() => this.update()).debounce(500) } id="count" value={default_count}></input></span>
            <span>Attribute: <input input={(() => this.update()).debounce(500) } id="attr" value={default_attr} list="attributelist"></input></span>
            <datalist id="attributelist" ></datalist> 
            <span>min: <input input={(() => this.update()).debounce(500) } id="min" value={default_min}></input></span>
          <button click={() => lively.openBrowser("academic://expr:" + this.queryString() + "?count=100") }>browse</button></div>
          <button click={() => lively.openInspector(this.data) }>inspect</button>
      </div>
      
    this.pane.querySelector("#attributelist").innerHTML = Object.keys(this.schemas.paper).map(ea => "<option>" + ea).join("\n")
    
    let parameters = markdownComp.parameters
    for(let name of Object.keys(parameters)) {
       let element = this.pane.querySelector("#" +name)
       if (element) element.value = parameters[name]
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