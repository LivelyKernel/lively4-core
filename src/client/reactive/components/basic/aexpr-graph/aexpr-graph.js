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
import AExprOverview from '../aexpr-overview.js';
//import d3 from "src/external/d3-graphviz.js"

export default class AexprGraph extends Morph {
  async initialize() {
    this.aeNodes = new Map();
    this.identifierNodes = new Map();
    this.valueNodes = new Map();

    this.onClickMap = new Map();
    this.allEvents = [];

    this.highlightedDependencies = [];
    this.deletedIdentifiers = [];

    this.windowTitle = "Active Expression Graph";
    this.setWindowSize(1200, 800);
    let width = window.innerWidth;
    let height = window.innerHeight;
    this.graphViz = await (<d3-graphviz style="background:gray"></d3-graphviz>);

    this.graph.append(this.graphViz);
    //"dot", "neato", "fdp", "twopi", "circo"
    this.graphViz.engine = "dot";
    this.graphViz.transition = false;
    const graph = this;
    this.graphViz.config({
      onclick(data, evt, element) {
        const callback = graph.onClickMap.get(data.key);
        if (callback) {
          callback(evt);
        }
      }
    });

    this.aexprOverview = new AExprOverview(this.aeOverview);
    this.aexprOverview.onChange(() => {
      this.debouncedDataChange();
    });
    this.aexprOverview.setAexprs(AExprRegistry.allAsArray());

    /*containerElement.setAttribute("display", "flex");
    containerElement.children[0].setAttribute("display", "flex");
    setTimeout(() => {
      debugger;
      const svgElement = this.graphViz.shadowRoot.querySelector("svg");
      svgElement.setAttribute("height", "100%");
      svgElement.setAttribute("width", "100%");
    }, 10000);*/

    this.debouncedRerender = this.rerenderGraph.debounce(50, 300);
    this.debouncedDataChange = this.dataChanged.debounce(50, 300);
    this.debouncedRegistryChange = (() => {
      this.aexprOverview.setAexprs(AExprRegistry.allAsArray());
      this.dataChanged();
    }).debounce(50, 300);
    this.debouncedEventChanged = this.selectEvent.debounce(50, 100);
    this.debouncedReconstruct = this.reconstructGraph.debounce(50, 100);
    this.dataChanged();
    this.setupEvents();

    const containerElement = this.graphViz.shadowRoot.querySelector("#container");
  }

  setupEvents() {
    AExprRegistry.addEventListener(this, (ae, event) => {
      this.debouncedRegistryChange();
    });
    this.eventSlider.addEventListener('input', () => {
      this.debouncedEventChanged();
    });
    /*
    this.groupAEs.addEventListener('change', () => {
      this.debouncedReconstruct();
    });*/
    this.showLocals.addEventListener('change', () => {
      this.debouncedReconstruct();
    });
    this.collapseAll.addEventListener('click', () => {
      this.allNodes().forEach(node => {
        if (node.parents.size === 0 && node.isVisible()) {
          node.collapse();
        }
      });
      this.debouncedRerender();
    });
    this.extendAll.addEventListener('click', () => {
      this.allNodes().forEach(node => {
        if (node.isVisible()) {
          node.extend();
        }
      });
      this.debouncedRerender();
    });

    this.currentEventButton.addEventListener('click', () => {
      lively.openInspector(this.allEvents[this.eventSlider.value - 1]);
    });
    this.jumpInTimeline.addEventListener('click', () => {
      const { event, ae } = this.getCurrentEvent();

      navigateToTimeline(timeline => timeline.showEvents([event], ae));
    });
    this.jumpToCode.addEventListener('click', () => {
      const { event } = this.getCurrentEvent();
      openLocationInBrowser(event.value.trigger);
    });
  }

  dataChanged() {
    const oldEvent = this.getCurrentEvent();
    this.allEvents = this.getAEs().flatMap(ae => ae.meta().get("events").map(event => ({ event, ae: ae }))).sort((event1, event2) => event1.event.timestamp < event2.event.timestamp);

    // Update AE nodes    
    this.aeNodes.forEach((node, value) => {
      node.setVisibility(false);
    });
    const aes = this.getAEs();
    for (const ae of aes) {
      const aeNode = this.aeNodes.getOrCreate(ae, () => new AExprNode(ae, this));
      aeNode.setVisibility(true);
    }
    /*const aeGroups = aes.groupBy(ae => this.groupAEs.checked ? this.aeLocationString(ae) : ae.meta().get("id"));
    for (const aeGroupKey of Object.keys(aeGroups)) {
      const aeGroup = aeGroups[aeGroupKey];
      const aeNode = this.aeNodes.getOrCreate(aeGroup[0], () => new AExprNode(aeGroup[0], this));
      aeNode.setVisibility(true);
    }*/

    const index = this.allEvents.findIndex(({ event, ae }) => event === (oldEvent && oldEvent.event));
    this.eventSlider.max = this.allEvents.length;
    if (index >= 0) {
      this.eventSlider.value = index + 1;
    } else {
      this.eventSlider.value = this.allEvents.length;
    }

    this.selectEvent();
  }

  getCurrentEvent() {
    if (this.eventSlider.max === "0") return undefined;
    const index = this.eventSlider.value - 1;
    const { event, ae } = this.allEvents[index];
    return { event, ae, index };
  }

  selectEvent() {
    const hasEvents = this.allEvents && this.allEvents.length > 0;
    this.jumpToCode.disabled = !hasEvents;
    this.jumpInTimeline.disabled = !hasEvents;
    this.currentEventButton.disabled = !hasEvents;
    if (!hasEvents) {
      this.eventSliderLabel.innerHTML = "?/?";
      this.eventType.innerHTML = "no event";
    } else {
      const { event, index } = this.getCurrentEvent();
      this.eventSliderLabel.innerHTML = this.eventSlider.value + "/" + this.allEvents.length;
      this.eventType.innerHTML = this.allEvents[index].event.type;
      this.jumpToCode.disabled = !event.value || !event.value.trigger;
    }

    this.reconstructGraph();
  }

  async reconstructGraph() {

    // calculate diff relative to present state
    const changedDependencies = [];

    // calculate all new Dependencies: present dependencies - removedDependencies + addedDependencies
    const newDependencies = new Map();
    for (const ae of this.getAEs()) {
      ae.dependencies().all().forEach(dep => {
        let key = [...newDependencies.keys()].find(dep2 => dep2.equals(dep.getKey()));
        if (!key) {
          key = dep.getKey();
          newDependencies.set(key, []);
        }
        newDependencies.get(key).push(ae);
      });
    }
    const currentEventIndex = this.eventSlider.value - 1;
    for (let i = this.allEvents.length - 1; i > currentEventIndex; i--) {
      const { event, ae } = this.allEvents[i];
      if (!event.value) continue;
      switch (event.type) {
        case "changed value":
          {
            const dependencyKey = event.value.dependency;
            if (!changedDependencies.some(dep => dep.equals(dependencyKey))) {
              changedDependencies.push(dependencyKey);
            }
          }
          break;

        case "dependencies changed":
          {
            const removed = [...event.value.removed];
            const added = [...event.value.added];
            for (const match of event.value.matching) {
              removed.push(match.removed);
              added.push(match.added);
            }
            for (const dependencyKey of removed) {
              const { key, value } = this.findInMap(newDependencies, dep => dep.equals(dependencyKey));
              if (key) {
                const index = value.findIndex(aexpr => aexpr === ae);
                if (index >= 0) {
                  value.push(ae);
                }
              } else {
                newDependencies.set(dependencyKey, [ae]);
              }
            }
            for (const dependencyKey of added) {
              const { key, value } = this.findInMap(newDependencies, dep => dep.equals(dependencyKey));
              if (key) {
                const index = value.findIndex(aexpr => aexpr === ae);
                if (index >= 0) {
                  value.splice(index, 1);
                }
                if (value.length === 0) {
                  changedDependencies.push(dependencyKey);
                  newDependencies.delete(key);
                }
              }
            }
          }
          break;
      }
    }

    await this.updateGraph(newDependencies, changedDependencies);
    this.updateEventArrows();
    await this.updateDependencyArrow();
    this.debouncedRerender();
  }

  async updateGraph(newDependencies, outdatedDependencies) {
    const currentDependencies = [...this.identifierNodes.keys()];
    // Make all current invisible
    currentDependencies.forEach(dep => this.identifierNodes.get(dep).setVisibility(false));
    currentDependencies.forEach(dep => this.identifierNodes.get(dep).setOutdated(false));

    // Add new Dependencies and make them visible
    for (const [addedDependency, aes] of newDependencies) {
      const identifierNode = await this.constructIdentifierNode(addedDependency, aes);      
      identifierNode.setVisibility(true);
    }
    
    // Mark outdated
    outdatedDependencies.forEach(dep => {
      const node = this.findInMap(this.identifierNodes, key => key.equals(dep));
      if (node.value) node.value.setOutdated(true);
    });

    // Ignore locals if the button is not checked
    if (!this.showLocals.checked) {
      this.identifierNodes.forEach(node => {
        const dependency = node.dependencyKey.getDependency();
        if (dependency && dependency.type() === "local") {
          node.setVisibility(false);
        }
      });
    }


    // Connect members of values to their nodes if they already exist
    this.valueNodes.forEach((node, value) => {
      let valueObject = value;
      if (value instanceof Set) {
        valueObject = [...value];
      }
      let keys = Object.keys(valueObject);
      if (value instanceof Map) {
        keys = value.keys();
      }
      for (const key of keys) {
        const contextAndIdentifier = new DependencyKey(value, key);
        const thisValue = contextAndIdentifier.getValue();
        if (this.isPrimitive(thisValue)) continue;
        if (this.valueNodes.has(thisValue)) {
          const contextAndIdentifier = new DependencyKey(value, key);
          const keyInMap = [...this.identifierNodes.keys()].find(dependencyKey => contextAndIdentifier.equals(dependencyKey));
          if (!keyInMap) {
            const variableNode = new IdentifierNode(contextAndIdentifier, this);

            node.connectTo(variableNode, {}, true);
            variableNode.connectTo(this.valueNodes.get(thisValue), { color: "gray50" }, true);
            this.identifierNodes.set(contextAndIdentifier, variableNode);
          } else {
            if (node.isVisible() && this.valueNodes.get(thisValue).isVisible()) {
              this.identifierNodes.get(keyInMap).setVisibility(true);
            }
          }
        }
      }
    });
  }

  async constructIdentifierNode(dependencyKey, aes) {
    const identifier = dependencyKey.identifier;
    const context = dependencyKey.context;
    const value = context[identifier];
    const identifierNode = this.getOrCreateByDependencyKey(this.identifierNodes, dependencyKey, () => new IdentifierNode(dependencyKey, this));

    for (const ae of aes) {
      const aeNode = this.getAENode(ae);
      aeNode.addDependency(identifierNode);
    }

    await identifierNode.loadLocations();
    this.valueNodes.getOrCreate(context, () => new ValueNode(context, this, false /*TODO: How to identify scope*/)).connectTo(identifierNode, {}, true);

    if (!this.isPrimitive(value)) {
      const valueNode = this.valueNodes.getOrCreate(value, () => new ValueNode(value, this));
      identifierNode.connectTo(valueNode, { color: "gray50" }, true);
    }
    return identifierNode;
  }

  updateEventArrows() {
    this.identifierNodes.forEach(node => node.resetEvents());
    for (let i = 0; i < Math.min(this.eventSlider.value, this.eventSlider.max); i++) {
      const { event, ae } = this.allEvents[i];

      if (event.value && event.value.dependency && event.type === "changed value") {
        const dependencyKey = event.value.dependency;
        let identifierNodeKey = [...this.identifierNodes.keys()].find(node => dependencyKey.equals(node));
        if (identifierNodeKey) {
          const identifierNode = this.identifierNodes.get(identifierNodeKey);
          identifierNode.addEvent(ae, this.getAENode(ae), event, i === this.eventSlider.value - 1);
        }
      }
    }
  }

  async updateDependencyArrow() {
    for (const highlighted of this.highlightedDependencies) {
      highlighted.aeNode.removeHighlight(highlighted.identifierNode);
    }
    this.highlightedDependencies = [];
    for (const deleted of this.deletedIdentifiers) {
      deleted.setDeleted(false);
    }
    this.deletedIdentifiers = [];
    //this.aeNodes.forEach(node => node.resetDependencies());
    const currentEvent = this.getCurrentEvent();
    if (!currentEvent) return;
    const { event, ae } = currentEvent;

    if (event.type === "dependencies changed") {
      for (const added of event.value.added) {
        let identifierNodeKey = [...this.identifierNodes.keys()].find(node => added.equals(node));
        if (identifierNodeKey) {
          const identifierNode = this.identifierNodes.get(identifierNodeKey);
          const aeNode = this.getAENode(ae);
          aeNode.highlightDependency(identifierNode);
          this.highlightedDependencies.push({ aeNode, identifierNode });
        }
      }
      for (const removed of event.value.removed) {
        const identifierNode = await this.constructIdentifierNode(removed, []);
        identifierNode.setDeleted(true);
        this.deletedIdentifiers.push(identifierNode);
      }
    }
  }

  async rerenderGraph() {
    const preGraph = this.graphViz.shadowRoot.querySelector("#graph0");
    let transform;
    if (preGraph) {
      transform = preGraph.getAttribute("transform");
    }
    await this.graphViz.update(this.graphData());
    if (preGraph) {
      this.graphViz.shadowRoot.querySelector("#graph0").setAttribute("transform", transform);
      //this.graphViz.shadowRoot.querySelector("#graph0").transform = preGraph.transform;
    }
  }

  graphData() {
    return `digraph {
      graph [  splines="ortho" overlap="false" compound="true" ];
      node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
      edge [  fontname="Arial"  fontsize="8" ];

      subgraph clusterAE {
        graph[color="#00ffff"];
        ${[...this.aeNodes.values()].map(n => n.getDOTNodes()).filter(n => n.length > 0).join("\n")}
        label = "AEs";
      }
      subgraph clusterObjects {
        graph[color="#ff00ff"];
        ${[...this.identifierNodes.values()].map(n => n.getDOTNodes()).filter(n => n.length > 0).join("\n")}
        ${[...this.valueNodes.values()].map(n => n.getDOTNodes()).filter(n => n.length > 0).join("\n")}
        label = "Objects";
      }
      ${[...this.aeNodes.values()].map(n => n.getDOTEdges()).filter(n => n.length > 0).join("\n")}
      ${[...this.identifierNodes.values()].map(n => n.getDOTEdges()).filter(n => n.length > 0).join("\n")}
      ${[...this.valueNodes.values()].map(n => n.getDOTEdges()).filter(n => n.length > 0).join("\n")}

    }`;
  }

  /*MD # Datasctructure Management MD*/

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

  allNodes() {
    return [...this.aeNodes.values(), ...this.identifierNodes.values(), ...this.valueNodes.values()];
  }

  getAENodes(aes) {
    return aes.groupBy(ae => this.getGroupingAttribute(ae));
  }

  getAENode(ae) {
    const key = [...this.aeNodes.keys()].find(key => this.getGroupingAttribute(ae) === this.getGroupingAttribute(key));
    return this.aeNodes.get(key);
  }

  aeLocationString(ae) {
    const location = ae.meta().get("location");
    return location.file + ":" + location.start.line + ":" + location.start.column;
  }

  getGroupingAttribute(ae) {
    return this.groupAEs && this.groupAEs.checked ? this.aeLocationString(ae) : ae.meta().get("id");
  }

  getAEs() {
    return this.aexprOverview.getSelectedAEs();
  }

  /*MD # Utility MD*/

  findInMap(map, lambda) {
    const key = [...map.keys()].find(lambda);
    return { key, value: map.get(key) };
  }

  isPrimitive(object) {
    return object !== Object(object);
  }
  /*MD # Interface MD*/
  filterToAEs(aes) {
    this.aexprOverview.filterToAEs(aes);
  }

  setAExprs(aexprs, selectedEvent) {
    this.filterToAEs(aexprs);
    this.dataChanged();
    const index = this.allEvents.findIndex(({ event, ae }) => event === selectedEvent);
    this.eventSlider.value = index + 1;
    this.debouncedEventChanged();
  }

  /*MD # Morph MD*/

  livelyMigrate(other) {}

  async livelyExample() {}

  livelyPreMigrate() {
    AExprRegistry.removeEventListener(this);
  }

  detachedCallback() {
    AExprRegistry.removeEventListener(this);
  }

  /*MD # HTML Getter MD*/

  get aeOverview() {
    return this.get("#aeOverview");
  }

  get graph() {
    return this.get("#graph");
  }
  /*
  get groupAEs() {
    return this.get("#groupAEs");
  }*/

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