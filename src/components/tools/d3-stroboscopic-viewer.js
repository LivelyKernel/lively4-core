import Morph from 'src/components/widgets/lively-morph.js';
import d3 from "src/external/d3.v5.js"
import Stroboscope from 'src/client/stroboscope/stroboscope.js';
import StroboscopeEvent from 'src/client/stroboscope/stroboscopeevent.js';


import { debounce } from "utils";



export default class D3StroboscopicViewer extends Morph {

  initialize() {
    this.d3 = d3 // for scripting...
    this.updateViz()
    this.options = {}
    
    
    this.addEventListener('extent-changed', ((evt) => {
      this.onExtentChanged(evt);
    })::debounce(500));

    // Map of objects displayed by viewer
    this.objectsToView = new Map();
  
  }

    
  getData() {
    return this.objectsToView
  }

  setData(data) {
    this.data = data;
    this.updateViz()
  }  
  
  dataColor(node) {
    if (this.options.color !== undefined) return this.options.color(node)
    return "gray"
  }

  dataWidth(node) {
    if (this.options.width !== undefined) return this.options.width(node)
    return 20
  }

  dataHeight(node) {
    if (this.options.height !== undefined) return this.options.height(node)
    return 40
  }
  
  dataFontsize(node) {
    if (this.options.fontsize !== undefined) return this.options.fontsize(node)
    return 10
  }
  
  onNodeClick(node, evt, element) {
    if (this.options.onclick) return this.options.onclick(node, evt, element)
    lively.notify("clicked on " + node.id)
  }
  
  config(config) {
    Object.keys(config).forEach(key => {
      // lively.notify("key " + key) 
      this.options[key] = config[key] // we could check them here...      
    })
  }

  livelyInspect(contentNode, inspector) {
    if (this.data) {
      contentNode.appendChild(inspector.display(this.data, false, "#data", this));
    }
  }

  onExtentChanged() {
    //lively.notify("extent changed")
    this.updateViz()
  }

  livelyMigrate(other) {
    this.options = other.options
    this.setData(other.getData())
  }
    
  // check if object is known
  knowAboutObject(id) {
    return this.objectsToView.has(id);
  }

  // check if known object has property
  knownObjHasProperty(object_id, property) {
    return this.objectsToView[object_id][property] != undefined;
  }
  
  
  /*
   *
   *
   */
  evaluateEvent(event) {
    
    // before all check if object is known
    if( this.knowAboutObject(event.object_id)) {
      // create new property
      if(event.event_type === "create") {
        this.objectsToView[event.object_id][event.property] = {
          value: event.value,
          type: event.property_type
        }
      }
      // change property
      if(event.event_type === "change") {
        // check if property exists
        if(knownObjHasProperty(event.object_id, event.property) ) {
          this.objectsToView[event.object_id][event.property] = {
            value: event.value,
            type: event.property_type
          }
        }
        else {
          lively.notify("no changes on non existing properties");
        }
      }
      // delete property
      if(event.event_type === "delete") {
        // check if property exists
        if(knownObjHasProperty(event.object_id, event.property) ) {
          delete this.objectsToView[event.object_id][event.property];
        }
        else {
          lively.notify("no delete on non existing properties");
        }
      }
    } else {
 
      if(event.event_type === "create") {
        var obj = {
          id: event.object_id
        }
        //create property object
        obj[event.property] = {
          value: event.value,
          type: event.property_type
        }
        // add property to object
        this.objectsToView.set(obj);
      }

      if(event.event_type === "change") {
        lively.notify("no changes on non existing objects");
      }

      if(event.event_type === "delete") {
        lively.notify("no deletes on non existing objects");
      }
    }
    
    this.updateViz();
  }
  
  
  
  
  
  
  
  updateViz() {
    
    //var object_container = this.get("#objectCntr");
    //object_container.style.backgroundColor = "red";
    //object_container.innerHTML=""
    
    //var e = document.createElement('div');
    //e.innerHTML = "Object and Properties";
    //object_container.appendChild(e.firstChild);
   
    
    /*
    var objCntr = d3.select(this.get("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
    */
    
    /*
    var svgContainer = this.get("#container")
    svgContainer.style.width = this.style.width // hard to find out how to do this in CSS, ... with "relative"
    svgContainer.style.height = this.style.height
    
    
    //var bounds = this.getBoundingClientRect()
    //this.get("svg").innerHTML = ""

    var knownObjects = this.getData()
    if (!knownObjects) return; // nothing to render
    
    
    var object_container = this.get("#objectCntr")
    //object_container.style.backgroundColor = "red";
    */
    
    
    /*
    var margin = { top: 20, right: 20, bottom: 20, left: 20 }
    var width = bounds.width,
      height = bounds.height;
    
    var data = this.getData();
    if (!data) return;// nothing to to

    var width = lively.getExtent(this).x - 30
    
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.x1)])
        .range([0, width]);

    
    var lineHeight = 20
    
    
    var svgOuter = d3.select(this.get("svg"))
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
    */
  }
    
  
  
  
  
  /*
  
  
  
  
import Stroboscope from 'src/client/stroboscope/stroboscope.js';    

var tt = {name:"name", length:8, width:4, height:2};
var stroboscope = new Stroboscope(tt)

stroboscope.init().then(() => {
  stroboscope.slice();
})
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  async livelyExample() {
    var tt = {name:"name", length:8, width:4, height:2};
    var stroboscope = new Stroboscope(tt)

    stroboscope.init().then(() => {
      stroboscope.slice();
    })

  }
  */
  
}