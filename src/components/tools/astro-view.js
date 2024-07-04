/*MD # Astro View - AST Token View spelled wrong

MD*/


import Morph from 'src/components/widgets/lively-morph.js';
import SyntaxChecker from 'src/client/syntax.js'

import { uuid as generateUUID, debounce, flatmap, executeAllTestRunners, promisedEvent, loc, range } from 'utils';

export default class AstroView extends Morph {

  static get defaultSourceURL() { return lively4url + "/src/components/tools/astro-view-example-source.js"; }
  static get defaultTransformerSourceURL() { return lively4url + "/src/components/tools/astro-view-example-transformer.py"; }
  static get defaultWorkspaceURL() { return lively4url + "/src/components/tools/astro-view-example-workspace.js"; }
  
  

  /*MD ## UI Accessing MD*/
  get container() { return this.get("#content"); }
  
  // Status Text
  get statusLine() { return this.get("#status"); }
  set status(text) { this.statusLine.innerHTML = text; }
  
  // Source
  get sourceEditor() { return this.get("#source"); }  
  get sourceLCM() { return this.sourceEditor.livelyCodeMirror(); }
  get sourceCM() { return this.sourceEditor.currentEditor(); }
  get source() { return this.sourceCM.getValue(); }
  
  // Source Path
  get sourcePath() { return this.get("#sourcePath"); }
  get sourceURL() { return this.sourcePath.value; }
  set sourceURL(urlString) { this.sourcePath.value = urlString; }
  onSourcePathEntered(urlString) { this.loadSourceFile(urlString); }
  
  // Project Name
  get projectNameInput() { return this.get('#projectName'); }
  get projectName() { return this.projectNameInput.value; }
  set projectName(text) { this.projectNameInput.value = text; }
  
  // Transformer Code
  get transformerSourceEditor() { return this.get("#transformerSource"); }  
  get transformerSourceLCM() { return this.transformerSourceEditor.livelyCodeMirror(); }
  get transformerSourceCM() { return this.transformerSourceEditor.currentEditor(); }
  get transformerSource() { return this.transformerSourceCM.getValue(); }
  
  // Transformer Code Path
  get transformerSourcePath() { return this.get("#transformerSourcePath"); }
  get transformerSourceURL() { return this.transformerSourcePath.value; }
  set transformerSourceURL(urlString) { this.transformerSourcePath.value = urlString; }
  onTransformerSourcePathEntered(urlString) { this.loadTransformerSourceFile(urlString); }
  
  // Plot
  get astroPlot() { return this.get("#astro-plot"); }
  
  get api() { return "http://127.0.0.1:5000"; }
  
  
  get astInspector() { return this.get("#ast"); }
  
  get updateButton() { return this.get("#update"); }
  get runQueryButton() { return this.get('#runQuery'); }
  get runMapButton() { return this.get('#runMap'); }
  get runReduceButton() { return this.get('#runReduce'); }
  
  get autoUpdate() { return this._autoUpdate; }
  set autoUpdate(bool) {
    this.updateButton.classList.toggle("on", bool);
    this.updateButton.querySelector("i").classList.toggle("fa-spin", bool);
    this._autoUpdate = bool;
  }
  onUpdate(evt) {
    if (evt.button === 2) this.autoUpdate = !this.autoUpdate;
    this.update();
  }
  
  log(s) {
    console.log(s)
  }

  /*MD ## Initialization MD*/

  async loadSourceFile(urlString) {
    console.log("LOAD ", urlString);
    this.sourceURL = urlString;
    this.sourceEditor.setURL(lively.paths.normalizePath(urlString, ""));
    await this.sourceEditor.loadFile();
    await this.update(); 
  }
  
  async loadTransformerSourceFile(urlString) {
    console.log("LOAD ", urlString);
    this.transformerSourceURL = urlString;
    this.transformerSourceEditor.setURL(lively.paths.normalizePath(urlString, ""));
    await this.transformerSourceEditor.loadFile();
    await this.update(); 
  }
  
  async initialize() {
    this.windowTitle = "Astro View";
    this.registerButtons();

    this.getAllSubmorphs("button").forEach(button => {
      button.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.dispatchEvent(new MouseEvent("click", {button: 2}));
      });
    });
    
    await this.sourceEditor.awaitEditor();
    await this.transformerSourceEditor.awaitEditor();
    
    this.sourceEditor.hideToolbar();
    this.astInspector.connectEditor(this.sourceEditor);
    this.sourceLCM.doSave = async () => {
      this.save();
    };
    this.transformerSourceLCM.doSave = async () => {
      this.save();
    };
    
    this.sourceEditor.livelyCodeMirror().editor.on("cursorActivity", (cm) => {
      // #TODO continue here....
      console.log(cm)
      // this.selectPath(pathKeys);
    })
    
    this.debouncedUpdate = this.update::debounce(500);
    this.sourceLCM.addEventListener("change", (() =>
      SyntaxChecker.checkForSyntaxErrors(this.sourceCM))::debounce(200));
    this.sourceLCM.addEventListener("change", () => {
      if (this.autoUpdate) this.debouncedUpdate()
    });
    
    this.debouncedUpdateTransformer = this.updateTransformer::debounce(500);
    this.transformerSourceLCM.addEventListener("change", (() => {
      // SyntaxChecker.checkForSyntaxErrors(this.transformerSourceCM))::debounce(200) 
    }));
    this.transformerSourceLCM.addEventListener("change", () => {
      if (this.autoUpdate) this.debouncedUpdateTransformer()
    });
    
    this.sourcePath.addEventListener("keyup", evt => {
      if (evt.code == "Enter") this.onSourcePathEntered(this.sourcePath.value);
    });
    this.transformerSourcePath.addEventListener("keyup", evt => {
      if (evt.code == "Enter") this.onTransformerSourcePathEntered(this.transformerSourcePath.value);
    });
    
    this.astroPlot.addEventListener('item_click', evt => this.onItemClicked(evt));

    const source = this.getAttribute("source");
    if (source) this.loadSourceFile(source);
    
    const transformerSource = this.getAttribute("transformerSource");
    if (transformerSource) this.loadTransformerSourceFile(transformerSource);
    
    this.projectName = this.getAttribute("projectName") || "";
    
    this.autoUpdate = true;

    this.dispatchEvent(new CustomEvent("initialize"));
  }

  onEditorCursorActivity(cm) {
    var from = cm.getCursor(true)
    var to = cm.getCursor(false)
    
    this.get("#editorInfo").textContent = `${cm.indexFromPos(from)}-${cm.indexFromPos(to)}`
  }
  
  async updateTokens() {   
    let api = "http://127.0.0.1:5000";
    let dataset = "d3-force-main";
    
    this.status = "source updated: fetching..."
    
    try {
      this.tokens = null;
      
      let response = await fetch(`${api}/tokenize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: this.source
        })
      })
    
      let tokens = await response.json();
      // filter new-lines
      tokens = tokens.filter(ea => !ea.value.match(/^[ \n]+$/));
      
      this.tokens = tokens;
    } catch (e) {
      this.status = `error fetching tokens: ${e}`;
      this.log(`error fetching tokens: ${e}`);
    }
    
    try {
      let response = await fetch(`${api}/dataset/${dataset}/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: this.source
        }),
      })
    
      let embedding = await response.json()
      this.embedding = embedding;
    } catch (e) {
      this.log(`error fetching embedding: ${e}`);
      this.status = `error fetching embedding: ${e}`;
    }
    
    if (this.embedding) {
      let formatted = JSON.stringify(this.embedding)
      this.get('#pool_embedding').innerText = formatted
      this.get('#astro-plot').showFeature(this.embedding)
    }

    this.log('fetched tokens', this.tokens)
    
    if (this.tokens) {
      this.get("#tokens").innerHTML = ""
      this.tokens.forEach((token) => {
        let tokenView = 
          <div class="token" style="">
            <div style="font-size: 6pt">{token.id}</div>
            <div style="background-color: lightgray" 
              click={() => this.selectToken(tokenView, token)}
              pointerenter={() => this.hoverToken(tokenView, token, true)}
              pointerleave={() => this.hoverToken(tokenView, token, false)}
            >{token.value}</div>
            <div style="font-size: 6pt; color: blue">{token.start}-{token.end}</div>
          </div>
        this.get("#tokens").appendChild(tokenView)
      })
    } else {
      this.get("#tokens").innerHTML = "Error fetching tokens"
      this.status = `error fetching tokens`;
    }
  }
  
  selectToken(view, token) {
    if (this.selectedTokenView) this.selectedTokenView.classList.remove("selected")
    view.classList.add("selected")
    this.selectedTokenView = view
    
    this.get("#embeddings").innerHTML = ""
    let rows = []
  
    let tds = Array.from(token.value)
      .map(ea => ea.charCodeAt(0))
      .map(ea => <td style="border: 1px solid gray">{ea}</td>)
           
    rows.push(<tr>{...tds}</tr>)
    
    let table = <table style="border-collapse: collapse; border: 1px solid gray">{...rows}</table>
    
    this.get("#embeddings").appendChild(table)
    
  }
  
  
  hoverToken(view, token, active) {
    if (active) {
      const start = loc(this.sourceCM.posFromIndex(token.start));
      const end = loc(this.sourceCM.posFromIndex(token.end));
      this.hoverMarker = this.sourceCM.markText(start.asCM(), end.asCM(), {css: "background-color: #fe3"});
    } else {
      this.hoverMarker.clear();
      this.hoverMarker = null;
    }
  }
  
  /*MD ## Execution MD*/
  
  async update() {
    this.lastSource  = this.source
    this.log("source code changed, length: " + this.source.length + "")
    
    try {
      var node = await this.astInspector.treeSitterParse(this.source)
      this.treeSitterRootNode = node.rootNode
      this.astInspector.inspect(this.treeSitterRootNode);
    } catch (e) {
      this.astInspector.inspect({Error: e.message});
    }
    
    this.updateTokens();
  }
  
  async updateTransformer() {
    this.status = "transformer: sending..."
    try {
      let response = await fetch(`${this.api}/dataset/${this.projectName}/transformer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: this.transformerSource
        }),
      })
      response = await response.json();
      if (response.error) throw new Error(response.error);
      this.status = "transformer: using " + response.transformer;
    } catch (e) {
      this.status = "transformer: " + e;
    }
  }
  
  async onRunParse() {
    this.status = "parser: running..."
    try {
      let language = "typescript";
      let response = await fetch(`${this.api}/dataset/${this.projectName}/parse?language=${language}`, {
        method: 'POST',
      })
      response = await response.json();
      if (response.error) throw new Error(response.error);
      this.status = `parser: currently ${response.ASTs} ASTs in memory. ${response.features} tokens with embeddings`;
    } catch (e) {
      this.status = "parser: " + e;
    }
  }
  
  async onRunQuery() {
    this.status = "query: running..."
    try {
      let response = await fetch(`${this.api}/dataset/${this.projectName}/run_query`, {
        method: 'POST',
      })
      response = await response.json();
      if (response.error) throw new Error(response.error);
      this.status = "query: matched " + response.matches + " items in " + response.files + " files";
    } catch (e) {
      this.status = "query: " + e;
    }
  }
  
  async onRunMap() {
    this.status = "map: running..."
    try {
      let response = await fetch(`${this.api}/dataset/${this.projectName}/run_map`, {
        method: 'POST',
      })
      response = await response.json();
      if (response.error) throw new Error(response.error);
      this.status = ("map: success. Data columns: \n" + response.columns).replaceAll('\n', '<br/>');
    } catch (e) {
      this.status = "map: " + e;
    }
  }
  
  async onRunReduce() {
    this.status = "reduce: running..."
    try {
      let response = await fetch(`${this.api}/dataset/${this.projectName}/run_reduce`, {
        method: 'POST',
      })
      response = await response.json();
      if (response.error) throw new Error(response.error);
      this.status = "reduce: success";
    } catch (e) {
      this.status = "reduce: " + e;
    }
  }
  
  async onRunUmap() {
    this.status = "umap: running..."
    let data;
    try {
      let response = await fetch(`${this.api}/dataset/${this.projectName}/run_umap`, {
        method: 'POST',
      })
      response = await response.json();
      if (response.error) throw new Error(response.error);
      data = response.umap;
      this.status = "umap: success";
    } catch (e) {
      this.status = "umap: " + e;
      return;
    }
    
    try {
      this.astroPlot.displayData(data)
    } catch (e) {
      this.status = "plot: " + e;
    }
  }
  
  async onItemClicked(e) {
    const item = e.detail;
    let id = item.id;
    
    this.status = "get item: running..."
    try {
      let response = await fetch(`${this.api}/dataset/${this.projectName}/embeddings/${id}`, {
        method: 'GET',
      })
      response = await response.json();
      if (response.error) throw new Error(response.error);
      this.status = "get item: success";
      
      const item = JSON.parse(response.item);
      const source = item.plot_content;
      
      this.sourceCM.setValue(source);
      debugger
    } catch (e) {
      this.status = "get item: " + e;
    }
  }

  async save() {
    if (this.sourceURL) {
      await this.sourceEditor.saveFile();
    }
    if (this.transformerSourceURL) {
      await this.transformerSourceEditor.saveFile();
    }
    this.update();
  }

  /*MD ## Lively Integration MD*/

  livelyPrepareSave() {
    this.setAttribute('source', this.sourceURL);
    this.setAttribute('transformerSource', this.transformerSourceURL);
    this.setAttribute('projectName', this.projectName);
    
    console.log("PREPARE SAVE (AST Explorer)");
  }
  
  livelyMigrate(other) {
  }

  async livelyExample() {
    await this.loadSourceFile(AstroView.defaultSourceURL);
    await this.loadTransformerSourceFile(AstroView.defaultTransformerSourceURL)
  }
}