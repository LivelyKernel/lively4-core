"enable aexpr";
import 'lang';

import focalStorage from 'src/external/focalStorage.js';
import ContextMenu from './../contextmenu.js';
import { through, uuid, fileName, hintForLabel, getTempKeyFor, asDragImageFor } from 'utils';
import { trackInstance } from 'active-group';

async function getJSYaml() {
  await lively.loadJavaScriptThroughDOM("esprima", "https://lively-kernel.org/lively4/foo/src/external/esprima.js");
  await lively.loadJavaScriptThroughDOM("js-yaml", "https://lively-kernel.org/lively4/foo/src/external/js-yaml.js");
  return jsyaml;
}

// #TODO: unused
async function parseMarkdown(markdown, filename) {
  try {
    const frontmatterSeparator = "---\r\n";
    if(markdown.startsWith(frontmatterSeparator)) {
      const parts = markdown.split(frontmatterSeparator);
      if(parts.length >= 3) {
        parts.shift(); // empty
        const frontmatterString = parts.shift();
        return {
          textContent: parts.join(frontmatterSeparator),
          metadata: (await getJSYaml()).load(frontmatterString)
        };
      }
    }
  } catch(e) {
    lively.notify("failed frontmatter parsing", "", undefined, undefined, "red");
  }
  return {
    textContent: markdown,
    metadata: {}
  };
}

export class Knot {
  constructor(fileName, content) {
    this.fileName = fileName;
    this.content = content;
    
    if(new.target === Knot) {
      trackInstance.call(Knot, this);
    }
  }
  get url() { return this.fileName; }
  getMetadata() { return this.metadata; }
  label() {
    if(this.fileName.endsWith('.md')) {
      const firstLine = this.content.split('\n')[0];
      return firstLine.replace(/^#\s/, '');
    }
    return this.fileName;
  }
  isTriple() { return false; }
  async save(newContent) {
    this.content = newContent;
    await lively.files.saveFile(this.url, newContent);
  }
  async openViewInWindow() {
    const knotView = await lively.openComponentInWindow("knot-view");
    knotView.loadKnotForURL(this.url);
  }
  collectContextMenuItems() {
    return [
        ["Knot View", evt => {
          ContextMenu.hide();
          this.openViewInWindow();
        }, "", '<i class="fa fa-window-maximize" aria-hidden="true"></i>'],
        ["Danger Zone", [
          ["Delete", async evt => {
            ContextMenu.hide();
            const graph = await Graph.getInstance();

            const label = this.label();
            if(await graph.deleteKnot(this)) {
              // #TODO: use reactivity to update views and search results
              lively.notify(`${label} deleted!`, null, 4, null, "red");
            } else {
              lively.notify('did not delete knot ' + label, this.url);
            }
          }, "Delete for good", '<i class="fa fa-trash" aria-hidden="true"></i>']
        ]]
      ];
  }

  toListItem() {
    const listItem = <li tabindex="1" draggable="true">{this.label()}</li>;
    listItem.knot = this;
    
    listItem.addEventListener('keydown', event => {
      if (event.keyCode == 13) { // ENTER
        this.openViewInWindow();
        event.stopPropagation();
        event.preventDefault();
      }
    });
    listItem.addEventListener("dblclick", event => {
      this.openViewInWindow();
      event.stopPropagation();
      event.preventDefault();
    });
    listItem.addEventListener("contextmenu", event => {
      ContextMenu.openIn(document.body, event, this, undefined, this.collectContextMenuItems());
      event.stopPropagation();
      event.preventDefault();
    });

    return listItem;
  }
  
  asDataForDrag(evt) {
    const dt = evt.dataTransfer;
    //listItem.style.color = "blue";
    dt.setData("knot/url", this.url);
    dt.setData("text/uri-list", this.url);
    dt.setData("text/plain", this.url);
    dt.setData("javascript/object", getTempKeyFor(this));
    const mimeType = 'text/plain';
    const filename = this.url::fileName();
    const url = this.url;
    dt.setData("DownloadURL", `${mimeType}:${filename}:${url}`);

    // #TODO: remove duplication
    const dragInfo = <div style="width: 150px;">
      {hintForLabel(this.label())}
    </div>;
    dragInfo::asDragImageFor(evt, 50, 60);
  }
}

export class Triple extends Knot {
  constructor(fileName, content) {
    try {
      JSON.parse(content)
    } catch(e) {
      debugger
      console.log(fileName);
    }

    super(fileName, JSON.parse(content));

    // track this Triple for ROQs after full initialization
  }
  
  label() {
    if(this.predicate) {
      return 't: ' + this.predicate.label();
    }
    return this.filename.replace('.triple.json', '');
  }
  isTriple() { return true; }
}

export const DEFAULT_FOLDER_URL = 'https://lively4/notes/';
export const TAG_URL = DEFAULT_FOLDER_URL + 'tag.md';
export const IS_A_URL = DEFAULT_FOLDER_URL + 'is_a.md';
export const SAME_AS_URL = DEFAULT_FOLDER_URL + 'same_as.md';
export const CONTAINS_URL = DEFAULT_FOLDER_URL + 'contains.md';

const ROOT_KNOWLEDGE_BASES_KEY = 'triple-notes-root-knowledge-bases';
const PREFERRED_KNOWLEDGE_BASE_KEY = 'triple-notes-preferred-knowledge-base';

function isInternalURL(url) {
  const origin = url.origin;
  return origin === 'https://lively4' || origin === 'https://localhost:8800';
}
function isExternalURL(url) { return !isInternalURL(url); }

export class Graph {
  constructor() {
    this.knots = [];
    this.loadedDirectoryPromises = new Map();
    // url string -> Promise for Knot
    this.requestedKnots = new Map();
  }
  async prepare() {
    const rootKnowledgeBases = await this.getRootKnowledgeBases();
    return Promise.all(rootKnowledgeBases.map(::this.loadFromDir));
  }
  
  async getRootKnowledgeBases() {
    return (await focalStorage.getItem(ROOT_KNOWLEDGE_BASES_KEY)) || [
      DEFAULT_FOLDER_URL
      //, "https://lively4/gamedev/"
    ]
  }
  
  async addRootKnowledgeBase(urlString) {
    try {
      new URL(urlString);
      const stats = JSON.parse(await lively.files.statFile(urlString));
      if(!stats || stats.type !== "directory") {
        throw new Error(stats);
      }
    } catch (e) {
      lively.notify(`Knowledge base ${urlString} not valid.`, e.message, undefined, undefined, "red");
      return;
    }
    
    const rootKnowledgeBases = (await this.getRootKnowledgeBases()) || [];
    if(!rootKnowledgeBases.includes(urlString)) {
      rootKnowledgeBases.push(urlString);
      await focalStorage.setItem(ROOT_KNOWLEDGE_BASES_KEY, rootKnowledgeBases);
      return await this.loadFromDir(urlString);
    }
  }
  
  async removeRootKnowledgeBase(urlString) {
    let rootKnowledgeBases = (await this.getRootKnowledgeBases()) || [];
    if(rootKnowledgeBases.includes(urlString)) {
      // remove via filter
      rootKnowledgeBases = rootKnowledgeBases.filter(rootBase => rootBase !== urlString);
      await focalStorage.setItem(ROOT_KNOWLEDGE_BASES_KEY, rootKnowledgeBases);
      return true;
    } else {
      return false;
    }
  }
  
  getKnots() {
    return this.knots;
  }
  hasKnotWithURL(url) {
    return !!this.getKnots().find(knot => knot.url === url);
  }
  get triples() {
    return this.knots.filter(knot => knot.isTriple());
  }
  async deleteKnot(knot) {
    // check for triples on top of the knot
    const referingTriples = this.query(knot, _, _)
      .concat(this.query(_, knot, _))
      .concat(this.query(_, _, knot));
    if(referingTriples.length > 0) {
      lively.notify('Deletion aborted!', `${referingTriples.length} triples refer to this knot.`);
      return false;
    }

    let url = knot.url;
    if (!window.confirm("delete knot " + url)) { return false; }
    
    let index = this.knots.indexOf(knot);
    if (index > -1) {
      this.knots.splice(index, 1);
      lively.notify(`Removed knot ${url} in local graph instance.`);
    } else {
      lively.notify(`Did not find knot ${url} in local graph instance.`);
    }
    
    let urlURL = new URL(url);
    if(!isInternalURL(urlURL)) {
      var result = await fetch(url, {method: 'DELETE'})
        .then(r => r.text());
      lively.notify(`Deleted knot ${url} in remote storage`, result);
    }
    
    lively.notify('Knot removed from graph.');
    
    return true;
  }

  async createReferree(triple, propName) {
    let subjectUrlString = triple.content[propName];
    let subjectUrl = new URL(subjectUrlString, triple.fileName);
    let searchString = subjectUrl.toString();
    
    let subject = await this.requestKnot(subjectUrl);
    //let subject = this.knots.find(knot => knot.fileName === searchString);
    if(subject) {
      triple[propName] = subject;
    } else {
      throw new Error(`${searchString} ${triple.fileName} external referrees not yet implemented!`);
    }
  }
  async linkUpTriple(triple) {
    return Promise.all([
      this.createReferree(triple, 'subject'),
      this.createReferree(triple, 'predicate'),
      this.createReferree(triple, 'object')
    ]);
  }

  static async getInstance() {
    if(!this.instance) {
      this.instance = new Graph();
    }
    
    await this.instance.prepare();
    
    return this.instance;
  }
  static clearInstance() {
    this.instance = undefined;
  }
  
  query(s, p, o) {
    return this.triples
      .filter(triple => s === _ || triple.subject === s)
      .filter(triple => p === _ || triple.predicate === p)
      .filter(triple => o === _ || triple.object === o);
  }
  
  getUrlsByKnot(knot) {
    // TODO: we simply return the single reference url for now
    return [knot.fileName];
  }

  // returns a promise for the Knot
  async requestKnot(url) {
    const filePath = url.toString();
    if(!this.requestedKnots.has(filePath)) {
      this.requestedKnots.set(filePath, this.loadSingleKnot(url));
    }
    return this.requestedKnots.get(filePath);
  }
  
  async loadSingleKnot(urlOrString) {
    const url = new URL(urlOrString);
    
    let fileName = url.toString();
    let text = isExternalURL(url) ?
      url.hostname + url.pathname :
      await fetch(url).then(r => r.text()).catch(err => `ERROR loading this knot: ${err}`);

    // deserializeKnot
    const isTriple = fileName.endsWith(".triple.json");

    let knot;
    if(isTriple) {
      knot = new Triple(fileName, text);
      await this.linkUpTriple(knot);
      trackInstance.call(Triple, knot);
    } else {
      knot = new Knot(fileName, text);
    }

    this.knots.push(knot);

    return knot;
  }
  
  async loadFromDir(directory) {
    if(!this.loadedDirectoryPromises.has(directory)) {
      this.loadedDirectoryPromises.set(directory, new Promise(async resolve => {
        const progress = await lively.showProgress(`loading dir ${directory}`);
        progress.value = 0;
        
        const directoryURL = new URL(directory);
        const json = await fetch(directory, { method: 'OPTIONS' }).then(r => r.json());
        const fileNames = json.contents
          .filter(desc => desc.type === "file")
          .map(desc => desc.name);
        
        const total = fileNames.length;
        let i = 0;
        const pool = new Set();
        const limit = 100;
        const arr = [1,2,3,4,5,6]
        let ii = 0;
        const groups = fileNames.groupBy((...args) => (ii++ / limit).floor())
        for (let group of Object.values(groups)) {
          await Promise.all(group.map(fileName => {
            const knotURL = new URL(fileName, directoryURL);
            const prom = this.requestKnot(knotURL);
            progress.value = i++ / total
            return prom
          }));
        }
        
        await resolve();
        await progress.remove()
      }));
    }
    return this.loadedDirectoryPromises.get(directory);
  }
  
  escapeSpecialCharacters(str) {
    return str.replace(/[^A-Za-z0-9-]/g, '_');
  }
  
  async fileForNameExists(name) {
    const url = new URL(`${this.escapeSpecialCharacters(str)}.md`, DEFAULT_FOLDER_URL);
    return (await fetch(url)).status === 200;
  }
  
  async getOrCreateKnotForTitle(name, defaultText = '# Default Text') {
    const escapedName = this.escapeSpecialCharacters(name);
    const proposedURL = `${DEFAULT_FOLDER_URL}${escapedName}.md`;

    const existingKnot = this.getKnots().find(knot => {
      return knot.url === proposedURL
    });
    if (existingKnot) {
      lively.success('EXISTS IN MEMORY')
      return existingKnot;
    }
    
    const fileExists = (await fetch(proposedURL)).status === 200;
    if(fileExists) {
      lively.success('EXISTS REMOTELY')
      return this.requestKnot(proposedURL);
    }
    
    lively.warn('NON EXISTENT')
    return this.createKnot(DEFAULT_FOLDER_URL, name, 'md');
  }

  async getNonCollidableURL(directory, name, fileEnding) {
    const maxTries = 10;
    const fileName = this.escapeSpecialCharacters(name);
    let offset = 0;
    let i = 0;
    
    for(; i < maxTries; i++) {
      let bust = offset === 0 ? '' : offset;
      let url = new URL(`${fileName}${bust}.${fileEnding}`, directory);
      let fileExists = (await fetch(url)).status === 200;
      if(fileExists) {
        offset++;
      } else {
        return url;
      }
    }
    throw new Error('too many tries for '); // TODO: improve error message
  }
  async createKnot(directory, name, fileEnding) {
    if(fileEnding !== 'md') { throw new Error('only .md files supported by now, instead found ', + fileEnding); }

    let url = await this.getNonCollidableURL(directory, name, fileEnding);
    let content = `# ${name}

`;
    await lively.files.saveFile(url, content);
    
    return this.requestKnot(url);
  }
  async createTriple(subjectUrlString, predicateURLString, objectURLString, knowledgeBaseURLString) {
    await this.requestKnot(subjectUrlString);
    await this.requestKnot(predicateURLString);
    await this.requestKnot(objectURLString);

    const url = await this.getNonCollidableURL(knowledgeBaseURLString, 'triple-' + uuid(), 'triple.json');
    const content = JSON.stringify({
      subject: subjectUrlString,
      predicate: predicateURLString,
      object: objectURLString
    });
    await lively.files.saveFile(url, content);
    
    //await invalidateFetchCache(knowledgeBaseURLString);
    
    return this.requestKnot(url);
  }

}

// wild card for querying
export const _ = {};
