import { openLocationInBrowser, navigateToTimeline, navigateToGraph } from 'src/client/reactive/components/basic/aexpr-debugging-utils.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import ContextMenu from 'src/client/contextmenu.js';
import { DependencyGraph } from 'src/client/dependency-graph/graph.js';
import { loc, range } from 'utils';


class Marker {
  
  constructor(line, dependencies, isAE) {
    lively.notify("marker at line: " + line);
    this.dependencies = dependencies;
    this.line = line;
    this.isAE = isAE;
    this.errorAEs = [...dependencies.entries()].filter(([ae, {errorEvents}]) => !errorEvents.isEmpty());
    this.hasError = this.errorAEs.length > 0;
  }
  
  draw(editor) {    
    editor.doc.setGutterMarker(this.line, 'activeExpressionGutter', this.drawIcon(editor));
  }
  
  drawIcon(editor) {
    const callback = async evt => {
      const markerBounds = evt.target.getBoundingClientRect();
      this.drawActionList(markerBounds, editor);
      
    };

    return <div class={"activeExpressionGutter-marker" + (this.isAE ? "-ae" : "-dep")} click={callback} style={this.hasError ? "color: rgba(255,0,0,1)" : ""}>
      {this.isAE ? <b>AE</b> : <i class="fa fa-share-alt"></i>}
    </div>;
  }
  
  
  async drawActionList(markerBounds, editor) {
    const menuItems = [];
    
    if(this.hasError) {
      let errorMenu = [];
      for(const [ae, {errorEvents}] of this.errorAEs) {
        let instanceErrors = [];
        for(const errorEvent of errorEvents) {
          instanceErrors.push([errorEvent.value.name, () => {navigateToTimeline(timeline => timeline.showEvents([errorEvent], ae));}, "", "o"]);
        }
        errorMenu.push([ae.getName(), instanceErrors, "", "l"]);
      }
      menuItems.push(["errors", errorMenu, "", "l"]);
    }
    
    const allAEs = this.union([...this.dependencies.entries()].flatMap(([ae, {errorEvents, dependencies}]) => dependencies.aes));
    menuItems.push(["open timeline", () => {
      navigateToTimeline(timeline => timeline.filterToAEs(allAEs));
    }, "", "l"]);
    menuItems.push(["open graph", () => {
      navigateToGraph(allAEs);
    }, "", "l"]);
    

    this.dependencies.forEach(instance => {
      instance.dependencies.forEach(dep => {        
        const source = dep.source;
        const line = dep.location.start.line;
        let description = `${line}: ${source}`;
        let path = dep.location.file;
        const inThisFile = !path || path.includes(this.fileURL);
        if (inThisFile) {
          description = 'line ' + description;
        } else {
          description = path.substring(path.lastIndexOf("/") + 1) + ":" + description;
        }
        menuItems.push([description, () => {
          openLocationInBrowser(dep.location);
          menu.remove();
        }, dep.events.length + " event" + (dep.events.length === 1 ? "" : "s") + ", " + dep.aes.size + " instance" + (dep.aes.size === 1 ? "" : "s"), this.faIcon(inThisFile ? 'location-arrow' : 'file-code-o')]);
      });
    });

    const menu = await ContextMenu.openIn(document.body, { clientX: markerBounds.left, clientY: markerBounds.bottom }, undefined, document.body, menuItems);
    menu.addEventListener("DOMNodeRemoved", () => {
      editor.focus();
    });
  }  
  

  faIcon(name, ...modifiers) {
    return `<i class="fa fa-${name} ${modifiers.map(m => 'fa-' + m).join(' ')}"></i>`;
  }
  
  union(...iterables) {
    const set = new Set();

    for (const iterable of iterables) {
      for (const item of iterable) {
        set.add(item);
      }
    }

    return set;
  }
}


export default class AEGutter {
    constructor(editor, fileURL, validCallback) {
    this.fileURL = fileURL;
    this.editor = editor;
    this.validCallback = validCallback;
    
    this.showAExprDependencyGutter();

    DebuggingCache.registerFileForAEDebugging(this.fileURL, this, aeData => {
      this.allDependenciesByLine(aeData).then(([depToAE, AEToDep]) => {
        this.editor.doc.clearGutter('activeExpressionGutter');
        this.showAExprDependencyGutterMarkers(depToAE, false);
        this.showAExprDependencyGutterMarkers(AEToDep, true);
      });
    });
  }
  
  valid() {
    return this.validCallback();
  }
 
  async showAExprDependencyGutter() {
    const id = "activeExpressionGutter";
    const editor = await this.editor;
    let gutters = editor.getOption("gutters");
    if (!gutters.some(marker => marker === id)) {
      editor.setOption('gutters', [...gutters, id]);
    }
  }

  async hideAExprDependencyGutter() {
    const id = "activeExpressionGutter";
    const editor = await this.editor;
    let gutters = editor.getOption("gutters");
    gutters = gutters.filter(marker => marker !== id);
    editor.setOption('gutters', gutters);
  }


  async showAExprDependencyGutterMarkers(dependencyMap, isAE) {
    await this.editor;

    for (const [line, aExprs] of dependencyMap.entries()) {
      this.drawAExprGutter(line, aExprs, isAE);
    }
  }

  async allDependenciesByLine(depsMapInFile) {
    const depToAE = new Map();
    const AEToDep = new Map();

    await this.editor;
    

    const handleDepAEPairing = (ae, AELocation, AELine, allEvents, dependencyLoc, dependencySource) => {
      const dependencyLine = dependencyLoc.start.line - 1;
      const dependencyFile = dependencyLoc.file;
      
      const relatedEvents = allEvents.filter(event => event.value.triggers && event.value.triggers.some(({ location }) => dependencyFile.includes(location.file) && location.start.line - 1 === dependencyLine));
      const relatedValueChangedEvents = relatedEvents.filter(event => event.type === "changed value");
      const relatedErrorEvents = relatedEvents.filter(event => event.type === "evaluation failed");
      
      if (dependencyFile.includes(this.fileURL)) {
        // Dependency is in this file
        if (!depToAE.get(dependencyLine)) {
          depToAE.set(dependencyLine, new Map());
        }
        if (!depToAE.get(dependencyLine).get(dependencySource)) {
          depToAE.get(dependencyLine).set(dependencySource, {errorEvents: [], dependencies: []});
        }
        depToAE.get(dependencyLine).get(dependencySource).errorEvents.push(...relatedErrorEvents);
        // Group by AE to distinguish between mutltiple AE Objects in the same line?
        depToAE.get(dependencyLine).get(dependencySource).dependencies.push({ location: AELocation, source: ae.meta().get("sourceCode"), events: relatedValueChangedEvents, aes: new Set([ae])});
      }

      if (AELocation.file.includes(this.fileURL)) {
        AEToDep.get(AELine).get(ae).dependencies.push({ location: dependencyLoc, source: dependencySource, events: relatedValueChangedEvents, aes: new Set([ae])});
      }
    };
    
    for(const [ae, depsAndHooks] of depsMapInFile) {
      const AELocation = ae.meta().get("location");
      const AELine = AELocation.start.line - 1;

      const allEvents = ae.meta().get("events");
      const errorEvents = allEvents.filter(event => event.type === "evaluation failed");
      
      if (AELocation.file.includes(this.fileURL)) {
        // AE is in this file
        if (!AEToDep.get(AELine)) {
          AEToDep.set(AELine, new Map());
        }
        if(!AEToDep.get(AELine).get(ae)) {
          AEToDep.get(AELine).set(ae, {errorEvents, dependencies: []});
        }
      }
      for(const {hook, dependency} of depsAndHooks) {
        const locations = await hook.getLocations();
        for (const location of locations) {
          handleDepAEPairing(ae, AELocation, AELine, allEvents, location, dependency.identifier);
        }        
      }
    }
    
    return [depToAE, AEToDep];
  }

  drawAExprGutter(line, dependencies, isAE) {
    //Use accumulate instead
    /*const sorted = dependencies.sort((aDep, bDep) => {
      const a = aDep.location;
      const b = bDep.location;
      if (a.file < b.file) {
        return -1;
      } else if (a.file > b.file) {
        return 1;
      }
      if (a.start.line < b.start.line) {
        return -1;
      } else if (a.start.line > b.start.line) {
        return 1;
      }
      return a.start.column - b.start.column;
    });

    const accumulated = [];

    sorted.forEach(dep => {
      //Location might differ due to one object having this file as source and the other not having a source
      if (accumulated.length === 0 || !_.isEqual(accumulated[accumulated.length - 1].location.start, dep.location.start)) {
        accumulated.push(dep);
      } else {
        const lastDep = accumulated[accumulated.length - 1];

        lastDep.events.push(...dep.events);
        if (dep.source && lastDep.source && dep.source.length > lastDep.source.length) {
          lastDep.source = dep.source;
        }
        lastDep.hasError |= dep.hasError; 
        if (dep.location.end.column > lastDep.location.end.column) {
          lastDep.location.end = dep.location.end;
        }
        lastDep.aes = new Set([...lastDep.aes, ...dep.aes]);
      }
    });

    let hasError = false;
    for (const dep of accumulated) {
      if (dep.hasError) {
        hasError = true;
        break;
      }
    }*/

    new Marker(line, dependencies, isAE).draw(this.editor);
  }
  
  
   /*
  async dependencyGraph() {
    return this._deps || (this._deps = new DependencyGraph((await this.astCapabilities(this.editor))));
  }

  async showAExprTextMarkers() {
    const editor = await this.editor;
    await this.resetAExprTextMarkers();
    const dependencyGraph = await this.dependencyGraph();
    dependencyGraph.getAllActiveExpressions().forEach(path => {
      const r = range(path.node.loc).asCM();
      const mark = this.editor.markText(r[0], r[1], {
        css: "background-color: #3BEDED"
      });
      mark.isAExprTextMarker = true;
    });
  }
  async resetAExprTextMarkers() {
    const editor = await this.editor;
    editor.getAllMarks().forEach(mark => {
      if (mark.isAExprTextMarker) {
        mark.clear();
      }
    });
  }
  async resetAExprDependencyTextMarkers() {
    const editor = await this.editor;
    editor.getAllMarks().forEach(mark => {
      if (mark.isAExprDependencyTextMarker) {
        mark.clear();
      }
    });
  }
  async showAExprDependencyTextMarkers() {
    await this.editor;
    await this.resetAExprDependencyTextMarkers();
    const cursor = this.editor.getCursor();
    const dependencyGraph = await this.dependencyGraph();
    const aexprPath = dependencyGraph.getAexprAtCursor(cursor);
    if (!aexprPath) return;
    const deps = dependencyGraph.resolveDependencies(aexprPath.get("arguments")[0]);
    deps.forEach(path => {
      const r = range(path.node.loc).asCM();
      const mark = this.editor.markText(r[0], r[1], {
        css: "background-color: orange"
      });
      mark.isAExprDependencyTextMarker = true;
    });
    // Searching for dependencies
    const dependencyGraph = await this.dependencyGraph();
    dependencyGraph.getAllActiveExpressions().forEach(path => {
      const dependencies = dependencyGraph.resolveDependencies(path.get("arguments")[0]);
      const AELine = path.node.loc.start.line - 1;
      if (!AEToDep.get(AELine)) {
        AEToDep.set(AELine, []);
      }
       dependencies.forEach(statement => {
        const depLine = statement.node.loc.start.line - 1;
        if (!depToAE.get(depLine)) {
          depToAE.set(depLine, []);
        }
        depToAE.get(depLine).push({ location: path.node.loc, source: path.get("arguments.0.body").getSource(), events: 0 });
        AEToDep.get(AELine).push({ location: statement.node.loc, source: statement.getSource(), events: 0 });
      });
    });
  }*/

}