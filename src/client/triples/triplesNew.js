import focalStorage from 'src/external/focalStorage.js'
const STORAGE_PREFIX = 'triple-notes:';
const STORAGE_PREFIX_ITEMS = STORAGE_PREFIX + 'items:';

async function cachedFetch(url, options) {
  const key = STORAGE_PREFIX_ITEMS + url.toString();
  if(null === await focalStorage.getItem(key)) {
    let text = await fetch(url, options).then(r => r.text())
    focalStorage.setItem(key, text);
    return text;
  } else {
    return focalStorage.getItem(key);
  }
}

class Knot {
  constructor(fileName, content) {
    this.fileName = fileName;
    this.content = content;
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
    
  }
  
  getByUrl(url) {
    return "A late-bound reference";
  }
  
  async loadFromDir(directory) {
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
    let graph = Graph.getInstance();
    knotDescriptors.forEach(({ text, fileName}) => graph.deserializeKnot(fileName, text));
    graph.linkUpTriples();
    return graph;
  }
}

export const _ = {};

// Have to be transparent
class LateBoundReference {
  constructor(url) {
    
  }
  
  get() {
    
  }
}



export default async function loadDropbox(directory) {
}
