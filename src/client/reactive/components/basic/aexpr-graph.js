import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
//import d3 from "src/external/d3-graphviz.js"

export default class AexprGraph extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Graph";
    let width = window.innerWidth;
    let height = window.innerHeight;
    this.graphViz = await (<d3-graphviz style="background:gray; width:1200px; height: 800px"></d3-graphviz>)
    this.graph.append(this.graphViz);
    this.graphViz.setDotData(this.graphData());
    //const graphvizElement = this.shadowRoot.querySelector("svg");
    //graphvizElement.setAttribute("height", "400px");
  }

  graphData() {

    const edges = [];
    const nodes = [];

    const aes = AExprRegistry.allAsArray();

    let i = 0;
    let j = 0;
    for (const ae of aes) {
      const aeData = this.extractData(ae);
      nodes.push(`AE${i} [shape="record" label="{${aeData.join("|")}}"]`);
      for (const { _, dep, hook } of DebuggingCache.getTripletsForAE(ae)) {
        nodes.push(`HOOK${j} [shape="record" label="{${this.escapeTextForDOTRecordLabel(hook.informationString())}}"]`);
        edges.push(`AE${i} -> HOOK${j}`);
        j++;
      }
      i++;
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