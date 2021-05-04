"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import { debounce } from "utils";
import ContextMenu from 'src/client/contextmenu.js';
import GraphNode from "./graph-node.js";
import AExprNode from "./aexpr-node.js";
import ObjectNode from "./object-node.js";
import groupBy from "src/external/lodash/lodash.js";
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

    await this.rerenderGraph();
    const containerElement = this.graphViz.shadowRoot.querySelector("#container");
    /*containerElement.setAttribute("display", "flex");
    containerElement.children[0].setAttribute("display", "flex");
    setTimeout(() => {
      debugger;
      const svgElement = this.graphViz.shadowRoot.querySelector("svg");
      svgElement.setAttribute("height", "100%");
      svgElement.setAttribute("width", "100%");
    }, 10000);*/

    this.debouncedChange = this.rerenderGraph.debounce(50, 300);
    AExprRegistry.addEventListener(this, (ae, event) => {
      this.debouncedChange();
    });
    this.groupAEs.addEventListener('change', () => {
      this.debouncedChange();
    });
  }

  livelyPreMigrate() {
    AExprRegistry.removeEventListener(this);
  }

  detachedCallback() {
    AExprRegistry.removeEventListener(this);
  }

  async rerenderGraph() {
    await this.graphViz.setDotData((await this.graphData()));
  }

  async graphData() {
    const aeNodes = new Map();
    const objectNodes = new Map();
    this.onClickMap = new Map();
    
    let aeLocationString = (ae) => {
      const location = ae.meta().get("location");
      return location.file + ":" + location.start.line + ":" + location.start.column
    }
    
    const aes = this.overrideAExprs || AExprRegistry.allAsArray().slice(0, 50);
    const aeGroups = aes.groupBy((ae) => this.groupAEs.checked ? aeLocationString(ae) : ae.meta().get("id"));
    for(const aeGroupKey of Object.keys(aeGroups)) {
      const aeGroup = aeGroups[aeGroupKey];
      const aeNode = aeNodes.getOrCreate(aeGroup[0], () => new AExprNode(aeGroup[0], this.onClickMap));
      // Create AEs and Dependencies
      for(const ae of aeGroup) {        
        for (const dep of ae.dependencies().all()) {
          const [context, identifier, value] = dep.contextIdentifierValue();

          const objectNode = this.getOrCreateByDependencyKey(objectNodes, dep.getKey(), () => new ObjectNode(value, identifier, this.onClickMap));
          await objectNode.setDependency(dep);

          aeNode.connectTo(objectNode);
        }
      }
      
      // Show parent relations between the Objects
      for(const ae of aeGroup) {        
        for (const dep of ae.dependencies().all()) {
          const [context, identifier, value] = dep.contextIdentifierValue();
          const objectNode = this.getOrCreateByDependencyKey(objectNodes, dep.getKey(), () => new ObjectNode(value, identifier, this.onClickMap));

          if(dep.type() === "member") {
            const contextNode = this.getOrCreateByIdentifier(objectNodes, context, () => new ObjectNode(context, context.toString(), this.onClickMap));
            contextNode.connectTo(objectNode, {color: "gray"});          
          }
        }
      }
      
      // Show events that changed the AE
      for (const ae of aes) {
        for (const event of ae.meta().get("events") || []) {
          if (event.value && event.value.dependency && event.type === "changed value") {
            const dependencyKey = event.value.dependency;
            const dependency = dependencyKey.getDependency();
            if (!dependency) {
              const objectNode = this.getOrCreateByDependencyKey(objectNodes, dependencyKey, 
                                                               () => new ObjectNode({event, identifier: dependencyKey.identifier}, dependencyKey.identifier, this.onClickMap));
              objectNode.connectTo(aeNode, {color: "blue", taillabel: "test"});
              objectNode.addEvent(ae, event);
            } else {
              const [context, identifier, value] = dependency.contextIdentifierValue();
              const objectNode = this.getOrCreateByDependencyKey(objectNodes, dependencyKey, () => new ObjectNode(value, identifier, this.onClickMap));
              objectNode.connectTo(aeNode, {color: "blue"});
              objectNode.addEvent(ae, event);
            }
          }
        }
      }
    }
    
    
    return `digraph {
      graph [  splines="ortho" overlap="false" compound="true" ];
      node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
      edge [  fontname="Arial"  fontsize="8" ];

      subgraph clusterAE {
        graph[color="#00ffff"];
        ${[...aeNodes.values()].map(n => n.getDOTNodes()).join("\n")}
        label = "AEs";
      }
      subgraph clusterObjects {
        graph[color="#ff00ff"];
        ${[...objectNodes.values()].map(n => n.getDOTNodes()).join("\n")}
        label = "Objects";
      }
      ${[...aeNodes.values()].map(n => n.getDOTEdges()).join("\n")}
      ${[...objectNodes.values()].map(n => n.getDOTEdges()).join("\n")}

    }`;
  }
  
  getOrCreateByDependencyKey(nodes, key, creator) {
    let nodeKey = [...nodes.keys()].find((node) => key.equals(node));
    let node;
    if(!nodeKey) {
      node = creator();
      nodes.set(key, node);
    } else {
      node = nodes.get(nodeKey);
    }
    return node;
  }
  
  getOrCreateByIdentifier(nodes, context, creator) {
    let nodeKey = [...nodes.keys()].find((node) => (node.context && context === node.context[node.identifier]) || context === node);
    let node;
    if(!nodeKey) {
      node = creator();
      nodes.set(context, node);
    } else {
      node = nodes.get(nodeKey);
    }
    return node;
  }  
  
  setAExprs(aexprs) {
    this.overrideAExprs = aexprs;
    this.debouncedChange();
  }
  
  livelyMigrate(other) {}

  async livelyExample() {}

  get graph() {
    return this.get("#graph");
  }

  get groupAEs() {
    return this.get("#groupAEs");
  }

}