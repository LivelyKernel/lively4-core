"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import { debounce } from "utils";
import ContextMenu from 'src/client/contextmenu.js';
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

    const edges = [];
    const nodes = [];

    const aes = AExprRegistry.allAsArray().slice(0, 50);

    const allScopes = new Map();
    const allDeps = new Map();
    const allAEs = new Map();
    const allHooks = new Map();
    this.onClickMap = new Map();

    let aeCount = 0;
    let depCount = 0;
    let hookCount = 0;
    for (const ae of aes) {
      const aeData = this.extractData(ae);
      const sameLocation = [...allAEs].find(aeAndIndex => this.extractData(aeAndIndex[0])[2] === aeData[2]);
      let aeID = aeCount;
      if (!sameLocation || !this.groupAEs.checked) {
        this.onClickMap.set(`AE${aeID}`, evt => {
          this.aeClicked(ae, evt);
        });
        nodes.push(`AE${aeID} [shape="record" label="{${aeData.join("|")}}"]`);
        aeCount++;
      } else {
        aeID = sameLocation[1];
      }
      allAEs.set(ae, aeID);
      for (const dep of ae.dependencies().all()) {
        const [context, identifier, value] = dep.contextIdentifierValue();
        if (!allScopes.has(context)) {
          allScopes.set(context, []);
        }
        allScopes.get(context).push(dep);
        if (!allDeps.has(dep)) {
          allDeps.set(dep, depCount);
          depCount++;
        }

        edges.push(`AE${aeID} -> DEP${allDeps.get(dep)}`);
      }
    }
    for (const ae of aes) {
      for (const event of ae.meta().get("events") || []) {
        if (event.value && event.value.parentAE) {
          edges.push(`AE${allAEs.get(ae)} -> AE${allAEs.get(event.value.parentAE)} [color="#ff0000"]`);
        }
        if (event.value && event.value.dependency && event.type === "changed value") {
          const dependencyKey = event.value.dependency;
          const dependency = dependencyKey.getDependency();
          if (!dependency) {
            let id = [...allDeps].find(depAndId => _.isEqual(depAndId[0], dependencyKey));
            if (id === undefined) {
              allDeps.set(dependencyKey, depCount);
              id = depCount;
              depCount++;
              nodes.push(`DEP${allDeps.get(dependencyKey)} [shape="record" label="{${this.escapeTextForDOTRecordLabel(dependencyKey.context + "." + dependencyKey.identifier)}|No longer tracked}"]`);
            } else {
              id = id[1];
            }
            edges.push(`AE${allAEs.get(ae)} -> DEP${id} [color="#00ff00"]`);
          } else {
            edges.push(`AE${allAEs.get(ae)} -> DEP${allDeps.get(dependency)} [color="#00ff00"]`);
          }
        }
      }
    }
    let i = 0;
    for (const [context, deps] of allScopes) {
      const subgraphNodes = [];
      const subgraphEdges = [];
      for (const dep of deps) {
        this.onClickMap.set(`DEP${allDeps.get(dep)}`, evt => {
          this.dependencyClicked(dep, evt);
        });
        subgraphNodes.push(`DEP${allDeps.get(dep)} [shape="record" label="{${this.escapeTextForDOTRecordLabel(dep.identifier)}|${dep.type()}}"]`);
        for (const hook of dep.getHooks()) {
          if ((await hook.getLocations()).length === 0) continue;
          if (!allHooks.has(hook)) {
            allHooks.set(hook, hookCount);
            this.onClickMap.set(`HOOK${hookCount}`, evt => {
              this.hookClicked(hook, evt);
            });
            subgraphNodes.push(`HOOK${hookCount} [shape="record" label="{${this.escapeTextForDOTRecordLabel(hook.informationString())}}"]`);
            hookCount++;
          }
          subgraphEdges.push(`DEP${allDeps.get(dep)} -> HOOK${allHooks.get(hook)}`);
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

  aeClicked(ae, evt) {
    this.constructContextMenu(ae, [ae.meta().get("location")], evt);
  }

  async dependencyClicked(dependency, evt) {
    const locations = await Promise.all(dependency.getHooks().map(hook => hook.getLocations()));
    this.constructContextMenu(dependency, locations.flat(), evt);
  }

  async hookClicked(hook, evt) {
    this.constructContextMenu(hook, (await hook.getLocations()), evt);
  }

  async constructContextMenu(object, locations, evt) {
    const menuItems = [];
    menuItems.push(["inspect", () => {
      lively.openInspector(object);
    }, "", "l"]);

    locations.forEach((location, index) => {
      menuItems.push([this.fileNameString(location.file) + ":" + location.start.line, () => {
        this.openLocationInBrowser(location);
      }, "", ""]);
    });

    const menu = await ContextMenu.openIn(document.body, evt, undefined, document.body, menuItems);
    menu.addEventListener("DOMNodeRemoved", () => {
      this.focus();
    });
  }

  extractData(ae) {
    const data = [];

    data.push(this.escapeTextForDOTRecordLabel(ae.meta().get("id")));
    data.push(this.escapeTextForDOTRecordLabel(ae.meta().get("sourceCode")));
    const location = ae.meta().get("location");
    if (location) {
      const locationText = location.file.substring(location.file.lastIndexOf("/") + 1) + " line " + location.start.line;
      data.push(this.escapeTextForDOTRecordLabel(locationText));
    }
    return data;
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

  livelyMigrate(other) {}

  async livelyExample() {}

  get graph() {
    return this.get("#graph");
  }

  get groupAEs() {
    return this.get("#groupAEs");
  }

}