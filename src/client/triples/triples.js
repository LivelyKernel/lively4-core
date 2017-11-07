import focalStorage from 'src/external/focalStorage.js';
import uuid from './../uuid.js';
import ContextMenu from './../contextmenu.js';

const STORAGE_PREFIX = 'triple-notes:';
const STORAGE_PREFIX_ITEMS = STORAGE_PREFIX + 'items:';

export async function cachedFetch(url, options) {
  return await fetch(url, options).then(r => r.text());
}

class Knot {
  constructor(fileName, content) {
    this.fileName = fileName;
    this.content = content;
  }
  get url() {
    return this.fileName;
  }
  label() {
    if(this.fileName.endsWith('.md')) {
      const firstLine = this.content.split('\n')[0];
      return firstLine.replace(/^#\s/, '');
    }
    return this.fileName;
  }
  isTriple() { return false; }
  async save(newContent) {
    //invalidateFetchCache(this.url);
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
    const listItem = <li tabindex="1">{this.label()}</li>;

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
}

class Triple extends Knot {
  constructor(fileName, content) {
    try {
      JSON.parse(content)
    } catch(e) {
      debugger
      console.log(fileName);
    }
    super(fileName, JSON.parse(content));
  }
  
  label() {
    if(this.predicate) {
      return 't: ' + this.predicate.label();
    }
    return this.filename.replace('.triple.json', '');
  }
  isTriple() { return true; }
}

export const DEFAULT_FOLDER_URL = 'https://localhost:8800/notes/';
export const TAG_URL = DEFAULT_FOLDER_URL + 'tag.md';
export const IS_A_URL = DEFAULT_FOLDER_URL + 'is_a.md';
export const SAME_AS_URL = DEFAULT_FOLDER_URL + 'same_as.md';
export const CONTAINS_URL = DEFAULT_FOLDER_URL + 'contains.md';

const ROOT_KNOWLEDGE_BASES_KEY = 'triple-notes-root-knowledge-bases';

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
  get triples() {
    return this.knots.filter(knot => knot.isTriple());
  }
  async deleteKnot(knot) {
    // check for triples on top of the knot
    const referingTriples = this.query(knot, _, _)
      .concat(this.query(_, knot, _))
      .concat(this.query(_, _, knot));
    if(referingTriples.length > 0) {
      lively.notify('Deletion aborted!', referingTriples.length + ' triples refer to this knot.');
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
    if(!Graph.isExternalURL(urlURL)) {
      var result = await fetch(url, {method: 'DELETE'})
        .then(r => r.text());
      lively.notify(`Deleted knot ${url} in remote storage`, result);
    }
    
    lively.notify('Knot removed from graph.');
    
    return true;
  }

  async deserializeKnot(fileName, text) {
    function isTriple(fileName, text) {
      return fileName.endsWith(".triple.json");
    }
    
    let knot;
    if(isTriple(fileName, text)) {
      knot = new Triple(fileName, text);
      await this.linkUpTriple(knot);
    } else {
      knot = new Knot(fileName, text);
    }
      
    this.knots.push(knot);
    
    return knot;
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
      throw new Error(searchString +' '+ triple.fileName+ 'external referrees not yet implemented!');
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
    let matchingTriples = [];
    this.triples.forEach(triple => {
      if(s === _ || triple.subject === s) {
        if(p === _ || triple.predicate === p) {
          if(o === _ || triple.object === o) {
            matchingTriples.push(triple);
          }
        }
      }
    });

    return matchingTriples;
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
  
  static isInternalURL(url) {
    const origin = url.origin;
    return origin === 'https://lively4' || origin === 'https://localhost:8800';
  }
  
  static isExternalURL(url) {
    return !this.isInternalURL(url);
  }
  async loadSingleKnot(urlOrString) {
    const url = new URL(urlOrString);
    if(Graph.isExternalURL(url)) {
      return this.deserializeKnot(url.toString(), url.hostname + url.pathname);
    }
    
    let text = await cachedFetch(url)
    const fileName = url.toString();
    return this.deserializeKnot(fileName, text);
  }
  
  async loadFromDir(directory) {
    if(!this.loadedDirectoryPromises.has(directory)) {
      this.loadedDirectoryPromises.set(directory, new Promise(async resolve => {
        let progress = await lively.showProgress("loading dir " + directory);
        progress.value = 0;
        
        let directoryURL = new URL(directory);
        let text = await cachedFetch(directory, { method: 'OPTIONS' });
        let json = JSON.parse(text);
        let fileDescriptors = json.contents;
        fileDescriptors = fileDescriptors.filter(desc => desc.type === "file");
        let fileNames = fileDescriptors.map(desc => desc.name);
        
        let total = fileNames.length;
        let i=0;
        Promise
          .all(fileNames.map(fileName => {
            let knotURL = new URL(fileName, directoryURL);
            return this.requestKnot(knotURL).then(val => {
              progress.value = i++ / total;
              return val;
            });
          }))
          .then(resolve)
          .then(() => progress.remove());
      }));
    }
    return this.loadedDirectoryPromises.get(directory);
  }
  
  async getNonCollidableURL(directory, name, fileEnding) {
    const maxTries = 10;
    let fileName = name.replace(/\s/g, '_');
    let offset = 0;
    
    for(let i = 0; i < maxTries; i++) {
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
    
    //await invalidateFetchCache(directory);
    
    return this.requestKnot(url);
  }
  async createTriple(subjectUrlString, predicateURLString, objectURLString, knowledgeBaseURLString) {
    await this.requestKnot(subjectUrlString);
    await this.requestKnot(predicateURLString);
    await this.requestKnot(objectURLString);

    let url = await this.getNonCollidableURL(knowledgeBaseURLString, 'triple-' + uuid(), 'triple.json');
    let content = JSON.stringify({
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
