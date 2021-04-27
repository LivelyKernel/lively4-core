import ContextMenu from 'src/client/contextmenu.js';

export default class GraphNode {
  
  constructor(onClickMap) {
    this.ins = new Map();
    this.outs = new Map();
    this.children = new Set();
    if(!GraphNode.count) {
      GraphNode.count = 1;
    }
    this.id = GraphNode.count;
    GraphNode.count++;
    onClickMap.set(this.id + "", (event) => this.onClick(event))
  }
  
  // See https://graphviz.org/doc/info/attrs.html for possible options
  connectTo(other, options) {    
    this.outs.getOrCreate(other, () => []).push(options ? options : {});
    other.ins.getOrCreate(this, () => []).push(options ? options : {});
  }
  
  disconnectFrom(other) {
    this.outs.remove(other);
    other.ins.remove(this);
  }
  
  addChild(child) {
    this.children.add(child);
  }
    
  onClick(event) {
    
  }
  
  getInfo() {
    
  }
  
  getDOTNodes() {
    const formattedInfo = this.getInfo().map((info) => this.escapeTextForDOTRecordLabel(info)).join("|");
    const node = this.id + ` [shape="record" label="{${formattedInfo}}"]`;
    return node;
  }
  
  getDOTEdges() {
    return [...this.outs.keys()]
      .flatMap(otherNode => 
               this.outs.get(otherNode)
               .map(edgeOptions => this.id + "->" + otherNode.id + " [" + Object.keys(edgeOptions).map(key => key + " = " + edgeOptions[key]).join(", ") + "]")).join("\n");
  }
  
  async constructContextMenu(object, locations, aeEvents, evt) {
    const menuItems = [];
    menuItems.push(["inspect", () => {
      lively.openInspector(object);
    }, "", "l"]);

    locations.forEach((location, index) => {
      menuItems.push([this.fileNameString(location.file) + ":" + location.start.line, () => {
        this.openLocationInBrowser(location);
      }, "", ""]);
    });
    
    const subMenuItems = [];
    aeEvents.forEach((aeEvent) => {      
      const [name, timelineCallback] = aeEvent;
      subMenuItems.push([name, () => {
        this.navigateToTimeline(timelineCallback);
      }, "", ""]);
    })
    menuItems.push(['Events', subMenuItems]);

    const menu = await ContextMenu.openIn(document.body, evt, undefined, document.body, menuItems);
    menu.addEventListener("DOMNodeRemoved", () => {
      //this.focus();
    });
  }

  fileNameString(file) {
    return file.substring(file.lastIndexOf('/') + 1);
  }

  openLocationInBrowser(location) {
    const start = { line: location.start.line - 1, ch: location.start.column };
    const end = { line: location.end.line - 1, ch: location.end.column };
    lively.files.exists(location.file).then(exists => {
      if (exists) {
        lively.openBrowser(location.file, true, { start, end }, false, undefined, true);
      } else {
        lively.notify("Unable to find file:" + location.file);
      }
    });
  }
  
  async navigateToTimeline(timelineCallback) {
    const existingTimelines = document.body.querySelectorAll('aexpr-timeline');
    
    if(existingTimelines.length > 0) {
      const timeline = existingTimelines[0];
      timelineCallback(timeline);
      timeline.parentElement.focus();
      timeline.focus();
      return;
    }
    
    lively.openComponentInWindow("aexpr-timeline").then((timeline) => {
      timelineCallback(timeline);
      // TODO Filter
    })
  }

  escapeTextForDOTRecordLabel(text) {
    if (!text) return "";
    text = text.toString();
    text = text.replaceAll("\\", "\\\\");
    text = text.replaceAll("<", "\\<");
    text = text.replaceAll(">", "\\>");
    text = text.replaceAll("{", "\\{");
    text = text.replaceAll("}", "\\}");
    text = text.replaceAll("[", "\\[");
    text = text.replaceAll("]", "\\]");
    text = text.replaceAll("\"", "\\\"");
    text = text.replaceAll("|", "\\|");
    return text;
  }
}