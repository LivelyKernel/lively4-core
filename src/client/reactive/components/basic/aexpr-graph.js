"enable aexpr"

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import { debounce } from "utils";
//import d3 from "src/external/d3-graphviz.js"

export default class AexprGraph extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Graph";
    this.setWindowSize(1200, 800);
    let width = window.innerWidth;
    let height = window.innerHeight;
    this.graphViz = await (<d3-graphviz style="background:gray"></d3-graphviz>)
    this.graph.append(this.graphViz);
    //"dot", "neato", "fdp", "twopi", "circo"
    this.graphViz.engine = "dot";
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
  }
  
  async rerenderGraph() {
    await this.graphViz.setDotData(this.graphData())
  }
  

  graphData() {

    const edges = [];
    const nodes = [];

    const aes = AExprRegistry.allAsArray();

    const allScopes = new Map();
    const allDeps = new Map();
    const allAEs = new Map();
    
    let aeCount = 0;
    let depCount = 0;
    let hookCount = 0;
    for (const ae of aes) {
      allAEs.set(ae, aeCount);
      const aeData = this.extractData(ae);
      nodes.push(`AE${aeCount} [shape="record" label="{${aeData.join("|")}}"]`);
      for(const dep of ae.dependencies().all()) {
        const [context, identifier, value] = dep.contextIdentifierValue();
        if(!allScopes.has(context)) {
          allScopes.set(context, []);
        }
        allScopes.get(context).push(dep);
        if(!allDeps.has(dep)) {
          allDeps.set(dep, depCount);
          depCount++;
        }
        
        edges.push(`AE${aeCount} -> DEP${allDeps.get(dep)}`);
      }
      aeCount++;
    }
    for (const ae of aes) {
      for(const event of ae.meta().get("events")||[]) {
        if(event.value && event.value.parentAE) {
          edges.push(`AE${allAEs.get(ae)} -> AE${allAEs.get(event.value.parentAE)} [color="#ff0000"]`);
        }
        if(event.value && event.value.dependency) {  
          edges.push(`AE${allAEs.get(ae)} -> DEP${allDeps.get(event.value.dependency)} [color="#00ff00"]`);
        }
      }
    }
    let i = 0;
    for(const [context, deps] of allScopes) {
      const subgraphNodes = [];
      const subgraphEdges = [];
      for(const dep of deps) {
        subgraphNodes.push(`DEP${allDeps.get(dep)} [shape="record" label="{${this.escapeTextForDOTRecordLabel(dep.getName())}|${dep.type()}}"]`);
        for(const hook of dep.getHooks()) {
          subgraphNodes.push(`HOOK${hookCount} [shape="record" label="{${this.escapeTextForDOTRecordLabel(hook.informationString())}}"]`);
          subgraphEdges.push(`DEP${allDeps.get(dep)} -> HOOK${hookCount}`);
          hookCount++;
        }
      }
      
      nodes.push(`subgraph cluster${i} {
        graph[color="#00ffff"];
        ${subgraphNodes.join(";\n")}
        ${subgraphEdges.join(";\n")}
        label = "${this.escapeTextForDOTRecordLabel(context.toString())}";
      }`);
      i++;
    }
    
    //edges.push(`lol1 -> lol2 [color="#00ff00"]`);

    return `digraph {
      graph [  splines="true"  overlap="false" compound="true" ];
      node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
      edge [  fontname="Arial"  fontsize="8" ];

      ${nodes.join(";\n")}

      ${edges.join(";\n")}
    }`;
  }

  extractData(ae) {
    const data = [];

    data.push(this.escapeTextForDOTRecordLabel(ae.meta().get("id")));
    data.push(this.escapeTextForDOTRecordLabel(ae.meta().get("sourceCode")));
    const location = ae.meta().get("location");
    const locationText = location.file.substring(location.file.lastIndexOf("/") + 1) + " line " + location.start.line;
    data.push(this.escapeTextForDOTRecordLabel(locationText));
    return data;
  }

  escapeTextForDOTRecordLabel(text) {
    text = text.replaceAll("\\", "\\\\");
    text = text.replaceAll("<", "\\<");
    text = text.replaceAll(">", "\\>");
    text = text.replaceAll("{", "\\{");
    text = text.replaceAll("}", "\\}");
    text = text.replaceAll("[", "\\[");
    text = text.replaceAll("]", "\\]");
    return text;
  }

  livelyMigrate(other) {}

  async livelyExample() {}

  get graph() {
    return this.get("#graph");
  }

}