import ContextMenu from 'src/client/contextmenu.js';
import _ from 'src/external/lodash/lodash.js';
import {openLocationInBrowser, navigateToTimeline} from '../aexpr-debugging-utils.js'

export default class GraphNode {

  constructor(graph, nodeOptions = {}) {
    this.ins = new Map();
    this.outs = new Map();
    this.children = new Set();
    this.parents = new Set();
    if (!GraphNode.count) {
      GraphNode.count = 1;
    }
    this.id = GraphNode.count;
    GraphNode.count++;
    this.graph = graph;
    graph.onClickMap.set(this.id + "", event => {
      if(event.ctrlKey) {
        this.toggleCollapse();
      } else {        
        this.onClick(event, () => {
          this.graph.debouncedRerender();
        });
      }
    });
    this.nodeOptions = nodeOptions;
    this.collapsing = false;
    this.visible = true;
  }

  /*MD # Subclass Interface MD*/
  onClick(event, rerenderCallback) {}

  getInfo() {}

  // return an Array of form {file, start, end}[]
  getLocations() {
    return [];
  }

  // returns an Array of form [name, timelineCallback][]
  getTimelineEvents() {
    return [];
  }

  /*MD # Graph Interface MD*/
  // See https://graphviz.org/doc/info/attrs.html for possible options
  connectTo(other, options, isChild = false) {
    this.outs.getOrCreate(other, () => []).push(options ? options : {});
    other.ins.getOrCreate(this, () => []).push(options ? options : {});
    if (isChild) {
      this.children.add(other);
      other.parents.add(this);
    }
  }
  
  getEdgesTo(other) {
    if(!this.outs.has(other)) return [];
    return this.outs.get(other);
  }

  disconnectFrom(other) {
    this.outs.remove(other);
    other.ins.remove(this);
    this.children.remove(other);
    other.parents.remove(this);
  }
  
  isVisible() {
    return this.visible && !this.collapsedBy;
  }
  
  setVisibility(visible) {
    this.visible = visible;
  }

  getDOTNodes() {
    if (!this.isVisible()) return "";
    const nodeInfo = this.getInfo();
    
    const locations = this.getAllLocations();
    if(locations.length > 0) {
      nodeInfo.push(this.pluralize(locations.length, "Location"));
    }
    const timlineEvents = this.getAllTimelineEvents();
    if(timlineEvents.length > 0) {
      nodeInfo.push(this.pluralize(timlineEvents.length, "Event"));
    }
    
    if (this.collapsing) {
      nodeInfo.push("Can be extended");
    }
    const formattedInfo = nodeInfo.map(info => this.escapeTextForDOTRecordLabel(info)).join("|");
    const nodeOptionString = Object.keys(this.nodeOptions).map(key => key + " = " + this.nodeOptions[key]).join(", ");
    const node = this.id + ` [shape="record" label="{${formattedInfo}}"` + nodeOptionString + `]`;
    return node;
  }

  getDOTEdges() {
    const start = this.collapsedBy || this;
    if (!start.visible) return "";
    return _.uniq([...this.outs.keys()].flatMap(otherNode => {
      
      const destination = otherNode.collapsedBy || otherNode;
      if(!destination.visible) return [];
      if (destination === start) return [];

      return this.outs.get(otherNode).map(edgeOptions => {
        const edgeOptionString = Object.keys(edgeOptions).map(key => key + " = " + edgeOptions[key]).join(", ");
        return start.id + "->" + destination.id + " [" + edgeOptionString + "]";
      });
    })).join("\n");
  }

  /*MD # Collapse/Expand MD*/
  canCollapse() {
    return [...this.children].some(child => child.collapseableBy(this));
  }

  collapseableBy(node) {
    if (this.parents.has(node)) return this.parents.size === 1;
    if (this.parents.size === 0) return false;
    return [...this.parents].every(parent => parent.collapseableBy(node));
  }

  collapseBy(node) {
    if (node === this.collapsedBy || !this.collapseableBy(node)) return;
    this.collapsedBy = node;
    this.collapsing = false;
    for (const child of this.children) {
      child.collapseBy(node);
    }
  }

  uncollapse() {
    if (!this.collapsedBy) return;
    this.collapsedBy = undefined;
    this.collapsing = false;
    for (const child of this.children) {
      child.uncollapse();
    }
  }
  
  collapse() {
    this.collapsing = true;
    for (const child of this.children) {
      child.collapseBy(this);
    }
  }
  
  extend() {
    this.collapsing = false;
    for (const child of this.children) {
      child.uncollapse();
    }
  }

  toggleCollapse() {
    if (this.collapsing) {
      this.extend();
    } else {
      this.collapse();
    }
    this.graph.debouncedRerender();
  }

  getAllLocations() {
    let locations = [];
    this.forCollapsedSubgraph(node => {
      locations.push(...node.getLocations());
    });
    return locations;
  }

  getAllTimelineEvents() {
    let timelineEvents = [];
    this.forCollapsedSubgraph(node => {
      timelineEvents.push(...node.getTimelineEvents());
    });
    return timelineEvents;
  }

  forCollapsedSubgraph(callback) {
    callback(this);
    const stack = [...this.children];
    while (stack.length > 0) {
      const child = stack.pop();
      if (child.collapsedBy === this) {
        callback(child);
        stack.push(...child.children);
      }
    }
  }
  /*MD # Utility MD*/
  async constructContextMenu(object, additionalEntries = [], evt) {
    const menuItems = [];
    const locations = this.getAllLocations();
    const timlineEvents = this.getAllTimelineEvents();
    
    const inspectObject = {};
    inspectObject.nodeInfo = object;
    inspectObject.locations = locations;
    inspectObject.events = timlineEvents;
    menuItems.push(["inspect", () => {
      lively.openInspector(inspectObject);
    }, "", "l"]);

    if (this.canCollapse()) {
      menuItems.push([(this.collapsing ? "Extend" : "Collapse") + " Node", () => {
        this.toggleCollapse();
      }, "", ""]);
    }

    for (const additionalEntry of additionalEntries) {
      menuItems.push([additionalEntry.name, () => {
        additionalEntry.callback();
      }, "", ""]);
    }

    if(locations.length > 0) {      
      const subMenuItems = [];
      locations.forEach((location, index) => {
        subMenuItems.push([this.fileNameString(location.file) + ":" + location.start.line, () => {
          openLocationInBrowser(location);
        }, "", ""]);
      });
      menuItems.push(['Locations', subMenuItems]);
    }

    if (timlineEvents.length > 0) {
      const subMenuItems = [];
      timlineEvents.forEach(aeEvent => {
        const [name, timelineCallback] = aeEvent;
        subMenuItems.push([name, () => {
          navigateToTimeline(timelineCallback);
        }, "", ""]);
      });
      menuItems.push(['Events', subMenuItems]);
    }

    const menu = await ContextMenu.openIn(document.body, evt, undefined, document.body, menuItems);
    menu.addEventListener("DOMNodeRemoved", () => {
      //this.focus();
    });
  }
  
  pluralize(count, name) {
    return count + " " + name + (count > 1 ? "s" : "");
  }
  
  fileNameString(file) {
    return file.substring(file.lastIndexOf('/') + 1);
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
    text = text.replaceAll(/(\n)/g, '\\l');
    text = text.replaceAll(" ", '\u00A0');
    return text;
  }
}