"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import { debounce } from "utils";
import ContextMenu from 'src/client/contextmenu.js';
import GraphNode from "./graph-node.js";
import AExprNode from "./aexpr-node.js";
import ValueNode from "./value-node.js";
import CallbackNode from "./callback-node.js";
import IdentifierNode from "./identifier-node.js";
import EventEdge from "./event-edge.js";
import groupBy from "src/external/lodash/lodash.js";
import { DependencyKey } from "src/client/reactive/active-expression-rewriting/active-expression-rewriting.js";
import { openLocationInBrowser, navigateToTimeline } from '../aexpr-debugging-utils.js';
import AExprOverview from '../aexpr-overview.js';

export default class AexprGraph extends Morph {
  async initialize() {
    let resolveFunction;
    this.initPromise = new Promise((resolve, reject) => {
      resolveFunction = resolve;
    })
    this.aeNodes = new Map();
    this.identifierNodes = new Map();
    this.valueNodes = new Map();
    this.callbackNodes = new Map();

    this.onClickMap = new Map();
    this.allEvents = [];

    this.highlightedDependencies = [];
    this.deletedIdentifiers = [];
    this.eventsChangedCallback = [];

    this.windowTitle = "Active Expression Graph";
    this.setWindowSize(1200, 800);    

    this.aexprOverview = new AExprOverview(this.aeOverview);
    this.aexprOverview.setAexprs(AExprRegistry.allAsArray());

    this.debouncedRerender = this.rerenderGraph.debounce(50, 300);
    this.debouncedDataChange = this.dataChanged.debounce(50, 300);
    this.debouncedRegistryChange = (() => {
      this.aexprOverview.setAexprs(AExprRegistry.allAsArray());
      this.dataChanged();
    }).debounce(50, 300);
    this.debouncedEventChanged = this.selectEvent.debounce(50, 100);
    this.debouncedReconstruct = this.reconstructGraph.debounce(50, 100);
    
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
    
    this.dataChanged();
    this.setupEvents();

    const containerElement = this.graphViz.shadowRoot.querySelector("#container");
    resolveFunction();
  }

  setupEvents() {
    AExprRegistry.addEventListener(this, (ae, event) => {
      this.debouncedRegistryChange();
    });
    
    this.aexprOverview.onChange(() => {
      this.debouncedDataChange();
    });
    
    this.eventSlider.addEventListener('input', () => {
      this.debouncedEventChanged();
    });
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

  onEventsChanged(callback) {
    callback(this.allEvents);
    this.eventsChangedCallback.push(callback);
  }
  
  async dataChanged() {
    const oldEvent = this.getCurrentEvent();
    this.allEvents = this.getAEs()
      .flatMap(ae => ae.meta().get("events").map(event => ({ event, ae: ae })))
      .sort((event1, event2) => event1.event.timestamp - event2.event.timestamp);

    this.eventsChangedCallback.forEach(cb => cb(this.allEvents));
    // Update AE nodes    
    this.aeNodes.forEach((node, value) => {
      node.setVisibility(false);
    });
    const aes = this.getAEs();
    for (const ae of aes) {
      const aeNode = await this.getOrCreateAENode(ae);
      aeNode.setVisibility(true);
    }
    
    const index = this.allEvents.findIndex(({ event, ae }) => event === (oldEvent && oldEvent.event));
    this.eventSlider.max = this.allEvents.length;
    if (index >= 0) {
      this.eventSlider.value = index + 1;
    } else {
      this.eventSlider.value = this.allEvents.length;
    }

    this.selectEvent();
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
    if(this.allEvents.length === 0) return;

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
            event.value.triggers.forEach(({dependency}) => {
              if (!changedDependencies.some(dep => dep.equals(dependency))) {
                changedDependencies.push(dependency);
              }
            });
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
    
    this.currentValuePerAE = new Map();
    const newCallbacks = new Map();
    for (let i = 0; i <= currentEventIndex; i++) {
      const { event, ae } = this.allEvents[i];
      if (!event.value) continue;
      switch (event.type) {
        case "created":
        case "changed value":
          this.currentValuePerAE.set(ae, event.value.value)
          break;
        case "callback added": 
          {
            newCallbacks.set(event.value.callback, {source: event.value.originalSource, ae})
          }
          break;
        case "callback removed": 
          {
            newCallbacks.delete(event.value.callback);         
          }
          break;
        }
    }

    await this.updateGraph(newDependencies, changedDependencies, newCallbacks);
    
    
    this.updateEventArrows();
    await this.updateDependencyArrow();
    this.debouncedRerender();
  }

  async updateGraph(newDependencies, outdatedDependencies, newCallbacks) {
    const currentCallbacks = [...this.callbackNodes.keys()];
    currentCallbacks.forEach(cb => this.callbackNodes.get(cb).setVisibility(false));
    
    for (const [callback, {source, ae, dependency}] of newCallbacks) {
      if(ae.isDataBinding()) continue;
      const callbackNode = this.callbackNodes.getOrCreate(callback, () => new CallbackNode(callback, this, source && source.sourceCode));
      const aeNode = this.getAENode(ae);
      //aeNode.addEventEdge(callbackNode, EventEdge.AEEventFilter(ae, callback)); //TODO: Make parent relationship   
      callbackNode.addParent(aeNode);
      callbackNode.setVisibility(true);
    }    
    
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
    this.valueNodes.forEach((node, context) => {
      let contextObject = context;
      if (context instanceof Set) {
        contextObject = [...context];
      }
      let keys = Object.keys(contextObject);
      if (context instanceof Map) {
        keys = context.keys();
      }
      for (const identifier of keys) {
        const contextAndIdentifier = new DependencyKey(context, identifier);
        const value = contextAndIdentifier.getValue();
        if (this.isPrimitive(value)) continue;
        if (context === value) continue;
        if (this.valueNodes.has(value)) {
          const keyInMap = [...this.identifierNodes.keys()].find(dependencyKey => contextAndIdentifier.equals(dependencyKey));
          if (!keyInMap) {
            const variableNode = new IdentifierNode(contextAndIdentifier, this);

            node.addParent(variableNode);
            variableNode.addParent(this.valueNodes.get(value));
            this.identifierNodes.set(contextAndIdentifier, variableNode);
          } else {
            if (node.isVisible() && this.valueNodes.get(value).isVisible()) {
              this.identifierNodes.get(keyInMap).setVisibility(true);
            }
          }
        }
      }
    });
  }

  updateEventArrows() {
    this.identifierNodes.forEach(node => node.resetEvents());
    this.callbackNodes.forEach(node => node.resetEvents());
    for (let i = 0; i < Math.min(this.eventSlider.value, this.eventSlider.max); i++) {
      const { event, ae } = this.allEvents[i];

      if (event.value && event.type === "changed value") {
        event.value.triggers.forEach(({dependency, parentAE, parentCallback}) => {
          let identifierNodeKey = [...this.identifierNodes.keys()].find(node => dependency.equals(node));
          if (identifierNodeKey) {
            const identifierNode = this.identifierNodes.get(identifierNodeKey);
            const aeNode = this.getAENode(ae);
            if(aeNode) {
              identifierNode.addEvent(event, ae, aeNode);
            }

            if(parentAE) {
              const callbackNode = this.callbackNodes.get(parentCallback);
              if(callbackNode) {
                callbackNode.addEvent(event, ae, identifierNode);
                const parentAENode = this.getAENode(parentAE);
                if(parentAENode) {
                  parentAENode.addEvent(event, ae, callbackNode);
                }
              }
            }
          }
        });
        
      }
    }
  }
  
  async updateDependencyArrow() {
    for (const deleted of this.deletedIdentifiers) {
      deleted.setDeleted(false);
    }
    this.deletedIdentifiers = [];
    
    const currentEvent = this.getCurrentEvent();
    if (!currentEvent) return;
    const { event, ae } = currentEvent;

    if (event.type === "dependencies changed") {
      for (const removed of event.value.removed) {
        //Todo: Should only be removed if it has no other AEs where it is still a dependency
        const identifierNode = await this.constructIdentifierNode(removed, [ae]);
        identifierNode.setDeleted(true);
        this.deletedIdentifiers.push(identifierNode);
      }
    }
  }

  async rerenderGraph() {
    const preGraph = this.graphViz.shadowRoot.querySelector("#graph0");
    let transform;
    let viewBox;
    if (preGraph) {
      transform = preGraph.getAttribute("transform");
      const preGraphSvgElement = preGraph.parentElement;
      viewBox = preGraphSvgElement.getAttribute("viewBox");
    }
    await this.graphViz.update(this.graphData());
    const postGraph = this.graphViz.shadowRoot.querySelector("#graph0");
    if(!postGraph) return;
    const svgElement = postGraph.parentElement;
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    if (preGraph) {
      postGraph.setAttribute("transform", transform);
      svgElement.setAttribute("viewBox", viewBox)
    }
  }

  graphData() {
    const nodeDOT = (nodes) => nodes.flatMap(n => n.getDOTNodes()).filter(n => n.length > 0).join("\n");
    const edgeDOT = (nodes) => nodes.flatMap(n => n.getDOTEdges()).filter(n => n.length > 0).join("\n");
  
    return `digraph {
      graph [  splines="ortho" overlap="false" compound="true"];
      node [ style="filled"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
      edge [  fontname="Arial"  fontsize="8" ];

      subgraph clusterAE {
        graph[];
        ${nodeDOT([...this.aeNodes.values()])}
        ${nodeDOT([...this.callbackNodes.values()])}
        label = "AEs";
      }
      subgraph clusterObjects {
        graph[];
        ${nodeDOT([...this.identifierNodes.values()])}
        ${nodeDOT([...this.valueNodes.values()])}
        label = "Objects";
      }
      ${edgeDOT([...this.aeNodes.values()])}
      ${edgeDOT([...this.identifierNodes.values()])}
      ${edgeDOT([...this.valueNodes.values()])}
      ${edgeDOT([...this.callbackNodes.values()])}
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
  

  async constructIdentifierNode(dependencyKey, aes = [], databindingAE) {
    const identifier = dependencyKey.identifier;
    const context = dependencyKey.context;
    const value = context[identifier];
    const identifierNode = this.getOrCreateByDependencyKey(this.identifierNodes, dependencyKey, () => new IdentifierNode(dependencyKey, this));

    for (const ae of aes) {
      const aeNode = this.getAENode(ae);
      aeNode.setVisibility(true);
      aeNode.addDependency(identifierNode, dependencyKey, ae);
    }

    if(databindingAE) {
      identifierNode.setDatabinding(databindingAE);
    }
    
    await identifierNode.loadLocations();
    this.valueNodes.getOrCreate(context, () => new ValueNode(context, this)).addParent(identifierNode);

    if (!this.isPrimitive(value)) {
      const valueNode = this.valueNodes.getOrCreate(value, () => new ValueNode(value, this));
      identifierNode.addParent(valueNode);
    }
    return identifierNode;
  }
  
  async getOrCreateAENode(ae) {
    if(ae.isDataBinding()) {
      return await this.constructIdentifierNode(ae.getDataBindingDependencyKey(), [], ae);
    } else {
      return this.aeNodes.getOrCreate(ae, () => new AExprNode(ae, this, {}));
    }
  }

  getAENode(ae) {
    if(ae.isDataBinding()) {
      const key = ae.getDataBindingDependencyKey();
      let nodeKey = [...this.identifierNodes.keys()].find(node => key.equals(node));
      if (!nodeKey) {
        return undefined;
      } else {
        return this.identifierNodes.get(nodeKey);
      }
    } else {
      return this.aeNodes.get(ae);      
    }
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
  
  /*MD # Node Interface MD*/  
  
  getCurrentValueFor(ae) {
    return this.currentValuePerAE.get(ae);
  }

  getCurrentEvent() {
    if (this.eventSlider.max === "0") return undefined;
    const index = this.eventSlider.value - 1;
    const { event, ae } = this.allEvents[index];
    return { event, ae, index };
  }

  getCurrentDependencyChangedEvent() {
    const currentEvent = this.getCurrentEvent();
    if (!currentEvent) return;

    if (currentEvent.event.type === "dependencies changed") {
      return currentEvent;
    }
    return {};
  }
  /*MD # Interface MD*/
  filterToAEs(aes) {
    this.aexprOverview.filterToAEs(aes);
  }

  setAExprs(aexprs, selectedEvent) {
    this.initPromise.then(() => {      
      this.filterToAEs(aexprs);
      this.dataChanged();
      const index = this.allEvents.findIndex(({ event, ae }) => event === selectedEvent);
      this.eventSlider.value = index + 1;
      this.debouncedEventChanged();
    });
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
    return this.get("#graph1");
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