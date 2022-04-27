import ContextMenu from 'src/client/contextmenu.js';
import _ from 'src/external/lodash/lodash.js';
import { openLocationInBrowser, navigateToTimeline, fileNameString } from '../aexpr-debugging-utils.js';
import ParentEdge from './parent-edge.js';
import DependencyEdge from './dependency-edge.js';
import EventEdge from './event-edge.js';
import NodeExtension from './node-extension.js';
import AENodeExtension from './ae-node-extension.js';


  
export const VisibilityStates = {
  IDC: undefined,
  VISIBLE: "VISIBLE",
  INVISIBLE: "INVISIBLE"
}

export default class GraphNode {

  constructor(graph, nodeOptions = {}) {
    this.extensions = [];
    this.ins = [];
    this.outs = [];
    this.events = [];
    this.dependencies = new Set();
    if (!GraphNode.count) {
      GraphNode.count = 1;
    }
    this.id = GraphNode.count;
    GraphNode.count++;
    this.graph = graph;
    graph.onClickMap.set(this.id + "", event => {
      if (event.ctrlKey) {
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
    this.rounded = false;
    this.showContent = false;
  }

  /*MD # Subclass Interface MD*/
  onClick(clickEvent, rerenderCallback) {
    this.constructContextMenu({}, [], clickEvent);
    return false;
  }

  getInfoInner() {
    return [...this.getInfo(), ...this.extensions.flatMap(e => e.getInfo())];
  }
  getInfo() {}

  getLocationsInner() {
    return [...this.getLocations(), ...this.extensions.flatMap(e => e.getLocations())];
  }
  // return an Array of form {file, start, end}[]
  getLocations() {
    return [];
  }

  // returns an Array of form [name, timelineCallback][]
  getTimelineEvents() {
    return [...this.getCausedEventsInner(), ...this.getOwnEventsInner()].map(({ event }) => [event.ae.getSourceCode(10) + ": " + event.value.lastValue.toString()
 + "=>" + event.value.value.toString()
, timeline => {
      timeline.showEvents([event], event.ae);
    }]);
  }

  getCausedEventsInner() {
    return [...this.getCausedEvents(), ...this.extensions.flatMap(e => e.getCausedEvents())];
  }
  getCausedEvents() {
    return this.events;
  }

  getOwnEventsInner() {
    return [...this.getOwnEvents(), ...this.extensions.flatMap(e => e.getOwnEvents())];
  }
  getOwnEvents() {
    return [];
  }
  
  additionalVisibilities() {
    return [];
  }
  /*MD # Graph Interface MD*/
  addParent(other) {
    this.addEdge(new ParentEdge(this, other, this.graph));
  }

  addDependency(other, dependencyKey, ae) {
    other.addEventEdge(this);
    //this.addEdge(new DependencyEdge(this, other, this.graph, dependencyKey, ae));    
  }
  
  resetDependencies() {
    this.ins
      .filter(other => other instanceof EventEdge)
      .forEach(other => other.from.disconnectFrom(this));
  }

  addEventEdge(other, otherPort) {
    this.addEdge(new EventEdge(this, other, this.graph, otherPort));
  }

  // It is prefered to use the specialized methods above
  addEdge(edge) {
    if (!this.outs.some(other => edge.constructor === other.constructor && other.to === edge.to)) {
      this.outs.push(edge);
      edge.to.ins.push(edge);
    }
  }
  
  getEdgesTo(other) {
    return this.outs.filter(e => e.to === other);
  }

  disconnectFrom(otherNode) {
    this.outs = this.outs.filter(e => e.to !== otherNode);
    otherNode.ins = otherNode.ins.filter(e => e.from !== this);
  }

  resetEvents() {
    this.events = [];
  }

  addEvent(event, ae, other = undefined) {
    if (!this.events) this.events = [];
    this.events.push({ other, event });

    if (other) {
      this.addEventEdge(other);
    }
  }

  getEvents(to) {
    return this.events.filter(({ other, event }) => to === other);
  }

  get children() {
    return this.outs.filter(e => e.impliesParentage).map(e => e.to);
  }

  get parents() {
    return new Set(this.ins.filter(e => e.impliesParentage).map(e => e.from));
  }
  
  isAE() {
    return this.extensions.some(e => e instanceof AENodeExtension);
  }
  
  getAE() {
    return this.extensions.find(e => e instanceof AENodeExtension).aexpr;
  }
  

  // If i am visible: which other nodes adjacent to me should be visible too?
  enforcedAdjacentVisibilities() {
    const visibleNeighbours = this.ins.filter(e => e instanceof ParentEdge)
      .map(e => e.from);
    if(this.collapsedBy){
      visibleNeighbours.push(this.collapsedBy);
    }
    if(this.isAE()) {
      visibleNeighbours.push(...this.outs.filter(e => e instanceof EventEdge).map(e => e.to));
      visibleNeighbours.push(...this.ins.filter(e => e instanceof EventEdge && this.graph.isCurrentlyADependency(this.getAE(), e.from.dependencyKey)).map(e => e.from));
    }
    visibleNeighbours.push(...this.additionalVisibilities())
    return visibleNeighbours;
  }

  setVisibility(visible) {
    this.visibilityState = visible;
  }

  getVisibility() {
    return this.visibilityState;
  }

  setCurrentVisibility(visible) {
    this.visible = visible;
  }
  
  isCurrentlyVisible() {
    return !this.collapsedBy && this.visible;
  }

  getDOTNodes() {
    if (!this.isCurrentlyVisible()) return "";
    const nodeInfo = this.getInfoInner();
    nodeInfo[0] +=  "    " + (this.showContent ? "-" : "+");

    const locations = this.getAllLocations();
    if (locations.length > 0) {
      nodeInfo.push(this.pluralize(locations.length, "Location"));
    }
    const causedEvents = this.getCausedEventsInner();
    if (causedEvents.length > 0) {
      nodeInfo.push("Caused " + this.pluralize(causedEvents.length, "Event"));
    }
    const ownEvents = this.getOwnEventsInner();
    if (ownEvents.length > 0) {
      nodeInfo.push("Has " + this.pluralize(ownEvents.length, "Event"));
    }

    if (this.collapsing) {
      nodeInfo.push("Can be expanded");
    }
    const style = Object.assign({}, this.nodeOptions);
    if(this.isAE() && this.graph.getCurrentEvent().event.ae === this.getAE()) {
      style.penwidth = 3;
    }
    const formattedInfo = this.formattedInfo(this.showContent ? nodeInfo : [nodeInfo[0]], style);
    //const node = this.id + ` [shape="${this.htmlLabel ? "plaintext" : this.rounded ? "Mrecord" : "record"}" label=${formattedInfo}` + nodeOptionString + `]`;
    return  this.id + " " + formattedInfo;
  }
  
  htmlLine(line) {
    let string = "<TR><TD";
    if(line.PORT) {
      string += " PORT=\"" + line.PORT + "\"";
    }
    if(line.ISCODE) {
      string += " ALIGN=\"LEFT\" BALIGN=\"LEFT\"";
    }
    string += ">";
    if(line.FONT) {
      string += "<FONT " + Object.keys(line.FONT).map(key => key + "=\"" + line.FONT[key] + "\"").join(" ") + ">" + line.text + "</FONT>"
    } else if(line.text) {
      string += line.text;
    } else {
      string += line;
    }
    string += "</TD></TR>"
    return string.replaceAll("\n", "<BR/>");
  }

  formattedInfo(nodeInfo, nodeOptions) {
    if(this.htmlLabel) {
      const tableAttributes = {CELLBORDER:0, CELLSPACING:2};
      if(this.rounded) {
        tableAttributes.STYLE = "rounded";
      }
      if(nodeOptions.fillcolor) {
        if(nodeOptions.colorscheme) {
          tableAttributes.BGCOLOR = "/" + nodeOptions.colorscheme + "/" + nodeOptions.fillcolor;
        } else {
          tableAttributes.BGCOLOR = nodeOptions.fillcolor;
        }
      }
      const tableAttributeString = Object.keys(tableAttributes).map(key => key + "=\"" + tableAttributes[key] + "\"").join(" ");
      
      const formattedInfo = "<<TABLE " + tableAttributeString + ">" + nodeInfo.map(info => this.htmlLine(info)).join("<HR/>") + "</TABLE>>"
      return `[shape="plaintext" label=${formattedInfo}, style="solid"]`;
    } else {
      let nodeOptionString = Object.keys(nodeOptions).map(key => key + " = " + nodeOptions[key]).join(", ");
      if (nodeOptionString !== "") {
        nodeOptionString = ", " + nodeOptionString;
      }
      const formattedInfo = "\"{" + nodeInfo.map(info => this.escapeTextForDOTRecordLabel(info)).join("|") + "}\"";
      return `[shape="${this.rounded ? "Mrecord" : "record"}" label=${formattedInfo}` + nodeOptionString + `]`;
    }
  }

  getDOTEdges() {
    const start = this.collapsedBy || this;
    if (!start.isCurrentlyVisible()) return "";
    return this.outs.flatMap(e => e.getDOT());
  }

  /*MD # Collapse/Expand MD*/
  canCollapse() {
    return this.children.some(child => child.collapseableBy(this));
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
      locations.push(...node.getLocationsInner());
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
    const stack = this.children;
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
    inspectObject.node = this;
    inspectObject.nodeInfo = object;
    Object.assign(inspectObject.nodeInfo, ...this.extensions.flatMap(e => e.inspectionsObjects()));
    inspectObject.locations = locations;
    inspectObject.events = timlineEvents;
    menuItems.push(["inspect", () => {
      lively.openInspector(inspectObject);
    }, "", "l"]);

    if (this.canCollapse()) {
      menuItems.push([(this.collapsing ? "Expand" : "Collapse") + " Node", () => {
        this.toggleCollapse();
      }, "", ""]);
    }
    
    menuItems.push([this.showContent ? "Show less" : "Show more", () => {
      this.showContent = !this.showContent;
      this.graph.debouncedRerender();
    }, "", ""]);

    for (const additionalEntry of additionalEntries) {
      menuItems.push([additionalEntry.name, () => {
        additionalEntry.callback();
      }, "", ""]);
    }

    if (locations.length > 0) {
      const subMenuItems = [];
      locations.forEach((location, index) => {
        subMenuItems.push([fileNameString(location.file) + ":" + location.start.line, () => {
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

  
  escapeTextForDOTHTMLLabel(text) {
    if (!text) return "";
    text = text.toString();
    text = text.replaceAll("<", "&lt;");
    text = text.replaceAll(">", "&gt;");
    return text;
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