	
export default class CommandHistory {
  
  constructor() {
    this.stack = [];
    this.undoIndex = null;
  }
  
  addCommand(command) {
    this.stack.length = this.undoIndex;
    this.stack.push(command);
    this.undoIndex = this.stack.length;
  }
  
  undo() {
    if (this.undoIndex === undefined) {
      this.undoIndex = this.strokes.length;
    }
    this.undoIndex = Math.max(0, this.undoIndex - 1); 
    var cmd = this.stack[this.undoIndex];
    if(cmd) { 
      cmd.unexecute();
    }
  }
  
  redo() {
    if (this.undoIndex === undefined) {
      return;
    }
    var cmd = this.stack[this.undoIndex];
    this.undoIndex = Math.min(this.stack.length, this.undoIndex + 1); 
    if(cmd) { 
      cmd.execute();
    }
  }
}