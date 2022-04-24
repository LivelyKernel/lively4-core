export class LocalStorage {
  constructor() {
    this.files = new Map();
  }
  read(file) {
    if(!this.files.has(file)) {
      this.write(file, "new file");
    }
    return this.files.get(file);
  }
  write(file, text) {
    this.files.set(file, text);    
  }
  merge(file, text) {
    this.files.set(file, text);   
  }
}

export class Server {
  constructor(enabledSource) {
    this.enabledSource = enabledSource;
    this.storage = new LocalStorage();
  }
  send(file, text) {
    this.storage.write(file, text);
  }
  read(file, text) {
    return this.storage.read(file, text);
  }
  onFileChange() {
    // no remote changes for now
  }
  get connected() {
    return this.enabledSource();
  }
}

export class EditorWidget {
  constructor(file) {
    this.file = file;
    this.localStorage = new LocalStorage();
  }
  render() {
    return <input type="text" id="text" value={this.localStorage.read(this.file)}></input>;
  }
  save(text) {
    this.localStorage.write(this.file, text);
  }
}