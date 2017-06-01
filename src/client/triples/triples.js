import focalStorage from 'src/external/focalStorage.js'
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

export function invalidateFetchCache(url) {
  const key = STORAGE_PREFIX_ITEMS + url.toString();
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
}

class Triple extends Knot {
  constructor(fileName, content) {
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
  }
  
  get triples() {
    return this.knots.filter(knot => knot.isTriple());
  }

  deserializeKnot(fileName, text) {
    function isTriple(fileName, text) {
      return fileName.endsWith(".triple.json");
    }
    
    let knot = isTriple(fileName, text) ?
      new Triple(fileName, text) :
      new Knot(fileName, text);
      
    this.knots.push(knot);
  }
  linkUpTriples() {
    function createReferree(graph, triple, propName) {
      let subjectUrlString = triple.content[propName];
      let subjectUrl = new URL(subjectUrlString, triple.fileName);
      let searchString = subjectUrl.toString();
      
      let subject = graph.knots.find(knot => knot.fileName === searchString);
      if(subject) {
        triple[propName] = subject;
      } else {
        throw new Error(searchString +' '+ triple.fileName+ 'external referrees not yet implemented!');
      }
    }
    this.knots
      .filter(knot => knot.isTriple())
      .forEach(triple => {
        createReferree(this, triple, 'subject');
        createReferree(this, triple, 'predicate');
        createReferree(this, triple, 'object');
      });
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
  getKnotByUrl(url) {
    let searchString = url.toString();
    let knot = this.knots.find(knot => knot.fileName === searchString);
    if(knot) {
      return knot;
    } else {
      throw new Error('No knot for ' + searchString + ' found!');
    }
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
    let knotDescriptors = await Promise.all(fileNames.map(fileName => {
      let path = new URL(fileName, directoryURL);
      return cachedFetch(path)
        .then(text => ({ text, fileName: path.toString() }));
    }));
    knotDescriptors.forEach(({ text, fileName}) => this.deserializeKnot(fileName, text));
    this.linkUpTriples();
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
    
    invalidateFetchCache(directory);
    
    // TODO: load as knot
    // TODO: update graph
    // TODO: open editor or knot view
  }
}

// wild card for querying
export const _ = {};
