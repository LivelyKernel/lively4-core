

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

const localStorage = new LocalStorage();

export class EditorWidget {
  constructor(file, textElement) {
    this.file = file;
    this.textElement = textElement;
    this.textElement.value = localStorage.read(file);
  }
  style() {
    return "border: 2px dotted blue";
  }
  save(text) {
    localStorage.write(this.file, text);
  }
}