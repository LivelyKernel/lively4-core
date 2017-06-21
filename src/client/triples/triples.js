import focalStorage from 'src/external/focalStorage.js';
import uuid from 'src/client/uuid.js';
const STORAGE_PREFIX = 'triple-notes:';
const STORAGE_PREFIX_ITEMS = STORAGE_PREFIX + 'items:';

export async function cachedFetch(url, options) {
  const key = STORAGE_PREFIX_ITEMS + url.toString();
  if(null === await focalStorage.getItem(key)) {
    let text = await fetch(url, options).then(r => r.text())
    focalStorage.setItem(key, text);
    return text;
  } else {
    return focalStorage.getItem(key);
  }
}

export async function invalidateFetchCache(url) {
  const key = STORAGE_PREFIX_ITEMS + url.toString();
  await focalStorage.removeItem(key);
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
      return this.content.split('\n')[0];
    }
    return this.fileName;
  }
  isTriple() { return false; }
  async save(newContent) {
    invalidateFetchCache(this.url);
    this.content = newContent;
    await lively.files.saveFile(this.url, newContent);
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
      return 't:' + this.predicate.label();
    }
    return this.filename.replace('.triple.json', '');
  }
  isTriple() { return true; }
}

export class Graph {
  constructor() {
    this.knots = [];
    this.loadedDirectories = [];
    // url string -> Promise for Knot
    this.requestedKnots = new Map();
  }
  
  
  getKnots() {
    return this.knots;
  }
  get triples() {
    return this.knots.filter(knot => knot.isTriple());
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

  static getInstance() {
    if(!this.instance) {
      this.instance = new Graph();
    }
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
  
  async loadSingleKnot(url) {
    return cachedFetch(url)
      .then(text => {
        const fileName = url.toString();
        return this.deserializeKnot(fileName, text);
      });
  }
  
  async loadFromDir(directory) {
    if(this.loadedDirectories.includes(directory)) {
      return;
    }
    this.loadedDirectories.push(directory);
    let directoryURL = new URL(directory);
    let text = await cachedFetch(directory, { method: 'OPTIONS' });
    let json = JSON.parse(text);
    let fileDescriptors = json.contents;
    fileDescriptors = fileDescriptors.filter(desc => desc.type === "file");
    let fileNames = fileDescriptors.map(desc => desc.name);
    
    await Promise.all(fileNames.map(fileName => {
      let knotURL = new URL(fileName, directoryURL);
      return this.requestKnot(knotURL);
    }));
    
    //await this.linkUpTriples();
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
    let content = `# ${name}`;
    await lively.files.saveFile(url, content);
    
    await invalidateFetchCache(directory);
    
    let knot = await this.requestKnot(url);
    let knotView = await lively.openComponentInWindow("knot-view");
    knotView.loadKnotForURL(knot.url);
  }
  async createTriple(subjectUrlString, predicateURLString, objectURLString) {
    const directory = 'https://lively4/dropbox/';
    let url = await this.getNonCollidableURL(directory, 'triple-' + uuid(), 'triple.json');
    let content = JSON.stringify({
      subject: subjectUrlString,
      predicate: predicateURLString,
      object: objectURLString
    });
    await lively.files.saveFile(url, content);
    
    await invalidateFetchCache(directory);
    
    let triple = await this.requestKnot(url);
    let knotView = await lively.openComponentInWindow("knot-view");
    knotView.loadKnotForURL(triple.url);
  }
}

// wild card for querying
export const _ = {};
