import { openLocationInBrowser, navigateToTimeline, navigateToGraph } from 'src/client/reactive/components/basic/aexpr-debugging-utils.js';
import { DebuggingCache } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';
import ContextMenu from 'src/client/contextmenu.js';
import { DependencyGraph } from 'src/client/dependency-graph/graph.js';
import { loc, range, pluralize } from 'utils';

class Marker {

  constructor(line, dependencies, isAE, fileURL) {
    lively.notify("marker at line: " + line);
    this.dependencies = dependencies;
    this.line = line;
    this.fileURL = fileURL;
    this.isAE = isAE;
    this.errorAEs = [...dependencies.entries()].filter(([ae, { errorEvents }]) => !errorEvents.isEmpty());
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
    
    
    if(this.dependencies.size > 1){
        const {errorEvents, dependencies, aes} = this.accumulateData();
        const accumulatedItems = this.generateInstanceSubmenu(errorEvents, dependencies, aes, editor);
        menuItems.push(["All", accumulatedItems, pluralize(dependencies.length, "dep")]);
    }
    
    this.dependencies.forEach(({errorEvents, dependencies}, ae) => {
      const instanceItems = this.generateInstanceSubmenu(errorEvents, dependencies, [ae], editor);
      menuItems.push([ae.getSymbol(), instanceItems, pluralize(dependencies.length, "dep")]);
    });
    
    const menu = await ContextMenu.openIn(document.body, { clientX: markerBounds.left, clientY: markerBounds.bottom }, undefined, document.body, menuItems);
    menu.addEventListener("DOMNodeRemoved", () => {
      editor.focus();
    });
  }
  
  generateAccumulateSubmenu(editor) {    
    const {errorEvents, dependencies, aes} = this.accumulateData();
    return this.generateInstanceSubmenu(errorEvents, dependencies, aes, editor);
  }
  
  accumulateData() {
    const cErrorEvents = [], cDependencies = [], aes = [];
    
    this.dependencies.forEach(({errorEvents, dependencies}, ae) => {
      cErrorEvents.push(...errorEvents);
      aes.push(ae);
      cDependencies.push(...dependencies);
    });
    const sorted = cDependencies.sort((aDep, bDep) => {
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
        const shallowClone = Object.assign({}, dep);
        shallowClone.events = [...shallowClone.events];
        accumulated.push(shallowClone);
      } else {
        const lastDep = accumulated[accumulated.length - 1];
        lastDep.events.push(...dep.events);
        if (dep.source && lastDep.source && dep.source.length > lastDep.source.length) {
          lastDep.source = dep.source;
        }
        if (dep.location.end.column > lastDep.location.end.column) {
          lastDep.location.end = dep.location.end;
        }
      }
    });
    return {errorEvents: cErrorEvents, dependencies: accumulated, aes};
  }

  generateInstanceSubmenu(errorEvents, dependencies, aes, editor) {
    const submenuItems = [];
    
    // Other views
    submenuItems.push(["open timeline", () => {
      navigateToTimeline(timeline => timeline.filterToAEs(aes));
    }, "", "l"]);
    submenuItems.push(["open graph", () => {
      navigateToGraph(aes);
    }, "", "l"]);
    
    // Errors
    let instanceErrors = [];
    for (const errorEvent of errorEvents) {
      instanceErrors.push([errorEvent.value.error.name, () => {
        navigateToTimeline(timeline => timeline.showEvents([errorEvent]));
      }, "", "o"]);
    }
    if(!instanceErrors.isEmpty()) {      
      submenuItems.push(["errors", instanceErrors, "", "l", { onClick: () => {
        navigateToTimeline(timeline => timeline.showEvents(errorEvents));
      }}]);
    }
    
    // Navigation
    dependencies.forEach(dep => {
      const source = dep.source;
      const line = dep.location.start.line;
      let description = `${line}: ${source}`;
      let path = dep.location.file;
      const inThisFile = !path || path.includes(this.fileURL);
      let onSelect = () => {};
      if (inThisFile) {
        description = 'line ' + description;

        onSelect = () => {
          const start = { line: dep.location.start.line - 1, ch: dep.location.start.column };
          const end = { line: dep.location.end.line - 1, ch: dep.location.end.column };
          editor.setSelection(start, end);
        };
      } else {
        description = path.substring(path.lastIndexOf("/") + 1) + ":" + description;
      }
      submenuItems.push([description, () => {
        openLocationInBrowser(dep.location);
      }, pluralize(dep.events.length, "event"), this.faIcon(inThisFile ? 'location-arrow' : 'file-code-o'), { onSelect, onDeselect: () => editor.undoSelection() }]);
    });
    return submenuItems;
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
        if (!depToAE.get(dependencyLine).get(ae)) {
          depToAE.get(dependencyLine).set(ae, { errorEvents: [], dependencies: [] });
        }
        depToAE.get(dependencyLine).get(ae).errorEvents.push(...relatedErrorEvents);
        // Group by AE to distinguish between mutltiple AE Objects in the same line?
        depToAE.get(dependencyLine).get(ae).dependencies.push({ location: AELocation, source: ae.getSymbol()/*ae.meta().get("sourceCode")*/, events: relatedValueChangedEvents });
      }

      if (AELocation.file.includes(this.fileURL)) {
        AEToDep.get(AELine).get(ae).dependencies.push({ location: dependencyLoc, source: dependencySource, events: relatedValueChangedEvents });
      }
    };

    for (const [ae, depsAndHooks] of depsMapInFile) {
      const AELocation = ae.meta().get("location");
      const AELine = AELocation.start.line - 1;

      const allEvents = ae.meta().get("events");
      const errorEvents = allEvents.filter(event => event.type === "evaluation failed");

      if (AELocation.file.includes(this.fileURL)) {
        // AE is in this file
        if (!AEToDep.get(AELine)) {
          AEToDep.set(AELine, new Map());
        }
        if (!AEToDep.get(AELine).get(ae)) {
          AEToDep.get(AELine).set(ae, { errorEvents, dependencies: [] });
        }
      }
      for (const { hook, dependency } of depsAndHooks) {
        const locations = await hook.getLocations();
        for (const location of locations) {
          handleDepAEPairing(ae, AELocation, AELine, allEvents, location, dependency.identifier);
        }
      }
    }

    return [depToAE, AEToDep];
  }

  drawAExprGutter(line, dependencies, isAE) {
    new Marker(line, dependencies, isAE, this.fileURL).draw(this.editor);
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