"enable aexpr"

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
//import d3 from "src/external/d3-graphviz.js"

export default class AexprGraph extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Graph";
    this.setWindowSize(1200, 800);
    let width = window.innerWidth;
    let height = window.innerHeight;
    this.graphViz = await (<d3-graphviz style="background:gray"></d3-graphviz>)
    this.graph.append(this.graphViz);
    await this.graphViz.setDotData(this.graphData());
    const containerElement = this.graphViz.shadowRoot.querySelector("#container");
    /*containerElement.setAttribute("display", "flex");
    containerElement.children[0].setAttribute("display", "flex");
    setTimeout(() => {
      debugger;
      const svgElement = this.graphViz.shadowRoot.querySelector("svg");
      svgElement.setAttribute("height", "100%");
      svgElement.setAttribute("width", "100%");
    }, 10000);*/
  }

  graphData() {

    const edges = [];
    const nodes = [];

    const aes = AExprRegistry.allAsArray();

    const allDeps = new Map();
    
    let aeCount = 0;
    let depCount = 0;
    let hookCount = 0;
    for (const ae of aes) {
      const aeData = this.extractData(ae);
      nodes.push(`AE${aeCount} [shape="record" label="{${aeData.join("|")}}"]`);
      for(const dep of ae.dependencies().all()) {
        if(!allDeps.has(dep)) {
          allDeps.set(dep, depCount);
          nodes.push(`DEP${depCount} [shape="record" label="{${this.escapeTextForDOTRecordLabel(dep.getName())}|${dep.type()}}"]`);
          depCount++;
        }
        
        edges.push(`AE${aeCount} -> DEP${allDeps.get(dep)}`);
      }
      aeCount++;
    }
    for(const dep of allDeps.keys()) {
      for(const hook of dep.getHooks()) {
        nodes.push(`HOOK${hookCount} [shape="record" label="{${this.escapeTextForDOTRecordLabel(hook.informationString())}}"]`);
        edges.push(`DEP${allDeps.get(dep)} -> HOOK${hookCount}`);
        hookCount++;
      }
    }

    return `digraph {
      graph [  splines="true"  overlap="false"  ];
      node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
      edge [  fontname="Arial"  fontsize="8" ];

      ${edges.join(";")}
      ${nodes.join(";")}
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