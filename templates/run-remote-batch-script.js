import Morph from 'src/components/widgets/lively-morph.js';

export default class RunRemoteBatchScript extends Morph {
  get endpoint() { return this.get("#endpoint").value; }
  set endpoint(value) { this.get("#endpoint").value = value; }
  borderColor(color) { this.get('#result-field').style.border = `2px solid ${color}`; }

  async initialize() {
    this.windowTitle = "RunRemoteBatchScript";
    
    this.registerButtons();
    this.get("#endpoint").addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.onSearchEndpoints(event);
      }
    });

    this.endpoint = this.endpoint || "https://localhost:8801/scripts/";
  }

  async onSearchEndpoints(evt) {
    const scripts = await fetch(this.endpoint, { method: 'OPTIONS'}).then(res => res.json());
    if(scripts.type !== 'directory') {
      lively.error('specified endpoint is no directory');
      return;
    }
    this.updateBatchScriptList(scripts);
  }

  createListItem(name) {
    return <li entry-name={name} click={evt => this.runScript(name)}><span><i class="fa fa-play"/>{name}</span></li>;
  }
  buildScriptListByNames(names) {
    const scriptListContainer = this.get('#scriptList');
    scriptListContainer.innerHTML = '';
    scriptListContainer.appendChild(<ul>{...names.map(::this.createListItem)}</ul>);
  }
  updateBatchScriptList(scripts) {
    function isBatchScript(entry) {
      return entry.type === 'file' && entry.name.endsWith('.bat');
    }
    
    this.buildScriptListByNames(scripts.contents
      .filter(isBatchScript)
      .map(entry => entry.name));
  }
  async runScript(scriptName) {
    const scriptURL = new URL(scriptName, this.endpoint);
    
    this.get('#result-field').innerHTML = '';
    this.borderColor('yellow');
    lively.files.fetchChunks(
      fetch(scriptURL, { method: 'POST' }),
      chunk => this.get('#result-field').appendChild(<span>{chunk}</span>),
      () => this.borderColor('green')
    );
  }

  livelyMigrate(other) {
    this.endpoint = other.endpoint;
    this.buildScriptListByNames(other
      .getAllSubmorphs('#scriptList li')
      .map(li => li.getAttribute('entry-name')));
    this.get('#result-field').innerHTML = other.get('#result-field').innerHTML;
  }
}