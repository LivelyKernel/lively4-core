"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import { debounce } from "utils";
import ContextMenu from 'src/client/contextmenu.js';
import GraphNode from "./graph-node.js";
import AExprNode from "./aexpr-node.js";
import ValueNode from "./value-node.js";
import IdentifierNode from "./identifier-node.js";
import groupBy from "src/external/lodash/lodash.js";
import { DependencyKey } from "src/client/reactive/active-expression-rewriting/active-expression-rewriting.js";
import { openLocationInBrowser, navigateToTimeline } from '../aexpr-debugging-utils.js';
//import d3 from "src/external/d3-graphviz.js"

export default class AexprGraph extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Graph";
    this.setWindowSize(1200, 800);
    let width = window.innerWidth;
    let height = window.innerHeight;
    this.graphViz = await (<d3-graphviz style="background:gray"></d3-graphviz>);

    this.graph.append(this.graphViz);
    //"dot", "neato", "fdp", "twopi", "circo"
    this.graphViz.engine = "dot";
    const graph = this;
    this.graphViz.config({
      onclick(data, evt, element) {
        // lively.showElement(element)
        //if(evt.ctrlKey) {} 
        const callback = graph.onClickMap.get(data.key);
        if (callback) {
          callback(evt);
        }
      }
    });

    /*containerElement.setAttribute("display", "flex");
    containerElement.children[0].setAttribute("display", "flex");
    setTimeout(() => {
      debugger;
      const svgElement = this.graphViz.shadowRoot.querySelector("svg");
      svgElement.setAttribute("height", "100%");
      svgElement.setAttribute("width", "100%");
    }, 10000);*/

    this.debouncedChange = this.reconstructGraph.debounce(50, 300);
    this.debouncedRerender = this.rerenderGraph.debounce(50, 300);
    this.debouncedEventChanged = this.selectEvent.debounce(50, 300);
    AExprRegistry.addEventListener(this, (ae, event) => {
      this.debouncedChange();
    });
    this.groupAEs.addEventListener('change', () => {
      this.debouncedChange();
    });
    this.showLocals.addEventListener('change', () => {
      this.objectNodes.forEach(node => {
        if (node.dependency && node.dependency.type() === "local") {
          node.setVisibility(this.showLocals.checked);
        }
      });
      this.debouncedRerender();
    });
    this.collapseAll.addEventListener('click', () => {
      this.allNodes().forEach(node => {
        if (node.parents.size === 0) {
          node.collapse();
        }
      });
      this.debouncedRerender();
    });
    this.extendAll.addEventListener('click', () => {
      this.allNodes().forEach(node => node.extend());
      this.debouncedRerender();
    });
    this.eventSlider.addEventListener('input', () => {
      this.debouncedEventChanged();
    });
    this.currentEventButton.addEventListener('click', () => {
      lively.openInspector(this.allEvents[this.eventSlider.value - 1]);
    });
    this.jumpInTimeline.addEventListener('click', () => {
      const { event, aeNode } = this.getCurrentEvent();

      navigateToTimeline(timeline => timeline.showEvents([event], aeNode.aexpr));
    });
    this.jumpToCode.addEventListener('click', () => {
      const { event, aeNode } = this.getCurrentEvent();
      openLocationInBrowser(event.value.trigger);
    });

    await this.reconstructGraph();
    const containerElement = this.graphViz.shadowRoot.querySelector("#container");
  }

  livelyPreMigrate() {
    AExprRegistry.removeEventListener(this);
  }

  detachedCallback() {
    AExprRegistry.removeEventListener(this);
  }

  getCurrentEvent() {
    const index = this.eventSlider.value - 1;
    const { event, aeNode } = this.allEvents[index];
    return { event, aeNode, index };
  }

  selectEvent() {
    const hasEvents = this.allEvents && this.allEvents.length > 0;
    this.jumpToCode.disabled = !hasEvents;
    this.jumpInTimeline.disabled = !hasEvents;
    this.currentEventButton.disabled = !hasEvents;
    if (!hasEvents) {
      this.eventSliderLabel.innerHTML = "?/?";
      this.eventType.innerHTML = "no event";
      return;
    }

    const { event, index } = this.getCurrentEvent();
    this.eventSliderLabel.innerHTML = this.eventSlider.value + "/" + this.allEvents.length;
    this.eventType.innerHTML = this.allEvents[index].event.type;
    this.jumpToCode.disabled = !event.value.trigger;

    this.reconstructGraphAtCurrentEvent();

    this.highlightSelectedEvent();
  }

  reconstructGraphAtCurrentEvent() {
    // delete current new nodes

    // calculate diff relative to current state
    this.changedDependencies = [];
    this.addedDependencies = [];
    this.removedDependencies = [];
    const keyToAEMap = new Map();
    const currentEventIndex = this.eventSlider.value - 1;
    for (let i = currentEventIndex; i < this.allEvents.length - 1; i++) {
      const { event, aeNode } = this.allEvents[i];
      const dependencyKey = event.value.dependency;
      keyToAEMap.set(dependencyKey, aeNode);
      switch (event.type) {
        case "changed value":
          if (!this.changedDependencies.some(dep => dep.equals(dependencyKey))) {
            this.changedDependencies.push(dependencyKey);
          }
          break;
        case "dependency removed":
          if (!this.addedDependencies.some(dep => dep.equals(dependencyKey))) {
            const removedIndex = this.removedDependencies.findIndex(dep => dep.equals(dependencyKey));
            if (removedIndex === -1) {
              this.addedDependencies.push(dependencyKey);
            } else {
              this.removedDependencies.splice(removedIndex, 1);
              if (!this.changedDependencies.some(dep => dep.equals(dependencyKey))) {
                this.changedDependencies.push(dependencyKey);
              }
            }
          }
          break;
        case "dependency added":
          if (!this.removedDependencies.some(dep => dep.equals(dependencyKey))) {
            const changedIndex = this.changedDependencies.findIndex(dep => dep.equals(dependencyKey));
            if (changedIndex !== -1) {
              this.changedDependencies.splice(changedIndex, 1);
            }
            this.removedDependencies.push(dependencyKey);
          }
          break;
      }
    }

    // adjust graph
    for(const dependencyKey of this.addedDependencies) {
      const dependencyNode = this.createDependencyNodeFromKey(dependencyKey)
      keyToAEMap.get(dependencyKey).connectTo(dependencyNode, { color: "orangered4" });
      this.valueNodes.getOrCreate(dependencyKey.context, () => new ValueNode(dependencyKey.context, this)).connectTo(dependencyNode, {}, true);
    }
    for(const dependencyKey of this.changedDependencies) {
      const dependencyNode = this.createDependencyNodeFromKey(dependencyKey)
      dependencyNode.nodeOptions = {color: "green"};
    }
    this.debouncedRerender();
  }

  highlightSelectedEvent() {
    const { event, aeNode } = this.getCurrentEvent();
    if (this.highlightedEdges) {
      this.highlightedEdges.forEach(highlightedEdge => highlightedEdge.option.color = highlightedEdge.originalColor);
      this.highlightedEdges = undefined;
      this.debouncedRerender();
    }
    if (event.value && event.value.dependency && event.type === "changed value") {
      const dependencyKey = event.value.dependency;
      const dependency = dependencyKey.getDependency();
      let identifierNodeKey = [...this.objectNodes.keys()].find(node => dependencyKey.equals(node));
      if (identifierNodeKey) {
        const identifierNode = this.objectNodes.get(identifierNodeKey);
        const options = this.eventEdgeOptions(aeNode, identifierNode);
        if (options) {
          this.highlightedEdges = options.map(option => ({ option, originalColor: option.color }));
          options.forEach(option => {
            option.color = "orange";
          });
        }
      }
      this.debouncedRerender();
    }
  }

  eventEdgeOptions(aeNode, identifierNode) {
    return identifierNode.getEdgesTo(aeNode).filter(option => option.color === "blue");
  }

  allNodes() {
    return [...this.aeNodes.values(), ...this.objectNodes.values(), ...this.valueNodes.values()];
  }

  async rerenderGraph() {
    await this.graphViz.setDotData(this.graphData());
  }

  async reconstructGraph() {
    this.aeNodes = new Map();
    this.objectNodes = new Map();
    this.valueNodes = new Map();

    this.onClickMap = new Map();

    let aeLocationString = ae => {
      const location = ae.meta().get("location");
      return location.file + ":" + location.start.line + ":" + location.start.column;
    };

    this.allEvents = [];

    const aes = this.overrideAExprs || AExprRegistry.allAsArray().slice(0, 50);
    const aeGroups = aes.groupBy(ae => this.groupAEs.checked ? aeLocationString(ae) : ae.meta().get("id"));
    for (const aeGroupKey of Object.keys(aeGroups)) {
      const aeGroup = aeGroups[aeGroupKey];
      const aeNode = this.aeNodes.getOrCreate(aeGroup[0], () => new AExprNode(aeGroup[0], this));
      // Create AEs and Dependencies
      for (const ae of aeGroup) {
        for (const dep of ae.dependencies().all()) {
          const [context, identifier, value] = dep.contextIdentifierValue();
          const objectNode = this.getOrCreateByDependencyKey(this.objectNodes, dep.getKey(), () => new IdentifierNode(identifier, this));
          await objectNode.setDependency(dep);

          if (!this.isPrimitive(value)) {
            const valueNode = this.valueNodes.getOrCreate(value, () => new ValueNode(value, this));
            objectNode.connectTo(valueNode, { color: "gray50" }, true);
          }

          aeNode.connectTo(objectNode, { color: "orangered4" });
        }
      }

      // Show parent relations between the Objects
      for (const ae of aeGroup) {
        for (const dep of ae.dependencies().all()) {
          const [context, identifier, value] = dep.contextIdentifierValue();
          const objectNode = this.getOrCreateByDependencyKey(this.objectNodes, dep.getKey(), () => new IdentifierNode(identifier, this));

          //if(dep.type() === "member") {
          this.valueNodes.getOrCreate(context, () => new ValueNode(context, this, dep.type() !== "member")).connectTo(objectNode, {}, true);
          /*this.getOrCreateByIdentifier(this.objectNodes, context, () => new IdentifierNode(context.toString(), this))
            .forEach(contextNode => contextNode.connectTo(objectNode, {color: "gray75"})); */
          //}
        }
      }

      // Show events that changed the AE
      for (const ae of aes) {
        let events = ae.meta().get("events");
        for (const event of events || []) {
          this.allEvents.push({ event, aeNode });
          if (event.value && event.value.dependency && event.type === "changed value") {
            const dependencyKey = event.value.dependency;
            const dependencyNode = this.createDependencyNodeFromKey(dependencyKey);
            
            const edgeOptions = { color: "blue" };
            if(!dependencyKey.getDependency()) {
              edgeOptions.taillabel = "untracked";
            }
            dependencyNode.connectTo(aeNode, edgeOptions);
            
            dependencyNode.addEvent(ae, event);
          }
        }
      }
    }
    this.allEvents.sort((event1, event2) => event1.event.timestamp < event2.event.timestamp);
    this.eventSlider.max = this.allEvents.length;
    this.eventSlider.value = this.allEvents.length;

    //Connect members of values to their nodes if they already exist
    this.valueNodes.forEach((node, value) => {
      for (const key of Object.keys(value)) {
        if (this.valueNodes.has(value[key])) {
          const contextAndIdentifier = new DependencyKey(value, key);
          if (![...this.objectNodes.keys()].some(dependencyKey => contextAndIdentifier.equals(dependencyKey))) {
            const variableNode = new IdentifierNode(key, this);

            node.connectTo(variableNode, {}, true);
            variableNode.connectTo(this.valueNodes.get(value[key]), { color: "gray50" }, true);
            this.objectNodes.set(contextAndIdentifier, variableNode);
          }
        }
      }
    });
    this.selectEvent();
    this.rerenderGraph();
  }

  createDependencyNodeFromKey(dependencyKey) {
    return this.getOrCreateByDependencyKey(this.objectNodes, dependencyKey, () => new IdentifierNode(dependencyKey.identifier, this));
  }

  graphData() {
    return `digraph {
      graph [  splines="ortho" overlap="false" compound="true" ];
      node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
      edge [  fontname="Arial"  fontsize="8" ];

      subgraph clusterAE {
        graph[color="#00ffff"];
        ${[...this.aeNodes.values()].map(n => n.getDOTNodes()).join("\n")}
        label = "AEs";
      }
      subgraph clusterObjects {
        graph[color="#ff00ff"];
        ${[...this.objectNodes.values()].map(n => n.getDOTNodes()).join("\n")}
        ${[...this.valueNodes.values()].map(n => n.getDOTNodes()).join("\n")}
        label = "Objects";
      }
      ${[...this.aeNodes.values()].map(n => n.getDOTEdges()).join("\n")}
      ${[...this.objectNodes.values()].map(n => n.getDOTEdges()).join("\n")}
      ${[...this.valueNodes.values()].map(n => n.getDOTEdges()).join("\n")}

    }`;
  }

  getOrCreateByDependencyKey(nodes, key, creator) {
    let nodeKey = [...nodes.keys()].find(node => key.equals(node));
    let node;
    if (!nodeKey) {
      node = creator();
      nodes.set(key, node);
    } else {
      node = nodes.get(nodeKey);
    }
    return node;
  }

  getOrCreateByIdentifier(nodes, context, creator) {
    let nodeKeys = [...nodes.keys()].filter(node => node.context && context === node.context[node.identifier] || context === node);
    let foundNodes;
    if (nodeKeys.length === 0) {
      foundNodes = [creator()];
      nodes.set(context, foundNodes[0]);
    } else {
      foundNodes = nodeKeys.map(nodeKey => nodes.get(nodeKey));
    }
    return foundNodes;
  }

  isPrimitive(object) {
    return object !== Object(object);
  }

  setAExprs(aexprs) {
    this.overrideAExprs = aexprs;
    if (this.debouncedChange) this.debouncedChange();
  }

  livelyMigrate(other) {}

  async livelyExample() {}

  get graph() {
    return this.get("#graph");
  }

  get groupAEs() {
    return this.get("#groupAEs");
  }

  get showLocals() {
    return this.get("#showLocals");
  }

  get collapseAll() {
    return this.get("#collapseAll");
  }

  get extendAll() {
    return this.get("#extendAll");
  }

  get eventSlider() {
    return this.get("#eventSlider");
  }

  get eventSliderLabel() {
    return this.get("#eventSliderLabel");
  }

  get currentEventButton() {
    return this.get("#currentEventButton");
  }

  get eventType() {
    return this.get("#eventType");
  }

  get jumpInTimeline() {
    return this.get("#jumpInTimeline");
  }

  get jumpToCode() {
    return this.get("#jumpToCode");
  }

}